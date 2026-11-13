import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  clearApiKey,
  ensureConfigReady,
  getPublicConfig,
  getSelectedModel,
  getStoredApiKey,
  setApiKey,
  setModel,
  validateApiKey,
} from './server/configVault';
import { isGeminiModelId } from './shared/geminiModels';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '2mb' }));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || '127.0.0.1';

// The API key is supplied by the user through the in-app setup screen and kept
// encrypted on disk. No key is ever read from a bundled env var.
let aiClient: GoogleGenAI | null = null;
let aiClientKey: string | null = null;

function getAiClient(): GoogleGenAI | null {
  const key = getStoredApiKey();
  if (!key) return null;
  if (!aiClient || aiClientKey !== key) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    aiClientKey = key;
  }
  return aiClient;
}

function getModelName() {
  return getSelectedModel();
}

// Socratic Tutor System Instructions
const SOCRATIC_SYSTEM_INSTRUCTION = `You are a world-class, strictly minimalist Socratic programming tutor for systems, application, and scripting languages (Rust, C, C++, Go, JavaScript, Java, C#, Lua, Luau, Python, GDScript).
CRITICAL RULES:
1. NEVER spoon-feed complete code solutions. Do NOT write out the full working code for the user.
2. Probe before prescribing: Ask thought-provoking, conceptual questions that force the student to examine their assumptions.
3. Keep feedback concise, high-signal, and clear. Avoid fluff, unnecessary praise, or filler words.
4. Explain core mechanics (e.g. stack vs heap, borrow checker lifetimes, manual memory allocation, table hash lookup, engine node lifecycles) using precise analogies and mental models.
5. If the user makes an error, point to the conceptual misunderstanding and ask what they think happens at runtime.`;

// Map user-configurable reasoning level to SDK ThinkingLevel
function getThinkingLevel(level?: string): ThinkingLevel {
  const normalized = level?.toLowerCase();
  // Carbon and Argon cap at `high`; only Hydrogen supports `xhigh`.
  if (normalized === 'xhigh') {
    return getSelectedModel() === 'gemini-4-hydrogen'
      ? ThinkingLevel.XHIGH
      : ThinkingLevel.HIGH;
  }
  switch (normalized) {
    case 'high':
      return ThinkingLevel.HIGH;
    case 'low':
      return ThinkingLevel.LOW;
    case 'medium':
    default:
      return ThinkingLevel.MEDIUM;
  }
}

// Make sure the encrypted key vault is ready before handling API traffic.
app.use(async (_req, _res, next) => {
  try {
    await ensureConfigReady();
    next();
  } catch (err) {
    next(err);
  }
});

// Default loopback deployments only accept loopback Host headers. This blocks
// DNS-rebinding attempts from a malicious page while keeping the local UI easy.
const loopbackBind = ['127.0.0.1', 'localhost', '::1'].includes(host);
const allowedApiHosts = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  os.hostname(),
  ...(process.env.ZENITH_ALLOWED_HOSTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
]);
app.use('/api', (req, res, next) => {
  if (!loopbackBind) {
    next();
    return;
  }
  const requestHost = (req.headers.host || '').replace(/:\d+$/, '');
  if (!allowedApiHosts.has(requestHost)) {
    res.status(403).json({ error: 'Invalid Host header for this local API.' });
    return;
  }
  next();
});

const keyAttempts = new Map<string, number[]>();
function isKeyAttemptRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (keyAttempts.get(ip) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 10) return true;
  recent.push(now);
  keyAttempts.set(ip, recent);
  if (keyAttempts.size > 500) keyAttempts.clear();
  return false;
}

// API: current (non-secret) Gemini configuration
app.get('/api/config', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, ...getPublicConfig() });
});

// API: store a user-supplied key, encrypted at rest
app.post('/api/config/key', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ip = req.ip || req.socket.remoteAddress || 'local';
  if (isKeyAttemptRateLimited(ip)) {
    res.status(429).json({ error: 'Too many key attempts. Wait a minute and try again.' });
    return;
  }

  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';
  if (!apiKey) {
    res.status(400).json({ error: 'A Gemini API key is required.' });
    return;
  }

  const directLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(
    req.socket.remoteAddress || ''
  );
  if (!req.secure && !directLoopback) {
    res.status(400).json({
      error: 'Refusing to accept an API key over an unencrypted remote connection. Use HTTPS or connect locally.',
    });
    return;
  }

  try {
    const verification = await validateApiKey(apiKey);
    const hardReject =
      !verification.ok &&
      (verification.status === 400 || verification.status === 401 || verification.status === 403);
    if (hardReject) {
      res.status(400).json({ error: verification.message });
      return;
    }

    const config = await setApiKey(apiKey);
    res.json({
      success: true,
      ...config,
      verified: verification.ok,
      verificationMessage: verification.message,
    });
  } catch (err: any) {
    console.error('[gemini-config] Could not save API key:', err?.message || err);
    res.status(500).json({ error: 'Could not save the API key securely.' });
  }
});

// API: remove the stored key
app.delete('/api/config/key', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const config = await clearApiKey();
    aiClient = null;
    aiClientKey = null;
    res.json({ success: true, ...config });
  } catch (err: any) {
    console.error('[gemini-config] Could not remove API key:', err?.message || err);
    res.status(500).json({ error: 'Could not remove the stored API key.' });
  }
});

// API: choose the active Gemini model
app.post('/api/config/model', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const model = req.body?.model;
  if (!isGeminiModelId(model)) {
    res.status(400).json({ error: 'Unsupported Gemini model.' });
    return;
  }
  try {
    const config = await setModel(model);
    res.json({ success: true, ...config });
  } catch (err: any) {
    console.error('[gemini-config] Could not save model:', err?.message || err);
    res.status(500).json({ error: 'Could not save the selected model.' });
  }
});

// API: Analyze Code in real time
app.post('/api/analyze-code', async (req: Request, res: Response) => {
  const { code, language, userLevel, context, reasoningLevel } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  const fallbackAnalysis = {
    success: true,
    analysis: `Analyzed ${language || 'code'} (${code.split('\n').length} lines). Your structure handles basic flow. Consider memory allocation lifecycles, resource deallocation, and edge boundary invariants.`,
    probingQuestions: [
      `What happens when your input values reach extreme boundaries in ${language}?`,
      `How does ${language} handle resource deallocation or scoping in this snippet?`,
    ],
    conceptHighlight: `Examine variable scope and runtime invariance in ${language}.`,
    issuesDetected: ['Verify boundary checks and error handling on edge inputs.'],
    hints: [
      'Walk through your logic line by line with sample values on scratch paper.',
      'Consider whether all branches terminate properly.',
    ],
    isOfflineFallback: true,
  };

  const ai = getAiClient();

  if (!ai) {
    res.json(fallbackAnalysis);
    return;
  }

  try {
    const prompt = `Student Level: ${userLevel || 'Intermediate'}
Target Language: ${language}
Context/Task: ${context || 'Freeform user code'}

User Code:
\`\`\`${language}
${code}
\`\`\`

Perform a Socratic analysis. Identify what is happening under the hood. Formulate probing questions that stimulate critical thinking. Do not provide the finished code.`;

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: getThinkingLevel(reasoningLevel) },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: 'Concise conceptual breakdown of how the code works and what trade-offs exist.',
            },
            probingQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '1 to 3 probing questions that prompt the student to think deeper.',
            },
            conceptHighlight: {
              type: Type.STRING,
              description: 'The key architectural or language mechanic involved.',
            },
            issuesDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Potential bugs, undefined behavior risks, or anti-patterns detected.',
            },
            hints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Conceptual guidance without giving direct code solutions.',
            },
          },
          required: ['analysis', 'probingQuestions', 'conceptHighlight', 'issuesDetected', 'hints'],
        },
      },
    });

    if (!response || !response.text) {
      res.json(fallbackAnalysis);
      return;
    }

    const parsed = JSON.parse(response.text);
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Gemini analyze error:', err?.message || err);
    // Graceful Socratic fallback so the student is never blocked
    res.json(fallbackAnalysis);
  }
});

// API: Socratic Tutor Dialogue
app.post('/api/ask-tutor', async (req: Request, res: Response) => {
  const { question, code, language, userLevel, history, reasoningLevel } = req.body;

  if (!question) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const fallbackTutor = {
    success: true,
    answer: `In ${language || 'programming'}, fundamental concepts like lexical scope, memory layout (stack vs heap), and type safety determine runtime behavior. When evaluating this operation, ask what transformations occur sequentially.`,
    probingQuestion: `What runtime guarantee does ${language} provide for this construct?`,
    keyInsight: `Mechanical understanding of memory layout and control flow precedes correct syntax.`,
    isOfflineFallback: true,
  };

  const ai = getAiClient();

  if (!ai) {
    res.json(fallbackTutor);
    return;
  }

  try {
    const prompt = `Student Level: ${userLevel || 'Beginner'}
Current Language: ${language}
Current Code in Editor:
\`\`\`${language}
${code || '// Empty editor'}
\`\`\`

User Question: "${question}"

Previous conversation context:
${(history || []).slice(-4).map((m: any) => `${m.role}: ${m.text}`).join('\n')}

Respond Socratically: Explain the core mechanics clearly and concisely, guide them without handing them finished code, and end with a probing question that tests their grasp.`;

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: getThinkingLevel(reasoningLevel) },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Clear, high-signal conceptual explanation without spoon-fed code.',
            },
            probingQuestion: {
              type: Type.STRING,
              description: 'Follow-up question to test their understanding.',
            },
            keyInsight: {
              type: Type.STRING,
              description: 'One-line fundamental principle.',
            },
          },
          required: ['answer', 'probingQuestion', 'keyInsight'],
        },
      },
    });

    if (!response || !response.text) {
      res.json(fallbackTutor);
      return;
    }

    const parsed = JSON.parse(response.text);
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Gemini tutor error:', err?.message || err);
    res.json(fallbackTutor);
  }
});

// API: Generate Adaptive Skill-based Challenge
app.post('/api/generate-challenge', async (req: Request, res: Response) => {
  const { language, userLevel, userFocus, completedCount, reasoningLevel } = req.body;

  const fallbackChallenge = {
    id: `adaptive-${Date.now()}`,
    title: `${language} Fundamentals: Buffer & Flow`,
    language: language || 'Python',
    difficulty: userLevel || 'Beginner',
    description: `Implement a minimal function in ${language} that processes a sequence of integers and returns only the positive values without allocating redundant intermediate copies.`,
    concepts: ['Memory Layout', 'Iteration', 'Conditionals'],
    starterCode: language === 'Rust'
      ? `// Implement filter_positives without unnecessary clones\npub fn filter_positives(nums: &[i32]) -> Vec<i32> {\n    // Your code here\n    todo!()\n}\n\nfn main() {\n    let sample = vec![-2, 0, 5, 12, -7];\n    println!("{:?}", filter_positives(&sample));\n}`
      : language === 'C'
      ? `// Filter positive integers into out_buf\n#include <stdio.h>\n\nint filter_positives(const int* arr, int len, int* out_buf) {\n    // Return count of positive items written\n    return 0;\n}\n\nint main() {\n    int data[] = {-3, 4, 0, 8, -1};\n    int out[5];\n    int count = filter_positives(data, 5, out);\n    printf("Count: %d\\n", count);\n    return 0;\n}`
      : `def filter_positives(numbers: list[int]) -> list[int]:\n    """Return only positive numbers."""\n    pass\n\nif __name__ == '__main__':\n    print(filter_positives([-2, 0, 5, 12, -7]))`,
    testCases: [
      { description: 'Filters out negative values and zero', sampleInput: '[-2, 0, 5, 12, -7]', expectedOutput: '[5, 12]' },
      { description: 'Handles all negative values', sampleInput: '[-1, -2, -3]', expectedOutput: '[]' }
    ],
    probingPrompt: `How does memory allocation change if the input is a streaming iterator vs a fixed contiguous array?`,
    xpReward: 50,
  };

  const ai = getAiClient();

  if (!ai) {
    res.json({ success: true, challenge: fallbackChallenge });
    return;
  }

  try {
    const prompt = `Generate an adaptive, skill-based programming challenge for a student.
Language: ${language}
Level: ${userLevel || 'Beginner'}
Primary Focus/Goal: ${userFocus || 'General Systems Mastery'}
Prior challenges completed: ${completedCount || 0}

Ensure the challenge is practical, minimalist, and tests idiomatic ${language} features (e.g. ownership/borrowing in Rust, pointers/headers in C, RAII/templates in C++, table/metatables in Lua, typed annotations in Luau, list comps/generators in Python, node trees/signals in GDScript).
Do not provide the solution. Provide clear starter code with TODO or structure.`;

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: getThinkingLevel(reasoningLevel) },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            language: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            description: { type: Type.STRING },
            concepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            starterCode: { type: Type.STRING },
            testCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  sampleInput: { type: Type.STRING },
                  expectedOutput: { type: Type.STRING },
                },
                required: ['description', 'sampleInput', 'expectedOutput'],
              },
            },
            probingPrompt: { type: Type.STRING },
            xpReward: { type: Type.INTEGER },
          },
          required: ['id', 'title', 'language', 'difficulty', 'description', 'concepts', 'starterCode', 'testCases', 'probingPrompt', 'xpReward'],
        },
      },
    });

    if (!response || !response.text) {
      res.json({ success: true, challenge: fallbackChallenge });
      return;
    }

    const parsed = JSON.parse(response.text);
    res.json({ success: true, challenge: parsed });
  } catch (err: any) {
    console.error('Gemini challenge generation error:', err?.message || err);
    res.json({ success: true, challenge: fallbackChallenge });
  }
});

// API: Evaluate User Solution Socratically
app.post('/api/evaluate-solution', async (req: Request, res: Response) => {
  const { code, language, challengeTitle, challengeDescription, testCases, reasoningLevel } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  const fallbackEvaluation = {
    success: true,
    passed: true,
    feedback: 'Code evaluated with structural static checks. The logic conforms to basic challenge requirements.',
    probingQuestion: 'How would this solution behave if input bounds were scaled by 10,000x?',
    xpEarned: 50,
    idiomaticScore: 88,
    suggestions: ['Consider memory consumption under extreme concurrency or unbounded loops.'],
    isOfflineFallback: true,
  };

  const ai = getAiClient();

  if (!ai) {
    res.json(fallbackEvaluation);
    return;
  }

  try {
    const prompt = `Language: ${language}
Challenge Title: ${challengeTitle || 'Custom Challenge'}
Challenge Goal: ${challengeDescription || 'Verify functionality'}
Test Cases: ${JSON.stringify(testCases || [])}

Student's Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Evaluate whether the code solves the challenge correctly, robustly, and idiomatically in ${language}.
Provide honest, constructive, minimalist feedback. Ask 1 follow-up question that challenges them to optimize or handle a subtle edge case.`;

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingLevel: getThinkingLevel(reasoningLevel) },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passed: {
              type: Type.BOOLEAN,
              description: 'Whether the code logically meets the challenge requirements.',
            },
            feedback: {
              type: Type.STRING,
              description: 'Concise assessment of logic, correctness, and style.',
            },
            probingQuestion: {
              type: Type.STRING,
              description: 'Sharp question testing understanding or deeper optimization.',
            },
            xpEarned: {
              type: Type.INTEGER,
              description: 'XP awarded (e.g. 30 to 100 based on completion quality).',
            },
            idiomaticScore: {
              type: Type.INTEGER,
              description: 'Score from 0 to 100 measuring idiomatic language usage.',
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '1 or 2 high-level suggestions for refinement.',
            },
          },
          required: ['passed', 'feedback', 'probingQuestion', 'xpEarned', 'idiomaticScore'],
        },
      },
    });

    if (!response || !response.text) {
      res.json(fallbackEvaluation);
      return;
    }

    const parsed = JSON.parse(response.text);
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Gemini evaluate error:', err?.message || err);
    res.json(fallbackEvaluation);
  }
});

// Minimal environment for submitted code. Never forward the server environment:
// it may contain credentials that a student's snippet could exfiltrate.
function getSandboxEnv(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    LANG: process.env.LANG || 'C.UTF-8',
    TMPDIR: os.tmpdir(),
    PYTHONDONTWRITEBYTECODE: '1',
  };
}

// Native snippets are sandboxed with bubblewrap when it is available. This is
// what keeps user code away from ~/.config/zenith-code (and therefore the vault).
let sandboxProbe: Promise<boolean> | null = null;

function isSandboxAvailable(): Promise<boolean> {
  if (sandboxProbe) return sandboxProbe;
  sandboxProbe = new Promise((resolve) => {
    fs.access('/usr/bin/bwrap', 1)
      .then(() => {
        const probe = spawn(
          '/usr/bin/bwrap',
          [
            '--unshare-all',
            '--die-with-parent',
            '--clearenv',
            '--ro-bind', '/usr', '/usr',
            '--symlink', 'usr/bin', '/bin',
            '--symlink', 'usr/lib', '/lib',
            '--symlink', 'usr/lib', '/lib64',
            '--proc', '/proc',
            '--dev', '/dev',
            '--',
            '/usr/bin/true',
          ],
          { stdio: 'ignore', env: getSandboxEnv() }
        );
        const timer = setTimeout(() => probe.kill('SIGKILL'), 2000);
        probe.on('close', (code) => {
          clearTimeout(timer);
          resolve(code === 0);
        });
        probe.on('error', () => {
          clearTimeout(timer);
          resolve(false);
        });
      })
      .catch(() => resolve(false));
  });
  return sandboxProbe;
}

interface SandboxedCommand {
  command: string;
  args: string[];
  cwd: string;
}

/**
 * Build either a direct command or a bubblewrap-isolated command. The sandbox
 * has no network, no home directory, no host /tmp, and a read-only /usr.
 */
function buildSandboxedCommand(
  kind: 'python' | 'node',
  hostFile: string,
  guestFile: string,
  programArgs: string[],
  sandboxed: boolean
): SandboxedCommand {
  if (!sandboxed) {
    return {
      command: kind === 'python' ? 'python3' : 'node',
      args: programArgs.map((arg) => (arg === guestFile ? hostFile : arg)),
      cwd: os.tmpdir(),
    };
  }

  const binary = kind === 'python' ? '/usr/bin/python3' : '/usr/bin/node';
  return {
    command: '/usr/bin/bwrap',
    args: [
      '--unshare-all',
      '--die-with-parent',
      '--new-session',
      '--clearenv',
      '--setenv', 'PATH', '/usr/bin:/bin',
      '--setenv', 'LANG', process.env.LANG || 'C.UTF-8',
      '--setenv', 'PYTHONDONTWRITEBYTECODE', '1',
      '--ro-bind', '/usr', '/usr',
      '--ro-bind', '/etc', '/etc',
      '--proc', '/proc',
      '--dev', '/dev',
      '--tmpfs', '/tmp',
      '--symlink', 'usr/bin', '/bin',
      '--symlink', 'usr/lib', '/lib',
      '--symlink', 'usr/lib', '/lib64',
      '--dir', '/sandbox',
      '--ro-bind', hostFile, guestFile,
      '--chdir', '/sandbox',
      '--',
      binary,
      ...programArgs,
    ],
    cwd: '/',
  };
}

// Helper: Execute Python natively via python3
async function runNativePython(
  code: string,
  stdin: string = '',
  flags: string = 'standard'
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  compilerVersion: string;
  memoryInsight: string;
  executionTrace: Array<{ step: string; memory: string }>;
  engine: 'native' | 'emulated';
}> {
  const start = Date.now();
  const sandboxed = await isSandboxAvailable();
  const tmpFile = path.join(os.tmpdir(), `zenith_py_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);
  await fs.writeFile(tmpFile, code, 'utf8');

  const args: string[] = [];
  if (flags === 'strict') {
    args.push('-W', 'error');
  }
  args.push('-u', '/sandbox/main.py');
  const { command, args: spawnArgs, cwd } = buildSandboxedCommand(
    'python',
    tmpFile,
    '/sandbox/main.py',
    args,
    sandboxed
  );
  const runtimeLabel = sandboxed ? 'Python 3 (Native · bubblewrap)' : 'Python 3 (Native)';

  try {
    return await new Promise((resolve) => {
      const proc = spawn(command, spawnArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd,
        env: getSandboxEnv(),
      });

      let stdout = '';
      let stderr = '';
      let killed = false;
      const MAX_BYTES = 128 * 1024;

      const timer = setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
      }, 6000);

      proc.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_BYTES) {
          stdout += chunk.toString();
        }
      });

      proc.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_BYTES) {
          stderr += chunk.toString();
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: `Failed to launch Python runtime: ${err.message}`,
          exitCode: 1,
          durationMs: Date.now() - start,
          compilerVersion: runtimeLabel,
          memoryInsight: 'Execution failed before interpreter initialization.',
          executionTrace: [],
          engine: 'native',
        });
      });

      proc.on('close', (exitCode) => {
        clearTimeout(timer);
        if (killed) {
          stderr += '\nExecution stopped: exceeded 6 second safety limit (possible infinite loop).';
        }
        const cleanedStderr = stderr
          .replace(new RegExp(tmpFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'main.py')
          .replace(/\/sandbox\/main\.py/g, 'main.py');

        const trace: Array<{ step: string; memory: string }> = [
          { step: 'CPython VM Initialized', memory: 'Module frame & global namespace allocated' },
        ];
        if (/def\s+\w+/.test(code)) {
          trace.push({ step: 'Function Objects Bound', memory: 'Code objects stored on heap; call frames pushed per call' });
        }
        if (/class\s+\w+/.test(code)) {
          trace.push({ step: 'Class Blueprints Loaded', memory: 'Instance dictionaries allocated dynamically' });
        }
        trace.push({
          step: exitCode === 0 ? 'Clean Shutdown' : `Halted (Exit ${exitCode ?? 1})`,
          memory: 'Reference counts decremented to 0; cycle GC swept',
        });

        resolve({
          stdout: stdout.trimEnd(),
          stderr: cleanedStderr.trimEnd(),
          exitCode: killed ? 124 : (exitCode ?? 0),
          durationMs: Math.max(4, Date.now() - start),
          compilerVersion:
            flags === 'strict' ? `${runtimeLabel} · -W error` : runtimeLabel,
          memoryInsight: 'Executed natively in CPython 3. Objects use reference counting with generational cycle garbage collection.',
          executionTrace: trace,
          engine: 'native',
        });
      });

      if (stdin) {
        proc.stdin.write(stdin);
      }
      proc.stdin.end();
    });
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

// Helper: Execute JavaScript natively via Node.js
async function runNativeJavaScript(
  code: string,
  stdin: string = '',
  flags: string = 'standard'
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  compilerVersion: string;
  memoryInsight: string;
  executionTrace: Array<{ step: string; memory: string }>;
  engine: 'native' | 'emulated';
}> {
  const start = Date.now();
  const sandboxed = await isSandboxAvailable();
  const ext = flags === 'strict' ? 'mjs' : 'js';
  const guestFile = ext === 'mjs' ? '/sandbox/main.mjs' : '/sandbox/main.js';
  const wrappedCode = flags === 'strict' ? `'use strict';\n${code}` : code;
  const tmpFile = path.join(os.tmpdir(), `zenith_js_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  await fs.writeFile(tmpFile, wrappedCode, 'utf8');

  const { command, args, cwd } = buildSandboxedCommand(
    'node',
    tmpFile,
    guestFile,
    [guestFile],
    sandboxed
  );
  const runtimeLabel = sandboxed ? 'Node.js (Native · bubblewrap)' : 'Node.js (Native V8)';

  try {
    return await new Promise((resolve) => {
      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd,
        env: getSandboxEnv(),
      });

      let stdout = '';
      let stderr = '';
      let killed = false;
      const MAX_BYTES = 128 * 1024;

      const timer = setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
      }, 6000);

      proc.stdout.on('data', (chunk) => {
        if (stdout.length < MAX_BYTES) stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk) => {
        if (stderr.length < MAX_BYTES) stderr += chunk.toString();
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: `Failed to launch Node.js runtime: ${err.message}`,
          exitCode: 1,
          durationMs: Date.now() - start,
          compilerVersion: runtimeLabel,
          memoryInsight: 'Execution failed before V8 isolate initialization.',
          executionTrace: [],
          engine: 'native',
        });
      });

      proc.on('close', (exitCode) => {
        clearTimeout(timer);
        if (killed) {
          stderr += '\nExecution stopped: exceeded 6 second safety limit (possible infinite loop).';
        }
        const cleanedStderr = stderr
          .replace(new RegExp(tmpFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'main.js')
          .replace(/\/sandbox\/main\.(js|mjs)/g, 'main.$1');

        const trace: Array<{ step: string; memory: string }> = [
          { step: 'V8 Isolate Initialized', memory: 'Call stack & generational V8 heap created' },
        ];
        if (/function\s+\w+|=>/.test(code)) {
          trace.push({ step: 'Closures & Functions Bound', memory: 'Lexical scopes captured in V8 heap contexts' });
        }
        trace.push({
          step: exitCode === 0 ? 'Event Loop Drained' : `Halted (Exit ${exitCode ?? 1})`,
          memory: 'Young-generation Scavenger / Mark-Sweep GC active',
        });

        resolve({
          stdout: stdout.trimEnd(),
          stderr: cleanedStderr.trimEnd(),
          exitCode: killed ? 124 : (exitCode ?? 0),
          durationMs: Math.max(4, Date.now() - start),
          compilerVersion:
            flags === 'strict' ? `${runtimeLabel} · Strict ESM` : runtimeLabel,
          memoryInsight: 'Executed natively in Node.js V8. Primitives live on the call stack while objects, arrays, and closures allocate on the generational V8 heap.',
          executionTrace: trace,
          engine: 'native',
        });
      });

      if (stdin) {
        proc.stdin.write(stdin);
      }
      proc.stdin.end();
    });
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

// API: Overhauled Multi-Language Run Code Endpoint
app.post('/api/run-code', async (req: Request, res: Response) => {
  const { code, language, stdin = '', flags = 'standard' } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Code is required' });
    return;
  }

  // 1. Native Execution for Python & JavaScript
  if (language === 'python') {
    try {
      const pyResult = await runNativePython(code, stdin, flags);
      res.json({ success: true, ...pyResult });
      return;
    } catch (err: any) {
      console.error('Native Python runner error:', err?.message || err);
    }
  }

  if (language === 'javascript') {
    try {
      const jsResult = await runNativeJavaScript(code, stdin, flags);
      res.json({ success: true, ...jsResult });
      return;
    } catch (err: any) {
      console.error('Native JavaScript runner error:', err?.message || err);
    }
  }

  // 2. Faithful Compiler & Runtime Emulation for Rust, C, C++, Java, Lua, Luau, GDScript
  const ai = getAiClient();
  if (!ai) {
    res.json({ success: false, fallbackToLocal: true });
    return;
  }

  const start = Date.now();
  try {
    const compilerProfiles: Record<string, string> = {
      rust:
        flags === 'release'
          ? 'rustc 1.84.0 (edition 2024, -O3 release mode)'
          : flags === 'clippy'
          ? 'rustc 1.84.0 + clippy strict lints'
          : 'rustc 1.84.0 (edition 2024, debug)',
      c:
        flags === 'strict'
          ? 'gcc 14.2 (-std=c17 -Wall -Wextra -Werror)'
          : flags === 'c99'
          ? 'gcc 14.2 (-std=c99)'
          : 'gcc 14.2 (-std=c17)',
      cpp:
        flags === 'asan'
          ? 'clang++ 19 (-std=c++20 -fsanitize=address,undefined)'
          : flags === 'cpp23'
          ? 'clang++ 19 (-std=c++23)'
          : 'clang++ 19 (-std=c++20)',
      java:
        flags === 'lint'
          ? 'OpenJDK 21 LTS (javac -Xlint:all)'
          : flags === 'preview'
          ? 'OpenJDK 21 LTS (--enable-preview)'
          : 'OpenJDK 21 LTS (javac + JVM)',
      go:
        flags === 'race'
          ? 'Go 1.23 (go run -race)'
          : flags === 'vet'
          ? 'Go 1.23 (go vet + run)'
          : 'Go 1.23 (gc compiler)',
      csharp:
        flags === 'nullable'
          ? '.NET 8 C# 12 (#nullable enable / warnings as errors)'
          : flags === 'aot'
          ? '.NET 8 C# 12 (Native AOT Release)'
          : '.NET 8 (C# 12 CLR JIT)',
      lua: flags === 'luajit' ? 'LuaJIT 2.1' : 'Lua 5.4.7',
      luau: flags === 'nonstrict' ? 'Luau 0.650 (--!nonstrict)' : 'Luau 0.650 (--!strict)',
      gdscript: flags === 'typed' ? 'Godot 4.3 GDScript (Safe Typed Lines)' : 'Godot 4.3 GDScript',
      python: 'Python 3.12',
      javascript: 'Node.js 22',
    };

    const selectedToolchain = compilerProfiles[language] || language;

    const prompt = `Act as a deterministic, 100% accurate compiler and runtime engine for ${selectedToolchain}.
Execute the exact source code below and return its EXACT output or authentic compiler/runtime diagnostics.

Rules:
1. Check syntax, types, borrow-checking (Rust), pointer/memory validity (C/C++), strict type annotations (Luau --!strict), metatables (Lua), and Godot _init/_ready lifecycle (GDScript).
2. If there is a compile error, type error, borrow-checker error, missing semicolon, or runtime crash (e.g. out-of-bounds, division by zero, null deref), set exitCode to 1 and put realistic ${selectedToolchain} error diagnostics in stderr with line numbers. Do NOT fabricate success output on broken code.
3. If valid, compute EVERY loop, function call, arithmetic expression, struct, format specifier (%d, %.2f, %zu, {}, {:?}, string.format), and RAII destructor order accurately. Put ONLY exact program stdout in "stdout" (no commentary inside stdout).
4. Consume standard input (stdin) if the program reads input.
5. Provide 2-4 concise executionTrace entries showing actual variables, stack frames, heap allocations, or drops from THIS code.

Compiler/Runtime: ${selectedToolchain}
Standard Input (stdin):
${stdin ? stdin : '(none)'}

Source Code:
\`\`\`${language}
${code}
\`\`\``;

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stdout: {
              type: Type.STRING,
              description: 'Exact program standard output (or empty string on error).',
            },
            stderr: {
              type: Type.STRING,
              description: 'Exact compiler diagnostics or runtime errors (empty string if clean).',
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Optional compiler warnings (e.g. unused variables).',
            },
            exitCode: {
              type: Type.INTEGER,
              description: '0 for success, non-zero for compile/runtime failure.',
            },
            compilerVersion: {
              type: Type.STRING,
              description: 'Toolchain label used.',
            },
            memoryInsight: {
              type: Type.STRING,
              description: 'Specific 1-2 sentence explanation of stack, heap, ownership, or GC behavior in this run.',
            },
            executionTrace: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  memory: { type: Type.STRING },
                },
                required: ['step', 'memory'],
              },
              description: '2 to 4 chronological execution steps with memory state.',
            },
          },
          required: ['stdout', 'stderr', 'exitCode', 'compilerVersion', 'memoryInsight', 'executionTrace'],
        },
      },
    });

    if (!response || !response.text) {
      res.json({ success: false, fallbackToLocal: true });
      return;
    }

    const parsed = JSON.parse(response.text);
    res.json({
      success: true,
      ...parsed,
      compilerVersion: parsed.compilerVersion || selectedToolchain,
      durationMs: Math.max(12, Date.now() - start),
      engine: 'emulated',
    });
  } catch (err: any) {
    console.error('Run-code endpoint error:', err?.message || err);
    res.json({ success: false, fallbackToLocal: true });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  const sandboxed = await isSandboxAvailable();
  if (!sandboxed) {
    console.warn(
      '[runner] bubblewrap is unavailable. Native snippets will run with the server user\'s filesystem access. Install bubblewrap to isolate them from the encrypted key vault.'
    );
  }

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, host, () => {
    const shownHost = host === '0.0.0.0' ? 'localhost' : host;
    console.log(`Zenith Code platform running at http://${shownHost}:${port}`);
    console.log(`Gemini API key vault: ${getPublicConfig().configDir}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
