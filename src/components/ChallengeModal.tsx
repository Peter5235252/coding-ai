import React, { useState } from 'react';
import {
  AccentColor,
  AdaptiveChallenge,
  BackgroundGradientStyle,
  CurriculumLesson,
  ReasoningLevel,
  SupportedLanguage,
  UserProfile,
} from '../types';
import { CURRICULUM_LESSONS } from '../data/curriculumData';
import { SUPPORTED_LANGUAGES } from '../utils/languageData';
import { ACCENT_MAP, getSurfacePalette } from '../utils/themeData';
import { playSound } from '../utils/soundEngine';
import { Sparkles, BookOpen, CheckCircle2, ArrowRight, X, AlertCircle } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  profile: UserProfile;
  completedIds: string[];
  onSelectLesson: (lesson: CurriculumLesson) => void;
  onSelectAdaptiveChallenge: (challenge: AdaptiveChallenge) => void;
  activeChallenge: AdaptiveChallenge | CurriculumLesson | null;
  reasoningLevel?: ReasoningLevel;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  language,
  profile,
  completedIds,
  onSelectLesson,
  onSelectAdaptiveChallenge,
  activeChallenge,
  reasoningLevel = 'medium',
  accent = 'sage',
  bgGradient = 'warm-linen',
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'adaptive'>('curriculum');
  const [isGenerating, setIsGenerating] = useState(false);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const lessons = CURRICULUM_LESSONS[language] || [];
  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);
  const langName = SUPPORTED_LANGUAGES[language]?.name || language;

  const handleGenerateAdaptive = async () => {
    setIsGenerating(true);
    setAdaptiveError(null);
    try {
      const res = await fetch('/api/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langName,
          userLevel: profile.level,
          userFocus: profile.primaryGoal,
          completedCount: completedIds.length,
          reasoningLevel,
        }),
      });
      const data = await res.json();
      if (data.challenge) {
        playSound('select');
        onSelectAdaptiveChallenge({
          ...data.challenge,
          language,
        });
        onClose();
      } else {
        playSound('runError');
        setAdaptiveError('Could not generate a custom challenge right now. Please try a curated lesson.');
      }
    } catch (err: any) {
      playSound('runError');
      setAdaptiveError(err?.message || 'Unable to reach challenge generator.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="zenith-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans">
      <div className={`zenith-modal-surface w-full max-w-3xl rounded-3xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl flex flex-col max-h-[88vh] overflow-hidden`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${accentConf.bgSubtle} ${accentConf.text} flex items-center justify-center`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`font-bold text-base ${surface.text}`}>
                {langName} Lessons & Practice
              </h2>
              <p className={`text-xs ${surface.textSubtle}`}>
                {completedIds.length} challenges completed so far
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friendly Segmented Tabs */}
        <div className={`px-6 py-3 border-b ${surface.border} flex items-center gap-2`}>
          <div className={`inline-flex p-1 rounded-xl ${surface.chipBg}`}>
            <button
              type="button"
              onClick={() => {
                playSound('tab');
                setActiveTab('curriculum');
              }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'curriculum'
                  ? `${surface.card} ${surface.text} shadow-xs`
                  : `${surface.textMuted} hover:opacity-80`
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guided Lessons ({lessons.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('tab');
                setActiveTab('adaptive');
              }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'adaptive'
                  ? `${surface.card} ${surface.text} shadow-xs`
                  : `${surface.textMuted} hover:opacity-80`
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Custom AI Practice</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'curriculum' ? (
            <div key="curriculum" className="zenith-step-view space-y-4">
              <p className={`text-xs ${surface.textMuted} leading-relaxed`}>
                Step-by-step lessons crafted for {langName}. Each lesson invites you to think through core ideas and practice writing real code.
              </p>

              <div className="space-y-3">
                {lessons.map((lesson, idx) => {
                  const isDone = completedIds.includes(lesson.id);
                  const isCurrent = activeChallenge?.id === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                      className={`zenith-item-reveal zenith-card-hover p-4 rounded-2xl border ${
                        isCurrent
                          ? `${accentConf.bgSubtle} ${accentConf.border} shadow-xs`
                          : `${surface.card} ${surface.border}`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <span className={`w-4 h-4 rounded-full border-2 ${surface.borderStrong} inline-block shrink-0`} />
                            )}
                            <h3 className={`text-sm font-semibold ${surface.text}`}>
                              {lesson.title}
                            </h3>
                            <span className={`text-[11px] ${surface.textSubtle}`}>
                              · {lesson.tier.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className={`text-xs ${surface.textMuted} leading-relaxed`}>
                            {lesson.description || lesson.summary}
                          </p>
                          <div className={`pt-1 text-xs ${surface.textMuted} italic`}>
                            <span className={`not-italic font-medium ${accentConf.text} mr-1.5`}>Food for thought:</span>
                            &ldquo;{lesson.probingQuestion}&rdquo;
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-xs font-semibold ${accentConf.text}`}>
                            +{lesson.xpReward} XP
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              playSound('select');
                              onSelectLesson(lesson);
                              onClose();
                            }}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                              isCurrent
                                ? `${accentConf.bg}`
                                : `border ${surface.border} ${surface.cardMuted} ${surface.text} ${surface.hoverBg}`
                            }`}
                          >
                            <span>{isCurrent ? 'Opened' : 'Start Lesson'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div key="adaptive" className="zenith-step-view space-y-4">
              <div className={`p-5 rounded-2xl border ${surface.border} ${surface.cardMuted} space-y-3`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${accentConf.text}`} />
                  <h3 className={`text-sm font-bold ${surface.text}`}>
                    Tailored {langName} Practice Challenge
                  </h3>
                </div>
                <p className={`text-xs ${surface.textMuted} leading-relaxed`}>
                  Creates a fresh coding exercise matched to your experience level and interests, complete with sample inputs and gentle guidance.
                </p>

                {adaptiveError && (
                  <div className={`p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs ${surface.text} flex items-center gap-2`}>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{adaptiveError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateAdaptive}
                    disabled={isGenerating}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${accentConf.bg} font-semibold text-xs shadow-sm hover:opacity-95 disabled:opacity-50 transition-all`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isGenerating ? 'Crafting your challenge...' : 'Create New Challenge'}
                    </span>
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${surface.border} ${surface.card} space-y-2 text-xs ${surface.textMuted}`}>
                <p className={`font-semibold ${surface.text}`}>How custom practice works:</p>
                <p>• Write your solution freely in the workspace editor.</p>
                <p>• Run your code anytime to test out ideas in the console.</p>
                <p>• Ask your Coding Mentor for gentle hints if you get stuck.</p>
                <p>• Submit your solution when you&apos;re ready to earn XP.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
