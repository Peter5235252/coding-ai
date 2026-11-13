import React, { useState } from 'react';
import { AccentColor, BackgroundGradientStyle, ExperienceLevel, SupportedLanguage, UserProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languageData';
import { ACCENT_MAP, getSurfacePalette } from '../utils/themeData';
import { Check, ChevronRight, ChevronLeft, Compass, Shield, Cpu, Code2, Sparkles, X } from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onClose?: () => void;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  isOpen,
  onComplete,
  onClose,
  accent = 'sage',
  bgGradient = 'warm-linen',
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialProfile.name || 'Friend');
  const [level, setLevel] = useState<ExperienceLevel>(initialProfile.level || 'started_before');
  const [priorLanguages, setPriorLanguages] = useState<string[]>(initialProfile.priorLanguages || []);
  const [primaryGoal, setPrimaryGoal] = useState<UserProfile['primaryGoal']>(initialProfile.primaryGoal || 'systems');
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(initialProfile.activeLanguage || 'rust');
  const [learningPace, setLearningPace] = useState<UserProfile['learningPace']>(initialProfile.learningPace || 'socratic_inquiry');

  if (!isOpen) return null;

  const totalSteps = 4;
  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);

  const togglePriorLang = (lang: string) => {
    if (lang === 'None yet') {
      setPriorLanguages(priorLanguages.includes('None yet') ? [] : ['None yet']);
      return;
    }
    const withoutNone = priorLanguages.filter((l) => l !== 'None yet');
    if (withoutNone.includes(lang)) {
      setPriorLanguages(withoutNone.filter((l) => l !== lang));
    } else {
      setPriorLanguages([...withoutNone, lang]);
    }
  };

  const handleFinish = () => {
    const updated: UserProfile = {
      ...initialProfile,
      name: name.trim() || 'Learner',
      level,
      priorLanguages,
      primaryGoal,
      activeLanguage,
      learningPace,
      isOnboarded: true,
      createdAt: initialProfile.createdAt || new Date().toISOString(),
    };
    onComplete(updated);
  };

  return (
    <div className="zenith-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans">
      <div className={`zenith-modal-surface w-full max-w-2xl rounded-3xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}>
        {/* Top Header */}
        <div className={`px-6 py-5 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl ${accentConf.bgSubtle} ${accentConf.text} flex items-center justify-center`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${surface.text}`}>
                Welcome to Zenith Code
              </h2>
              <p className={`text-xs ${surface.textSubtle}`}>
                Step {step} of {totalSteps} · Let&apos;s tailor your study space
              </p>
            </div>
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

        {/* Soft Progress Bar */}
        <div className={`h-1.5 w-full ${surface.chipBg}`}>
          <div
            className={`h-full ${accentConf.bg} zenith-progress-fill rounded-r-full`}
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div key={step} className="zenith-step-view space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={`block text-xs font-semibold ${surface.text} mb-2`}>
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex, Sam, or Ada"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm ${surface.input} focus:outline-hidden focus:ring-2 focus:ring-black/5`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold ${surface.text} mb-2.5`}>
                  How comfortable are you with programming right now?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'absolute_beginner',
                      title: 'Brand New',
                      desc: 'Never written code before. Excited to start from the basics.',
                    },
                    {
                      id: 'started_before',
                      title: 'Getting Started',
                      desc: 'I know a bit about variables, loops, and basic conditions.',
                    },
                    {
                      id: 'intermediate',
                      title: 'Intermediate',
                      desc: 'I can write programs and want deeper systems intuition.',
                    },
                    {
                      id: 'experienced_systems',
                      title: 'Experienced Builder',
                      desc: 'Comfortable coding; exploring Rust, C/C++, Lua, or Godot.',
                    },
                  ].map((item) => {
                    const isSelected = level === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLevel(item.id as ExperienceLevel)}
                        className={`zenith-card-hover text-left p-4 rounded-2xl border ${
                          isSelected
                            ? `${accentConf.bgSubtle} ${accentConf.border} shadow-xs`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${surface.text}`}>{item.title}</span>
                          {isSelected && <Check className={`w-4 h-4 ${accentConf.text}`} />}
                        </div>
                        <p className={`text-xs leading-relaxed ${surface.textMuted}`}>{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className={`text-xs font-semibold ${surface.text}`}>
                    Have you tried any languages before?
                  </label>
                  <span className={`text-[11px] ${surface.textSubtle}`}>Optional</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'None yet',
                    'Python',
                    'JavaScript',
                    'Java',
                    'C',
                    'C++',
                    'Rust',
                    'Lua',
                  ].map((lang) => {
                    const isSelected = priorLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => togglePriorLang(lang)}
                        className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center justify-between ${
                          isSelected
                            ? `${accentConf.bg} border-transparent shadow-xs`
                            : `${surface.card} ${surface.textMuted} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <span>{lang}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1">
                <label className={`block text-xs font-semibold ${surface.text} mb-2.5`}>
                  What brings you here today?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'systems',
                      title: 'Systems & Performance',
                      desc: 'Learn how memory, pointers, and low-level code work under the hood.',
                      icon: Cpu,
                    },
                    {
                      id: 'game_dev',
                      title: 'Game Development',
                      desc: 'Explore Godot GDScript, Roblox Luau, and C++ game logic.',
                      icon: Code2,
                    },
                    {
                      id: 'embedded_algorithms',
                      title: 'Problem Solving & Logic',
                      desc: 'Build clean algorithmic thinking and solid data structures.',
                      icon: Shield,
                    },
                    {
                      id: 'general_mastery',
                      title: 'Explore Multiple Languages',
                      desc: 'Compare styles across modern scripting and compiled languages.',
                      icon: Compass,
                    },
                  ].map((g) => {
                    const Icon = g.icon;
                    const isSelected = primaryGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setPrimaryGoal(g.id as UserProfile['primaryGoal'])}
                        className={`zenith-card-hover text-left p-4 rounded-2xl border ${
                          isSelected
                            ? `${accentConf.bgSubtle} ${accentConf.border} shadow-xs`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? accentConf.text : surface.textMuted}`} />
                          <span className={`text-sm font-semibold ${surface.text}`}>{g.title}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${surface.textMuted}`}>{g.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold ${surface.text} mb-1`}>
                  Pick your starting language
                </label>
                <p className={`text-xs ${surface.textMuted} mb-3`}>
                  Don&apos;t worry — you can switch between all 11 languages anytime from the top bar.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langKey) => {
                    const lang = SUPPORTED_LANGUAGES[langKey];
                    const isSelected = activeLanguage === langKey;
                    return (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => setActiveLanguage(langKey)}
                        className={`zenith-card-hover text-left p-3.5 rounded-2xl border ${
                          isSelected
                            ? `${accentConf.bgSubtle} ${accentConf.border} shadow-xs`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                              isSelected ? accentConf.badgeBg : `${surface.chipBg} ${surface.border} ${surface.textMuted}`
                            }`}>
                              {lang.extension}
                            </span>
                            <span className={`text-sm font-semibold ${surface.text}`}>{lang.name}</span>
                          </div>
                          <span className={`text-[11px] ${surface.textSubtle}`}>
                            {lang.category}
                          </span>
                        </div>
                        <p className={`text-xs ${surface.textMuted} line-clamp-1`}>{lang.tagline}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold ${surface.text} mb-1`}>
                  How would you like your mentor to guide you?
                </label>
                <p className={`text-xs ${surface.textMuted} mb-3`}>
                  Your AI tutor asks thoughtful questions and gives clear mental models instead of spoiling the answer for you.
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'socratic_inquiry',
                      title: 'Guided Discovery',
                      desc: 'Asks helpful questions to guide you toward understanding how things work.',
                    },
                    {
                      id: 'hands_on_challenges',
                      title: 'Practice & Challenges First',
                      desc: 'Focuses on testing edge cases and helping you refine your solutions.',
                    },
                    {
                      id: 'balanced',
                      title: 'Balanced Mix',
                      desc: 'An even blend of concept questions and practical challenge tips.',
                    },
                  ].map((style) => {
                    const isSelected = learningPace === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setLearningPace(style.id as UserProfile['learningPace'])}
                        className={`zenith-card-hover w-full text-left p-4 rounded-2xl border ${
                          isSelected
                            ? `${accentConf.bgSubtle} ${accentConf.border} shadow-xs`
                            : `${surface.card} ${surface.border} ${surface.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${surface.text}`}>{style.title}</span>
                          {isSelected && <Check className={`w-4 h-4 ${accentConf.text}`} />}
                        </div>
                        <p className={`text-xs ${surface.textMuted}`}>{style.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border ${surface.border} ${surface.cardMuted} text-xs ${surface.textMuted}`}>
                <strong className={surface.text}>Private & Saved Locally:</strong> Your code, notes, and learning progress stay right in your browser.
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className={`px-6 py-4 border-t ${surface.border} ${surface.cardMuted} flex items-center justify-between`}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl ${accentConf.bg} shadow-sm hover:opacity-95 transition-all`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl ${accentConf.bg} shadow-sm hover:opacity-95 transition-all`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Learning</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
