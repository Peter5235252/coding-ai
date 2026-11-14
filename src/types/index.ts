export type SupportedLanguage = 'rust' | 'c' | 'cpp' | 'go' | 'lua' | 'luau' | 'python' | 'gdscript' | 'javascript' | 'java' | 'csharp';

export type ExperienceLevel =
  | 'absolute_beginner'
  | 'started_before'
  | 'intermediate'
  | 'experienced_systems';

export interface UserProfile {
  name: string;
  level: ExperienceLevel;
  priorLanguages: string[];
  primaryGoal: 'game_dev' | 'systems' | 'embedded_algorithms' | 'general_mastery';
  learningPace: 'socratic_inquiry' | 'hands_on_challenges' | 'balanced';
  activeLanguage: SupportedLanguage;
  enabledLanguages: SupportedLanguage[];
  isOnboarded: boolean;
  createdAt: string;
}

export interface LanguageSkillStat {
  xp: number;
  level: number;
  challengesCompleted: number;
  accuracy: number;
  skills: {
    syntax: number; // 0 - 100
    memory: number; // 0 - 100
    controlFlow: number; // 0 - 100
    idioms: number; // 0 - 100
    architecture: number; // 0 - 100
  };
}

export interface ProgressState {
  overallXP: number;
  overallLevel: number;
  streakDays: number;
  lastActiveDate: string;
  completedLessons: string[];
  completedChallenges: string[];
  unlockedAchievements: string[];
  languageStats: Record<SupportedLanguage, LanguageSkillStat>;
}

export interface CurriculumLesson {
  id: string;
  language: SupportedLanguage;
  tier: 'foundation' | 'memory_and_types' | 'idiomatic_patterns' | 'advanced_systems';
  title: string;
  description: string;
  summary?: string;
  theory: string[];
  probingQuestion: string;
  starterCode: string;
  solutionHint: string;
  verificationRule: {
    mustContain?: string[];
    description: string;
    expectedOutputSample?: string;
  };
  xpReward: number;
}

export interface AdaptiveChallenge {
  id: string;
  title: string;
  language: SupportedLanguage;
  difficulty: string;
  description: string;
  concepts: string[];
  starterCode: string;
  testCases: Array<{
    description: string;
    sampleInput: string;
    expectedOutput: string;
  }>;
  probingPrompt: string;
  xpReward: number;
}

export interface GeminiApiErrorInfo {
  code?: number;
  status?: string;
  message: string;
}

export interface SocraticAnalysis {
  analysis: string;
  probingQuestions: string[];
  conceptHighlight: string;
  issuesDetected: string[];
  hints: string[];
  isOfflineFallback?: boolean;
  apiError?: GeminiApiErrorInfo;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  probingQuestion?: string;
  timestamp: string;
  apiError?: GeminiApiErrorInfo;
}

export interface HydrogenCodeEdit {
  id: string;
  title: string;
  reason: string;
  severity: 'error' | 'edge_case' | 'nuance';
  lineStart: number;
  lineEnd: number;
  targetSnippet: string;
  replacementSnippet: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface HydrogenReviewResult {
  bullets: string[];
  edits: HydrogenCodeEdit[];
  reviewedAt: string;
  sourceCodeSnapshot: string;
  apiError?: GeminiApiErrorInfo;
}

export interface AutocompleteItem {
  label: string;
  insertText: string;
  type: 'keyword' | 'type' | 'function' | 'snippet' | 'constant';
  detail: string;
  documentation?: string;
}

export type AccentColor =
  | 'sage'
  | 'terracotta'
  | 'ochre'
  | 'slate'
  | 'plum'
  | 'moss'
  | 'olive'
  | 'dusk'
  | 'custom'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'rose'
  | 'sky'
  | 'indigo'
  | 'white';

export type BackgroundGradientStyle =
  | 'warm-linen'
  | 'sunlit-meadow'
  | 'coastal-breeze'
  | 'meadow-blossom'
  | 'warm-espresso'
  | 'twilight-cedar'
  | 'midnight-pine'
  | 'starlit-slate'
  | 'deep-solid'
  | 'ambient-radial'
  | 'midnight-linear'
  | 'aurora-mesh';

export type SyntaxTheme =
  | 'warm-botanical'
  | 'soft-pastel'
  | 'warm-amber'
  | 'coastal-calm'
  | 'nordic-moss'
  | 'ink-mono'
  | 'polyglot-vibrant'
  | 'pastel-soft'
  | 'monochrome-titanium'
  | 'amber-terminal';

export type LayoutPreset =
  | 'standard-ide'
  | 'inverted-studio'
  | 'side-by-side'
  | 'wide-theater'
  | 'bottom-editor'
  | 'stacked-horizontal'
  | 'focus-mode';

export type PanelId = 'editor' | 'terminal' | 'tutor';
export type NavPlacement = 'top' | 'bottom' | 'left' | 'right';
export type ChallengePlacement = 'top' | 'bottom' | 'hidden';
export type PanelGapSize = 'none' | 'tight' | 'cozy' | 'airy';
export type CornerRadiusStyle = 'sharp' | 'subtle' | 'rounded' | 'pillowy';
export type EditorFontSize = 'sm' | 'md' | 'lg' | 'xl';
export type EditorLineHeight = 'compact' | 'comfortable' | 'relaxed';
export type UIFontFamily = 'jakarta' | 'dm-sans' | 'serif' | 'mono';
export type EditorFontFamily = 'jetbrains' | 'ibm-plex' | 'fira' | 'system';
export type SurfaceStyle = 'crisp' | 'tinted' | 'frosted';
export type EditorSurfaceStyle = 'matte-slate' | 'warm-charcoal' | 'forest-ink' | 'soft-espresso';
export type PanelHeaderStyle = 'detailed' | 'compact' | 'minimal';
export type MotionIntensity = 'smooth' | 'snappy' | 'reduced';

export type ReasoningLevel = 'low' | 'medium' | 'high' | 'xhigh';

export type AutoTilingAlgorithm =
  | 'smart-bsp'
  | 'equal-columns'
  | 'dwindle'
  | 'equal-rows'
  | 'stacked-windows'
  | 'tabbed-windows'
  | 'master-tabbed';
export type AutoTilingDirection = 'auto' | 'horizontal' | 'vertical';
export type TabBarPlacement = 'top' | 'bottom';
export type TabBarDensity = 'compact' | 'rich';

export interface InterfaceCustomization {
  presetName: string;
  accent: AccentColor;
  customAccentHex: string;
  bgGradient: BackgroundGradientStyle;
  showAmbientGlow: boolean;
  surfaceStyle: SurfaceStyle;
  editorSurface: EditorSurfaceStyle;
  syntaxTheme: SyntaxTheme;
  layoutPreset: LayoutPreset;
  reasoningLevel: ReasoningLevel;
  autoTiling: boolean;
  autoTilingAlgorithm: AutoTilingAlgorithm;
  lastSplitAlgorithm: 'smart-bsp' | 'equal-columns' | 'dwindle' | 'equal-rows';
  autoTilingDirection: AutoTilingDirection;
  autoTilingMasterRatio: number; // 40 - 70 (% master tile)
  autoTilingAutoRebalance: boolean;
  tabBarPlacement: TabBarPlacement;
  tabBarDensity: TabBarDensity;
  autoFocusTerminalOnRun: boolean;
  panelOrder: PanelId[];
  hiddenPanels: PanelId[];
  maximizedPanel: PanelId | null;
  navPlacement: NavPlacement;
  challengePlacement: ChallengePlacement;
  splitRatioX: number; // 30 - 75 (% for primary group)
  splitRatioY: number; // 25 - 80 (% for top stacked panel)
  panelGap: PanelGapSize;
  cornerRadius: CornerRadiusStyle;
  panelHeaderStyle: PanelHeaderStyle;
  uiFontFamily: UIFontFamily;
  editorFontFamily: EditorFontFamily;
  editorFontSize: EditorFontSize;
  editorLineHeight: EditorLineHeight;
  editorTabSize: 2 | 4;
  showLineNumbers: boolean;
  wordWrap: boolean;
  showStatusBar: boolean;
  motionIntensity: MotionIntensity;
  soundEnabled: boolean;
  soundVolume: number; // 0.1 - 1.0
  editorKeySounds: boolean;
  panelPositions: {
    editor: number;
    tutor: number;
    terminal: number;
  };
  terminalPlacement: 'bottom' | 'right' | 'drawer';
  fontSize: 'compact' | 'medium' | 'spacious';
  fontFamily: 'monospace' | 'fira' | 'jetbrains';
  glassmorphism: boolean;
  borderGlow: boolean;
}
