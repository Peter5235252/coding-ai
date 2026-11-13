/**
 * Shared Gemini model catalog used by both the Express API and the React UI.
 * Keep this file free of Node- or browser-only imports.
 */

export type GeminiModelId = 'gemini-4-hydrogen' | 'gemini-4-argon' | 'gemini-4-carbon';

export type GeminiModelBadge = 'FREE TIER' | 'BALANCED' | 'SOTA';

export interface GeminiModelSource {
  label: string;
  url: string;
}

export interface GeminiModelInfo {
  id: GeminiModelId;
  name: string;
  shortName: string;
  badge: GeminiModelBadge;
  tagline: string;
  description: string;
  bestFor: string[];
  contextWindow: string;
  thinkingLevels: string;
  freeTier: boolean;
  priceLabel: string;
  /** Relative speed, 1 (slowest) to 3 (fastest). */
  speed: number;
  /** Relative reasoning depth, 1 (lowest) to 3 (highest). */
  depth: number;
  highlight?: string;
  sources: GeminiModelSource[];
}

export const HYDROGEN_BENCHMARKS = [
  {
    value: '51 vs 50',
    label: 'Artificial Analysis Intelligence Index at the default high thinking level',
    detail: 'Hydrogen edges out Gemini 4 Argon — and reaches 54 at the new xhigh setting.',
  },
  {
    value: '2.5×',
    label: 'faster than Gemini 3.8 Flash on agentic tasks',
    detail: 'Terminal-Bench 4.1 rises from 18.2% to 57.0% while finishing tasks 2.5× faster.',
  },
  {
    value: 'Free',
    label: 'on the Gemini API free tier',
    detail: 'Standard free-tier RPM rates apply. Paid usage is $1.50 / $7.50 per 1M tokens.',
  },
] as const;

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen',
    shortName: 'Hydrogen',
    badge: 'FREE TIER',
    tagline: 'Fast, free, and deceptively strong.',
    description:
      'The everyday workhorse. Built for rapid coding and agentic execution, it outscores Gemini 4 Argon on the Artificial Analysis Intelligence Index at its default thinking level.',
    bestFor: ['Everyday coding & debugging', 'Interactive prototyping', 'High-volume Socratic tutoring'],
    contextWindow: '1M tokens',
    thinkingLevels: 'low · medium · high · xhigh',
    freeTier: true,
    priceLabel: 'Free tier · $1.50 / $7.50 paid',
    speed: 3,
    depth: 2,
    highlight: 'Outscores Argon on the AA Intelligence Index (51 vs 50) and is free within standard RPM limits.',
    sources: [
      {
        label: 'Google: Introducing Gemini 4 Hydrogen',
        url: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-hydrogen/',
      },
      {
        label: 'Gemini API pricing & free tier',
        url: 'https://ai.google.dev/gemini-api/docs/pricing#gemini-4-hydrogen',
      },
      {
        label: 'Artificial Analysis',
        url: 'https://artificialanalysis.ai/',
      },
    ],
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    shortName: 'Argon',
    badge: 'BALANCED',
    tagline: 'Frontier reasoning with lower token spend.',
    description:
      'A Gemini 4 frontier reasoning model for complex, long-horizon work. It keeps more intelligence per turn than Carbon while using fewer thinking tokens.',
    bestFor: ['Multi-step architecture work', 'Hard debugging sessions', 'Long-horizon agent tasks'],
    contextWindow: '1M tokens',
    thinkingLevels: 'low · medium · high',
    freeTier: false,
    priceLabel: '$2.00 / $10.00 per 1M',
    speed: 2,
    depth: 3,
    sources: [
      {
        label: 'Gemini API pricing — Argon',
        url: 'https://ai.google.dev/gemini-api/docs/pricing#gemini-4-argon',
      },
      {
        label: 'Gemini 4 Argon model card',
        url: 'https://deepmind.google/models/model-cards/gemini-4-argon/',
      },
    ],
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    shortName: 'Carbon',
    badge: 'SOTA',
    tagline: 'Maximum depth for the hardest problems.',
    description:
      'The strongest Gemini 4 frontier model. Carbon spends more thinking tokens to test hypotheses, verify edge cases, and audit architecture, science, and security work.',
    bestFor: ['Deep architecture & security audits', 'Scientific reasoning', 'Long-decode generation'],
    contextWindow: '1M tokens',
    thinkingLevels: 'low · medium · high',
    freeTier: false,
    priceLabel: '$2.00 / $10.00 per 1M',
    speed: 1,
    depth: 3,
    sources: [
      {
        label: 'Gemini API pricing — Carbon',
        url: 'https://ai.google.dev/gemini-api/docs/pricing#gemini-4-carbon',
      },
      {
        label: 'Gemini 4 model lineup',
        url: 'https://ai.google.dev/gemini-api/docs/models',
      },
    ],
  },
];

export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-4-hydrogen';

const MODEL_IDS = new Set<string>(GEMINI_MODELS.map((model) => model.id));

export function isGeminiModelId(value: unknown): value is GeminiModelId {
  return typeof value === 'string' && MODEL_IDS.has(value);
}

export function getGeminiModel(id: string | undefined | null): GeminiModelInfo {
  return GEMINI_MODELS.find((model) => model.id === id) ?? GEMINI_MODELS[0];
}
