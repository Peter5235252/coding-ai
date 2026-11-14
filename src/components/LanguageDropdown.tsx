import React, { useState, useRef, useEffect } from 'react';
import { AccentColor, BackgroundGradientStyle, NavPlacement, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languageData';
import { ACCENT_MAP, getSurfacePalette } from '../utils/themeData';
import { playSound } from '../utils/soundEngine';
import { ChevronDown, Check, Cpu, Gamepad2, Terminal } from 'lucide-react';

interface LanguageDropdownProps {
  activeLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
  navPlacement?: NavPlacement;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  activeLanguage,
  onSelectLanguage,
  accent = 'sage',
  bgGradient = 'warm-linen',
  navPlacement = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMeta = SUPPORTED_LANGUAGES[activeLanguage];
  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);

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

  const GROUPS = [
    {
      title: 'Systems & Core',
      icon: Cpu,
      langs: ['rust', 'c', 'cpp', 'go'] as SupportedLanguage[],
    },
    {
      title: 'Application & Web',
      icon: Terminal,
      langs: ['javascript', 'java', 'csharp', 'python'] as SupportedLanguage[],
    },
    {
      title: 'Game Development & Scripting',
      icon: Gamepad2,
      langs: ['gdscript', 'luau', 'lua'] as SupportedLanguage[],
    },
  ];

  const isVerticalRail = navPlacement === 'left' || navPlacement === 'right';
  const menuPositionClass =
    navPlacement === 'bottom'
      ? 'left-0 bottom-full mb-2'
      : navPlacement === 'left'
      ? 'left-full top-0 ml-2'
      : navPlacement === 'right'
      ? 'right-full top-0 mr-2'
      : 'left-0 top-full mt-2';

  const dropdownOrigin =
    navPlacement === 'bottom'
      ? 'bottom left'
      : navPlacement === 'right'
      ? 'top right'
      : 'top left';

  return (
    <div ref={dropdownRef} className="relative inline-block font-sans">
      {/* Friendly Rounded Trigger */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          playSound(next ? 'dropdownOpen' : 'dropdownClose');
          setIsOpen(next);
        }}
        className={`flex items-center gap-2 ${isVerticalRail ? 'px-2 py-2 w-full justify-center' : 'px-3 py-1.5'} rounded-xl border transition-all duration-150 ${surface.card} ${
          isOpen ? accentConf.border : `${surface.border} ${surface.hoverBg}`
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`Language: ${activeMeta?.name}`}
      >
        <span
          className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${accentConf.badgeBg}`}
        >
          {activeMeta?.extension}
        </span>
        {!isVerticalRail && (
          <>
            <span className={`font-semibold text-xs sm:text-sm ${surface.text}`}>
              {activeMeta?.name}
            </span>
            <ChevronDown
              className={`w-4 h-4 ${surface.textSubtle} transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Inviting Rounded Dropdown Panel */}
      {isOpen && (
        <div
          style={{ transformOrigin: dropdownOrigin }}
          className={`zenith-dropdown-menu absolute ${menuPositionClass} w-72 sm:w-80 rounded-2xl border ${surface.borderStrong} ${surface.modalBg} shadow-xl z-50 overflow-hidden`}
        >
          <div className={`px-4 py-2.5 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between`}>
            <span className={`text-xs font-semibold ${surface.text}`}>
              Choose a Language
            </span>
            <span className={`text-[11px] ${surface.textSubtle}`}>
              11 supported
            </span>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-2 space-y-3">
            {GROUPS.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.title} className="space-y-1">
                  <div className={`px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-semibold ${surface.textSubtle}`}>
                    <GroupIcon className="w-3.5 h-3.5" />
                    <span>{group.title}</span>
                  </div>

                  <div className="space-y-1">
                    {group.langs.map((langKey) => {
                      const meta = SUPPORTED_LANGUAGES[langKey];
                      const isSelected = activeLanguage === langKey;
                      return (
                        <button
                          key={langKey}
                          type="button"
                          onClick={() => {
                            playSound('select');
                            onSelectLanguage(langKey);
                            setIsOpen(false);
                          }}
                          className={`zenith-card-hover w-full text-left px-3 py-2 rounded-xl flex items-center justify-between border ${
                            isSelected
                              ? `${accentConf.bgSubtle} ${accentConf.border}`
                              : `border-transparent ${surface.hoverBg}`
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <span
                              className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                                isSelected
                                  ? accentConf.badgeBg
                                  : `${surface.chipBg} ${surface.border} ${surface.textMuted}`
                              }`}
                            >
                              {meta.extension}
                            </span>
                            <div className="overflow-hidden">
                              <span className={`font-semibold text-xs block ${surface.text}`}>
                                {meta.name}
                              </span>
                              <span className={`text-[11px] truncate block ${surface.textSubtle}`}>
                                {meta.paradigm}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className={`w-4 h-4 shrink-0 ${accentConf.text}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
