import React, { useState } from 'react';
import {
  AutoTilingAlgorithm,
  AutoTilingDirection,
  ChallengePlacement,
  CornerRadiusStyle,
  EditorFontSize,
  InterfaceCustomization,
  LayoutPreset,
  NavPlacement,
  PanelGapSize,
  PanelId,
  ReasoningLevel,
  SyntaxTheme,
} from '../types';
import {
  ACCENT_MAP,
  DEFAULT_CUSTOMIZATION,
  SELECTABLE_ACCENTS,
  THEME_PRESETS,
  getSurfacePalette,
} from '../utils/themeData';
import {
  Palette,
  Layout,
  Sliders,
  Sparkles,
  RotateCcw,
  X,
  Check,
  Columns,
  MoveLeft,
  Brain,
  ArrowUpDown,
  Eye,
  EyeOff,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Maximize2,
  Rows,
  Code2,
  Terminal,
  MessageCircle,
  Type,
  LayoutGrid,
} from 'lucide-react';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: InterfaceCustomization;
  onChange: (updated: InterfaceCustomization) => void;
  supportsXHigh?: boolean;
}

const PANEL_LABELS: Record<PanelId, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  editor: { label: 'Code Editor', icon: Code2 },
  terminal: { label: 'Output Console', icon: Terminal },
  tutor: { label: 'Coding Mentor', icon: MessageCircle },
};

const BLUEPRINTS: Array<{
  id: LayoutPreset;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'standard-ide',
    name: '2 Left · 1 Right',
    desc: 'Slots 1 & 2 stacked left, Slot 3 full height right.',
    icon: Columns,
  },
  {
    id: 'inverted-studio',
    name: '1 Left · 2 Right',
    desc: 'Slot 1 full height left, Slots 2 & 3 stacked right.',
    icon: MoveLeft,
  },
  {
    id: 'side-by-side',
    name: '3 Columns',
    desc: 'All three panels side by side in a row.',
    icon: Layout,
  },
  {
    id: 'wide-theater',
    name: '1 Top · 2 Bottom',
    desc: 'Slot 1 wide across the top, Slots 2 & 3 below.',
    icon: PanelTop,
  },
  {
    id: 'bottom-editor',
    name: '2 Top · 1 Bottom',
    desc: 'Slots 1 & 2 above, Slot 3 wide across the bottom.',
    icon: PanelBottom,
  },
  {
    id: 'stacked-horizontal',
    name: '3 Stacked Rows',
    desc: 'All three panels stacked vertically.',
    icon: Rows,
  },
  {
    id: 'focus-mode',
    name: 'Solo Focus',
    desc: 'Only Slot 1 fills the canvas cleanly.',
    icon: Maximize2,
  },
];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  customization,
  onChange,
  supportsXHigh = true,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'appearance' | 'editor'>('layout');

  if (!isOpen) return null;

  const currentAccent = ACCENT_MAP[customization.accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(customization.bgGradient);

  const thinkingTiers = [
    {
      id: 'low' as const,
      title: 'Low',
      desc: 'Fast, lightweight checks for simple syntax or quick hints.',
    },
    {
      id: 'medium' as const,
      title: 'Medium',
      desc: 'Balanced guidance on memory, logic, and edge cases.',
    },
    {
      id: 'high' as const,
      title: 'High',
      desc: 'Deeper analysis for tricky lifetimes, pointers, or subtle bugs.',
    },
    ...(supportsXHigh
      ? [
          {
            id: 'xhigh' as const,
            title: 'Extra High',
            desc: 'Maximum reasoning depth on Gemini 4 Hydrogen for multi-step systems problems.',
          },
        ]
      : []),
  ];

  const handleApplyPreset = (presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    onChange({
      ...customization,
      presetName: found.name,
      accent: found.accent,
      bgGradient: found.bgGradient,
      syntaxTheme: found.syntaxTheme,
    });
  };

  const handleResetDefaults = () => {
    onChange({ ...DEFAULT_CUSTOMIZATION });
  };

  const swapSlotWithNext = (index: number) => {
    const nextOrder = [...customization.panelOrder];
    const target = (index + 1) % nextOrder.length;
    [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    onChange({ ...customization, panelOrder: nextOrder, maximizedPanel: null });
  };

  const togglePanelHidden = (panelId: PanelId) => {
    const isHidden = customization.hiddenPanels.includes(panelId);
    if (!isHidden && customization.hiddenPanels.length >= 2) {
      // Keep at least 1 panel visible
      return;
    }
    const nextHidden = isHidden
      ? customization.hiddenPanels.filter((p) => p !== panelId)
      : [...customization.hiddenPanels, panelId];
    onChange({
      ...customization,
      hiddenPanels: nextHidden,
      maximizedPanel: customization.maximizedPanel === panelId ? null : customization.maximizedPanel,
    });
  };

  const setPanelAtSlot = (slotIdx: number, chosenId: PanelId) => {
    const currentIdx = customization.panelOrder.indexOf(chosenId);
    if (currentIdx === -1 || currentIdx === slotIdx) return;
    const nextOrder = [...customization.panelOrder];
    [nextOrder[slotIdx], nextOrder[currentIdx]] = [nextOrder[currentIdx], nextOrder[slotIdx]];
    onChange({ ...customization, panelOrder: nextOrder });
  };

  const slotLabel = (idx: number) => {
    const pid = customization.panelOrder[idx];
    return PANEL_LABELS[pid]?.label.split(' ').pop() || pid;
  };

  return (
    <div className="zenith-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans text-xs">
      <div className={`zenith-modal-surface w-full max-w-4xl rounded-3xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-3 flex-wrap`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${currentAccent.bgSubtle} ${currentAccent.text} flex items-center justify-center`}>
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${surface.text}`}>
                Workspace Studio &amp; Preferences
              </h2>
              <p className={`text-xs ${surface.textSubtle}`}>
                Arrange every panel, bar, proportion, and color theme to fit how you think.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className={`px-3 py-1.5 text-xs rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors flex items-center gap-1.5`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className={`px-6 py-2.5 border-b ${surface.border} ${surface.cardMuted} flex items-center gap-2`}>
          {(
            [
              { id: 'layout', label: 'Layout & Placements', icon: Layout },
              { id: 'appearance', label: 'Themes & Colors', icon: Palette },
              { id: 'editor', label: 'Editor & Mentor', icon: Sliders },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div key={activeTab} className="zenith-step-view space-y-6">
          {activeTab === 'layout' && (
            <>
              {/* Live Mini-Map Preview + Quick Nav/Banner Placement */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Live Blueprint Mini-Map */}
                <div className={`md:col-span-5 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted} flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${surface.text}`}>
                      Live Workspace Blueprint
                    </span>
                    <span className={`text-[11px] font-medium ${currentAccent.text}`}>
                      {customization.autoTiling
                        ? `Auto-Tile · ${customization.autoTilingAlgorithm}`
                        : BLUEPRINTS.find((b) => b.id === customization.layoutPreset)?.name}
                    </span>
                  </div>

                  {/* Mini Shell Preview */}
                  <div className={`flex-1 min-h-[150px] rounded-xl border ${surface.borderStrong} ${surface.card} p-2 flex ${
                    customization.navPlacement === 'left'
                      ? 'flex-row'
                      : customization.navPlacement === 'right'
                      ? 'flex-row-reverse'
                      : customization.navPlacement === 'bottom'
                      ? 'flex-col-reverse'
                      : 'flex-col'
                  } gap-1.5`}>
                    {/* Nav Bar Representation */}
                    <div
                      className={`${currentAccent.bgSubtle} border ${currentAccent.border} rounded-md flex items-center justify-center text-[9px] font-semibold ${currentAccent.text} ${
                        customization.navPlacement === 'left' || customization.navPlacement === 'right'
                          ? 'w-7 writing-mode-vertical py-1'
                          : 'h-4 w-full'
                      }`}
                    >
                      {customization.navPlacement === 'left' || customization.navPlacement === 'right' ? 'Nav' : 'Navigation Bar'}
                    </div>

                    {/* Inner area with challenge banner + workspace */}
                    <div className={`flex-1 flex ${customization.challengePlacement === 'bottom' ? 'flex-col-reverse' : 'flex-col'} gap-1.5`}>
                      {customization.challengePlacement !== 'hidden' && (
                        <div className={`h-3.5 rounded-md ${surface.chipBg} border ${surface.border} flex items-center justify-center text-[9px] ${surface.textSubtle}`}>
                          Lesson Banner
                        </div>
                      )}

                      <div className="flex-1 flex gap-1.5">
                        {customization.layoutPreset === 'inverted-studio' ? (
                          <>
                            <div className={`w-2/5 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                              1. {slotLabel(0)}
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                2. {slotLabel(1)}
                              </div>
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                3. {slotLabel(2)}
                              </div>
                            </div>
                          </>
                        ) : customization.layoutPreset === 'side-by-side' ? (
                          <>
                            {[0, 1, 2].map((i) => (
                              <div key={i} className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                {i + 1}. {slotLabel(i)}
                              </div>
                            ))}
                          </>
                        ) : customization.layoutPreset === 'wide-theater' ? (
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                              1. {slotLabel(0)}
                            </div>
                            <div className="flex-1 flex gap-1.5">
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                2. {slotLabel(1)}
                              </div>
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                3. {slotLabel(2)}
                              </div>
                            </div>
                          </div>
                        ) : customization.layoutPreset === 'bottom-editor' ? (
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex-1 flex gap-1.5">
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                1. {slotLabel(0)}
                              </div>
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                2. {slotLabel(1)}
                              </div>
                            </div>
                            <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                              3. {slotLabel(2)}
                            </div>
                          </div>
                        ) : customization.layoutPreset === 'stacked-horizontal' ? (
                          <div className="flex-1 flex flex-col gap-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                {i + 1}. {slotLabel(i)}
                              </div>
                            ))}
                          </div>
                        ) : customization.layoutPreset === 'focus-mode' ? (
                          <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[11px] font-semibold ${surface.text}`}>
                            1. {slotLabel(0)} (Solo Focus)
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 flex flex-col gap-1.5">
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                1. {slotLabel(0)}
                              </div>
                              <div className={`flex-1 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                                2. {slotLabel(1)}
                              </div>
                            </div>
                            <div className={`w-2/5 rounded-md ${surface.cardMuted} border ${surface.border} flex items-center justify-center text-[10px] font-semibold ${surface.text}`}>
                              3. {slotLabel(2)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className={`text-[11px] ${surface.textSubtle}`}>
                    Tip: You can also drag any panel header onto another panel directly in the workspace to swap them!
                  </p>
                </div>

                {/* Slot Assignment & Visibility Controls */}
                <div className={`md:col-span-7 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted} space-y-3`}>
                  <span className={`text-xs font-semibold ${surface.text} block`}>
                    Panel Slots &amp; Visibility (Reorder Any Slot)
                  </span>

                  <div className="space-y-2.5">
                    {[0, 1, 2].map((slotIndex) => {
                      const panelId = customization.panelOrder[slotIndex];
                      const meta = PANEL_LABELS[panelId];
                      const Icon = meta.icon;
                      const isHidden = customization.hiddenPanels.includes(panelId);

                      return (
                        <div
                          key={slotIndex}
                          className={`p-2.5 rounded-xl border ${surface.border} ${surface.card} flex items-center justify-between gap-2 flex-wrap`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-6 h-6 rounded-lg ${currentAccent.bgSubtle} ${currentAccent.text} font-semibold flex items-center justify-center text-[11px]`}>
                              {slotIndex + 1}
                            </span>
                            <Icon className={`w-4 h-4 ${surface.textMuted}`} />
                            <select
                              value={panelId}
                              onChange={(e) => setPanelAtSlot(slotIndex, e.target.value as PanelId)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${surface.input} focus:outline-hidden`}
                            >
                              <option value="editor">Code Editor</option>
                              <option value="terminal">Output Console</option>
                              <option value="tutor">Coding Mentor</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => swapSlotWithNext(slotIndex)}
                              title="Swap with next slot"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium`}
                            >
                              <ArrowUpDown className="w-3 h-3" />
                              <span>Swap</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => togglePanelHidden(panelId)}
                              title={isHidden ? 'Show panel' : 'Hide panel'}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                isHidden
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                  : `${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                              }`}
                            >
                              {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isHidden ? 'Hidden' : 'Visible'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Auto-Tiling Engine Controls */}
              <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${currentAccent.bgSubtle} ${currentAccent.text} flex items-center justify-center`}>
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-semibold ${surface.text} block`}>
                        Automatic Window Tiling
                      </span>
                      <span className={`text-[11px] ${surface.textSubtle}`}>
                        Automatically arrange &amp; resize all opened windows whenever panels open, close, or resize.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...customization,
                        autoTiling: !customization.autoTiling,
                        maximizedPanel: null,
                      })
                    }
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      customization.autoTiling
                        ? `${currentAccent.bg} border-transparent shadow-xs`
                        : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                    }`}
                  >
                    {customization.autoTiling ? 'Auto-Tile: ON' : 'Auto-Tile: OFF'}
                  </button>
                </div>

                {customization.autoTiling && (
                  <div className="zenith-banner-enter space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {(
                        [
                          {
                            id: 'smart-bsp',
                            title: 'Smart BSP',
                            desc: 'Master tile + evenly tiled secondary windows.',
                          },
                          {
                            id: 'equal-columns',
                            title: 'Equal Columns',
                            desc: 'All opened windows tile cleanly side by side.',
                          },
                          {
                            id: 'dwindle',
                            title: 'Dwindle Split',
                            desc: 'Each opened window halves the remaining region.',
                          },
                          {
                            id: 'equal-rows',
                            title: 'Equal Rows',
                            desc: 'All opened windows stack in balanced rows.',
                          },
                        ] as Array<{ id: AutoTilingAlgorithm; title: string; desc: string }>
                      ).map((alg) => {
                        const active = customization.autoTilingAlgorithm === alg.id;
                        return (
                          <button
                            key={alg.id}
                            type="button"
                            onClick={() => onChange({ ...customization, autoTilingAlgorithm: alg.id })}
                            className={`zenith-card-hover p-3 text-left rounded-xl border ${
                              active
                                ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                                : `${surface.card} ${surface.border} ${surface.hoverBg}`
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold ${surface.text}`}>{alg.title}</span>
                              {active && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                            </div>
                            <p className={`text-[11px] ${surface.textMuted} leading-snug`}>{alg.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <span className={`text-[11px] font-semibold ${surface.text} block mb-1.5`}>
                          Split Orientation
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {(
                            [
                              { id: 'auto', label: 'Auto' },
                              { id: 'horizontal', label: 'Horizontal' },
                              { id: 'vertical', label: 'Vertical' },
                            ] as Array<{ id: AutoTilingDirection; label: string }>
                          ).map((dir) => (
                            <button
                              key={dir.id}
                              type="button"
                              onClick={() => onChange({ ...customization, autoTilingDirection: dir.id })}
                              className={`py-1.5 rounded-lg border text-[11px] font-medium ${
                                customization.autoTilingDirection === dir.id
                                  ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                  : `${surface.card} ${surface.border} ${surface.textMuted}`
                              }`}
                            >
                              {dir.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-semibold ${surface.text}`}>
                            Master Tile Bias
                          </span>
                          <span className={`text-[11px] font-mono ${currentAccent.text}`}>
                            {customization.autoTilingMasterRatio}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={40}
                          max={70}
                          value={customization.autoTilingMasterRatio}
                          onChange={(e) =>
                            onChange({
                              ...customization,
                              autoTilingMasterRatio: Number(e.target.value),
                            })
                          }
                          className="w-full accent-current"
                        />
                      </div>

                      <div>
                        <span className={`text-[11px] font-semibold ${surface.text} block mb-1.5`}>
                          Window Open/Close Behavior
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...customization,
                              autoTilingAutoRebalance: !customization.autoTilingAutoRebalance,
                            })
                          }
                          className={`w-full px-3 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-between ${
                            customization.autoTilingAutoRebalance
                              ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                              : `${surface.card} ${surface.border} ${surface.textMuted}`
                          }`}
                        >
                          <span>Auto-Rebalance Splits</span>
                          <span>{customization.autoTilingAutoRebalance ? 'On' : 'Off'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 7 Structural Blueprints (Manual Blueprint Mode) */}
              <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${surface.text}`}>
                    Manual Grid Blueprints
                  </span>
                  {customization.autoTiling && (
                    <span className={`text-[11px] ${surface.textSubtle}`}>
                      Selecting a blueprint switches Auto-Tile off
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {BLUEPRINTS.map((bp) => {
                    const isSel = !customization.autoTiling && customization.layoutPreset === bp.id;
                    const Icon = bp.icon;
                    return (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...customization,
                            autoTiling: false,
                            layoutPreset: bp.id,
                            maximizedPanel: null,
                          })
                        }
                        className={`zenith-card-hover p-3 text-left rounded-2xl border ${
                          isSel
                            ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isSel ? currentAccent.text : surface.textMuted}`} />
                            <span className={`text-xs font-semibold ${surface.text}`}>{bp.name}</span>
                          </div>
                          {isSel && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                        </div>
                        <p className={`text-[11px] ${surface.textMuted} leading-snug`}>{bp.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Bar & Lesson Banner Placement + Proportions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${surface.border} ${surface.cardMuted} space-y-4`}>
                  <div>
                    <span className={`text-xs font-semibold ${surface.text} block mb-2`}>
                      Navigation Bar Dock Position
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'top', label: 'Top', icon: PanelTop },
                          { id: 'bottom', label: 'Bottom', icon: PanelBottom },
                          { id: 'left', label: 'Left Rail', icon: PanelLeft },
                          { id: 'right', label: 'Right Rail', icon: PanelRight },
                        ] as const
                      ).map((pos) => {
                        const Icon = pos.icon;
                        const active = customization.navPlacement === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => onChange({ ...customization, navPlacement: pos.id as NavPlacement })}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                              active
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{pos.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className={`text-xs font-semibold ${surface.text} block mb-2`}>
                      Active Lesson Banner Placement
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'top', label: 'Top of Canvas' },
                          { id: 'bottom', label: 'Bottom Bar' },
                          { id: 'hidden', label: 'Compact / Hidden' },
                        ] as const
                      ).map((pos) => {
                        const active = customization.challengePlacement === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => onChange({ ...customization, challengePlacement: pos.id as ChallengePlacement })}
                            className={`px-2.5 py-2 rounded-xl border text-[11px] font-medium transition-colors ${
                              active
                                ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                                : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                            }`}
                          >
                            {pos.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Split Ratios, Panel Gap & Corner Roundness */}
                <div className={`p-4 rounded-2xl border ${surface.border} ${surface.cardMuted} space-y-4`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${surface.text}`}>Primary Split Width</span>
                      <span className={`text-xs font-mono ${currentAccent.text}`}>{customization.splitRatioX}%</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={75}
                      value={customization.splitRatioX}
                      onChange={(e) => onChange({ ...customization, splitRatioX: Number(e.target.value) })}
                      className="w-full accent-current"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${surface.text}`}>Stacked Split Height</span>
                      <span className={`text-xs font-mono ${currentAccent.text}`}>{customization.splitRatioY}%</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={80}
                      value={customization.splitRatioY}
                      onChange={(e) => onChange({ ...customization, splitRatioY: Number(e.target.value) })}
                      className="w-full accent-current"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className={`text-[11px] font-semibold ${surface.text} block mb-1.5`}>
                        Panel Spacing
                      </span>
                      <div className="flex gap-1">
                        {(['tight', 'cozy', 'airy'] as PanelGapSize[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => onChange({ ...customization, panelGap: g })}
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] capitalize font-medium ${
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
                      <span className={`text-[11px] font-semibold ${surface.text} block mb-1.5`}>
                        Corner Roundness
                      </span>
                      <div className="flex gap-1">
                        {(['subtle', 'rounded', 'pillowy'] as CornerRadiusStyle[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => onChange({ ...customization, cornerRadius: r })}
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] capitalize font-medium ${
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
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              {/* Natural Themes */}
              <div className="space-y-3">
                <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                  <Sparkles className={`w-4 h-4 ${currentAccent.text}`} />
                  Natural Color Themes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
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

              {/* Accent Swatches */}
              <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                    <Palette className={`w-4 h-4 ${currentAccent.text}`} />
                    Accent Color
                  </span>
                  <span className={`text-xs font-semibold ${currentAccent.text}`}>
                    {currentAccent.name}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {SELECTABLE_ACCENTS.map((col) => {
                    const conf = ACCENT_MAP[col];
                    const isSel = customization.accent === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => onChange({ ...customization, accent: col, presetName: 'Custom' })}
                        className={`zenith-card-hover p-2.5 rounded-xl border flex flex-col items-center gap-1.5 ${
                          isSel
                            ? `${conf.bgSubtle} ${conf.border} shadow-xs`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-black/15"
                          style={{ backgroundColor: conf.hex }}
                        />
                        <span className={`text-[11px] font-medium ${surface.text}`}>
                          {conf.name.split(' ').pop()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code Syntax Palette */}
              <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                  <Sliders className={`w-4 h-4 ${currentAccent.text}`} />
                  Editor Syntax Palette
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'warm-botanical',
                      label: 'Warm Botanical',
                      desc: 'Soft coral, sage mint, and warm gold on a matte slate canvas.',
                      sample: '<span style="color:#e38c7d">fn</span> <span style="color:#e6c57a">solve</span>(x: <span style="color:#84bfb2">i32</span>) -> <span style="color:#9fc48d">"ok"</span>',
                    },
                    {
                      id: 'soft-pastel',
                      label: 'Soft Chalk Pastel',
                      desc: 'Gentle muted rose, eucalyptus, and lavender tones.',
                      sample: '<span style="color:#df9399">fn</span> <span style="color:#e5c882">solve</span>(x: <span style="color:#87bfb5">i32</span>) -> <span style="color:#9dc493">"ok"</span>',
                    },
                    {
                      id: 'warm-amber',
                      label: 'Fireside Amber',
                      desc: 'Cozy toasted honey, parchment, and ochre hues.',
                      sample: '<span style="color:#e6a15c">fn</span> <span style="color:#f2be7e">solve</span>(x: <span style="color:#ebd086">i32</span>) -> <span style="color:#c9a97c">"ok"</span>',
                    },
                    {
                      id: 'ink-mono',
                      label: 'Warm Paper & Ink',
                      desc: 'Calm cream and stone monochrome for quiet reading.',
                      sample: '<span style="color:#f5f2eb">fn</span> <span style="color:#e7e2d8">solve</span>(x: <span style="color:#d6d1c7">i32</span>) -> <span style="color:#a8a296">"ok"</span>',
                    },
                  ].map((syn) => {
                    const isSel = customization.syntaxTheme === syn.id;
                    return (
                      <button
                        key={syn.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...customization,
                            syntaxTheme: syn.id as SyntaxTheme,
                            presetName: 'Custom',
                          })
                        }
                        className={`zenith-card-hover p-3 text-left rounded-2xl border ${
                          isSel
                            ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold ${surface.text}`}>{syn.label}</span>
                          {isSel && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                        </div>
                        <p className={`text-[11px] ${surface.textMuted} mb-2 leading-snug`}>
                          {syn.desc}
                        </p>
                        <div
                          className="p-2 rounded-xl bg-[#212422] font-mono text-[11px]"
                          dangerouslySetInnerHTML={{ __html: syn.sample }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'editor' && (
            <>
              {/* Editor Typography & Line Numbers */}
              <div className={`space-y-4 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                  <Type className={`w-4 h-4 ${currentAccent.text}`} />
                  Editor Readability
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className={`text-[11px] font-semibold ${surface.textMuted} block mb-2`}>
                      Code Font Size
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'sm', label: 'Compact (11px)' },
                          { id: 'md', label: 'Medium (12px)' },
                          { id: 'lg', label: 'Large (14px)' },
                        ] as Array<{ id: EditorFontSize; label: string }>
                      ).map((fs) => (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() => onChange({ ...customization, editorFontSize: fs.id })}
                          className={`p-2 rounded-xl border text-[11px] font-medium ${
                            customization.editorFontSize === fs.id
                              ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
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
                      Line Number Gutter
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...customization, showLineNumbers: !customization.showLineNumbers })
                      }
                      className={`w-full p-2 rounded-xl border text-xs font-medium flex items-center justify-between ${
                        customization.showLineNumbers
                          ? `${currentAccent.bgSubtle} ${currentAccent.border} ${currentAccent.text}`
                          : `${surface.card} ${surface.border} ${surface.textMuted}`
                      }`}
                    >
                      <span>Show Line Numbers</span>
                      <span>{customization.showLineNumbers ? 'On' : 'Off'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mentor AI Thinking Depth */}
              <div className={`space-y-3 p-4 rounded-2xl border ${surface.border} ${surface.cardMuted}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
                    <Brain className={`w-4 h-4 ${currentAccent.text}`} />
                    Mentor AI Thinking Depth
                  </span>
                  <span className={`text-xs font-semibold ${currentAccent.text}`}>
                    {customization.reasoningLevel === 'low'
                      ? 'Low'
                      : customization.reasoningLevel === 'medium'
                      ? 'Medium'
                      : customization.reasoningLevel === 'high'
                      ? 'High'
                      : 'Extra High'}
                  </span>
                </div>

                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
                    supportsXHigh ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                  }`}
                >
                  {thinkingTiers.map((tier) => {
                    const isSel = customization.reasoningLevel === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...customization,
                            reasoningLevel: tier.id as ReasoningLevel,
                          })
                        }
                        className={`zenith-card-hover p-3 text-left rounded-2xl border ${
                          isSel
                            ? `${currentAccent.bgSubtle} ${currentAccent.border}`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold ${surface.text}`}>{tier.title}</span>
                          {isSel && <Check className={`w-3.5 h-3.5 ${currentAccent.text}`} />}
                        </div>
                        <p className={`text-[11px] ${surface.textMuted} leading-snug`}>{tier.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${surface.border} ${surface.cardMuted} flex items-center justify-between`}>
          <span className={`text-xs ${surface.textSubtle}`}>
            All placements, splits, and themes save automatically.
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
