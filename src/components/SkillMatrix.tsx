import React from 'react';
import { AccentColor, BackgroundGradientStyle, ProgressState, SupportedLanguage, UserProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languageData';
import { getMasteryTitle } from '../utils/storage';
import { ACCENT_MAP, getSurfacePalette } from '../utils/themeData';
import { Award, Flame, CheckCircle2, BarChart3, Target, X } from 'lucide-react';

interface SkillMatrixProps {
  progress: ProgressState;
  profile: UserProfile;
  activeLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onClose?: () => void;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
}

export const SkillMatrix: React.FC<SkillMatrixProps> = ({
  progress,
  profile,
  activeLanguage,
  onSelectLanguage,
  onClose,
  accent = 'sage',
  bgGradient = 'warm-linen',
}) => {
  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);

  const currentLangStat = progress.languageStats[activeLanguage] || {
    xp: 0,
    level: 1,
    challengesCompleted: 0,
    accuracy: 100,
    skills: { syntax: 10, memory: 5, controlFlow: 10, idioms: 5, architecture: 5 },
  };

  const masteryTitle = getMasteryTitle(progress.overallLevel);

  const ACHIEVEMENTS = [
    {
      id: 'first_step',
      title: 'Getting Started',
      desc: 'Completed your learning profile and chose a starting language.',
      unlocked: profile.isOnboarded,
    },
    {
      id: 'first_century',
      title: '100 XP Milestone',
      desc: 'Earned 100+ total XP across coding exercises.',
      unlocked: progress.overallXP >= 100,
    },
    {
      id: 'challenger_initiate',
      title: 'Curious Problem Solver',
      desc: 'Completed 3+ lessons or custom challenges.',
      unlocked: progress.completedChallenges.length >= 3,
    },
    {
      id: 'streak_master',
      title: 'Steady Rhythm',
      desc: 'Practiced across multiple days in a row.',
      unlocked: progress.streakDays >= 2,
    },
    {
      id: 'polyglot',
      title: 'Multi-Language Explorer',
      desc: 'Practiced and earned XP in two or more languages.',
      unlocked: Object.values(progress.languageStats).filter((s) => s.xp > 30).length >= 2,
    },
  ];

  return (
    <div className={`flex flex-col h-full ${surface.modalBg} ${surface.text} font-sans text-xs overflow-y-auto p-6 space-y-6`}>
      {/* Top Profile Summary Card */}
      <div className={`p-5 rounded-2xl border ${surface.border} ${surface.cardMuted} space-y-4`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`text-[11px] font-semibold ${accentConf.text} block mb-0.5`}>
              Learning Journey
            </span>
            <h2 className={`text-lg font-bold ${surface.text}`}>{profile.name}</h2>
            <p className={`text-xs ${surface.textMuted}`}>{masteryTitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className={`px-3 py-1.5 rounded-xl border ${surface.border} ${surface.card} flex items-center gap-1.5 ${surface.text}`}>
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">{progress.streakDays}d Streak</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl ${accentConf.bg} font-semibold`}>
              Level {progress.overallLevel}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`p-2 rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Smooth Rounded XP Progress Bar */}
        <div className="space-y-1.5">
          <div className={`flex items-center justify-between text-xs ${surface.textMuted}`}>
            <span>Overall Progress</span>
            <span className="font-semibold tabular-nums">{progress.overallXP} Total XP</span>
          </div>
          <div className={`w-full h-2.5 rounded-full ${surface.chipBg} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${accentConf.bg} zenith-progress-fill`}
              style={{ width: `${Math.max(6, Math.min(100, (progress.overallXP % 60) * 1.66))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Language Selector Grid */}
      <div className="space-y-2.5">
        <span className={`text-xs font-semibold ${surface.text} block`}>
          Progress by Language
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((lang, idx) => {
            const stat = progress.languageStats[lang] || { xp: 0, level: 1 };
            const isSelected = activeLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onSelectLanguage(lang)}
                style={{ animationDelay: `${Math.min(idx, 10) * 28}ms` }}
                className={`zenith-item-reveal zenith-card-hover p-3 text-left rounded-2xl border ${
                  isSelected
                    ? `${accentConf.bgSubtle} ${accentConf.border} shadow-xs`
                    : `${surface.card} ${surface.border} ${surface.hoverBg}`
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-xs ${surface.text}`}>
                    {SUPPORTED_LANGUAGES[lang].name}
                  </span>
                  <span className={`text-[11px] font-medium ${isSelected ? accentConf.text : surface.textSubtle}`}>
                    Lvl {stat.level}
                  </span>
                </div>
                <div className={`text-[11px] ${surface.textMuted} tabular-nums`}>{stat.xp} XP</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Core Competency Bars for Active Language */}
      <div className={`space-y-3.5 p-5 rounded-2xl border ${surface.border} ${surface.card}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
            <BarChart3 className={`w-4 h-4 ${accentConf.text}`} />
            {SUPPORTED_LANGUAGES[activeLanguage]?.name} Skills
          </span>
          <span className={`text-xs ${surface.textSubtle}`}>
            {currentLangStat.challengesCompleted} completed
          </span>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Syntax & Structure', value: currentLangStat.skills.syntax },
            { label: 'Memory & Lifecycles', value: currentLangStat.skills.memory },
            { label: 'Logic & Control Flow', value: currentLangStat.skills.controlFlow },
            { label: 'Idiomatic Patterns', value: currentLangStat.skills.idioms },
            { label: 'Program Design', value: currentLangStat.skills.architecture },
          ].map((skill, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={surface.textMuted}>{skill.label}</span>
                <span className={`font-medium tabular-nums ${surface.text}`}>{skill.value}%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${surface.chipBg} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${accentConf.bg} zenith-progress-fill`}
                  style={{ width: `${Math.min(100, skill.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Friendly Milestones */}
      <div className="space-y-2.5">
        <span className={`text-xs font-semibold ${surface.text} flex items-center gap-2`}>
          <Award className={`w-4 h-4 ${accentConf.text}`} />
          Milestones ({ACHIEVEMENTS.filter((a) => a.unlocked).length} of {ACHIEVEMENTS.length})
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((ach, idx) => (
            <div
              key={ach.id}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`zenith-item-reveal zenith-card-hover p-3.5 rounded-2xl border flex items-start gap-3 ${
                ach.unlocked
                  ? `${surface.card} ${surface.border}`
                  : `${surface.cardMuted} ${surface.border} opacity-60`
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {ach.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Target className={`w-4 h-4 ${surface.textSubtle}`} />
                )}
              </div>
              <div>
                <span className={`font-semibold block text-xs ${surface.text}`}>{ach.title}</span>
                <p className={`text-[11px] ${surface.textMuted} leading-relaxed mt-0.5`}>{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
