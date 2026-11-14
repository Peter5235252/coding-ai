import React, { useEffect, useState } from 'react';
import {
  AutoTilingAlgorithm,
  ChallengePlacement,
  CornerRadiusStyle,
  EditorFontFamily,
  EditorFontSize,
  EditorLineHeight,
  EditorSurfaceStyle,
  ExperienceLevel,
  InterfaceCustomization,
  MotionIntensity,
  NavPlacement,
  PanelGapSize,
  PanelHeaderStyle,
  PanelId,
  SurfaceStyle,
  SyntaxTheme,
  TabBarDensity,
  TabBarPlacement,
  UIFontFamily,
  UserProfile,
} from '../types';
import {
  ACCENT_MAP,
  DEFAULT_CUSTOMIZATION,
  SELECTABLE_ACCENTS,
  THEME_PRESETS,
  getAccentConfig,
  getEditorSurfaceColors,
  getSurfacePalette,
  normalizeCustomization,
} from '../utils/themeData';
import { playSound, updateSoundConfig } from '../utils/soundEngine';
import { ReasoningEffortSlider } from './ReasoningEffortSlider';
import {
  ArrowUpDown,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Columns2,
  Compass,
  Copy,
  Cpu,
  Download,
  Eye,
  EyeOff,
  FolderKanban,
  Layers,
  Layout,
  LayoutGrid,
  MessageCircle,
  Palette,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Terminal,
  Type,
  Upload,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

export type SettingsTab = 'general' | 'appearance' | 'workspace' | 'editor';

interface SettingsModalProps {
  isOpen: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
  customization: InterfaceCustomization;
  onChange: (updated: InterfaceCustomization) => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

const PANEL_LABELS: Record<
  PanelId,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  editor: {
    label: 'Code Editor',
    desc: 'Write code & review Hydrogen suggestions',
    icon: Code2,
  },
  terminal: {
    label: 'Output Console',
    desc: 'Compiler diagnostics, stdout & execution trace',
    icon: Terminal,
  },
  tutor: {
    label: 'Coding Mentor',
    desc: 'Socratic explanations & guided Q&A',
    icon: MessageCircle,
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  initialTab = 'general',
  onClose,
  customization,
  onChange,
  profile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [hexDraft, setHexDraft] = useState<string>(customization.customAccentHex || '#3D6B56');
  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setHexDraft(customization.customAccentHex || '#3D6B56');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentAccent = getAccentConfig(customization.accent, customization.customAccentHex);
  const surface = getSurfacePalette(customization.bgGradient, customization.surfaceStyle);
  const editorColors = getEditorSurfaceColors(customization.editorSurface);

  const handleApplyPreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    playSound('select');
    onChange({
      ...customization,
      presetName: found.name,
      accent: found.accent,
      bgGradient: found.bgGradient,
      syntaxTheme: found.syntaxTheme,
      editorSurface: found.editorSurface,
    });
  };

  const handleResetDefaults = () => {
    playSound('reset');
    setHexDraft(DEFAULT_CUSTOMIZATION.customAccentHex);
    updateSoundConfig({
      enabled: DEFAULT_CUSTOMIZATION.soundEnabled,
      volume: DEFAULT_CUSTOMIZATION.soundVolume,
      editorKeySounds: DEFAULT_CUSTOMIZATION.editorKeySounds,
    });
    onChange({ ...DEFAULT_CUSTOMIZATION });
  };

  const handleCustomHexChange = (val: string) => {
    setHexDraft(val);
    const normalized = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      onChange({
        ...customization,
        accent: 'custom',
        customAccentHex: normalized.toUpperCase(),
        presetName: 'Custom',
      });
    }
  };

  const handleCopyThemeJson = () => {
    const payload = JSON.stringify(customization, null, 2);
    navigator.clipboard?.writeText(payload);
    playSound('copy');
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  const handleImportThemeJson = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid JSON');
      }
      const normalized = normalizeCustomization({
        ...customization,
        ...parsed,
      });
      onChange(normalized);
      setHexDraft(normalized.customAccentHex);
      playSound('primary');
      setImportStatus({ type: 'ok', msg: 'Settings configuration applied.' });
      setImportText('');
      setShowImportBox(false);
    } catch {
      playSound('runError');
      setImportStatus({ type: 'err', msg: 'Could not parse JSON. Check formatting and try again.' });
    }
  };

  const swapPanelWithNext = (index: number) => {
    playSound('panelSwap');
    const nextOrder = [...customization.panelOrder];
    const target = (index + 1) % nextOrder.length;
    [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    onChange({ ...customization, panelOrder: nextOrder, maximizedPanel: null });
  };

  const togglePanelHidden = (panelId: PanelId) => {
    const isHidden = customization.hiddenPanels.includes(panelId);
    if (!isHidden && customization.hiddenPanels.length >= 2) {
      playSound('runError');
      return;
    }
    playSound(isHidden ? 'toggleOn' : 'toggleOff');
    const nextHidden = isHidden
      ? customization.hiddenPanels.filter((p) => p !== panelId)
      : [...customization.hiddenPanels, panelId];
    onChange({
      ...customization,
      hiddenPanels: nextHidden,
      maximizedPanel: customization.maximizedPanel === panelId ? null : customization.maximizedPanel,
    });
  };

  const selectWindowMode = (alg: AutoTilingAlgorithm, enableAuto = true) => {
    playSound('select');
    const isSplit =
      alg === 'smart-bsp' ||
      alg === 'equal-columns' ||
      alg === 'equal-rows' ||
      alg === 'dwindle';
    onChange({
      ...customization,
      autoTiling: enableAuto,
      maximizedPanel: null,
      autoTilingAlgorithm: alg,
      lastSplitAlgorithm: isSplit ? alg : customization.lastSplitAlgorithm,
    });
  };

  const activeWindowMode = !customization.autoTiling
    ? 'manual'
    : customization.autoTilingAlgorithm === 'stacked-windows'
    ? 'stacked'
    : customization.autoTilingAlgorithm === 'master-tabbed'
    ? 'master-tabbed'
    : customization.autoTilingAlgorithm === 'tabbed-windows'
    ? 'tabbed'
    : 'tiled';

  return (
    <div
      className="zenith-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans text-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`zenith-modal-surface w-full max-w-4xl rounded-3xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-3 flex-wrap`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${currentAccent.bgSubtle} ${currentAccent.text} flex items-center justify-center shrink-0`}>
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${surface.text}`}>
                Settings
              </h2>
              <p className={`text-xs ${surface.textSubtle}`}>
                Sound, themes, workspace layout, editor comfort, and your learning preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className={`px-3 py-1.5 text-xs rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors flex items-center gap-1.5 whitespace-nowrap`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className={`p-2 rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean 4-Tab Navigation */}
        <div className={`px-6 py-2.5 border-b ${surface.border} ${surface.cardMuted} flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0`}>
          {(
            [
              { id: 'general', label: 'General & Sound', icon: Volume2 },
              { id: 'appearance', label: 'Themes & Colors', icon: Palette },
              { id: 'workspace', label: 'Layout & Windows', icon: Layout },
              { id: 'editor', label: 'Editor & Motion', icon: Type },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playSound('tab');
                  setActiveTab(t.id);
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? `${currentAccent.bg} shadow-xs`
                    : `${surface.card} border ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div key={activeTab} className="zenith-step-view space-y-5">
            {/* TAB 1: GENERAL, SOUND, AI & LEARNING PROFILE */}
            {activeTab === 'general' && (
              <>
                {/* Sound & Audio Controls */}
                <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${currentAccent.bgSubtle} ${currentAccent.text} flex items-center justify-center shrink-0`}>
                        {customization.soundEnabled ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-semibold ${surface.text} block`}>
                          Synthesized Sound Effects
                        </span>
                        <span className={`text-[11px] ${surface.textSubtle}`}>
                          Subtle tactile audio for clicks, code execution, and mentor replies.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !customization.soundEnabled;
                        if (next) {
                          updateSoundConfig({ enabled: true });
                          playSound('toggleOn');
                        } else {
                          playSound('toggleOff');
                        }
                        onChange({ ...customization, soundEnabled: next });
                      }}
                      aria-pressed={customization.soundEnabled}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                        customization.soundEnabled
                          ? `${currentAccent.bg} border-transparent shadow-xs`
                          : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                      }`}
                    >
                      {customization.soundEnabled ? 'Sound: On' : 'Sound: Muted'}
                    </button>
                  </div>

                  {customization.soundEnabled && (
                    <div className={`zenith-banner-enter space-y-3 pt-3 border-t ${surface.border}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-semibold ${surface.text}`}>
                              Volume
                            </span>
                            <span className={`text-[11px] font-mono tabular-nums ${currentAccent.text}`}>
                              {Math.round(customization.soundVolume * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            step={5}
                            value={Math.round(customization.soundVolume * 100)}
                            onChange={(e) => {
                              const vol = Number(e.target.value) / 100;
                              updateSoundConfig({ volume: vol });
                              onChange({ ...customization, soundVolume: vol });
                            }}
                            className="w-full accent-current"
                          />
                        </div>

                        <div>
                          <span className={`text-[11px] font-semibold ${surface.text} block mb-1.5`}>
                            Editor Keystroke Sounds
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = !customization.editorKeySounds;
                              updateSoundConfig({ editorKeySounds: next });
                              playSound(next ? 'toggleOn' : 'toggleOff');
                              onChange({ ...customization, editorKeySounds: next });
                            }}
                            className={`w-full px-3 py-1.5 rounded-xl border text-[11px] font-medium flex items-center justify-between ${
                              customization.editorKeySounds
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                : `${surface.card} ${surface.border} ${surface.textMuted}`
                            }`}
                          >
                            <span>Soft typing clicks</span>
                            <span>{customization.editorKeySounds ? 'On' : 'Off'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className={`text-[11px] ${surface.textSubtle} mr-1`}>
                          Test sounds:
                        </span>
                        <button
                          type="button"
                          onClick={() => playSound('click')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium`}
                        >
                          <Play className="w-3 h-3" />
                          <span>UI Click</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => playSound('runPass')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium`}
                        >
                          <Play className="w-3 h-3 text-emerald-600" />
                          <span>Run Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => playSound('runError')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium`}
                        >
                          <Play className="w-3 h-3 text-amber-600" />
                          <span>Run Error</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Global AI Reasoning Effort */}
                <div className={`p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <ReasoningEffortSlider
                    value={customization.reasoningLevel}
                    onChange={(level) =>
                      onChange({
                        ...customization,
                        reasoningLevel: level,
                      })
                    }
                    variant="full"
                    accent={customization.accent}
                    customAccentHex={customization.customAccentHex}
                    bgGradient={customization.bgGradient}
                    surfaceStyle={customization.surfaceStyle}
                  />
                </div>

                {/* Learning Profile */}
                <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                      <User className={`w-4 h-4 ${currentAccent.text}`} />
                      Your Learning Profile
                    </span>
                    <span className={`text-[11px] ${surface.textSubtle}`}>
                      Tailors challenges &amp; mentor explanations
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[11px] font-semibold ${surface.textMuted} mb-1.5`}>
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          onUpdateProfile({
                            ...profile,
                            name: e.target.value,
                            isOnboarded: true,
                          })
                        }
                        placeholder="Learner"
                        className={`w-full rounded-xl border px-3 py-2 text-xs ${surface.input} focus:outline-hidden`}
                      />
                    </div>

                    <div>
                      <span className={`block text-[11px] font-semibold ${surface.textMuted} mb-1.5`}>
                        Comfort Level
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            { id: 'absolute_beginner', label: 'Brand New' },
                            { id: 'started_before', label: 'Getting Started' },
                            { id: 'intermediate', label: 'Intermediate' },
                            { id: 'experienced_systems', label: 'Experienced' },
                          ] as Array<{ id: ExperienceLevel; label: string }>
                        ).map((lvl) => {
                          const active = profile.level === lvl.id;
                          return (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => {
                                playSound('select');
                                onUpdateProfile({ ...profile, level: lvl.id, isOnboarded: true });
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium text-left truncate ${
                                active
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                  : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                              }`}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className={`block text-[11px] font-semibold ${surface.textMuted} mb-1.5`}>
                        Learning Focus
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            { id: 'systems', label: 'Systems', icon: Cpu },
                            { id: 'game_dev', label: 'Game Dev', icon: Code2 },
                            { id: 'embedded_algorithms', label: 'Algorithms', icon: Shield },
                            { id: 'general_mastery', label: 'Explore All', icon: Compass },
                          ] as const
                        ).map((goal) => {
                          const Icon = goal.icon;
                          const active = profile.primaryGoal === goal.id;
                          return (
                            <button
                              key={goal.id}
                              type="button"
                              onClick={() => {
                                playSound('select');
                                onUpdateProfile({
                                  ...profile,
                                  primaryGoal: goal.id,
                                  isOnboarded: true,
                                });
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 ${
                                active
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                  : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{goal.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className={`block text-[11px] font-semibold ${surface.textMuted} mb-1.5`}>
                        Mentor Style
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'socratic_inquiry', label: 'Guided Q&A' },
                            { id: 'hands_on_challenges', label: 'Practice First' },
                            { id: 'balanced', label: 'Balanced' },
                          ] as const
                        ).map((pace) => {
                          const active = profile.learningPace === pace.id;
                          return (
                            <button
                              key={pace.id}
                              type="button"
                              onClick={() => {
                                playSound('select');
                                onUpdateProfile({
                                  ...profile,
                                  learningPace: pace.id,
                                  isOnboarded: true,
                                });
                              }}
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium text-center truncate ${
                                active
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                  : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                              }`}
                            >
                              {pace.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: THEMES & COLORS */}
            {activeTab === 'appearance' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                      <Sparkles className={`w-4 h-4 ${currentAccent.text}`} />
                      Quick Color Themes
                    </span>
                    <span className={`text-[11px] ${surface.textSubtle}`}>
                      Active: {customization.presetName}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected = customization.presetName === preset.name;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyPreset(preset.id)}
                          className={`zenith-card-hover p-3 text-left rounded-2xl border ${
                            isSelected
                              ? `${currentAccent.bgSubtle} ${currentAccent.border} shadow-xs`
                              : `${surface.card} ${surface.border} ${surface.hoverBg}`
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 rounded-full border border-black/15 ${preset.previewBg}`} />
                              <span className={`w-3.5 h-3.5 rounded-full border border-black/15 ${preset.previewAccent}`} />
                              <span className={`text-[10px] font-medium ${surface.textSubtle} ml-1`}>
                                {preset.mode}
                              </span>
                            </div>
                            {isSelected && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                          </div>
                          <span className={`font-semibold text-xs block ${surface.text}`}>{preset.name}</span>
                          <p className={`text-[11px] ${surface.textMuted} mt-0.5 line-clamp-2 leading-snug`}>
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Swatches & Custom Picker */}
                <div className={`space-y-3.5 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                      <Palette className={`w-4 h-4 ${currentAccent.text}`} />
                      Accent Color
                    </span>
                    <span className={`text-xs font-semibold ${currentAccent.text}`}>
                      {customization.accent === 'custom'
                        ? `Custom (${customization.customAccentHex})`
                        : currentAccent.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SELECTABLE_ACCENTS.map((col) => {
                      const conf = ACCENT_MAP[col];
                      const isSel = customization.accent === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => {
                            playSound('select');
                            onChange({ ...customization, accent: col, presetName: 'Custom' });
                          }}
                          className={`zenith-card-hover p-2 rounded-xl border flex flex-col items-center gap-1.5 ${
                            isSel
                              ? `${conf.bgSubtle} ${conf.border} shadow-xs`
                              : `${surface.card} ${surface.border} ${surface.hoverBg}`
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/15"
                            style={{ backgroundColor: conf.hex }}
                          />
                          <span className={`text-[11px] font-medium ${surface.text} truncate max-w-full`}>
                            {conf.name.split(' ').pop()}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={`pt-3 border-t ${surface.border} flex items-center justify-between gap-3 flex-wrap`}>
                    <div className="flex items-center gap-2.5">
                      <label
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer ${
                          customization.accent === 'custom'
                            ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(hexDraft) ? hexDraft : customization.customAccentHex}
                          onChange={(e) => handleCustomHexChange(e.target.value)}
                          className="w-5 h-5 rounded-md border-0 bg-transparent cursor-pointer p-0"
                          aria-label="Pick custom accent color"
                        />
                        <span className={`text-[11px] font-semibold ${surface.text}`}>
                          Custom Color
                        </span>
                      </label>
                      <input
                        type="text"
                        value={hexDraft}
                        onChange={(e) => handleCustomHexChange(e.target.value)}
                        maxLength={7}
                        placeholder="#3D6B56"
                        className={`w-24 px-2.5 py-1.5 rounded-xl border text-xs font-mono uppercase ${surface.input} focus:outline-hidden`}
                      />
                    </div>
                    <span className={`text-[11px] ${surface.textSubtle}`}>
                      Button text contrast adjusts automatically.
                    </span>
                  </div>
                </div>

                {/* Surfaces & Syntax */}
                <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                      <Layers className={`w-4 h-4 ${currentAccent.text}`} />
                      Editor Canvas &amp; Surfaces
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !customization.showAmbientGlow;
                        playSound(next ? 'toggleOn' : 'toggleOff');
                        onChange({
                          ...customization,
                          showAmbientGlow: next,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-2 ${
                        customization.showAmbientGlow
                          ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                          : `${surface.card} ${surface.border} ${surface.textMuted}`
                      }`}
                    >
                      <span>Ambient Glow: {customization.showAmbientGlow ? 'On' : 'Off'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                        Panel Finish
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { id: 'crisp', label: 'Crisp Solid' },
                            { id: 'tinted', label: 'Warm Tinted' },
                            { id: 'frosted', label: 'Frosted' },
                          ] as Array<{ id: SurfaceStyle; label: string }>
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, surfaceStyle: st.id });
                            }}
                            className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium ${
                              customization.surfaceStyle === st.id
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                        Code Canvas Tone
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(
                          [
                            { id: 'matte-slate', label: 'Matte Slate', swatch: '#212422' },
                            { id: 'warm-charcoal', label: 'Charcoal', swatch: '#202124' },
                            { id: 'forest-ink', label: 'Forest Ink', swatch: '#19221E' },
                            { id: 'soft-espresso', label: 'Espresso', swatch: '#231D1A' },
                          ] as Array<{ id: EditorSurfaceStyle; label: string; swatch: string }>
                        ).map((es) => {
                          const active = customization.editorSurface === es.id;
                          return (
                            <button
                              key={es.id}
                              type="button"
                              onClick={() => {
                                playSound('select');
                                onChange({
                                  ...customization,
                                  editorSurface: es.id,
                                  presetName: 'Custom',
                                });
                              }}
                              className={`p-2 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 ${
                                active
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                  : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: es.swatch }}
                              />
                              <span className="truncate">{es.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Syntax Highlighting */}
                <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                    <Sliders className={`w-4 h-4 ${currentAccent.text}`} />
                    Code Syntax Colors
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'warm-botanical',
                        label: 'Warm Botanical',
                        sample:
                          '<span style="color:#e38c7d">fn</span> <span style="color:#e6c57a">solve</span>(x: <span style="color:#84bfb2">i32</span>) -> <span style="color:#9fc48d">"ok"</span>',
                      },
                      {
                        id: 'soft-pastel',
                        label: 'Soft Pastel',
                        sample:
                          '<span style="color:#df9399">fn</span> <span style="color:#e5c882">solve</span>(x: <span style="color:#87bfb5">i32</span>) -> <span style="color:#9dc493">"ok"</span>',
                      },
                      {
                        id: 'warm-amber',
                        label: 'Fireside Amber',
                        sample:
                          '<span style="color:#e6a15c">fn</span> <span style="color:#f2be7e">solve</span>(x: <span style="color:#ebd086">i32</span>) -> <span style="color:#c9a97c">"ok"</span>',
                      },
                      {
                        id: 'coastal-calm',
                        label: 'Coastal Calm',
                        sample:
                          '<span style="color:#7fb3bd">fn</span> <span style="color:#d9be8b">solve</span>(x: <span style="color:#92c4b3">i32</span>) -> <span style="color:#a5c79e">"ok"</span>',
                      },
                      {
                        id: 'nordic-moss',
                        label: 'Nordic Moss',
                        sample:
                          '<span style="color:#98b878">fn</span> <span style="color:#dfc182">solve</span>(x: <span style="color:#88b8a4">i32</span>) -> <span style="color:#b5cb93">"ok"</span>',
                      },
                      {
                        id: 'ink-mono',
                        label: 'Paper & Ink',
                        sample:
                          '<span style="color:#f5f2eb">fn</span> <span style="color:#e7e2d8">solve</span>(x: <span style="color:#d6d1c7">i32</span>) -> <span style="color:#a8a296">"ok"</span>',
                      },
                    ].map((syn) => {
                      const isSel = customization.syntaxTheme === syn.id;
                      return (
                        <button
                          key={syn.id}
                          type="button"
                          onClick={() => {
                            playSound('select');
                            onChange({
                              ...customization,
                              syntaxTheme: syn.id as SyntaxTheme,
                              presetName: 'Custom',
                            });
                          }}
                          className={`zenith-card-hover p-3 text-left rounded-2xl border ${
                            isSel
                              ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                              : `${surface.card} ${surface.border} ${surface.hoverBg}`
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold ${surface.text}`}>{syn.label}</span>
                            {isSel && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                          </div>
                          <div
                            className="p-2 rounded-xl font-mono text-[11px]"
                            style={{ backgroundColor: editorColors.bg }}
                            dangerouslySetInnerHTML={{ __html: syn.sample }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: LAYOUT & WINDOWS (SIMPLIFIED FOR BEGINNERS) */}
            {activeTab === 'workspace' && (
              <>
                {/* Simple Window Mode Chooser */}
                <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                      <LayoutGrid className={`w-4 h-4 ${currentAccent.text}`} />
                      Window Arrangement
                    </span>
                    <span className={`text-[11px] ${surface.textSubtle}`}>
                      Choose how your panels sit on screen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'tiled',
                        title: 'Tiled',
                        desc: 'Side-by-side panes with draggable dividers.',
                        alg: customization.lastSplitAlgorithm || ('smart-bsp' as AutoTilingAlgorithm),
                        icon: LayoutGrid,
                      },
                      {
                        id: 'stacked',
                        title: 'Stacked',
                        desc: 'Title bars stacked vertically; one active pane.',
                        alg: 'stacked-windows' as AutoTilingAlgorithm,
                        icon: Layers,
                      },
                      {
                        id: 'master-tabbed',
                        title: 'Master + Tabs',
                        desc: 'Keep main editor open beside tabbed panels.',
                        alg: 'master-tabbed' as AutoTilingAlgorithm,
                        icon: Columns2,
                      },
                      {
                        id: 'tabbed',
                        title: 'Tabs',
                        desc: 'Single full-screen window with clean top tabs.',
                        alg: 'tabbed-windows' as AutoTilingAlgorithm,
                        icon: FolderKanban,
                      },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSel = activeWindowMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => selectWindowMode(mode.alg, true)}
                          className={`zenith-card-hover p-3 text-left rounded-2xl border ${
                            isSel
                              ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                              : `${surface.card} ${surface.border} ${surface.hoverBg}`
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${isSel ? currentAccent.text : surface.textMuted}`} />
                              <span className={`text-xs font-semibold ${surface.text}`}>{mode.title}</span>
                            </div>
                            {isSel && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                          </div>
                          <p className={`text-[11px] ${surface.textMuted} leading-snug`}>{mode.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simple Panel Visibility & Order */}
                <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${surface.text}`}>
                      Workspace Panels
                    </span>
                    <span className={`text-[11px] ${surface.textSubtle}`}>
                      Show, hide, or reorder panels (you can also drag panel headers)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {customization.panelOrder.map((panelId, idx) => {
                      const meta = PANEL_LABELS[panelId];
                      const Icon = meta.icon;
                      const isHidden = customization.hiddenPanels.includes(panelId);
                      return (
                        <div
                          key={panelId}
                          className={`p-3 rounded-2xl border ${
                            isHidden
                              ? `${surface.cardMuted} ${surface.border} opacity-65`
                              : `${surface.card} ${surface.border}`
                          } space-y-2.5`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`w-4 h-4 shrink-0 ${isHidden ? surface.textSubtle : currentAccent.text}`} />
                              <div className="min-w-0">
                                <span className={`text-xs font-semibold ${surface.text} block truncate`}>
                                  {meta.label}
                                </span>
                                <span className={`text-[11px] ${surface.textSubtle} block truncate`}>
                                  {meta.desc}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => swapPanelWithNext(idx)}
                              className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border ${surface.border} ${surface.cardMuted} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium`}
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              <span>Move</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePanelHidden(panelId)}
                              className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium ${
                                isHidden
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                  : `${surface.border} ${surface.cardMuted} ${surface.textMuted} ${surface.hoverBg}`
                              }`}
                            >
                              {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{isHidden ? 'Show' : 'Hide'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bar Positions */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div>
                    <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                      Navigation Bar Position
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: 'top', label: 'Top' },
                          { id: 'bottom', label: 'Bottom' },
                          { id: 'left', label: 'Left' },
                          { id: 'right', label: 'Right' },
                        ] as Array<{ id: NavPlacement; label: string }>
                      ).map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => {
                            playSound('select');
                            onChange({ ...customization, navPlacement: pos.id });
                          }}
                          className={`py-2 rounded-xl border text-[11px] font-medium ${
                            customization.navPlacement === pos.id
                              ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                              : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                      Active Lesson Banner
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'top', label: 'Top' },
                          { id: 'bottom', label: 'Bottom' },
                          { id: 'hidden', label: 'Hidden' },
                        ] as Array<{ id: ChallengePlacement; label: string }>
                      ).map((cp) => (
                        <button
                          key={cp.id}
                          type="button"
                          onClick={() => {
                            playSound('select');
                            onChange({ ...customization, challengePlacement: cp.id });
                          }}
                          className={`py-2 rounded-xl border text-[11px] font-medium ${
                            customization.challengePlacement === cp.id
                              ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                              : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                          }`}
                        >
                          {cp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Collapsible Advanced Tiling & Spacing Options */}
                <div className={`rounded-2xl border ${surface.border} ${surface.cardMuted} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setShowAdvancedLayout((prev) => !prev);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between text-xs font-semibold ${surface.text} ${surface.hoverBg} transition-colors`}
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className={`w-3.5 h-3.5 ${currentAccent.text}`} />
                      <span>Fine-Tune Split Ratios, Spacing &amp; Corners</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ${surface.textSubtle} transition-transform duration-150 ${
                        showAdvancedLayout ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showAdvancedLayout && (
                    <div className={`zenith-banner-enter p-4 pt-3 border-t ${surface.border} space-y-4`}>
                      {/* Split Style */}
                      <div>
                        <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                          Split Style
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {(
                            [
                              { id: 'smart-bsp', label: 'Smart' },
                              { id: 'equal-columns', label: 'Columns' },
                              { id: 'equal-rows', label: 'Rows' },
                              { id: 'dwindle', label: 'Spiral' },
                              { id: 'manual', label: 'Manual' },
                            ] as const
                          ).map((st) => {
                            const active =
                              st.id === 'manual'
                                ? !customization.autoTiling
                                : customization.autoTiling && customization.autoTilingAlgorithm === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  if (st.id === 'manual') {
                                    playSound('select');
                                    onChange({ ...customization, autoTiling: false, maximizedPanel: null });
                                  } else {
                                    selectWindowMode(st.id, true);
                                  }
                                }}
                                className={`py-2 px-2 rounded-xl border text-[11px] font-medium ${
                                  active
                                    ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                    : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                                }`}
                              >
                                {st.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Main Panel Width */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-semibold ${surface.textMuted}`}>
                            Primary Panel Width
                          </span>
                          <span className={`text-[11px] font-mono tabular-nums ${currentAccent.text}`}>
                            {customization.autoTiling
                              ? `${customization.autoTilingMasterRatio}%`
                              : `${customization.splitRatioX}%`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={40}
                          max={70}
                          value={
                            customization.autoTiling
                              ? customization.autoTilingMasterRatio
                              : customization.splitRatioX
                          }
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            onChange({
                              ...customization,
                              autoTilingMasterRatio: val,
                              splitRatioX: val,
                            });
                          }}
                          className="w-full accent-current"
                        />
                      </div>

                      {/* Gap, Corners, Header Style, Tab Placement */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                            Panel Spacing
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['none', 'tight', 'cozy', 'airy'] as PanelGapSize[]).map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => {
                                  playSound('select');
                                  onChange({ ...customization, panelGap: g });
                                }}
                                className={`py-1.5 rounded-xl border text-[11px] capitalize font-medium ${
                                  customization.panelGap === g
                                    ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                    : `${surface.card} ${surface.border} ${surface.textMuted}`
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                            Corner Style
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['sharp', 'subtle', 'rounded', 'pillowy'] as CornerRadiusStyle[]).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  playSound('select');
                                  onChange({ ...customization, cornerRadius: r });
                                }}
                                className={`py-1.5 rounded-xl border text-[11px] capitalize font-medium ${
                                  customization.cornerRadius === r
                                    ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                    : `${surface.card} ${surface.border} ${surface.textMuted}`
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                            Panel Header Detail
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['detailed', 'compact', 'minimal'] as PanelHeaderStyle[]).map((hs) => (
                              <button
                                key={hs}
                                type="button"
                                onClick={() => {
                                  playSound('select');
                                  onChange({ ...customization, panelHeaderStyle: hs });
                                }}
                                className={`py-1.5 rounded-xl border text-[11px] capitalize font-medium ${
                                  customization.panelHeaderStyle === hs
                                    ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                    : `${surface.card} ${surface.border} ${surface.textMuted}`
                                }`}
                              >
                                {hs}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                            Tab Bar &amp; Density
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const next: TabBarPlacement =
                                  customization.tabBarPlacement === 'top' ? 'bottom' : 'top';
                                playSound('select');
                                onChange({ ...customization, tabBarPlacement: next });
                              }}
                              className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium ${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`}
                            >
                              Tabs: {customization.tabBarPlacement === 'top' ? 'Top' : 'Bottom'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next: TabBarDensity =
                                  customization.tabBarDensity === 'rich' ? 'compact' : 'rich';
                                playSound('select');
                                onChange({ ...customization, tabBarDensity: next });
                              }}
                              className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium ${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`}
                            >
                              Density: {customization.tabBarDensity === 'rich' ? 'Rich' : 'Compact'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-[11px] ${surface.textMuted}`}>
                          Focus Output Console automatically in tabbed modes when running code
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !customization.autoFocusTerminalOnRun;
                            playSound(next ? 'toggleOn' : 'toggleOff');
                            onChange({ ...customization, autoFocusTerminalOnRun: next });
                          }}
                          className={`px-3 py-1 rounded-xl border text-[11px] font-semibold ${
                            customization.autoFocusTerminalOnRun
                              ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                              : `${surface.card} ${surface.border} ${surface.textMuted}`
                          }`}
                        >
                          {customization.autoFocusTerminalOnRun ? 'On' : 'Off'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB 4: EDITOR & MOTION */}
            {activeTab === 'editor' && (
              <>
                {/* Editor Sizing & Readability */}
                <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                    <Code2 className={`w-4 h-4 ${currentAccent.text}`} />
                    Code Editor Readability
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                        Text Size
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(
                          [
                            { id: 'sm', label: 'Small' },
                            { id: 'md', label: 'Medium' },
                            { id: 'lg', label: 'Large' },
                            { id: 'xl', label: 'Extra' },
                          ] as Array<{ id: EditorFontSize; label: string }>
                        ).map((fs) => (
                          <button
                            key={fs.id}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, editorFontSize: fs.id });
                            }}
                            className={`p-2 rounded-xl border text-[11px] font-medium ${
                              customization.editorFontSize === fs.id
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            {fs.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                        Line Spacing
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'compact', label: 'Compact' },
                            { id: 'comfortable', label: 'Balanced' },
                            { id: 'relaxed', label: 'Relaxed' },
                          ] as Array<{ id: EditorLineHeight; label: string }>
                        ).map((lh) => (
                          <button
                            key={lh.id}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, editorLineHeight: lh.id });
                            }}
                            className={`p-2 rounded-xl border text-[11px] font-medium ${
                              customization.editorLineHeight === lh.id
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            {lh.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                        Tab Spaces
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([2, 4] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, editorTabSize: sz });
                            }}
                            className={`p-2 rounded-xl border text-[11px] font-medium ${
                              customization.editorTabSize === sz
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text} font-semibold`
                                : `${surface.card} ${surface.border} ${surface.textMuted}`
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                        Line Numbers
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !customization.showLineNumbers;
                          playSound(next ? 'toggleOn' : 'toggleOff');
                          onChange({ ...customization, showLineNumbers: next });
                        }}
                        className={`w-full p-2 rounded-xl border text-[11px] font-medium flex items-center justify-between ${
                          customization.showLineNumbers
                            ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                            : `${surface.card} ${surface.border} ${surface.textMuted}`
                        }`}
                      >
                        <span>Gutter</span>
                        <span>{customization.showLineNumbers ? 'On' : 'Off'}</span>
                      </button>
                    </div>

                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                        Word Wrap
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !customization.wordWrap;
                          playSound(next ? 'toggleOn' : 'toggleOff');
                          onChange({ ...customization, wordWrap: next });
                        }}
                        className={`w-full p-2 rounded-xl border text-[11px] font-medium flex items-center justify-between ${
                          customization.wordWrap
                            ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                            : `${surface.card} ${surface.border} ${surface.textMuted}`
                        }`}
                      >
                        <span>Wrap</span>
                        <span>{customization.wordWrap ? 'On' : 'Off'}</span>
                      </button>
                    </div>

                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-1.5`}>
                        Status Footer
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !customization.showStatusBar;
                          playSound(next ? 'toggleOn' : 'toggleOff');
                          onChange({ ...customization, showStatusBar: next });
                        }}
                        className={`w-full p-2 rounded-xl border text-[11px] font-medium flex items-center justify-between ${
                          customization.showStatusBar
                            ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                            : `${surface.card} ${surface.border} ${surface.textMuted}`
                        }`}
                      >
                        <span>Bar</span>
                        <span>{customization.showStatusBar ? 'On' : 'Off'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                    <Type className={`w-4 h-4 ${currentAccent.text}`} />
                    Fonts
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                        Interface Font
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'jakarta', label: 'Plus Jakarta' },
                            { id: 'dm-sans', label: 'DM Sans' },
                            { id: 'serif', label: 'Lora Serif' },
                            { id: 'mono', label: 'Tech Mono' },
                          ] as Array<{ id: UIFontFamily; label: string }>
                        ).map((uf) => (
                          <button
                            key={uf.id}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, uiFontFamily: uf.id });
                            }}
                            className={`p-2 rounded-xl border text-[11px] font-medium ${
                              customization.uiFontFamily === uf.id
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            {uf.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                        Code Font
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'jetbrains', label: 'JetBrains Mono' },
                            { id: 'ibm-plex', label: 'IBM Plex Mono' },
                            { id: 'fira', label: 'Fira Code' },
                            { id: 'system', label: 'System Mono' },
                          ] as Array<{ id: EditorFontFamily; label: string }>
                        ).map((ef) => (
                          <button
                            key={ef.id}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, editorFontFamily: ef.id });
                            }}
                            className={`p-2 rounded-xl border text-[11px] font-mono font-medium ${
                              customization.editorFontFamily === ef.id
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            {ef.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motion Comfort & Portable Backup */}
                <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                  <div className="space-y-2.5">
                    <span className={`text-xs font-semibold ${surface.text} block`}>
                      Animation &amp; Motion Comfort
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(
                        [
                          { id: 'smooth', title: 'Smooth', desc: 'Gentle animations when moving panels.' },
                          { id: 'snappy', title: 'Snappy', desc: 'Crisp, fast transitions.' },
                          { id: 'reduced', title: 'Reduced Motion', desc: 'Minimal movement for focus.' },
                        ] as Array<{ id: MotionIntensity; title: string; desc: string }>
                      ).map((mo) => {
                        const isSel = customization.motionIntensity === mo.id;
                        return (
                          <button
                            key={mo.id}
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onChange({ ...customization, motionIntensity: mo.id });
                            }}
                            className={`p-3 text-left rounded-2xl border ${
                              isSel
                                ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                                : `${surface.card} ${surface.border} ${surface.hoverBg}`
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-xs font-semibold ${surface.text}`}>{mo.title}</span>
                              {isSel && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                            </div>
                            <p className={`text-[11px] ${surface.textMuted}`}>{mo.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`pt-3 border-t ${surface.border} flex items-center justify-between gap-3 flex-wrap`}>
                    <div>
                      <span className={`text-xs font-semibold ${surface.text} block`}>
                        Backup &amp; Restore Settings
                      </span>
                      <span className={`text-[11px] ${surface.textSubtle}`}>
                        Export or import your theme and layout as JSON.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyThemeJson}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${surface.border} ${surface.card} ${surface.text} ${surface.hoverBg} text-[11px] font-medium`}
                      >
                        {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedJson ? 'Copied' : 'Export JSON'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowImportBox(!showImportBox);
                          setImportStatus(null);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${surface.border} ${surface.card} ${surface.text} ${surface.hoverBg} text-[11px] font-medium`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import JSON</span>
                      </button>
                    </div>
                  </div>

                  {showImportBox && (
                    <div className="zenith-banner-enter space-y-2">
                      <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={3}
                        placeholder='Paste settings JSON here...'
                        className={`w-full p-2.5 rounded-xl border font-mono text-[11px] ${surface.input} focus:outline-hidden resize-y`}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowImportBox(false)}
                          className={`px-3 py-1.5 rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} text-[11px] font-medium`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleImportThemeJson}
                          disabled={!importText.trim()}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ${currentAccent.bg} text-[11px] font-semibold disabled:opacity-40`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {importStatus && (
                    <p className={`text-[11px] font-medium ${importStatus.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {importStatus.msg}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-3`}>
          <span className={`text-xs ${surface.textSubtle} flex items-center gap-1.5`}>
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Changes save automatically to your browser.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl ${currentAccent.bg} font-semibold hover:opacity-95 transition-all text-xs shadow-sm`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
