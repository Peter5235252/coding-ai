import React from 'react';
import { AccentColor, BackgroundGradientStyle, ReasoningLevel, SurfaceStyle } from '../types';
import { getAccentConfig, getSurfacePalette } from '../utils/themeData';
import { playSound } from '../utils/soundEngine';
import { Brain } from 'lucide-react';

export const REASONING_TIERS: Array<{
  id: ReasoningLevel;
  shortLabel: string;
  label: string;
  description: string;
}> = [
  {
    id: 'low',
    shortLabel: 'Low',
    label: 'Low',
    description: 'Fastest responses for quick syntax checks, hints, and simple scripts.',
  },
  {
    id: 'medium',
    shortLabel: 'Med',
    label: 'Medium',
    description: 'Balanced reasoning for everyday code reviews, logic, and edge cases.',
  },
  {
    id: 'high',
    shortLabel: 'High',
    label: 'High',
    description: 'Deep analysis for tricky lifetimes, pointers, concurrency, or subtle bugs.',
  },
  {
    id: 'xhigh',
    shortLabel: 'Extra High',
    label: 'Extra High',
    description: 'Maximum Gemini 4 Hydrogen thinking depth for complex systems architecture.',
  },
];

export function getReasoningTierIndex(level: ReasoningLevel): number {
  const idx = REASONING_TIERS.findIndex((t) => t.id === level);
  return idx === -1 ? 1 : idx;
}

export function getReasoningTierMeta(level: ReasoningLevel) {
  return REASONING_TIERS[getReasoningTierIndex(level)];
}

interface ReasoningEffortSliderProps {
  value: ReasoningLevel;
  onChange: (level: ReasoningLevel) => void;
  variant?: 'compact' | 'full';
  accent?: AccentColor;
  customAccentHex?: string;
  bgGradient?: BackgroundGradientStyle;
  surfaceStyle?: SurfaceStyle;
}

export const ReasoningEffortSlider: React.FC<ReasoningEffortSliderProps> = ({
  value,
  onChange,
  variant = 'compact',
  accent = 'sage',
  customAccentHex,
  bgGradient = 'warm-linen',
  surfaceStyle = 'crisp',
}) => {
  const accentConf = getAccentConfig(accent, customAccentHex);
  const surface = getSurfacePalette(bgGradient, surfaceStyle);

  const activeIdx = getReasoningTierIndex(value);
  const activeTier = REASONING_TIERS[activeIdx];
  const progressPct = (activeIdx / (REASONING_TIERS.length - 1)) * 100;

  const selectIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(REASONING_TIERS.length - 1, idx));
    const nextTier = REASONING_TIERS[clamped];
    if (nextTier.id !== value) {
      playSound('sliderTick');
      onChange(nextTier.id);
    }
  };

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2.5 px-2.5 py-1 rounded-xl border ${surface.border} ${surface.chipBg}`}
        title={`Reasoning Effort: ${activeTier.label} — ${activeTier.description}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Brain className={`w-3.5 h-3.5 ${accentConf.text} shrink-0`} />
          <span className={`text-[11px] font-medium ${surface.textSubtle} hidden sm:inline`}>
            Effort
          </span>
        </div>

        <div className="relative w-24 sm:w-28 h-5 flex items-center shrink-0">
          {/* Base track */}
          <div
            className={`absolute left-1 right-1 h-1.5 rounded-full ${
              surface.isDark ? 'bg-white/12' : 'bg-black/10'
            }`}
          />
          {/* Active fill */}
          <div
            style={{
              width: `calc(${progressPct}% * 0.92)`,
              backgroundColor: accentConf.hex,
            }}
            className="absolute left-1 h-1.5 rounded-full transition-all duration-150"
          />
          {/* 4-tier stop pips */}
          <div className="absolute left-1 right-1 flex items-center justify-between pointer-events-none">
            {REASONING_TIERS.map((tier, idx) => {
              const reached = idx <= activeIdx;
              const isCurrent = idx === activeIdx;
              return (
                <span
                  key={tier.id}
                  style={reached ? { backgroundColor: accentConf.hex } : undefined}
                  className={`rounded-full transition-transform duration-150 ${
                    isCurrent
                      ? 'w-3 h-3 ring-2 ring-white/80 dark:ring-black/50 scale-105'
                      : reached
                      ? 'w-1.5 h-1.5 opacity-90'
                      : `w-1.5 h-1.5 ${surface.isDark ? 'bg-white/25' : 'bg-black/20'}`
                  }`}
                />
              );
            })}
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={activeIdx}
            aria-label="AI Reasoning Effort"
            aria-valuetext={activeTier.label}
            onChange={(e) => selectIndex(Number(e.target.value))}
            className="relative z-10 w-full h-5 opacity-0 cursor-pointer"
          />
        </div>

        <span
          className={`text-[11px] font-semibold ${accentConf.text} whitespace-nowrap min-w-[3.75rem] text-right tabular-nums`}
        >
          {activeTier.shortLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className={`w-4 h-4 ${accentConf.text} shrink-0`} />
          <span className={`text-xs font-semibold ${surface.text} truncate`}>
            Reasoning Effort
          </span>
        </div>
        <span className={`text-xs font-semibold ${accentConf.text} whitespace-nowrap`}>
          {activeTier.label}
        </span>
      </div>

      {/* Interactive 4-Tier Track + Slider */}
      <div className="space-y-2">
        <div className="relative h-6 flex items-center">
          <div
            className={`absolute left-1.5 right-1.5 h-2 rounded-full ${
              surface.isDark ? 'bg-white/12' : 'bg-black/10'
            }`}
          />
          <div
            style={{
              width: `calc(${progressPct}% * 0.96)`,
              backgroundColor: accentConf.hex,
            }}
            className="absolute left-1.5 h-2 rounded-full transition-all duration-150"
          />
          <div className="absolute left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
            {REASONING_TIERS.map((tier, idx) => {
              const reached = idx <= activeIdx;
              const isCurrent = idx === activeIdx;
              return (
                <span
                  key={tier.id}
                  style={reached ? { backgroundColor: accentConf.hex } : undefined}
                  className={`rounded-full transition-all duration-150 ${
                    isCurrent
                      ? 'w-4 h-4 ring-2 ring-white shadow-sm'
                      : reached
                      ? 'w-2 h-2'
                      : `w-2 h-2 ${surface.isDark ? 'bg-white/25' : 'bg-black/20'}`
                  }`}
                />
              );
            })}
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={activeIdx}
            aria-label="AI Reasoning Effort"
            aria-valuetext={activeTier.label}
            onChange={(e) => selectIndex(Number(e.target.value))}
            className="relative z-10 w-full h-6 opacity-0 cursor-pointer"
          />
        </div>

        {/* Interactive Tier Tick Labels */}
        <div className="grid grid-cols-4 gap-1">
          {REASONING_TIERS.map((tier, idx) => {
            const isCurrent = idx === activeIdx;
            const alignClass =
              idx === 0
                ? 'text-left'
                : idx === 3
                ? 'text-right'
                : 'text-center';
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => selectIndex(idx)}
                className={`text-[11px] py-0.5 rounded transition-colors whitespace-nowrap ${alignClass} ${
                  isCurrent
                    ? `font-semibold ${accentConf.text}`
                    : `${surface.textSubtle} hover:opacity-80`
                }`}
              >
                {tier.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <p className={`text-[11px] ${surface.textMuted} leading-relaxed`}>
        {activeTier.description}
      </p>
    </div>
  );
};
