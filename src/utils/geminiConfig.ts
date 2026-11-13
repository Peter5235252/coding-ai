import type { GeminiModelId } from '../../shared/geminiModels';

export interface GeminiRuntimeConfig {
  hasKey: boolean;
  maskedKey: string | null;
  model: GeminiModelId;
  configDir?: string;
  verified?: boolean;
  verificationMessage?: string;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function fetchGeminiConfig(): Promise<GeminiRuntimeConfig> {
  const res = await fetch('/api/config', { cache: 'no-store' });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not load Gemini settings.');
  }
  return data as unknown as GeminiRuntimeConfig;
}

export async function saveGeminiKey(apiKey: string): Promise<GeminiRuntimeConfig> {
  const res = await fetch('/api/config/key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ apiKey }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not save the API key.');
  }
  return data as unknown as GeminiRuntimeConfig;
}

export async function clearGeminiKey(): Promise<GeminiRuntimeConfig> {
  const res = await fetch('/api/config/key', { method: 'DELETE', cache: 'no-store' });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not remove the API key.');
  }
  return data as unknown as GeminiRuntimeConfig;
}

export async function saveGeminiModel(model: GeminiModelId): Promise<GeminiRuntimeConfig> {
  const res = await fetch('/api/config/model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ model }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Could not save the selected model.');
  }
  return data as unknown as GeminiRuntimeConfig;
}
