import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccentColor,
  BackgroundGradientStyle,
  CornerRadiusStyle,
} from '../types';
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  HYDROGEN_BENCHMARKS,
  getGeminiModel,
  type GeminiModelId,
  type GeminiModelInfo,
} from '../../shared/geminiModels';
import { ACCENT_MAP, getPanelRadiusClass, getSurfacePalette } from '../utils/themeData';
import {
  clearGeminiKey,
  saveGeminiKey,
  saveGeminiModel,
  type GeminiRuntimeConfig,
} from '../utils/geminiConfig';
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  Crown,
  Eye,
  EyeOff,
  ExternalLink,
  Gauge,
  KeyRound,
  Loader2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface GeminiSetupModalProps {
  isOpen: boolean;
  mode: 'initial' | 'manage';
  config: GeminiRuntimeConfig | null;
  onSaved: (config: GeminiRuntimeConfig) => void;
  onSkip?: () => void;
  onClose?: () => void;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
  cornerRadius?: CornerRadiusStyle;
}

const MODEL_ICONS: Record<GeminiModelId, React.ReactNode> = {
  'gemini-4-hydrogen': <Zap className="w-4 h-4" />,
  'gemini-4-argon': <Scale className="w-4 h-4" />,
  'gemini-4-carbon': <Crown className="w-4 h-4" />,
};

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${value}/3`}>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`h-1.5 w-3 rounded-full ${
              step <= value ? 'bg-current opacity-80' : 'bg-current opacity-15'
            }`}
          />
        ))}
      </span>
    </div>
  );
}

function ModelCard({
  model,
  selected,
  onSelect,
  accentConf,
  surface,
  radiusClass,
}: {
  model: GeminiModelInfo;
  selected: boolean;
  onSelect: () => void;
  accentConf: (typeof ACCENT_MAP)[keyof typeof ACCENT_MAP];
  surface: ReturnType<typeof getSurfacePalette>;
  radiusClass: string;
}) {
  const badgeClass =
    model.badge === 'SOTA'
      ? 'border-amber-500/35 bg-amber-500/10 text-amber-700'
      : model.freeTier
      ? `${accentConf.border} ${accentConf.bgSubtle} ${accentConf.text}`
      : `${surface.border} ${surface.chipBg} ${surface.textMuted}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative text-left flex flex-col p-4 border-2 ${radiusClass} transition-all ${
        selected
          ? `${accentConf.border} ${accentConf.bgSubtle} shadow-sm`
          : `${surface.border} ${surface.card} hover:opacity-95`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            selected ? `${accentConf.bg} ${accentConf.text}` : `${surface.chipBg} ${surface.textMuted}`
          }`}
        >
          {MODEL_ICONS[model.id]}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wide ${badgeClass}`}>
            {model.badge}
          </span>
          <span
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
              selected
                ? `${accentConf.bg} border-transparent`
                : `${surface.border} ${surface.cardMuted}`
            }`}
          >
            {selected && <Check className="w-2.5 h-2.5" />}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className={`text-sm font-bold ${surface.text}`}>{model.name}</h3>
        <p className={`text-[11px] leading-relaxed ${surface.textMuted}`}>{model.tagline}</p>
      </div>

      <p className={`mt-2.5 text-[11px] leading-relaxed ${surface.textSubtle}`}>
        {model.description}
      </p>

      <ul className="mt-3 space-y-1">
        {model.bestFor.map((item) => (
          <li key={item} className={`flex items-start gap-1.5 text-[11px] ${surface.textMuted}`}>
            <Check className={`w-3 h-3 mt-0.5 shrink-0 ${accentConf.text}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className={`mt-4 pt-3 border-t ${surface.border} space-y-2`}>
        <div className={`flex items-center justify-between gap-2 text-[10px] ${surface.textSubtle}`}>
          <span className="inline-flex items-center gap-1">
            <Brain className="w-3 h-3" /> {model.contextWindow}
          </span>
          <span>{model.priceLabel}</span>
        </div>
        <div className={`flex items-center gap-3 text-[10px] ${surface.textSubtle}`}>
          <Meter value={model.speed} label="Speed" />
          <Meter value={model.depth} label="Depth" />
        </div>
      </div>
    </button>
  );
}

export const GeminiSetupModal: React.FC<GeminiSetupModalProps> = ({
  isOpen,
  mode,
  config,
  onSaved,
  onSkip,
  onClose,
  accent = 'sage',
  bgGradient = 'warm-linen',
  cornerRadius = 'rounded',
}) => {
  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);
  const radiusClass = getPanelRadiusClass(cornerRadius);
  const initialModel = (config?.model || DEFAULT_GEMINI_MODEL) as GeminiModelId;

  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(initialModel);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [replacingKey, setReplacingKey] = useState(!config?.hasKey);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!isOpen) return;
    const current = configRef.current;
    setSelectedModel((current?.model || DEFAULT_GEMINI_MODEL) as GeminiModelId);
    setApiKey('');
    setShowKey(false);
    setReplacingKey(!current?.hasKey);
    setConfirmRemove(false);
    setError(null);
    setNotice(null);
    setShowSources(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== 'manage' || !onClose) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode, onClose]);

  const selectedInfo = useMemo(() => getGeminiModel(selectedModel), [selectedModel]);

  if (!isOpen) return null;

  const hasExistingKey = Boolean(config?.hasKey);
  const keyChanged = apiKey.trim().length > 0;
  const modelChanged = selectedModel !== config?.model;
  const canSave = hasExistingKey ? keyChanged || modelChanged : keyChanged;

  const handleSave = async () => {
    setError(null);
    setNotice(null);
    if (!canSave) {
      setError('Paste a Gemini API key to continue, or explore the studio offline.');
      return;
    }
    setSaving(true);
    try {
      let next: GeminiRuntimeConfig = config || {
        hasKey: false,
        maskedKey: null,
        model: selectedModel,
      };

      if (keyChanged) {
        next = await saveGeminiKey(apiKey.trim());
      }
      if (selectedModel !== next.model) {
        next = await saveGeminiModel(selectedModel);
      }

      const message = keyChanged
        ? next.verified === false
          ? next.verificationMessage || 'Key saved. Verification will retry on the next request.'
          : 'Key verified and encrypted locally.'
        : 'Model preference saved.';
      setNotice(message);
      setApiKey('');
      setReplacingKey(false);
      onSaved(next);
    } catch (err: any) {
      setError(err?.message || 'Could not save your Gemini settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    setRemoving(true);
    setError(null);
    setNotice(null);
    try {
      const next = await clearGeminiKey();
      setConfirmRemove(false);
      setReplacingKey(true);
      setNotice('Stored key removed. The app will use offline fallbacks until you add a new key.');
      onSaved(next);
    } catch (err: any) {
      setError(err?.message || 'Could not remove the stored key.');
    } finally {
      setRemoving(false);
    }
  };

  const title = mode === 'initial' ? 'Select your ideal Gemini model' : 'Gemini model & API key';
  const subtitle =
    mode === 'initial'
      ? 'Choose your mentor and connect your own key. Nothing is pre-baked or shared.'
      : 'Switch models or rotate the API key stored on this machine.';

  return (
    <div className="zenith-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm p-3 sm:p-4 font-sans">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gemini-setup-title"
        className={`zenith-modal-surface w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-5 sm:px-6 py-4 border-b ${surface.border} ${surface.cardMuted} flex items-start justify-between gap-4 shrink-0`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-2xl ${accentConf.bgSubtle} ${accentConf.text} flex items-center justify-center shrink-0`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="gemini-setup-title" className={`text-base font-bold ${surface.text}`}>
                  {title}
                </h2>
                {mode === 'initial' && (
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide border ${accentConf.border} ${accentConf.bgSubtle} ${accentConf.text}`}>
                    BRING YOUR OWN KEY
                  </span>
                )}
              </div>
              <p className={`text-xs ${surface.textSubtle} mt-0.5`}>{subtitle}</p>
            </div>
          </div>
          {mode === 'manage' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors shrink-0`}
              title="Close Gemini settings"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-1 w-full bg-black/5">
          <div className={`h-full ${accentConf.bg} w-full opacity-80`} />
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          <div className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border ${surface.border} ${surface.chipBg} text-[11px] ${surface.textMuted}`}>
            <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${accentConf.text}`} />
            <p>
              Your key is sent only to this local server, encrypted with <strong>AES-256-GCM</strong> at rest,
              and never returned to the browser or bundled with the app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GEMINI_MODELS.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                selected={selectedModel === model.id}
                onSelect={() => setSelectedModel(model.id)}
                accentConf={accentConf}
                surface={surface}
                radiusClass={radiusClass}
              />
            ))}
          </div>

          {selectedModel === 'gemini-4-hydrogen' && (
            <div className={`rounded-2xl border ${accentConf.border} ${accentConf.bgSubtle} p-3.5`}>
              <div className="flex items-start gap-2.5">
                <TrendingUp className={`w-4 h-4 mt-0.5 shrink-0 ${accentConf.text}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${surface.text}`}>
                    Why Hydrogen can outperform a bigger flagship
                  </p>
                  <p className={`text-[11px] leading-relaxed ${surface.textMuted} mt-1`}>
                    {selectedInfo.highlight}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    {HYDROGEN_BENCHMARKS.map((benchmark) => (
                      <div key={benchmark.label} className={`rounded-xl border ${surface.border} ${surface.card} px-2.5 py-2`}>
                        <div className={`text-sm font-bold ${accentConf.text}`}>{benchmark.value}</div>
                        <div className={`text-[10px] leading-snug ${surface.textMuted}`}>{benchmark.label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSources((value) => !value)}
                    className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold ${accentConf.text} hover:opacity-80`}
                  >
                    Benchmark details &amp; sources
                    <ChevronDown className={`w-3 h-3 transition-transform ${showSources ? 'rotate-180' : ''}`} />
                  </button>
                  {showSources && (
                    <div className={`mt-2 space-y-2 text-[10px] ${surface.textMuted}`}>
                      {HYDROGEN_BENCHMARKS.map((benchmark) => (
                        <p key={`${benchmark.value}-detail`}>
                          <strong>{benchmark.value}</strong> — {benchmark.detail}
                        </p>
                      ))}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                        {selectedInfo.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1 underline underline-offset-2 ${accentConf.text}`}
                          >
                            {source.label}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                      <p className={`${surface.textSubtle} pt-1`}>
                        Benchmarks are vendor-reported or third-party measurements as of November 2026.
                        Actual results vary by prompt, thinking level, and load.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* API key */}
          <div className={`rounded-2xl border ${surface.border} ${surface.card} p-4 space-y-3`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <KeyRound className={`w-4 h-4 ${accentConf.text}`} />
                <h3 className={`text-sm font-semibold ${surface.text}`}>Gemini API key</h3>
              </div>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${accentConf.text} hover:opacity-80`}
              >
                Get a key in AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {hasExistingKey && !replacingKey ? (
              <div className={`flex items-center justify-between gap-3 rounded-xl border ${surface.border} ${surface.chipBg} px-3.5 py-2.5`}>
                <div className="flex items-center gap-2 min-w-0">
                  <LockKeyhole className={`w-3.5 h-3.5 ${accentConf.text} shrink-0`} />
                  <span className={`font-mono text-xs ${surface.text} truncate`}>{config?.maskedKey}</span>
                  <span className={`text-[10px] ${surface.textSubtle} hidden sm:inline`}>encrypted on this machine</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReplacingKey(true)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={removing}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      confirmRemove
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-600'
                        : `${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`
                    }`}
                    title={confirmRemove ? 'Click again to remove the stored key' : 'Remove stored key'}
                  >
                    {removing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : confirmRemove ? (
                      'Confirm remove'
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value);
                      setError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && canSave && !saving) {
                        event.preventDefault();
                        void handleSave();
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Paste your Gemini API key"
                    aria-label="Gemini API key"
                    className={`w-full rounded-xl border px-3.5 py-2.5 pr-20 text-sm font-mono ${surface.input} focus:outline-hidden focus:ring-2 focus:ring-black/5`}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey((value) => !value)}
                      className={`p-1.5 rounded-lg ${surface.textMuted} ${surface.hoverBg}`}
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {hasExistingKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingKey(false);
                          setApiKey('');
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] ${surface.textMuted} ${surface.hoverBg}`}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-[10px] ${surface.textSubtle} flex items-center gap-1.5`}>
                  <LockKeyhole className="w-3 h-3" />
                  Stored at <span className="font-mono">{config?.configDir || '~/.config/zenith-code'}</span>.
                  Never saved in localStorage. The key is used only for Gemini requests from this server.
                </p>
              </div>
            )}

            {!hasExistingKey && (
              <p className={`text-[10px] ${surface.textSubtle}`}>
                No key yet. You can still explore the editor, lessons, and offline fallbacks.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-[11px] text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className={`rounded-xl border ${accentConf.border} ${accentConf.bgSubtle} px-3.5 py-2.5 text-[11px] ${accentConf.text}`}>
              {notice}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 sm:px-6 py-4 border-t ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-3 shrink-0 flex-wrap`}>
          <div className="min-w-0">
            {mode === 'initial' && onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${surface.textMuted} hover:opacity-80`}
              >
                Explore offline
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-[10px] ${surface.textSubtle}`}>
                <Gauge className="w-3 h-3" />
                Active model: <strong>{getGeminiModel(config?.model).shortName}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'manage' && onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${accentConf.bg} shadow-xs transition-all disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving securely…
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {mode === 'initial' ? 'Save & start learning' : 'Save changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
