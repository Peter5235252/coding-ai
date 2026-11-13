import React from 'react';
import {
  AccentColor,
  BackgroundGradientStyle,
  CornerRadiusStyle,
  InterfaceCustomization,
  PanelGapSize,
  PanelId,
  SyntaxTheme,
} from '../types';

export const THEME_STORAGE_KEY = 'zenith_interface_theme_v3';

export const DEFAULT_CUSTOMIZATION: InterfaceCustomization = {
  presetName: 'Sunlit Sage',
  accent: 'sage',
  bgGradient: 'warm-linen',
  syntaxTheme: 'warm-botanical',
  layoutPreset: 'standard-ide',
  reasoningLevel: 'medium',
  autoTiling: true,
  autoTilingAlgorithm: 'smart-bsp',
  autoTilingDirection: 'auto',
  autoTilingMasterRatio: 56,
  autoTilingAutoRebalance: true,
  panelOrder: ['editor', 'terminal', 'tutor'],
  hiddenPanels: [],
  maximizedPanel: null,
  navPlacement: 'top',
  challengePlacement: 'top',
  splitRatioX: 58,
  splitRatioY: 62,
  panelGap: 'cozy',
  cornerRadius: 'rounded',
  editorFontSize: 'md',
  showLineNumbers: true,
  panelPositions: {
    editor: 0,
    terminal: 1,
    tutor: 2,
  },
  terminalPlacement: 'bottom',
  fontSize: 'medium',
  fontFamily: 'monospace',
  glassmorphism: false,
  borderGlow: false,
};

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  accent: AccentColor;
  bgGradient: BackgroundGradientStyle;
  syntaxTheme: SyntaxTheme;
  previewBg: string;
  previewAccent: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'sunlit-sage',
    name: 'Sunlit Sage',
    description: 'Warm cream linen canvas with soft woodland sage accents.',
    accent: 'sage',
    bgGradient: 'warm-linen',
    syntaxTheme: 'warm-botanical',
    previewBg: 'bg-[#F5F1E8]',
    previewAccent: 'bg-[#3D6B56]',
  },
  {
    id: 'morning-oat',
    name: 'Morning Oat',
    description: 'Cozy toasted oat backdrop with warm terracotta clay.',
    accent: 'terracotta',
    bgGradient: 'sunlit-meadow',
    syntaxTheme: 'warm-amber',
    previewBg: 'bg-[#F6EFE6]',
    previewAccent: 'bg-[#BA613E]',
  },
  {
    id: 'coastal-mist',
    name: 'Coastal Mist',
    description: 'Calm sea-glass morning mist with serene slate-blue tones.',
    accent: 'slate',
    bgGradient: 'coastal-breeze',
    syntaxTheme: 'soft-pastel',
    previewBg: 'bg-[#EDF2F3]',
    previewAccent: 'bg-[#3B6978]',
  },
  {
    id: 'warm-espresso',
    name: 'Warm Espresso',
    description: 'Cozy dark roast evening study with soft sage highlights.',
    accent: 'moss',
    bgGradient: 'warm-espresso',
    syntaxTheme: 'warm-botanical',
    previewBg: 'bg-[#221D1A]',
    previewAccent: 'bg-[#6F9B76]',
  },
  {
    id: 'twilight-cedar',
    name: 'Twilight Cedar',
    description: 'Quiet forest dusk with warm golden ochre accents.',
    accent: 'ochre',
    bgGradient: 'twilight-cedar',
    syntaxTheme: 'warm-amber',
    previewBg: 'bg-[#1F2522]',
    previewAccent: 'bg-[#D19A53]',
  },
];

function normalizeAccent(accent?: string): AccentColor {
  const valid: AccentColor[] = ['sage', 'terracotta', 'ochre', 'slate', 'plum', 'moss'];
  if (accent && valid.includes(accent as AccentColor)) return accent as AccentColor;
  switch (accent) {
    case 'emerald':
      return 'moss';
    case 'amber':
      return 'ochre';
    case 'rose':
      return 'terracotta';
    case 'violet':
    case 'indigo':
      return 'plum';
    case 'sky':
    case 'cyan':
      return 'slate';
    default:
      return 'sage';
  }
}

function normalizeBackground(bg?: string): BackgroundGradientStyle {
  const valid: BackgroundGradientStyle[] = [
    'warm-linen',
    'sunlit-meadow',
    'coastal-breeze',
    'warm-espresso',
    'twilight-cedar',
  ];
  if (bg && valid.includes(bg as BackgroundGradientStyle)) {
    return bg as BackgroundGradientStyle;
  }
  return 'warm-linen';
}

function normalizePanelOrder(order?: unknown): PanelId[] {
  const base: PanelId[] = ['editor', 'terminal', 'tutor'];
  if (!Array.isArray(order) || order.length !== 3) return base;
  const filtered = order.filter((item): item is PanelId =>
    item === 'editor' || item === 'terminal' || item === 'tutor'
  );
  if (new Set(filtered).size !== 3) return base;
  return filtered;
}

export function loadCustomization(): InterfaceCustomization {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('zenith_interface_theme_v2');
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CUSTOMIZATION,
      ...parsed,
      accent: normalizeAccent(parsed.accent),
      bgGradient: normalizeBackground(parsed.bgGradient),
      reasoningLevel:
        parsed.reasoningLevel === 'low' ||
        parsed.reasoningLevel === 'medium' ||
        parsed.reasoningLevel === 'high' ||
        parsed.reasoningLevel === 'xhigh'
          ? parsed.reasoningLevel
          : 'medium',
      panelOrder: normalizePanelOrder(parsed.panelOrder),
      hiddenPanels: Array.isArray(parsed.hiddenPanels) ? parsed.hiddenPanels : [],
      autoTiling: typeof parsed.autoTiling === 'boolean' ? parsed.autoTiling : true,
      autoTilingAlgorithm:
        parsed.autoTilingAlgorithm === 'equal-columns' ||
        parsed.autoTilingAlgorithm === 'dwindle' ||
        parsed.autoTilingAlgorithm === 'equal-rows'
          ? parsed.autoTilingAlgorithm
          : 'smart-bsp',
      autoTilingDirection:
        parsed.autoTilingDirection === 'horizontal' || parsed.autoTilingDirection === 'vertical'
          ? parsed.autoTilingDirection
          : 'auto',
      autoTilingMasterRatio:
        typeof parsed.autoTilingMasterRatio === 'number'
          ? Math.min(72, Math.max(38, parsed.autoTilingMasterRatio))
          : 56,
      autoTilingAutoRebalance:
        typeof parsed.autoTilingAutoRebalance === 'boolean' ? parsed.autoTilingAutoRebalance : true,
      splitRatioX: typeof parsed.splitRatioX === 'number' ? Math.min(78, Math.max(28, parsed.splitRatioX)) : 58,
      splitRatioY: typeof parsed.splitRatioY === 'number' ? Math.min(80, Math.max(24, parsed.splitRatioY)) : 62,
    };
  } catch (err) {
    console.error('Failed to load theme customization', err);
    return DEFAULT_CUSTOMIZATION;
  }
}

export function saveCustomization(custom: InterfaceCustomization): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {
    console.error('Failed to save theme customization', err);
  }
}

export interface AccentConfig {
  name: string;
  text: string;
  border: string;
  borderHover: string;
  bg: string;
  bgSubtle: string;
  badgeBg: string;
  glow: string;
  hex: string;
}

const NATURAL_ACCENTS: Record<'sage' | 'terracotta' | 'ochre' | 'slate' | 'plum' | 'moss', AccentConfig> = {
  sage: {
    name: 'Forest Sage',
    text: 'text-[#3D6B56]',
    border: 'border-[#3D6B56]/40',
    borderHover: 'hover:border-[#3D6B56]/70',
    bg: 'bg-[#3D6B56] text-white',
    bgSubtle: 'bg-[#3D6B56]/12',
    badgeBg: 'bg-[#3D6B56]/12 text-[#2E5443] border-[#3D6B56]/30',
    glow: 'shadow-sm',
    hex: '#3D6B56',
  },
  terracotta: {
    name: 'Terracotta',
    text: 'text-[#B85D3B]',
    border: 'border-[#B85D3B]/40',
    borderHover: 'hover:border-[#B85D3B]/70',
    bg: 'bg-[#B85D3B] text-white',
    bgSubtle: 'bg-[#B85D3B]/12',
    badgeBg: 'bg-[#B85D3B]/12 text-[#94472B] border-[#B85D3B]/30',
    glow: 'shadow-sm',
    hex: '#B85D3B',
  },
  ochre: {
    name: 'Warm Ochre',
    text: 'text-[#B57B32]',
    border: 'border-[#B57B32]/40',
    borderHover: 'hover:border-[#B57B32]/70',
    bg: 'bg-[#B57B32] text-white',
    bgSubtle: 'bg-[#B57B32]/12',
    badgeBg: 'bg-[#B57B32]/12 text-[#8E5F22] border-[#B57B32]/30',
    glow: 'shadow-sm',
    hex: '#B57B32',
  },
  slate: {
    name: 'Sea Slate',
    text: 'text-[#3B6978]',
    border: 'border-[#3B6978]/40',
    borderHover: 'hover:border-[#3B6978]/70',
    bg: 'bg-[#3B6978] text-white',
    bgSubtle: 'bg-[#3B6978]/12',
    badgeBg: 'bg-[#3B6978]/12 text-[#2B505C] border-[#3B6978]/30',
    glow: 'shadow-sm',
    hex: '#3B6978',
  },
  plum: {
    name: 'Heather Plum',
    text: 'text-[#735B78]',
    border: 'border-[#735B78]/40',
    borderHover: 'hover:border-[#735B78]/70',
    bg: 'bg-[#735B78] text-white',
    bgSubtle: 'bg-[#735B78]/12',
    badgeBg: 'bg-[#735B78]/12 text-[#57435B] border-[#735B78]/30',
    glow: 'shadow-sm',
    hex: '#735B78',
  },
  moss: {
    name: 'Soft Moss',
    text: 'text-[#6D9B75]',
    border: 'border-[#6D9B75]/45',
    borderHover: 'hover:border-[#6D9B75]/75',
    bg: 'bg-[#5B8A63] text-white',
    bgSubtle: 'bg-[#6D9B75]/15',
    badgeBg: 'bg-[#6D9B75]/15 text-[#88B590] border-[#6D9B75]/35',
    glow: 'shadow-sm',
    hex: '#5B8A63',
  },
};

export const SELECTABLE_ACCENTS: Array<'sage' | 'terracotta' | 'ochre' | 'slate' | 'plum' | 'moss'> = [
  'sage',
  'terracotta',
  'ochre',
  'slate',
  'plum',
  'moss',
];

export const ACCENT_MAP: Record<AccentColor, AccentConfig> = {
  ...NATURAL_ACCENTS,
  cyan: NATURAL_ACCENTS.slate,
  emerald: NATURAL_ACCENTS.moss,
  amber: NATURAL_ACCENTS.ochre,
  violet: NATURAL_ACCENTS.plum,
  rose: NATURAL_ACCENTS.terracotta,
  sky: NATURAL_ACCENTS.slate,
  indigo: NATURAL_ACCENTS.plum,
  white: NATURAL_ACCENTS.sage,
};

export interface SurfacePalette {
  isDark: boolean;
  card: string;
  cardMuted: string;
  header: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  input: string;
  hoverBg: string;
  chipBg: string;
  modalBg: string;
}

export function getSurfacePalette(bgGradient: BackgroundGradientStyle): SurfacePalette {
  const darkTheme =
    bgGradient === 'warm-espresso' ||
    bgGradient === 'twilight-cedar' ||
    bgGradient === 'deep-solid' ||
    bgGradient === 'midnight-linear';

  if (darkTheme) {
    return {
      isDark: true,
      card: 'bg-[#2A2522] shadow-md',
      cardMuted: 'bg-[#231F1C]',
      header: 'bg-[#25211E]/95 backdrop-blur-sm',
      border: 'border-[#3E3732]',
      borderStrong: 'border-[#544B44]',
      text: 'text-[#F2EDE4]',
      textMuted: 'text-[#C2B8AC]',
      textSubtle: 'text-[#968C80]',
      input: 'bg-[#1E1A17] border-[#3E3732] text-[#F2EDE4] placeholder:text-[#847A6F]',
      hoverBg: 'hover:bg-[#352F2B]',
      chipBg: 'bg-[#332D29]',
      modalBg: 'bg-[#26221F]',
    };
  }

  return {
    isDark: false,
    card: 'bg-[#FFFFFF]/95 shadow-sm',
    cardMuted: 'bg-[#F8F5EE]',
    header: 'bg-[#FFFFFF]/90 backdrop-blur-sm',
    border: 'border-[#E6DFD3]',
    borderStrong: 'border-[#D5CCBC]',
    text: 'text-[#2B2723]',
    textMuted: 'text-[#5C554C]',
    textSubtle: 'text-[#847B70]',
    input: 'bg-[#FAF8F4] border-[#DED6C8] text-[#2B2723] placeholder:text-[#968D81]',
    hoverBg: 'hover:bg-[#F3EFE6]',
    chipBg: 'bg-[#F1ECE1]',
    modalBg: 'bg-[#FCFBF8]',
  };
}

export function getPanelRadiusClass(radius: CornerRadiusStyle = 'rounded'): string {
  switch (radius) {
    case 'subtle':
      return 'rounded-lg';
    case 'pillowy':
      return 'rounded-3xl';
    case 'rounded':
    default:
      return 'rounded-2xl';
  }
}

export function getWorkspaceGapClass(gap: PanelGapSize = 'cozy'): { container: string; inner: string } {
  switch (gap) {
    case 'tight':
      return { container: 'p-1.5 gap-1.5', inner: 'gap-1.5' };
    case 'airy':
      return { container: 'p-5 gap-5', inner: 'gap-5' };
    case 'cozy':
    default:
      return { container: 'p-3 sm:p-4 gap-3 sm:gap-4', inner: 'gap-3 sm:gap-4' };
  }
}

export function getBackgroundStyle(
  style: BackgroundGradientStyle,
  _accent: AccentColor
): React.CSSProperties {
  switch (style) {
    case 'sunlit-meadow':
      return {
        background:
          'radial-gradient(circle at 12% 18%, rgba(214, 180, 134, 0.18) 0%, transparent 48%), radial-gradient(circle at 88% 82%, rgba(184, 114, 84, 0.12) 0%, transparent 45%), #F6EFE6',
      };
    case 'coastal-breeze':
      return {
        background:
          'radial-gradient(circle at 15% 15%, rgba(133, 173, 181, 0.18) 0%, transparent 48%), radial-gradient(circle at 85% 85%, rgba(154, 186, 175, 0.16) 0%, transparent 45%), #EDF2F3',
      };
    case 'warm-espresso':
      return {
        background:
          'radial-gradient(circle at 20% 10%, rgba(109, 155, 117, 0.10) 0%, transparent 50%), linear-gradient(180deg, #211D1A 0%, #1B1815 100%)',
      };
    case 'twilight-cedar':
      return {
        background:
          'radial-gradient(circle at 80% 12%, rgba(209, 154, 83, 0.10) 0%, transparent 48%), linear-gradient(180deg, #1F2522 0%, #181D1A 100%)',
      };
    case 'warm-linen':
    default:
      return {
        background:
          'radial-gradient(circle at 15% 12%, rgba(138, 170, 148, 0.16) 0%, transparent 48%), radial-gradient(circle at 85% 88%, rgba(214, 186, 148, 0.15) 0%, transparent 48%), #F5F1E8',
      };
  }
}
