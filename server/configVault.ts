/**
 * Local, encrypted-at-rest configuration store for the Gemini API key.
 *
 * Design:
 *  - The key is never read from a bundled env var or shipped to the browser.
 *  - The key is encrypted with AES-256-GCM before it touches disk.
 *  - The 32-byte master key lives in `master.key` (mode 0600) or can be supplied
 *    through ZENITH_MASTER_KEY for deployments that should not keep it on disk.
 *  - The API only ever returns a masked hint, never the key itself.
 *
 * Threat model: this protects the key at rest (backups, accidental file sharing,
 * another local account without read access to your home directory). It does not
 * protect against malware running as the same user, which is true of any local
 * secret store. Prefer ZENITH_MASTER_KEY if you want the master key off disk.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_GEMINI_MODEL,
  isGeminiModelId,
  type GeminiModelId,
} from '../shared/geminiModels';

const CONFIG_DIR =
  process.env.ZENITH_CONFIG_DIR ||
  path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'zenith-code');
const MASTER_KEY_FILE = path.join(CONFIG_DIR, 'master.key');
const VAULT_FILE = path.join(CONFIG_DIR, 'api-key.vault');
const SETTINGS_FILE = path.join(CONFIG_DIR, 'settings.json');

const VAULT_VERSION = 1;
const ALGORITHM = 'aes-256-gcm';
const AAD = Buffer.from('zenith-code/api-key/v1', 'utf8');

interface VaultPayload {
  apiKey: string;
  savedAt: string;
}

interface VaultFile {
  v: number;
  alg: typeof ALGORITHM;
  iv: string;
  tag: string;
  data: string;
}

interface SettingsFile {
  model: GeminiModelId;
}

export interface PublicGeminiConfig {
  hasKey: boolean;
  maskedKey: string | null;
  model: GeminiModelId;
  configDir: string;
}

let masterKey: Buffer | null = null;
let cachedApiKey: string | null = null;
let cachedModel: GeminiModelId = DEFAULT_GEMINI_MODEL;
let initPromise: Promise<void> | null = null;

async function chmodQuiet(file: string, mode: number) {
  try {
    await fs.chmod(file, mode);
  } catch {
    // Best effort: some filesystems do not support POSIX modes.
  }
}

async function ensureConfigDir() {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await chmodQuiet(CONFIG_DIR, 0o700);
}

async function readMasterKey(): Promise<Buffer> {
  const supplied = process.env.ZENITH_MASTER_KEY;
  if (supplied) {
    const decoded = Buffer.from(supplied, 'base64');
    if (decoded.length !== 32) {
      throw new Error('ZENITH_MASTER_KEY must be a base64-encoded 32-byte key.');
    }
    return decoded;
  }

  try {
    const raw = (await fs.readFile(MASTER_KEY_FILE, 'utf8')).trim();
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length !== 32) {
      throw new Error('master key has an invalid length');
    }
    await chmodQuiet(MASTER_KEY_FILE, 0o600);
    return decoded;
  } catch (err: any) {
    if (err?.code !== 'ENOENT' && err?.message !== 'master key has an invalid length') {
      throw err;
    }
    // Missing or corrupt local master key: rotate it. Any previously saved key
    // becomes unreadable, so the user will be asked to enter it again.
    const generated = randomBytes(32);
    await fs.writeFile(MASTER_KEY_FILE, `${generated.toString('base64')}\n`, { mode: 0o600 });
    await chmodQuiet(MASTER_KEY_FILE, 0o600);
    return generated;
  }
}

async function atomicWrite(file: string, content: string) {
  const tempFile = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tempFile, content, { mode: 0o600 });
  await chmodQuiet(tempFile, 0o600);
  await fs.rename(tempFile, file);
  await chmodQuiet(file, 0o600);
}

async function loadSettings() {
  try {
    const parsed = JSON.parse(await fs.readFile(SETTINGS_FILE, 'utf8')) as SettingsFile;
    if (isGeminiModelId(parsed.model)) {
      cachedModel = parsed.model;
    }
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      console.warn('[gemini-config] Could not read settings.json:', err?.message || err);
    }
  }
}

async function loadVault() {
  try {
    const raw = JSON.parse(await fs.readFile(VAULT_FILE, 'utf8')) as VaultFile;
    if (raw.v !== VAULT_VERSION || raw.alg !== ALGORITHM || !masterKey) {
      throw new Error('unsupported vault format');
    }
    const decipher = createDecipheriv(ALGORITHM, masterKey, Buffer.from(raw.iv, 'base64'));
    decipher.setAAD(AAD);
    decipher.setAuthTag(Buffer.from(raw.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(raw.data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    const payload = JSON.parse(plaintext) as VaultPayload;
    cachedApiKey = typeof payload.apiKey === 'string' && payload.apiKey.length > 0 ? payload.apiKey : null;
    await chmodQuiet(VAULT_FILE, 0o600);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      console.warn(
        '[gemini-config] Could not decrypt the saved API key. Re-enter it in the app:',
        err?.message || err
      );
    }
    cachedApiKey = null;
  }
}

async function initialize() {
  await ensureConfigDir();
  masterKey = await readMasterKey();
  await Promise.all([loadSettings(), loadVault()]);
}

/** Idempotent startup hook. Safe to call on every request. */
export function ensureConfigReady(): Promise<void> {
  if (!initPromise) {
    initPromise = initialize().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

function maskKey(key: string): string {
  const tail = key.slice(-4);
  return `••••••••${tail}`;
}

export function getStoredApiKey(): string | null {
  return cachedApiKey;
}

export function getSelectedModel(): GeminiModelId {
  return cachedModel;
}

export function getPublicConfig(): PublicGeminiConfig {
  return {
    hasKey: Boolean(cachedApiKey),
    maskedKey: cachedApiKey ? maskKey(cachedApiKey) : null,
    model: cachedModel,
    configDir: CONFIG_DIR.startsWith(os.homedir())
      ? `~${CONFIG_DIR.slice(os.homedir().length)}`
      : CONFIG_DIR,
  };
}

export async function setApiKey(apiKey: string): Promise<PublicGeminiConfig> {
  const trimmed = apiKey.trim();
  if (trimmed.length < 20 || trimmed.length > 512 || /\s/.test(trimmed)) {
    throw new Error('That does not look like a valid Gemini API key.');
  }
  if (!masterKey) {
    throw new Error('Configuration store is not initialized.');
  }

  const payload: VaultPayload = { apiKey: trimmed, savedAt: new Date().toISOString() };
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  cipher.setAAD(AAD);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const vault: VaultFile = {
    v: VAULT_VERSION,
    alg: ALGORITHM,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64'),
  };

  await atomicWrite(VAULT_FILE, `${JSON.stringify(vault, null, 2)}\n`);
  cachedApiKey = trimmed;
  return getPublicConfig();
}

export async function clearApiKey(): Promise<PublicGeminiConfig> {
  cachedApiKey = null;
  try {
    await fs.unlink(VAULT_FILE);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') throw err;
  }
  return getPublicConfig();
}

export async function setModel(model: GeminiModelId): Promise<PublicGeminiConfig> {
  if (!isGeminiModelId(model)) {
    throw new Error('Unsupported Gemini model.');
  }
  cachedModel = model;
  const settings: SettingsFile = { model };
  await atomicWrite(SETTINGS_FILE, `${JSON.stringify(settings, null, 2)}\n`);
  return getPublicConfig();
}

export interface KeyVerification {
  ok: boolean;
  status?: number;
  message: string;
  /** True when the request could not reach Google, so the key may still be valid. */
  unreachable?: boolean;
}

/**
 * Best-effort validation. Uses the Gemini API `models.list` endpoint so it does
 * not spend tokens. The key travels in the x-goog-api-key header, never the URL.
 */
export async function validateApiKey(apiKey: string): Promise<KeyVerification> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',
      {
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey.trim() },
        signal: controller.signal,
      }
    );
    if (res.ok) {
      return { ok: true, status: res.status, message: 'Key verified with the Gemini API.' };
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: res.status,
        message: 'Google rejected this API key. Check it and try again.',
      };
    }
    return {
      ok: false,
      status: res.status,
      message: `The Gemini API returned ${res.status}. The key was saved; try again later.`,
    };
  } catch {
    return {
      ok: false,
      message: 'Could not reach the Gemini API to verify the key. It will still be saved.',
      unreachable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
