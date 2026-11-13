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

export interface SocraticAnalysis {
  analysis: string;
  probingQuestions: string[];
  conceptHighlight: string;
  issuesDetected: string[];
  hints: string[];
  isOfflineFallback?: boolean;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  probingQuestion?: string;
  timestamp: string;
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
  | 'warm-espresso'
  | 'twilight-cedar'
  | 'deep-solid'
  | 'ambient-radial'
  | 'midnight-linear'
  | 'aurora-mesh';

export type SyntaxTheme =
  | 'warm-botanical'
  | 'soft-pastel'
  | 'warm-amber'
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
export type PanelGapSize = 'tight' | 'cozy' | 'airy';
export type CornerRadiusStyle = 'subtle' | 'rounded' | 'pillowy';
export type EditorFontSize = 'sm' | 'md' | 'lg';

export type ReasoningLevel = 'low' | 'medium' | 'high' | 'xhigh';

export type AutoTilingAlgorithm = 'smart-bsp' | 'equal-columns' | 'dwindle' | 'equal-rows';
export type AutoTilingDirection = 'auto' | 'horizontal' | 'vertical';

export interface InterfaceCustomization {
  presetName: string;
  accent: AccentColor;
  bgGradient: BackgroundGradientStyle;
  syntaxTheme: SyntaxTheme;
  layoutPreset: LayoutPreset;
  reasoningLevel: ReasoningLevel;
  autoTiling: boolean;
  autoTilingAlgorithm: AutoTilingAlgorithm;
  autoTilingDirection: AutoTilingDirection;
  autoTilingMasterRatio: number; // 40 - 70 (% master tile)
  autoTilingAutoRebalance: boolean;
  panelOrder: PanelId[];
  hiddenPanels: PanelId[];
  maximizedPanel: PanelId | null;
  navPlacement: NavPlacement;
  challengePlacement: ChallengePlacement;
  splitRatioX: number; // 30 - 75 (% for primary group)
  splitRatioY: number; // 25 - 80 (% for top stacked panel)
  panelGap: PanelGapSize;
  cornerRadius: CornerRadiusStyle;
  editorFontSize: EditorFontSize;
  showLineNumbers: boolean;
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
