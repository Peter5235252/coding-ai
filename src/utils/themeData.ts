import React from 'react';
import {
  AccentColor,
  BackgroundGradientStyle,
  CornerRadiusStyle,
  EditorFontFamily,
  EditorSurfaceStyle,
  InterfaceCustomization,
  PanelGapSize,
  PanelId,
  SurfaceStyle,
  SyntaxTheme,
  UIFontFamily,
} from '../types';

export const THEME_STORAGE_KEY = 'zenith_interface_theme_v3';

export const DEFAULT_CUSTOMIZATION: InterfaceCustomization = {
  presetName: 'Sunlit Sage',
  accent: 'sage',
  customAccentHex: '#3D6B56',
  bgGradient: 'warm-linen',
  showAmbientGlow: true,
  surfaceStyle: 'crisp',
  editorSurface: 'matte-slate',
  syntaxTheme: 'warm-botanical',
  layoutPreset: 'standard-ide',
  reasoningLevel: 'medium',
  autoTiling: true,
  autoTilingAlgorithm: 'smart-bsp',
  lastSplitAlgorithm: 'smart-bsp',
  autoTilingDirection: 'auto',
  autoTilingMasterRatio: 56,
  autoTilingAutoRebalance: true,
  tabBarPlacement: 'top',
  tabBarDensity: 'rich',
  autoFocusTerminalOnRun: true,
  panelOrder: ['editor', 'terminal', 'tutor'],
  hiddenPanels: [],
  maximizedPanel: null,
  navPlacement: 'top',
  challengePlacement: 'top',
  splitRatioX: 58,
  splitRatioY: 62,
  panelGap: 'cozy',
  cornerRadius: 'rounded',
  panelHeaderStyle: 'detailed',
  uiFontFamily: 'jakarta',
  editorFontFamily: 'jetbrains',
  editorFontSize: 'md',
  editorLineHeight: 'comfortable',
  editorTabSize: 4,
  showLineNumbers: true,
  wordWrap: false,
  showStatusBar: true,
  motionIntensity: 'smooth',
  soundEnabled: true,
  soundVolume: 0.65,
  editorKeySounds: true,
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
  mode: 'Light' | 'Dark';
  description: string;
  accent: AccentColor;
  bgGradient: BackgroundGradientStyle;
  syntaxTheme: SyntaxTheme;
  editorSurface: EditorSurfaceStyle;
  previewBg: string;
  previewAccent: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'sunlit-sage',
    name: 'Sunlit Sage',
    mode: 'Light',
    description: 'Warm cream linen canvas with soft woodland sage accents.',
    accent: 'sage',
    bgGradient: 'warm-linen',
    syntaxTheme: 'warm-botanical',
    editorSurface: 'matte-slate',
    previewBg: 'bg-[#F5F1E8]',
    previewAccent: 'bg-[#3D6B56]',
  },
  {
    id: 'morning-oat',
    name: 'Morning Oat',
    mode: 'Light',
    description: 'Cozy toasted oat backdrop with warm terracotta clay.',
    accent: 'terracotta',
    bgGradient: 'sunlit-meadow',
    syntaxTheme: 'warm-amber',
    editorSurface: 'soft-espresso',
    previewBg: 'bg-[#F6EFE6]',
    previewAccent: 'bg-[#BA613E]',
  },
  {
    id: 'coastal-mist',
    name: 'Coastal Mist',
    mode: 'Light',
    description: 'Calm sea-glass morning mist with serene slate-blue tones.',
    accent: 'slate',
    bgGradient: 'coastal-breeze',
    syntaxTheme: 'coastal-calm',
    editorSurface: 'matte-slate',
    previewBg: 'bg-[#EDF2F3]',
    previewAccent: 'bg-[#3B6978]',
  },
  {
    id: 'meadow-blossom',
    name: 'Meadow Blossom',
    mode: 'Light',
    description: 'Soft lavender-chalk paper with dusty dusk rose accents.',
    accent: 'dusk',
    bgGradient: 'meadow-blossom',
    syntaxTheme: 'soft-pastel',
    editorSurface: 'warm-charcoal',
    previewBg: 'bg-[#F4F0F3]',
    previewAccent: 'bg-[#9E5B68]',
  },
  {
    id: 'warm-espresso',
    name: 'Warm Espresso',
    mode: 'Dark',
    description: 'Cozy dark roast evening study with soft sage highlights.',
    accent: 'moss',
    bgGradient: 'warm-espresso',
    syntaxTheme: 'warm-botanical',
    editorSurface: 'soft-espresso',
    previewBg: 'bg-[#221D1A]',
    previewAccent: 'bg-[#6F9B76]',
  },
  {
    id: 'twilight-cedar',
    name: 'Twilight Cedar',
    mode: 'Dark',
    description: 'Quiet forest dusk with warm golden ochre accents.',
    accent: 'ochre',
    bgGradient: 'twilight-cedar',
    syntaxTheme: 'warm-amber',
    editorSurface: 'matte-slate',
    previewBg: 'bg-[#1F2522]',
    previewAccent: 'bg-[#D19A53]',
  },
  {
    id: 'midnight-pine',
    name: 'Midnight Pine',
    mode: 'Dark',
    description: 'Deep evergreen slate study with muted olive foliage.',
    accent: 'olive',
    bgGradient: 'midnight-pine',
    syntaxTheme: 'nordic-moss',
    editorSurface: 'forest-ink',
    previewBg: 'bg-[#161F1C]',
    previewAccent: 'bg-[#7A8F5C]',
  },
  {
    id: 'starlit-slate',
    name: 'Starlit Slate',
    mode: 'Dark',
    description: 'Clean stone charcoal backdrop with heather plum accents.',
    accent: 'plum',
    bgGradient: 'starlit-slate',
    syntaxTheme: 'soft-pastel',
    editorSurface: 'warm-charcoal',
    previewBg: 'bg-[#1C1E22]',
    previewAccent: 'bg-[#9A7FA0]',
  },
];

function normalizeAccent(accent?: string): AccentColor {
  const valid: AccentColor[] = [
    'sage',
    'terracotta',
    'ochre',
    'slate',
    'plum',
    'moss',
    'olive',
    'dusk',
    'custom',
  ];
  if (accent && valid.includes(accent as AccentColor)) return accent as AccentColor;
  switch (accent) {
    case 'emerald':
      return 'moss';
    case 'amber':
      return 'ochre';
    case 'rose':
      return 'dusk';
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
    'meadow-blossom',
    'warm-espresso',
    'twilight-cedar',
    'midnight-pine',
    'starlit-slate',
  ];
  if (bg && valid.includes(bg as BackgroundGradientStyle)) {
    return bg as BackgroundGradientStyle;
  }
  return 'warm-linen';
}

function normalizePanelOrder(order?: unknown): PanelId[] {
  const base: PanelId[] = ['editor', 'terminal', 'tutor'];
  if (!Array.isArray(order) || order.length !== 3) return base;
  const filtered = order.filter(
    (item): item is PanelId => item === 'editor' || item === 'terminal' || item === 'tutor'
  );
  if (new Set(filtered).size !== 3) return base;
  return filtered;
}

function sanitizeHex(hex?: string): string {
  if (typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  return '#3D6B56';
}

export function normalizeCustomization(
  parsed: Partial<InterfaceCustomization> & Record<string, unknown>
): InterfaceCustomization {
  return {
    ...DEFAULT_CUSTOMIZATION,
    ...parsed,
    accent: normalizeAccent(typeof parsed.accent === 'string' ? parsed.accent : undefined),
    customAccentHex: sanitizeHex(
      typeof parsed.customAccentHex === 'string' ? parsed.customAccentHex : undefined
    ),
    bgGradient: normalizeBackground(
      typeof parsed.bgGradient === 'string' ? parsed.bgGradient : undefined
    ),
    showAmbientGlow:
      typeof parsed.showAmbientGlow === 'boolean' ? parsed.showAmbientGlow : true,
    surfaceStyle:
      parsed.surfaceStyle === 'tinted' || parsed.surfaceStyle === 'frosted'
        ? parsed.surfaceStyle
        : 'crisp',
    editorSurface:
      parsed.editorSurface === 'warm-charcoal' ||
      parsed.editorSurface === 'forest-ink' ||
      parsed.editorSurface === 'soft-espresso'
        ? parsed.editorSurface
        : 'matte-slate',
    panelHeaderStyle:
      parsed.panelHeaderStyle === 'compact' || parsed.panelHeaderStyle === 'minimal'
        ? parsed.panelHeaderStyle
        : 'detailed',
    uiFontFamily:
      parsed.uiFontFamily === 'dm-sans' ||
      parsed.uiFontFamily === 'serif' ||
      parsed.uiFontFamily === 'mono'
        ? parsed.uiFontFamily
        : 'jakarta',
    editorFontFamily:
      parsed.editorFontFamily === 'ibm-plex' ||
      parsed.editorFontFamily === 'fira' ||
      parsed.editorFontFamily === 'system'
        ? parsed.editorFontFamily
        : 'jetbrains',
    editorFontSize:
      parsed.editorFontSize === 'sm' ||
      parsed.editorFontSize === 'lg' ||
      parsed.editorFontSize === 'xl'
        ? parsed.editorFontSize
        : 'md',
    editorLineHeight:
      parsed.editorLineHeight === 'compact' || parsed.editorLineHeight === 'relaxed'
        ? parsed.editorLineHeight
        : 'comfortable',
    editorTabSize: parsed.editorTabSize === 2 ? 2 : 4,
    wordWrap: typeof parsed.wordWrap === 'boolean' ? parsed.wordWrap : false,
    showStatusBar: typeof parsed.showStatusBar === 'boolean' ? parsed.showStatusBar : true,
    motionIntensity:
      parsed.motionIntensity === 'snappy' || parsed.motionIntensity === 'reduced'
        ? parsed.motionIntensity
        : 'smooth',
    soundEnabled:
      typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
    soundVolume:
      typeof parsed.soundVolume === 'number'
        ? Math.min(1, Math.max(0.1, parsed.soundVolume))
        : 0.65,
    editorKeySounds:
      typeof parsed.editorKeySounds === 'boolean' ? parsed.editorKeySounds : true,
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
      parsed.autoTilingAlgorithm === 'equal-rows' ||
      parsed.autoTilingAlgorithm === 'stacked-windows' ||
      parsed.autoTilingAlgorithm === 'tabbed-windows' ||
      parsed.autoTilingAlgorithm === 'master-tabbed'
        ? parsed.autoTilingAlgorithm
        : 'smart-bsp',
    lastSplitAlgorithm:
      parsed.lastSplitAlgorithm === 'equal-columns' ||
      parsed.lastSplitAlgorithm === 'dwindle' ||
      parsed.lastSplitAlgorithm === 'equal-rows'
        ? parsed.lastSplitAlgorithm
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
      typeof parsed.autoTilingAutoRebalance === 'boolean'
        ? parsed.autoTilingAutoRebalance
        : true,
    tabBarPlacement: parsed.tabBarPlacement === 'bottom' ? 'bottom' : 'top',
    tabBarDensity: parsed.tabBarDensity === 'compact' ? 'compact' : 'rich',
    autoFocusTerminalOnRun:
      typeof parsed.autoFocusTerminalOnRun === 'boolean'
        ? parsed.autoFocusTerminalOnRun
        : true,
    splitRatioX:
      typeof parsed.splitRatioX === 'number'
        ? Math.min(78, Math.max(28, parsed.splitRatioX))
        : 58,
    splitRatioY:
      typeof parsed.splitRatioY === 'number'
        ? Math.min(80, Math.max(24, parsed.splitRatioY))
        : 62,
  };
}

export function loadCustomization(): InterfaceCustomization {
  try {
    const raw =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem('zenith_interface_theme_v2');
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    return normalizeCustomization(parsed);
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

const NATURAL_ACCENTS: Record<
  'sage' | 'terracotta' | 'ochre' | 'slate' | 'plum' | 'moss' | 'olive' | 'dusk',
  AccentConfig
> = {
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
  olive: {
    name: 'Cedar Olive',
    text: 'text-[#6E7F4F]',
    border: 'border-[#6E7F4F]/40',
    borderHover: 'hover:border-[#6E7F4F]/70',
    bg: 'bg-[#647546] text-white',
    bgSubtle: 'bg-[#6E7F4F]/14',
    badgeBg: 'bg-[#6E7F4F]/14 text-[#526138] border-[#6E7F4F]/35',
    glow: 'shadow-sm',
    hex: '#647546',
  },
  dusk: {
    name: 'Dusk Rose',
    text: 'text-[#9E5B68]',
    border: 'border-[#9E5B68]/40',
    borderHover: 'hover:border-[#9E5B68]/70',
    bg: 'bg-[#9E5B68] text-white',
    bgSubtle: 'bg-[#9E5B68]/12',
    badgeBg: 'bg-[#9E5B68]/12 text-[#7E444F] border-[#9E5B68]/30',
    glow: 'shadow-sm',
    hex: '#9E5B68',
  },
};

export const SELECTABLE_ACCENTS: Array<
  'sage' | 'terracotta' | 'ochre' | 'slate' | 'plum' | 'moss' | 'olive' | 'dusk'
> = ['sage', 'terracotta', 'ochre', 'slate', 'plum', 'moss', 'olive', 'dusk'];

const CUSTOM_ACCENT_VAR_CONF: AccentConfig = {
  name: 'Custom Color',
  text: 'text-[var(--zenith-accent-text)]',
  border: 'border-[var(--zenith-accent-border)]',
  borderHover: 'hover:border-[var(--zenith-accent)]',
  bg: 'bg-[var(--zenith-accent)] text-[var(--zenith-accent-fg)]',
  bgSubtle: 'bg-[var(--zenith-accent-subtle)]',
  badgeBg:
    'bg-[var(--zenith-accent-subtle)] text-[var(--zenith-accent-text)] border-[var(--zenith-accent-border)]',
  glow: 'shadow-sm',
  hex: '#3D6B56',
};

export const ACCENT_MAP: Record<AccentColor, AccentConfig> = {
  ...NATURAL_ACCENTS,
  custom: CUSTOM_ACCENT_VAR_CONF,
  cyan: NATURAL_ACCENTS.slate,
  emerald: NATURAL_ACCENTS.moss,
  amber: NATURAL_ACCENTS.ochre,
  violet: NATURAL_ACCENTS.plum,
  rose: NATURAL_ACCENTS.dusk,
  sky: NATURAL_ACCENTS.slate,
  indigo: NATURAL_ACCENTS.plum,
  white: NATURAL_ACCENTS.sage,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = sanitizeHex(hex).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  ratio: number
): string {
  const r = Math.round(a.r * (1 - ratio) + b.r * ratio);
  const g = Math.round(a.g * (1 - ratio) + b.g * ratio);
  const bl = Math.round(a.b * (1 - ratio) + b.b * ratio);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function resolveAccentCssVars(
  accent: AccentColor,
  customHex: string,
  isDark: boolean
): Record<string, string> {
  const baseHex =
    accent === 'custom'
      ? sanitizeHex(customHex)
      : (ACCENT_MAP[accent] || NATURAL_ACCENTS.sage).hex;
  const rgb = hexToRgb(baseHex);
  const lum = relativeLuminance(rgb);

  const fg = lum > 0.44 ? '#1C1917' : '#FFFFFF';

  let textColor = baseHex;
  if (isDark && lum < 0.28) {
    textColor = mixRgb(rgb, { r: 242, g: 237, b: 228 }, 0.45);
  } else if (!isDark && lum > 0.52) {
    textColor = mixRgb(rgb, { r: 30, g: 27, b: 24 }, 0.48);
  }

  return {
    '--zenith-accent': baseHex,
    '--zenith-accent-fg': fg,
    '--zenith-accent-text': textColor,
    '--zenith-accent-subtle': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.16 : 0.12})`,
    '--zenith-accent-border': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.42)`,
  };
}

export function getAccentConfig(accent: AccentColor, customHex?: string): AccentConfig {
  if (accent === 'custom') {
    return {
      ...CUSTOM_ACCENT_VAR_CONF,
      hex: sanitizeHex(customHex),
    };
  }
  return ACCENT_MAP[accent] || NATURAL_ACCENTS.sage;
}

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

export function isDarkBackground(bgGradient: BackgroundGradientStyle): boolean {
  return (
    bgGradient === 'warm-espresso' ||
    bgGradient === 'twilight-cedar' ||
    bgGradient === 'midnight-pine' ||
    bgGradient === 'starlit-slate' ||
    bgGradient === 'deep-solid' ||
    bgGradient === 'midnight-linear'
  );
}

export function getSurfacePalette(
  bgGradient: BackgroundGradientStyle,
  surfaceStyle: SurfaceStyle = 'crisp'
): SurfacePalette {
  const darkTheme = isDarkBackground(bgGradient);

  if (darkTheme) {
    const isPine = bgGradient === 'midnight-pine';
    const isSlate = bgGradient === 'starlit-slate';
    const cardBg =
      surfaceStyle === 'frosted'
        ? isPine
          ? 'bg-[#1D2723]/82 backdrop-blur-md shadow-md'
          : isSlate
          ? 'bg-[#24272D]/82 backdrop-blur-md shadow-md'
          : 'bg-[#2A2522]/82 backdrop-blur-md shadow-md'
        : surfaceStyle === 'tinted'
        ? isPine
          ? 'bg-[#1E2A25] shadow-md'
          : isSlate
          ? 'bg-[#25282E] shadow-md'
          : 'bg-[#2E2824] shadow-md'
        : isPine
        ? 'bg-[#1B2421] shadow-md'
        : isSlate
        ? 'bg-[#22252A] shadow-md'
        : 'bg-[#2A2522] shadow-md';

    return {
      isDark: true,
      card: cardBg,
      cardMuted: isPine ? 'bg-[#161E1B]' : isSlate ? 'bg-[#1D2024]' : 'bg-[#231F1C]',
      header: isPine
        ? 'bg-[#18201D]/92 backdrop-blur-sm'
        : isSlate
        ? 'bg-[#1F2227]/92 backdrop-blur-sm'
        : 'bg-[#25211E]/92 backdrop-blur-sm',
      border: isPine
        ? 'border-[#2D3B35]'
        : isSlate
        ? 'border-[#353942]'
        : 'border-[#3E3732]',
      borderStrong: isPine
        ? 'border-[#3E5149]'
        : isSlate
        ? 'border-[#4A505C]'
        : 'border-[#544B44]',
      text: 'text-[#F2EDE4]',
      textMuted: 'text-[#C2B8AC]',
      textSubtle: 'text-[#968C80]',
      input: isPine
        ? 'bg-[#141B18] border-[#2D3B35] text-[#F2EDE4] placeholder:text-[#847A6F]'
        : isSlate
        ? 'bg-[#1A1C20] border-[#353942] text-[#F2EDE4] placeholder:text-[#847A6F]'
        : 'bg-[#1E1A17] border-[#3E3732] text-[#F2EDE4] placeholder:text-[#847A6F]',
      hoverBg: isPine
        ? 'hover:bg-[#26332D]'
        : isSlate
        ? 'hover:bg-[#2D3138]'
        : 'hover:bg-[#352F2B]',
      chipBg: isPine ? 'bg-[#26332E]' : isSlate ? 'bg-[#2D3037]' : 'bg-[#332D29]',
      modalBg: isPine ? 'bg-[#19221F]' : isSlate ? 'bg-[#202328]' : 'bg-[#26221F]',
    };
  }

  const isBlossom = bgGradient === 'meadow-blossom';
  const isCoastal = bgGradient === 'coastal-breeze';
  const cardBg =
    surfaceStyle === 'frosted'
      ? 'bg-white/75 backdrop-blur-md shadow-sm'
      : surfaceStyle === 'tinted'
      ? isBlossom
        ? 'bg-[#FAF6F8]/95 shadow-sm'
        : isCoastal
        ? 'bg-[#F5F9FA]/95 shadow-sm'
        : 'bg-[#FBF8F1]/95 shadow-sm'
      : 'bg-[#FFFFFF]/96 shadow-sm';

  return {
    isDark: false,
    card: cardBg,
    cardMuted: isBlossom ? 'bg-[#F5EFF3]' : isCoastal ? 'bg-[#EFF4F5]' : 'bg-[#F8F5EE]',
    header: 'bg-[#FFFFFF]/90 backdrop-blur-sm',
    border: isBlossom
      ? 'border-[#E6DCE3]'
      : isCoastal
      ? 'border-[#DCE5E7]'
      : 'border-[#E6DFD3]',
    borderStrong: isBlossom
      ? 'border-[#D5C6D0]'
      : isCoastal
      ? 'border-[#C7D5D8]'
      : 'border-[#D5CCBC]',
    text: 'text-[#2B2723]',
    textMuted: 'text-[#5C554C]',
    textSubtle: 'text-[#847B70]',
    input: isBlossom
      ? 'bg-[#F9F5F7] border-[#E0D4DC] text-[#2B2723] placeholder:text-[#968D81]'
      : isCoastal
      ? 'bg-[#F4F8F9] border-[#D4DFE2] text-[#2B2723] placeholder:text-[#968D81]'
      : 'bg-[#FAF8F4] border-[#DED6C8] text-[#2B2723] placeholder:text-[#968D81]',
    hoverBg: isBlossom
      ? 'hover:bg-[#EFE7EC]'
      : isCoastal
      ? 'hover:bg-[#E7EFF1]'
      : 'hover:bg-[#F3EFE6]',
    chipBg: isBlossom ? 'bg-[#EFE8ED]' : isCoastal ? 'bg-[#E8EFF1]' : 'bg-[#F1ECE1]',
    modalBg: isBlossom ? 'bg-[#FDFBFC]' : isCoastal ? 'bg-[#FAFDFD]' : 'bg-[#FCFBF8]',
  };
}

export function getPanelRadiusClass(radius: CornerRadiusStyle = 'rounded'): string {
  switch (radius) {
    case 'sharp':
      return 'rounded-sm';
    case 'subtle':
      return 'rounded-lg';
    case 'pillowy':
      return 'rounded-3xl';
    case 'rounded':
    default:
      return 'rounded-2xl';
  }
}

export function getWorkspaceGapClass(
  gap: PanelGapSize = 'cozy'
): { container: string; inner: string } {
  switch (gap) {
    case 'none':
      return { container: 'p-1 gap-0.5', inner: 'gap-0.5' };
    case 'tight':
      return { container: 'p-1.5 gap-1.5', inner: 'gap-1.5' };
    case 'airy':
      return { container: 'p-5 gap-5', inner: 'gap-5' };
    case 'cozy':
    default:
      return { container: 'p-3 sm:p-4 gap-3 sm:gap-4', inner: 'gap-3 sm:gap-4' };
  }
}

export function getEditorSurfaceColors(editorSurface: EditorSurfaceStyle = 'matte-slate'): {
  bg: string;
  gutterBg: string;
  border: string;
} {
  switch (editorSurface) {
    case 'warm-charcoal':
      return { bg: '#202124', gutterBg: '#1B1C1F', border: '#313338' };
    case 'forest-ink':
      return { bg: '#19221E', gutterBg: '#141C19', border: '#2A3731' };
    case 'soft-espresso':
      return { bg: '#231D1A', gutterBg: '#1D1815', border: '#382F2B' };
    case 'matte-slate':
    default:
      return { bg: '#212422', gutterBg: '#1C1F1D', border: '#2E3330' };
  }
}

export function getFontFamilyStrings(
  uiFont: UIFontFamily = 'jakarta',
  editorFont: EditorFontFamily = 'jetbrains'
): { ui: string; mono: string } {
  const ui =
    uiFont === 'dm-sans'
      ? "'DM Sans', system-ui, -apple-system, sans-serif"
      : uiFont === 'serif'
      ? "'Lora', Georgia, Cambria, serif"
      : uiFont === 'mono'
      ? "'JetBrains Mono', ui-monospace, monospace"
      : "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

  const mono =
    editorFont === 'ibm-plex'
      ? "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace"
      : editorFont === 'fira'
      ? "'Fira Code', ui-monospace, SFMono-Regular, monospace"
      : editorFont === 'system'
      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      : "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

  return { ui, mono };
}

export function getBackgroundStyle(
  style: BackgroundGradientStyle,
  _accent: AccentColor,
  showAmbientGlow = true
): React.CSSProperties {
  if (!showAmbientGlow) {
    switch (style) {
      case 'sunlit-meadow':
        return { background: '#F6EFE6' };
      case 'coastal-breeze':
        return { background: '#EDF2F3' };
      case 'meadow-blossom':
        return { background: '#F4EFF2' };
      case 'warm-espresso':
        return { background: '#1E1A17' };
      case 'twilight-cedar':
        return { background: '#1B211E' };
      case 'midnight-pine':
        return { background: '#151D1A' };
      case 'starlit-slate':
        return { background: '#1B1D21' };
      case 'warm-linen':
      default:
        return { background: '#F5F1E8' };
    }
  }

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
    case 'meadow-blossom':
      return {
        background:
          'radial-gradient(circle at 18% 15%, rgba(190, 146, 166, 0.16) 0%, transparent 48%), radial-gradient(circle at 85% 82%, rgba(168, 176, 198, 0.15) 0%, transparent 46%), #F4EFF2',
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
    case 'midnight-pine':
      return {
        background:
          'radial-gradient(circle at 22% 14%, rgba(122, 143, 92, 0.12) 0%, transparent 48%), linear-gradient(180deg, #18221E 0%, #131A17 100%)',
      };
    case 'starlit-slate':
      return {
        background:
          'radial-gradient(circle at 78% 18%, rgba(154, 127, 160, 0.11) 0%, transparent 48%), linear-gradient(180deg, #202329 0%, #181A1F 100%)',
      };
    case 'warm-linen':
    default:
      return {
        background:
          'radial-gradient(circle at 15% 12%, rgba(138, 170, 148, 0.16) 0%, transparent 48%), radial-gradient(circle at 85% 88%, rgba(214, 186, 148, 0.15) 0%, transparent 48%), #F5F1E8',
      };
  }
}
