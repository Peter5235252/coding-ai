import React, { useState, useRef, useEffect } from 'react';
import {
  AccentColor,
  BackgroundGradientStyle,
  CornerRadiusStyle,
  PanelHeaderStyle,
  ReasoningLevel,
  SocraticAnalysis,
  SurfaceStyle,
  SupportedLanguage,
  TutorMessage,
} from '../types';
import { getAccentConfig, getPanelRadiusClass, getSurfacePalette } from '../utils/themeData';
import { PanelControls } from './PanelControls';
import { ReasoningEffortSlider } from './ReasoningEffortSlider';
import { playSound } from '../utils/soundEngine';
import { Sparkles, Send, ChevronRight, HelpCircle, AlertCircle, BookOpen, MessageCircle } from 'lucide-react';

interface TutorPanelProps {
  analysis: SocraticAnalysis | null;
  language: SupportedLanguage;
  code: string;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  messages: TutorMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isSendingMessage: boolean;
  accent?: AccentColor;
  customAccentHex?: string;
  bgGradient?: BackgroundGradientStyle;
  surfaceStyle?: SurfaceStyle;
  panelHeaderStyle?: PanelHeaderStyle;
  cornerRadius?: CornerRadiusStyle;
  reasoningLevel: ReasoningLevel;
  onReasoningLevelChange: (level: ReasoningLevel) => void;
  onClearMessages?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onCyclePosition?: () => void;
  onHidePanel?: () => void;
  onDragStartPanel?: (e: React.DragEvent) => void;
}

export const TutorPanel: React.FC<TutorPanelProps> = ({
  analysis,
  language,
  isAnalyzing,
  onAnalyze,
  messages,
  onSendMessage,
  isSendingMessage,
  accent = 'sage',
  customAccentHex,
  bgGradient = 'warm-linen',
  surfaceStyle = 'crisp',
  panelHeaderStyle = 'detailed',
  cornerRadius = 'rounded',
  reasoningLevel,
  onReasoningLevelChange,
  isMaximized = false,
  onToggleMaximize,
  onCyclePosition,
  onHidePanel,
  onDragStartPanel,
}) => {
  const accentConf = getAccentConfig(accent, customAccentHex);
  const surface = getSurfacePalette(bgGradient, surfaceStyle);
  const radiusClass = getPanelRadiusClass(cornerRadius);

  const [inputVal, setInputVal] = useState('');
  const [showHint, setShowHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSendingMessage, analysis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSendingMessage) return;
    const text = inputVal.trim();
    setInputVal('');
    await onSendMessage(text);
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isSendingMessage) return;
    await onSendMessage(promptText);
  };

  return (
    <div className={`zenith-tile-frame flex flex-col h-full ${radiusClass} border ${surface.border} ${surface.card} font-sans text-xs overflow-hidden`}>
      {/* Draggable Friendly Mentor Header */}
      <div
        draggable={!!onDragStartPanel}
        onDragStart={onDragStartPanel}
        className={`${
          panelHeaderStyle === 'minimal'
            ? 'px-3 py-1.5'
            : panelHeaderStyle === 'compact'
            ? 'px-3.5 py-1.5'
            : 'px-3.5 py-2'
        } border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-2 shrink-0 flex-wrap`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {panelHeaderStyle !== 'minimal' && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentConf.bgSubtle} ${accentConf.text}`}>
              <MessageCircle className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`font-semibold text-xs ${surface.text} leading-tight truncate`}>
                Coding Mentor
              </span>
              <span className={`px-1.5 py-0.5 rounded-md border ${surface.border} ${surface.chipBg} ${surface.textSubtle} text-[10px] font-medium leading-none shrink-0`}>
                Gemini 4 Hydrogen
              </span>
            </div>
            {panelHeaderStyle === 'detailed' && (
              <span className={`text-[11px] ${surface.textSubtle} truncate block mt-0.5`}>
                Guided questions
              </span>
            )}
          </div>
        </div>

        {/* 4-Tier Reasoning Effort Slider & Placement Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ReasoningEffortSlider
            value={reasoningLevel}
            onChange={onReasoningLevelChange}
            variant="compact"
            accent={accent}
            customAccentHex={customAccentHex}
            bgGradient={bgGradient}
            surfaceStyle={surfaceStyle}
          />

          <PanelControls
            panelId="tutor"
            surface={surface}
            isMaximized={isMaximized}
            onToggleMaximize={onToggleMaximize}
            onCyclePosition={onCyclePosition}
            onHidePanel={onHidePanel}
          />
        </div>
      </div>

      {/* Warm Conversational Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {!analysis && messages.length === 0 && (
          <div className="py-6 px-3 text-center space-y-4">
            <div className={`w-12 h-12 mx-auto rounded-2xl ${accentConf.bgSubtle} ${accentConf.text} flex items-center justify-center`}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className={`font-semibold text-base ${surface.text}`}>
                Let&apos;s explore together
              </h3>
              <p className={`${surface.textMuted} text-xs max-w-xs mx-auto leading-relaxed`}>
                Instead of just handing you answers, I&apos;ll ask gentle questions to help your mental model click.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${accentConf.bg} shadow-sm hover:opacity-95 transition-all disabled:opacity-50`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Reading your code...' : 'Review My Current Code'}</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto text-left">
              <span className={`text-[11px] font-medium ${surface.textSubtle} text-center`}>
                Or start with a question:
              </span>
              <button
                type="button"
                onClick={() => handleQuickPrompt(`How does memory management work in ${language}?`)}
                className={`zenith-card-hover p-3 rounded-xl border ${surface.border} ${surface.cardMuted} ${surface.hoverBg} ${surface.text} text-xs flex items-center justify-between group`}
              >
                <span>How does {language} handle memory?</span>
                <ChevronRight className={`w-4 h-4 ${surface.textSubtle} group-hover:translate-x-0.5 transition-transform`} />
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt(`What is a common beginner mistake to watch out for in ${language}?`)}
                className={`zenith-card-hover p-3 rounded-xl border ${surface.border} ${surface.cardMuted} ${surface.hoverBg} ${surface.text} text-xs flex items-center justify-between group`}
              >
                <span>Common pitfalls in {language}</span>
                <ChevronRight className={`w-4 h-4 ${surface.textSubtle} group-hover:translate-x-0.5 transition-transform`} />
              </button>
            </div>
          </div>
        )}

        {analysis && (
          <div className={`zenith-item-reveal p-4 rounded-2xl border ${surface.border} ${surface.cardMuted} space-y-3.5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${surface.text} flex items-center gap-1.5`}>
                <Sparkles className={`w-4 h-4 ${accentConf.text}`} />
                Code Insights
              </span>
              {analysis.apiError ? (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Gemini 4 Hydrogen {[analysis.apiError.code, analysis.apiError.status].filter(Boolean).join(' · ') || 'Unavailable'}
                </span>
              ) : analysis.isOfflineFallback ? (
                <span className={`text-[11px] ${surface.textSubtle}`}>Offline helper</span>
              ) : null}
            </div>

            {analysis.apiError && (
              <div className="p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs space-y-1">
                <div className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Gemini 4 Hydrogen error
                    {analysis.apiError.code || analysis.apiError.status
                      ? ` (${[analysis.apiError.code, analysis.apiError.status].filter(Boolean).join(' ')})`
                      : ''}
                  </span>
                </div>
                <p className={`${surface.textMuted} leading-relaxed`}>
                  {analysis.apiError.message}
                </p>
              </div>
            )}

            {analysis.conceptHighlight && !analysis.apiError && (
              <div className={`p-3 rounded-xl ${accentConf.bgSubtle} border ${accentConf.border} text-xs ${surface.text} font-medium leading-relaxed`}>
                {analysis.conceptHighlight}
              </div>
            )}

            <p className={`${surface.textMuted} text-xs leading-relaxed whitespace-pre-wrap`}>
              {analysis.analysis}
            </p>

            {analysis.issuesDetected && analysis.issuesDetected.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className={`text-[11px] font-semibold ${surface.text} flex items-center gap-1.5`}>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Things to Double-Check
                </span>
                <ul className={`space-y-1 text-xs ${surface.textMuted} pl-4 list-disc`}>
                  {analysis.issuesDetected.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.probingQuestions && analysis.probingQuestions.length > 0 && (
              <div className={`space-y-2 pt-3 border-t ${surface.border}`}>
                <span className={`text-[11px] font-semibold ${surface.text} flex items-center gap-1.5`}>
                  <HelpCircle className={`w-3.5 h-3.5 ${accentConf.text}`} />
                  Questions to Ponder (tap any to reply)
                </span>
                <div className="space-y-2">
                  {analysis.probingQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPrompt(q)}
                      className={`zenith-card-hover w-full text-left p-3 rounded-xl border ${surface.border} ${surface.card} ${surface.hoverBg} text-xs ${surface.text} flex items-start gap-2.5 group`}
                    >
                      <span className={`font-semibold text-[11px] ${accentConf.text} mt-0.5 shrink-0`}>
                        {idx + 1}.
                      </span>
                      <span className="flex-1 leading-relaxed">{q}</span>
                      <ChevronRight className={`w-4 h-4 ${surface.textSubtle} shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {analysis.hints && analysis.hints.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showHint;
                    playSound(next ? 'toggleOn' : 'toggleOff');
                    setShowHint(next);
                  }}
                  className={`text-xs font-medium ${accentConf.text} hover:underline underline-offset-2`}
                >
                  {showHint ? 'Hide gentle hints' : 'Need a gentle hint?'}
                </button>
                {showHint && (
                  <div className={`zenith-banner-enter mt-2 p-3 rounded-xl border ${surface.border} ${surface.card} text-xs ${surface.textMuted} space-y-1.5`}>
                    {analysis.hints.map((h, i) => (
                      <p key={i}>• {h}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`zenith-item-reveal p-3.5 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user'
                ? `ml-8 ${accentConf.bgSubtle} border ${accentConf.border} ${surface.text}`
                : m.apiError
                ? `mr-4 border border-amber-500/35 bg-amber-500/10 ${surface.text}`
                : `mr-4 ${surface.cardMuted} border ${surface.border} ${surface.text}`
            }`}
          >
            <div className={`flex items-center justify-between mb-1.5 text-[11px] ${m.apiError ? 'text-amber-700 dark:text-amber-300' : surface.textSubtle}`}>
              <span className="font-semibold flex items-center gap-1.5">
                {m.apiError && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                {m.role === 'user'
                  ? 'You'
                  : m.apiError
                  ? `Mentor · Gemini 4 Hydrogen${
                      m.apiError.code || m.apiError.status
                        ? ` (${[m.apiError.code, m.apiError.status].filter(Boolean).join(' ')})`
                        : ' Error'
                    }`
                  : 'Mentor'}
              </span>
              <span>{m.timestamp}</span>
            </div>
            <div className="whitespace-pre-wrap">{m.text}</div>
            {m.probingQuestion && (
              <button
                type="button"
                onClick={() => handleQuickPrompt(`About that question: "${m.probingQuestion}" — here is what I think:`)}
                className={`zenith-card-hover mt-3 w-full text-left p-2.5 rounded-xl border ${surface.border} ${surface.card} ${surface.hoverBg} text-xs ${surface.text} block`}
              >
                <span className={`text-[11px] font-semibold ${accentConf.text} block mb-0.5`}>
                  Think about this:
                </span>
                {m.probingQuestion}
              </button>
            )}
          </div>
        ))}

        {isSendingMessage && (
          <div className={`zenith-banner-enter p-3.5 rounded-2xl border ${surface.border} ${surface.cardMuted} text-xs ${surface.textMuted} flex items-center gap-2.5 mr-4`}>
            <Sparkles className={`w-4 h-4 ${accentConf.text} shrink-0`} />
            <span>Thinking through a helpful question</span>
            <span className="inline-flex items-center gap-1 ml-0.5" aria-hidden="true">
              <span className={`w-1.5 h-1.5 rounded-full ${accentConf.bg} zenith-wave-dot`} style={{ animationDelay: '0ms' }} />
              <span className={`w-1.5 h-1.5 rounded-full ${accentConf.bg} zenith-wave-dot`} style={{ animationDelay: '160ms' }} />
              <span className={`w-1.5 h-1.5 rounded-full ${accentConf.bg} zenith-wave-dot`} style={{ animationDelay: '320ms' }} />
            </span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className={`px-3.5 py-2 border-t ${surface.border} ${surface.cardMuted} flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar`}>
        <button
          type="button"
          onClick={() => handleQuickPrompt('What edge cases should I test in my code?')}
          disabled={isSendingMessage}
          className={`whitespace-nowrap px-3 py-1 rounded-full border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
        >
          Check edge cases
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt(`How does ${language} clean up memory here?`)}
          disabled={isSendingMessage}
          className={`whitespace-nowrap px-3 py-1 rounded-full border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
        >
          Explain memory
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt('Quiz me on this concept!')}
          disabled={isSendingMessage}
          className={`whitespace-nowrap px-3 py-1 rounded-full border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
        >
          Quick quiz
        </button>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className={`p-3 border-t ${surface.border} ${surface.card} flex gap-2 shrink-0`}>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Ask anything about ${language}...`}
          disabled={isSendingMessage}
          className={`flex-1 rounded-xl border px-3.5 py-2 text-xs ${surface.input} focus:outline-hidden focus:ring-2 focus:ring-black/5`}
        />
        <button
          type="submit"
          disabled={isSendingMessage || !inputVal.trim()}
          className={`px-3.5 py-2 rounded-xl font-medium ${accentConf.bg} text-xs transition-opacity disabled:opacity-40 shadow-xs`}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
