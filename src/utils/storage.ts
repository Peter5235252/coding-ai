import { ExperienceLevel, ProgressState, SupportedLanguage, UserProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'zenith_profile_v1',
  PROGRESS: 'zenith_progress_v1',
  SAVED_CODE: 'zenith_code_cache_v1',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Learner',
  level: 'started_before',
  priorLanguages: [],
  primaryGoal: 'systems',
  learningPace: 'socratic_inquiry',
  activeLanguage: 'rust',
  enabledLanguages: ['rust', 'c', 'cpp', 'go', 'lua', 'luau', 'python', 'gdscript', 'javascript', 'java', 'csharp'],
  isOnboarded: false,
  createdAt: new Date().toISOString(),
};

const DEFAULT_SKILL_STAT = {
  xp: 0,
  level: 1,
  challengesCompleted: 0,
  accuracy: 100,
  skills: {
    syntax: 10,
    memory: 5,
    controlFlow: 10,
    idioms: 5,
    architecture: 5,
  },
};

const DEFAULT_PROGRESS: ProgressState = {
  overallXP: 0,
  overallLevel: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessons: [],
  completedChallenges: [],
  unlockedAchievements: [],
  languageStats: {
    rust: { ...DEFAULT_SKILL_STAT },
    c: { ...DEFAULT_SKILL_STAT },
    cpp: { ...DEFAULT_SKILL_STAT },
    lua: { ...DEFAULT_SKILL_STAT },
    luau: { ...DEFAULT_SKILL_STAT },
    python: { ...DEFAULT_SKILL_STAT },
    gdscript: { ...DEFAULT_SKILL_STAT },
    javascript: { ...DEFAULT_SKILL_STAT },
    java: { ...DEFAULT_SKILL_STAT },
    go: { ...DEFAULT_SKILL_STAT },
    csharp: { ...DEFAULT_SKILL_STAT },
  },
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading profile from localStorage', err);
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving profile to localStorage', err);
  }
}

export function loadProgressState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];

    // Compute streak
    let streak = parsed.streakDays || 1;
    if (parsed.lastActiveDate) {
      const last = new Date(parsed.lastActiveDate);
      const curr = new Date(today);
      const diffDays = Math.floor((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
    }

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      streakDays: streak,
      lastActiveDate: today,
      languageStats: {
        ...DEFAULT_PROGRESS.languageStats,
        ...(parsed.languageStats || {}),
      },
    };
  } catch (err) {
    console.error('Error loading progress from localStorage', err);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgressState(progress: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (err) {
    console.error('Error saving progress to localStorage', err);
  }
}

export function awardXP(
  language: SupportedLanguage,
  amount: number,
  challengeId?: string,
  lessonId?: string
): ProgressState {
  const current = loadProgressState();
  const langStat = current.languageStats[language] || { ...DEFAULT_SKILL_STAT };

  const newLangXP = langStat.xp + amount;
  const newLangLevel = Math.max(1, Math.floor(Math.sqrt(newLangXP / 40)) + 1);

  // Boost individual skills
  const skills = { ...langStat.skills };
  skills.syntax = Math.min(100, skills.syntax + Math.floor(amount / 15));
  skills.memory = Math.min(100, skills.memory + Math.floor(amount / 20));
  skills.controlFlow = Math.min(100, skills.controlFlow + Math.floor(amount / 20));
  skills.idioms = Math.min(100, skills.idioms + Math.floor(amount / 18));
  skills.architecture = Math.min(100, skills.architecture + Math.floor(amount / 25));

  const newOverallXP = current.overallXP + amount;
  const newOverallLevel = Math.max(1, Math.floor(Math.sqrt(newOverallXP / 60)) + 1);

  const completedChallenges = challengeId && !current.completedChallenges.includes(challengeId)
    ? [...current.completedChallenges, challengeId]
    : current.completedChallenges;

  const completedLessons = lessonId && !current.completedLessons.includes(lessonId)
    ? [...current.completedLessons, lessonId]
    : current.completedLessons;

  // Check achievements
  const unlocked = [...current.unlockedAchievements];
  if (newOverallXP >= 100 && !unlocked.includes('first_century')) {
    unlocked.push('first_century');
  }
  if (completedChallenges.length >= 3 && !unlocked.includes('challenger_initiate')) {
    unlocked.push('challenger_initiate');
  }
  if (newLangLevel >= 3 && !unlocked.includes(`level3_${language}`)) {
    unlocked.push(`level3_${language}`);
  }

  const updated: ProgressState = {
    ...current,
    overallXP: newOverallXP,
    overallLevel: newOverallLevel,
    completedChallenges,
    completedLessons,
    unlockedAchievements: unlocked,
    languageStats: {
      ...current.languageStats,
      [language]: {
        ...langStat,
        xp: newLangXP,
        level: newLangLevel,
        challengesCompleted: challengeId ? langStat.challengesCompleted + 1 : langStat.challengesCompleted,
        skills,
      },
    },
  };

  saveProgressState(updated);
  return updated;
}

export function saveCodeCache(language: SupportedLanguage, code: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_CODE);
    const map = raw ? JSON.parse(raw) : {};
    map[language] = code;
    localStorage.setItem(STORAGE_KEYS.SAVED_CODE, JSON.stringify(map));
  } catch (err) {
    console.error('Error saving code cache', err);
  }
}

export function loadCodeCache(language: SupportedLanguage): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_CODE);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[language] || null;
  } catch (err) {
    return null;
  }
}

export function getMasteryTitle(level: number): string {
  if (level <= 1) return 'Initiate Observer';
  if (level <= 2) return 'Apprentice Syntaxist';
  if (level <= 4) return 'Practitioner Craftsman';
  if (level <= 6) return 'Systems Architect';
  if (level <= 8) return 'Memory Strategist';
  return 'Kernel Sage';
}
