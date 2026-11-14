import React, { useEffect, useRef, useState } from 'react';
import { InterfaceCustomization } from '../types';
import { getAccentConfig, getSurfacePalette } from '../utils/themeData';
import { playSound } from '../utils/soundEngine';
import {
  Check,
  ChevronDown,
  Columns2,
  FolderKanban,
  Layout,
  LayoutGrid,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

interface TilingDropdownProps {
  customization: InterfaceCustomization;
  onChange: (updated: InterfaceCustomization) => void;
  onOpenLayoutStudio: () => void;
}

type SplitAlg = 'smart-bsp' | 'equal-columns' | 'equal-rows' | 'dwindle';

function isSplitAlg(
  alg: InterfaceCustomization['autoTilingAlgorithm']
): alg is SplitAlg {
  return (
    alg === 'smart-bsp' ||
    alg === 'equal-columns' ||
    alg === 'dwindle' ||
    alg === 'equal-rows'
  );
}

export const TilingDropdown: React.FC<TilingDropdownProps> = ({
  customization,
  onChange,
  onOpenLayoutStudio,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const accentConf = getAccentConfig(customization.accent, customization.customAccentHex);
  const surface = getSurfacePalette(customization.bgGradient, customization.surfaceStyle);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isVerticalRail =
    customization.navPlacement === 'left' || customization.navPlacement === 'right';

  const isManual = !customization.autoTiling;
  const activeModeId = isManual
    ? 'manual'
    : customization.autoTilingAlgorithm === 'stacked-windows'
    ? 'stacked'
    : customization.autoTilingAlgorithm === 'master-tabbed'
    ? 'master-tabbed'
    : customization.autoTilingAlgorithm === 'tabbed-windows'
    ? 'tabbed'
    : 'tiled';

  const activeMeta =
    activeModeId === 'stacked'
      ? { label: 'Stacked', shortLabel: 'Stacked', icon: Layers }
      : activeModeId === 'master-tabbed'
      ? { label: 'Master + Tabs', shortLabel: 'M+Tabs', icon: Columns2 }
      : activeModeId === 'tabbed'
      ? { label: 'Tabs', shortLabel: 'Tabs', icon: FolderKanban }
      : activeModeId === 'manual'
      ? { label: 'Custom Split', shortLabel: 'Custom', icon: Layout }
      : { label: 'Tiled', shortLabel: 'Tiled', icon: LayoutGrid };

  const ActiveIcon = activeMeta.icon;

  const selectWindowMode = (alg: InterfaceCustomization['autoTilingAlgorithm']) => {
    playSound('select');
    onChange({
      ...customization,
      autoTiling: true,
      maximizedPanel: null,
      autoTilingAlgorithm: alg,
      lastSplitAlgorithm: isSplitAlg(alg) ? alg : customization.lastSplitAlgorithm,
      splitRatioX:
        customization.autoTilingAutoRebalance
          ? customization.autoTilingMasterRatio
          : customization.splitRatioX,
      splitRatioY: customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY,
    });
    setIsOpen(false);
  };

  const selectSplitStyle = (style: SplitAlg | 'manual') => {
    playSound('select');
    if (style === 'manual') {
      onChange({
        ...customization,
        autoTiling: false,
        maximizedPanel: null,
      });
      return;
    }
    onChange({
      ...customization,
      autoTiling: true,
      maximizedPanel: null,
      autoTilingAlgorithm: style,
      lastSplitAlgorithm: style,
    });
  };

  const menuPositionClass =
    customization.navPlacement === 'bottom'
      ? 'right-0 bottom-full mb-2'
      : customization.navPlacement === 'left'
      ? 'left-full bottom-0 ml-2'
      : customization.navPlacement === 'right'
      ? 'right-full bottom-0 mr-2'
      : 'right-0 top-full mt-2';

  const dropdownOrigin =
    customization.navPlacement === 'bottom'
      ? 'bottom right'
      : customization.navPlacement === 'left'
      ? 'bottom left'
      : customization.navPlacement === 'right'
      ? 'bottom right'
      : 'top right';

  const WINDOW_MODES: Array<{
    id: 'tiled' | 'stacked' | 'master-tabbed' | 'tabbed';
    label: string;
    desc: string;
    alg: InterfaceCustomization['autoTilingAlgorithm'];
    preview: React.ReactNode;
  }> = [
    {
      id: 'tiled',
      label: 'Tiled',
      desc: 'Side-by-side resizable panes',
      alg: customization.lastSplitAlgorithm || 'smart-bsp',
      preview: (
        <div className="w-8 h-6 rounded border border-current/25 p-0.5 grid grid-cols-2 gap-0.5 shrink-0 opacity-85">
          <div className="rounded-[2px] bg-current/35" />
          <div className="grid grid-rows-2 gap-0.5">
            <div className="rounded-[2px] bg-current/25" />
            <div className="rounded-[2px] bg-current/25" />
          </div>
        </div>
      ),
    },
    {
      id: 'stacked',
      label: 'Stacked',
      desc: 'Window title bars stacked vertically',
      alg: 'stacked-windows',
      preview: (
        <div className="w-8 h-6 rounded border border-current/25 p-0.5 flex flex-col gap-0.5 shrink-0 opacity-85">
          <div className="h-1 rounded-[1px] bg-current/25" />
          <div className="h-1 rounded-[1px] bg-current/45" />
          <div className="flex-1 rounded-[2px] bg-current/25" />
        </div>
      ),
    },
    {
      id: 'master-tabbed',
      label: 'Master + Tabs',
      desc: 'Main pane open beside tabbed panels',
      alg: 'master-tabbed',
      preview: (
        <div className="w-8 h-6 rounded border border-current/25 p-0.5 grid grid-cols-2 gap-0.5 shrink-0 opacity-85">
          <div className="rounded-[2px] bg-current/35" />
          <div className="flex flex-col gap-0.5">
            <div className="h-1 rounded-[1px] bg-current/45" />
            <div className="flex-1 rounded-[2px] bg-current/25" />
          </div>
        </div>
      ),
    },
    {
      id: 'tabbed',
      label: 'Tabs',
      desc: 'Full-screen tabbed window view',
      alg: 'tabbed-windows',
      preview: (
        <div className="w-8 h-6 rounded border border-current/25 p-0.5 flex flex-col gap-0.5 shrink-0 opacity-85">
          <div className="grid grid-cols-3 gap-0.5 h-1">
            <div className="rounded-[1px] bg-current/50" />
            <div className="rounded-[1px] bg-current/20" />
            <div className="rounded-[1px] bg-current/20" />
          </div>
          <div className="flex-1 rounded-[2px] bg-current/30" />
        </div>
      ),
    },
  ];

  const SPLIT_STYLES: Array<{
    id: SplitAlg | 'manual';
    label: string;
    title: string;
  }> = [
    { id: 'smart-bsp', label: 'Smart', title: 'Adaptive master + split panes' },
    { id: 'equal-columns', label: 'Columns', title: 'Three side-by-side columns' },
    { id: 'equal-rows', label: 'Rows', title: 'Three stacked rows' },
    { id: 'dwindle', label: 'Spiral', title: 'Progressive dwindle splits' },
    { id: 'manual', label: 'Manual', title: 'Use manual layout blueprints & custom drag ratios' },
  ];

  return (
    <div ref={dropdownRef} className="relative hidden md:inline-block font-sans">
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          playSound(next ? 'dropdownOpen' : 'dropdownClose');
          setIsOpen(next);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Window Layout: ${activeMeta.label}`}
        className={`inline-flex items-center justify-center gap-1.5 ${
          isVerticalRail ? 'w-full py-2 flex-col text-[10px]' : 'px-2.5 py-1.5 text-xs'
        } rounded-xl border transition-colors font-medium whitespace-nowrap shrink-0 ${
          isOpen
            ? `${accentConf.bgSubtle} ${accentConf.border} ${accentConf.text}`
            : `${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`
        }`}
      >
        <ActiveIcon className={`w-3.5 h-3.5 ${accentConf.text} shrink-0`} />
        {isVerticalRail ? (
          <span>{activeMeta.shortLabel}</span>
        ) : (
          <>
            <span className={surface.text}>{activeMeta.label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 ${surface.textSubtle} transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{ transformOrigin: dropdownOrigin }}
          className={`zenith-dropdown-menu absolute ${menuPositionClass} w-80 rounded-2xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl z-50 overflow-hidden`}
        >
          {/* Header */}
          <div
            className={`px-4 py-2.5 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between`}
          >
            <span className={`text-xs font-semibold ${surface.text}`}>
              Window Tiling
            </span>
            <span className={`text-[11px] ${surface.textSubtle}`}>
              {isManual ? 'Manual split' : activeMeta.label}
            </span>
          </div>

          {/* 4 Window Modes */}
          <div className="p-2 space-y-1">
            {WINDOW_MODES.map((mode) => {
              const isSelected = activeModeId === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => selectWindowMode(mode.alg)}
                  className={`zenith-card-hover w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 border transition-colors ${
                    isSelected
                      ? `${accentConf.bgSubtle} ${accentConf.border}`
                      : `border-transparent ${surface.hoverBg}`
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={isSelected ? accentConf.text : surface.textMuted}>
                      {mode.preview}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold ${surface.text} leading-tight`}>
                        {mode.label}
                      </div>
                      <div className={`text-[11px] ${surface.textSubtle} truncate mt-0.5`}>
                        {mode.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className={`w-4 h-4 shrink-0 ${accentConf.text}`} />}
                </button>
              );
            })}
          </div>

          {/* Split Arrangement Quick Picker */}
          <div className={`px-3 py-2.5 border-t ${surface.border} ${surface.cardMuted} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${surface.textSubtle}`}>
                Split Arrangement
              </span>
              <span className={`text-[11px] ${surface.textSubtle}`}>
                {isManual ? 'Locked ratios' : 'Auto-balanced'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {SPLIT_STYLES.map((style) => {
                const active =
                  style.id === 'manual'
                    ? isManual
                    : !isManual && customization.autoTilingAlgorithm === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    title={style.title}
                    onClick={() => selectSplitStyle(style.id)}
                    className={`px-1.5 py-1 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap text-center ${
                      active
                        ? `${accentConf.bg} border-transparent shadow-xs`
                        : `${surface.card} ${surface.border} ${surface.textMuted} ${surface.hoverBg}`
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Studio Link */}
          <button
            type="button"
            onClick={() => {
              playSound('modalOpen');
              setIsOpen(false);
              onOpenLayoutStudio();
            }}
            className={`w-full px-4 py-2 border-t ${surface.border} ${surface.card} ${surface.hoverBg} flex items-center justify-between text-[11px] font-medium ${surface.textMuted} transition-colors`}
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className={`w-3.5 h-3.5 ${accentConf.text}`} />
              <span>Customize panel order &amp; gaps</span>
            </span>
            <span className={accentConf.text}>Studio</span>
          </button>
        </div>
      )}
    </div>
  );
};
