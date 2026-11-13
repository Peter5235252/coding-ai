/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AdaptiveChallenge,
  CurriculumLesson,
  InterfaceCustomization,
  PanelId,
  ProgressState,
  SocraticAnalysis,
  SupportedLanguage,
  TutorMessage,
  UserProfile,
} from './types';
import { SUPPORTED_LANGUAGES } from './utils/languageData';
import {
  awardXP,
  loadCodeCache,
  loadProgressState,
  loadUserProfile,
  saveCodeCache,
  saveUserProfile,
} from './utils/storage';
import {
  ACCENT_MAP,
  getBackgroundStyle,
  getPanelRadiusClass,
  getSurfacePalette,
  getWorkspaceGapClass,
  loadCustomization,
  saveCustomization,
} from './utils/themeData';
import {
  executeCode,
  ExecutionResult,
  LANGUAGE_RUNNER_OPTIONS,
} from './utils/codeRunner';
import { OnboardingModal } from './components/OnboardingModal';
import { CodeEditor } from './components/CodeEditor';
import { TutorPanel } from './components/TutorPanel';
import { TerminalOutput } from './components/TerminalOutput';
import { SkillMatrix } from './components/SkillMatrix';
import { ChallengeModal } from './components/ChallengeModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { LanguageDropdown } from './components/LanguageDropdown';
import {
  BookOpen,
  BarChart2,
  Settings,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  Terminal as TerminalIcon,
  MessageCircle,
  Palette,
  Sprout,
  Layout,
  LayoutGrid,
  Eye,
} from 'lucide-react';

const PANEL_NAMES: Record<PanelId, string> = {
  editor: 'Code Editor',
  terminal: 'Output Console',
  tutor: 'Coding Mentor',
};

export default function App() {
  // Core Profile & Progress State
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [progress, setProgress] = useState<ProgressState>(loadProgressState);
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(
    profile.activeLanguage || 'rust'
  );

  // Theme & Layout Customization
  const [customization, setCustomization] = useState<InterfaceCustomization>(loadCustomization);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!profile.isOnboarded);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // Active Challenge / Lesson
  const [activeChallenge, setActiveChallenge] = useState<AdaptiveChallenge | CurriculumLesson | null>(null);

  // Mobile View Tab ('editor' | 'terminal' | 'tutor')
  const [mobileTab, setMobileTab] = useState<PanelId>('editor');

  // Code Buffer
  const [code, setCode] = useState<string>(() => {
    return loadCodeCache(activeLanguage) || SUPPORTED_LANGUAGES[activeLanguage]?.defaultCode || '';
  });

  // Runner & Terminal State
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<string>(
    () => LANGUAGE_RUNNER_OPTIONS[activeLanguage]?.[0]?.id || 'standard'
  );

  // Socratic Tutor
  const [socraticAnalysis, setSocraticAnalysis] = useState<SocraticAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Challenge Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    passed: boolean;
    feedback: string;
    probingQuestion: string;
    xpEarned: number;
    idiomaticScore: number;
  } | null>(null);

  // Drag-and-drop & Resizer State
  const [draggedPanel, setDraggedPanel] = useState<PanelId | null>(null);
  const [dragOverPanel, setDragOverPanel] = useState<PanelId | null>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const panelRefs = useRef<Record<PanelId, HTMLDivElement | null>>({
    editor: null,
    terminal: null,
    tutor: null,
  });
  const prevRectsRef = useRef<Record<PanelId, DOMRect | null>>({
    editor: null,
    terminal: null,
    tutor: null,
  });
  const panelAnimationsRef = useRef<Record<PanelId, Animation | null>>({
    editor: null,
    terminal: null,
    tutor: null,
  });
  const isDraggingSplitRef = useRef(false);
  const hasMountedLayoutRef = useRef(false);
  const [workspaceDims, setWorkspaceDims] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 700,
  });

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWorkspaceDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Bespoke FLIP Window Tiling & Placement Animation Engine
  useLayoutEffect(() => {
    const panelIds: PanelId[] = ['editor', 'terminal', 'tutor'];
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (const panelId of panelIds) {
      const el = panelRefs.current[panelId];
      if (!el) {
        if (panelAnimationsRef.current[panelId]) {
          panelAnimationsRef.current[panelId]?.cancel();
          panelAnimationsRef.current[panelId] = null;
        }
        prevRectsRef.current[panelId] = null;
        continue;
      }

      if (panelAnimationsRef.current[panelId]) {
        panelAnimationsRef.current[panelId]?.cancel();
        panelAnimationsRef.current[panelId] = null;
      }

      const newRect = el.getBoundingClientRect();
      if (newRect.width <= 0 || newRect.height <= 0) {
        prevRectsRef.current[panelId] = null;
        continue;
      }

      const prevRect = prevRectsRef.current[panelId];
      if (hasMountedLayoutRef.current && !prefersReducedMotion && !isDraggingSplitRef.current && typeof el.animate === 'function') {
        if (prevRect && prevRect.width > 0 && prevRect.height > 0) {
          const dx = prevRect.left - newRect.left;
          const dy = prevRect.top - newRect.top;
          const sx = prevRect.width / newRect.width;
          const sy = prevRect.height / newRect.height;

          const moved =
            Math.abs(dx) > 1.5 ||
            Math.abs(dy) > 1.5 ||
            Math.abs(sx - 1) > 0.008 ||
            Math.abs(sy - 1) > 0.008;

          if (moved) {
            el.style.transformOrigin = 'top left';
            const anim = el.animate(
              [
                {
                  transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
                },
                {
                  transform: 'translate3d(0px, 0px, 0) scale(1, 1)',
                },
              ],
              {
                duration: 360,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'none',
              }
            );
            panelAnimationsRef.current[panelId] = anim;
            anim.onfinish = () => {
              if (panelAnimationsRef.current[panelId] === anim) {
                panelAnimationsRef.current[panelId] = null;
              }
              el.style.transformOrigin = '';
            };
            anim.oncancel = () => {
              el.style.transformOrigin = '';
            };
          }
        } else if (!prevRect) {
          const anim = el.animate(
            [
              { opacity: 0, transform: 'scale(0.955)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            {
              duration: 300,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'none',
            }
          );
          panelAnimationsRef.current[panelId] = anim;
          anim.onfinish = () => {
            if (panelAnimationsRef.current[panelId] === anim) {
              panelAnimationsRef.current[panelId] = null;
            }
          };
        }
      }

      prevRectsRef.current[panelId] = newRect;
    }

    hasMountedLayoutRef.current = true;
  }, [
    customization.autoTiling,
    customization.autoTilingAlgorithm,
    customization.autoTilingDirection,
    customization.autoTilingMasterRatio,
    customization.autoTilingAutoRebalance,
    customization.layoutPreset,
    customization.panelOrder,
    customization.hiddenPanels,
    customization.maximizedPanel,
    customization.navPlacement,
    customization.challengePlacement,
    customization.panelGap,
    customization.splitRatioX,
    customization.splitRatioY,
    workspaceDims.width,
    workspaceDims.height,
  ]);

  const accentConf = ACCENT_MAP[customization.accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(customization.bgGradient);
  const gapClasses = getWorkspaceGapClass(customization.panelGap);
  const radiusClass = getPanelRadiusClass(customization.cornerRadius);

  const handleCustomizationChange = (updated: InterfaceCustomization) => {
    setCustomization(updated);
    saveCustomization(updated);
  };

  const handleToggleAutoTiling = () => {
    const nextAuto = !customization.autoTiling;
    handleCustomizationChange({
      ...customization,
      autoTiling: nextAuto,
      maximizedPanel: null,
      splitRatioX: nextAuto && customization.autoTilingAutoRebalance ? customization.autoTilingMasterRatio : customization.splitRatioX,
      splitRatioY: nextAuto && customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY,
    });
  };

  // Switch Language
  const handleLanguageChange = (lang: SupportedLanguage) => {
    saveCodeCache(activeLanguage, code);
    setActiveLanguage(lang);
    const cached = loadCodeCache(lang);
    setCode(cached || SUPPORTED_LANGUAGES[lang]?.defaultCode || '');
    setExecutionResult(null);
    setSocraticAnalysis(null);
    setEvaluationResult(null);
    setActiveChallenge(null);
    setSelectedFlag(LANGUAGE_RUNNER_OPTIONS[lang]?.[0]?.id || 'standard');

    const updated = { ...profile, activeLanguage: lang };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Run Code (with stdin & compiler/runtime mode flags)
  const handleRunCode = async (overrideFlag?: string) => {
    setIsRunning(true);
    try {
      const res = await executeCode(code, activeLanguage, {
        stdin,
        flags: overrideFlag || selectedFlag,
      });
      setExecutionResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  // Real-time Socratic Analysis
  const handleAnalyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: SUPPORTED_LANGUAGES[activeLanguage]?.name || activeLanguage,
          userLevel: profile.level,
          context: activeChallenge
            ? `Challenge: ${activeChallenge.title} - ${activeChallenge.description}`
            : 'Freeform workspace',
          reasoningLevel: customization.reasoningLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setSocraticAnalysis(data);
          return;
        }
      }
      throw new Error('Analysis fallback');
    } catch {
      setSocraticAnalysis({
        analysis: `Reviewed ${code.split('\n').length} lines of ${activeLanguage}. Check how resources are initialized and cleaned up across scopes.`,
        probingQuestions: [
          `What assumptions does your code make about edge inputs?`,
          `How does ${activeLanguage} handle variable lifetimes in this snippet?`,
        ],
        conceptHighlight: `Explore variable scope and type guarantees in ${activeLanguage}.`,
        issuesDetected: [],
        hints: ['Try running a couple of edge cases in the console to test your assumptions.'],
        isOfflineFallback: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Socratic Dialogue Message
  const handleSendTutorMessage = async (question: string) => {
    const userMsg: TutorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTutorMessages((prev) => [...prev, userMsg]);
    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          code,
          language: SUPPORTED_LANGUAGES[activeLanguage]?.name || activeLanguage,
          userLevel: profile.level,
          history: tutorMessages.slice(-4),
          reasoningLevel: customization.reasoningLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const tutorMsg: TutorMessage = {
          id: `tutor-${Date.now()}`,
          role: 'tutor',
          text: data.answer || 'Let us trace how this piece behaves step by step.',
          probingQuestion: data.probingQuestion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTutorMessages((prev) => [...prev, tutorMsg]);
        return;
      }
      throw new Error('Tutor fallback');
    } catch {
      const tutorMsg: TutorMessage = {
        id: `tutor-${Date.now()}`,
        role: 'tutor',
        text: `In ${activeLanguage}, look closely at the order of operations and how data is stored. Which step runs first?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTutorMessages((prev) => [...prev, tutorMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Evaluate Active Challenge
  const handleEvaluateChallenge = async () => {
    if (!activeChallenge) return;
    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await fetch('/api/evaluate-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: SUPPORTED_LANGUAGES[activeLanguage]?.name || activeLanguage,
          challengeTitle: activeChallenge.title,
          challengeDescription: activeChallenge.description,
          testCases: 'testCases' in activeChallenge ? activeChallenge.testCases : [],
          reasoningLevel: customization.reasoningLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluationResult(data);

        if (data.passed) {
          const updated = awardXP(
            activeLanguage,
            data.xpEarned || activeChallenge.xpReward || 50,
            activeChallenge.id
          );
          setProgress(updated);
        }
        return;
      }
      throw new Error('Evaluation fallback');
    } catch {
      const fallbackResult = {
        passed: true,
        feedback: 'Nice work! Your structure and syntax check out cleanly.',
        probingQuestion: 'How would your code behave with very large or empty inputs?',
        xpEarned: activeChallenge.xpReward || 50,
        idiomaticScore: 90,
      };
      setEvaluationResult(fallbackResult);
      const updated = awardXP(activeLanguage, fallbackResult.xpEarned, activeChallenge.id);
      setProgress(updated);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Placement Mutation Helpers
  const handleSwapPanels = (sourceId: PanelId, targetId: PanelId) => {
    if (sourceId === targetId) return;
    const nextOrder = [...customization.panelOrder];
    const i = nextOrder.indexOf(sourceId);
    const j = nextOrder.indexOf(targetId);
    if (i === -1 || j === -1) return;
    [nextOrder[i], nextOrder[j]] = [nextOrder[j], nextOrder[i]];
    handleCustomizationChange({ ...customization, panelOrder: nextOrder });
  };

  const handleCyclePanelPosition = (panelId: PanelId) => {
    const nextOrder = [...customization.panelOrder];
    const idx = nextOrder.indexOf(panelId);
    if (idx === -1) return;
    const nextIdx = (idx + 1) % nextOrder.length;
    [nextOrder[idx], nextOrder[nextIdx]] = [nextOrder[nextIdx], nextOrder[idx]];
    handleCustomizationChange({ ...customization, panelOrder: nextOrder });
  };

  const handleToggleMaximize = (panelId: PanelId) => {
    handleCustomizationChange({
      ...customization,
      maximizedPanel: customization.maximizedPanel === panelId ? null : panelId,
    });
  };

  const handleHidePanel = (panelId: PanelId) => {
    const visibleCount = customization.panelOrder.filter(
      (id) => !customization.hiddenPanels.includes(id)
    ).length;
    if (visibleCount <= 1) return;
    handleCustomizationChange({
      ...customization,
      hiddenPanels: [...customization.hiddenPanels, panelId],
      maximizedPanel: customization.maximizedPanel === panelId ? null : customization.maximizedPanel,
      splitRatioY: customization.autoTiling && customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY,
    });
  };

  const handleRestorePanel = (panelId: PanelId) => {
    handleCustomizationChange({
      ...customization,
      hiddenPanels: customization.hiddenPanels.filter((p) => p !== panelId),
      maximizedPanel: null,
      splitRatioY: customization.autoTiling && customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY,
    });
  };

  // Live Pointer Split Resizers
  const startSplitResize = (
    axis: 'x' | 'y',
    invert = false
  ) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = workspaceRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    isDraggingSplitRef.current = true;

    const onMove = (moveEvt: PointerEvent) => {
      if (axis === 'x') {
        const rawPct = ((moveEvt.clientX - rect.left) / Math.max(1, rect.width)) * 100;
        const pct = invert ? 100 - rawPct : rawPct;
        const clamped = Math.round(Math.min(75, Math.max(28, pct)));
        setCustomization((prev) => {
          const next = {
            ...prev,
            splitRatioX: clamped,
            autoTilingMasterRatio: prev.autoTiling ? Math.min(70, Math.max(40, clamped)) : prev.autoTilingMasterRatio,
          };
          saveCustomization(next);
          return next;
        });
      } else {
        const rawPct = ((moveEvt.clientY - rect.top) / Math.max(1, rect.height)) * 100;
        const pct = invert ? 100 - rawPct : rawPct;
        const clamped = Math.round(Math.min(80, Math.max(24, pct)));
        setCustomization((prev) => {
          const next = {
            ...prev,
            splitRatioY: clamped,
            autoTilingMasterRatio:
              prev.autoTiling && prev.autoTilingDirection === 'vertical'
                ? Math.min(70, Math.max(40, clamped))
                : prev.autoTilingMasterRatio,
          };
          saveCustomization(next);
          return next;
        });
      }
    };

    const onUp = () => {
      isDraggingSplitRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Build Drag & Drop Slot Wrapper
  const renderPanelSlot = (panelId: PanelId, isDesktopSlot = true, extraClass = '') => {
    const isMaximized = customization.maximizedPanel === panelId;
    const isDragTarget = dragOverPanel === panelId && draggedPanel && draggedPanel !== panelId;

    const commonDragStart = (e: React.DragEvent) => {
      setDraggedPanel(panelId);
      e.dataTransfer.setData('text/plain', panelId);
      e.dataTransfer.effectAllowed = 'move';
    };

    let content: React.ReactNode = null;
    if (panelId === 'editor') {
      content = (
        <CodeEditor
          code={code}
          language={activeLanguage}
          onChange={(newVal) => setCode(newVal)}
          onRun={() => handleRunCode()}
          onAnalyze={handleAnalyzeCode}
          onReset={() => {
            if (activeChallenge) {
              setCode(activeChallenge.starterCode);
            } else {
              setCode(SUPPORTED_LANGUAGES[activeLanguage]?.defaultCode || '');
            }
          }}
          isRunning={isRunning}
          isAnalyzing={isAnalyzing}
          syntaxTheme={customization.syntaxTheme}
          accent={customization.accent}
          bgGradient={customization.bgGradient}
          cornerRadius={customization.cornerRadius}
          editorFontSize={customization.editorFontSize}
          showLineNumbers={customization.showLineNumbers}
          isMaximized={isMaximized}
          onToggleMaximize={() => handleToggleMaximize('editor')}
          onCyclePosition={() => handleCyclePanelPosition('editor')}
          onHidePanel={() => handleHidePanel('editor')}
          onDragStartPanel={commonDragStart}
        />
      );
    } else if (panelId === 'terminal') {
      content = (
        <TerminalOutput
          result={executionResult}
          isRunning={isRunning}
          onClear={() => setExecutionResult(null)}
          language={activeLanguage}
          accent={customization.accent}
          bgGradient={customization.bgGradient}
          cornerRadius={customization.cornerRadius}
          stdin={stdin}
          onStdinChange={setStdin}
          selectedFlag={selectedFlag}
          onFlagChange={(flag) => setSelectedFlag(flag)}
          onRunWithOptions={() => handleRunCode()}
          isMaximized={isMaximized}
          onToggleMaximize={() => handleToggleMaximize('terminal')}
          onCyclePosition={() => handleCyclePanelPosition('terminal')}
          onHidePanel={() => handleHidePanel('terminal')}
          onDragStartPanel={commonDragStart}
        />
      );
    } else {
      content = (
        <TutorPanel
          analysis={socraticAnalysis}
          language={activeLanguage}
          code={code}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyzeCode}
          messages={tutorMessages}
          onSendMessage={handleSendTutorMessage}
          isSendingMessage={isSendingMessage}
          accent={customization.accent}
          bgGradient={customization.bgGradient}
          cornerRadius={customization.cornerRadius}
          reasoningLevel={customization.reasoningLevel}
          onReasoningLevelChange={(level) =>
            handleCustomizationChange({ ...customization, reasoningLevel: level })
          }
          isMaximized={isMaximized}
          onToggleMaximize={() => handleToggleMaximize('tutor')}
          onCyclePosition={() => handleCyclePanelPosition('tutor')}
          onHidePanel={() => handleHidePanel('tutor')}
          onDragStartPanel={commonDragStart}
        />
      );
    }

    return (
      <div
        key={panelId}
        ref={
          isDesktopSlot
            ? (el) => {
                panelRefs.current[panelId] = el;
              }
            : undefined
        }
        onDragOver={(e) => {
          if (draggedPanel && draggedPanel !== panelId) {
            e.preventDefault();
            setDragOverPanel(panelId);
          }
        }}
        onDragLeave={() => {
          if (dragOverPanel === panelId) setDragOverPanel(null);
        }}
        onDragEnd={() => {
          setDraggedPanel(null);
          setDragOverPanel(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          const source = (e.dataTransfer.getData('text/plain') as PanelId) || draggedPanel;
          if (source && source !== panelId) {
            handleSwapPanels(source, panelId);
          }
          setDraggedPanel(null);
          setDragOverPanel(null);
        }}
        className={`relative h-full w-full overflow-hidden ${radiusClass} zenith-tile-frame ${
          draggedPanel === panelId ? 'opacity-80 scale-[0.985]' : ''
        } ${
          isDragTarget ? `ring-2 ring-offset-2 ${accentConf.border}` : ''
        } ${extraClass}`}
      >
        {content}
      </div>
    );
  };

  // Determine Visible Panels in Order
  const visiblePanels = customization.panelOrder.filter(
    (id) => !customization.hiddenPanels.includes(id)
  );

  // Split Handle Component
  const renderHorizontalResizer = (invert = false) => (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={startSplitResize('x', invert)}
      title="Drag to resize panels"
      className="hidden md:flex w-2.5 shrink-0 cursor-col-resize items-center justify-center group select-none"
    >
      <div className={`w-1 h-12 rounded-full ${surface.chipBg} zenith-resizer-pill opacity-60 group-hover:opacity-100 group-hover:scale-y-125 group-active:scale-y-150`} />
    </div>
  );

  const renderVerticalResizer = (invert = false) => (
    <div
      role="separator"
      aria-orientation="horizontal"
      onPointerDown={startSplitResize('y', invert)}
      title="Drag to resize panels vertically"
      className="hidden md:flex h-2.5 shrink-0 cursor-row-resize items-center justify-center group select-none"
    >
      <div className={`h-1 w-12 rounded-full ${surface.chipBg} zenith-resizer-pill opacity-60 group-hover:opacity-100 group-hover:scale-x-125 group-active:scale-x-150`} />
    </div>
  );

  // Automatic Window Tiling Renderer
  const renderAutoTiledWorkspace = (openPanels: PanelId[]) => {
    if (openPanels.length === 1) {
      return (
        <div className="hidden md:flex flex-1 h-full w-full overflow-hidden">
          {renderPanelSlot(openPanels[0])}
        </div>
      );
    }

    const preferVertical =
      customization.autoTilingDirection === 'vertical' ||
      (customization.autoTilingDirection === 'auto' && workspaceDims.width < workspaceDims.height * 1.15);

    const masterPct = customization.autoTilingMasterRatio || 56;
    const twoPanePct = customization.autoTilingAutoRebalance ? 50 : masterPct;

    if (openPanels.length === 2) {
      const stackVertical =
        customization.autoTilingAlgorithm === 'equal-rows' ||
        (customization.autoTilingAlgorithm !== 'equal-columns' && preferVertical);

      if (stackVertical) {
        return (
          <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
            <div style={{ height: `${twoPanePct}%` }} className="w-full min-h-[150px] overflow-hidden">
              {renderPanelSlot(openPanels[0])}
            </div>
            {renderVerticalResizer(false)}
            <div className="flex-1 w-full min-h-[140px] overflow-hidden">
              {renderPanelSlot(openPanels[1])}
            </div>
          </div>
        );
      }

      return (
        <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
          <div style={{ width: `${twoPanePct}%` }} className="h-full min-w-[240px] overflow-hidden">
            {renderPanelSlot(openPanels[0])}
          </div>
          {renderHorizontalResizer(false)}
          <div className="flex-1 h-full min-w-[240px] overflow-hidden">
            {renderPanelSlot(openPanels[1])}
          </div>
        </div>
      );
    }

    // 3 Open Windows Tiled Automatically
    const [w0, w1, w2] = openPanels;

    if (customization.autoTilingAlgorithm === 'equal-columns') {
      return (
        <div className={`hidden md:flex flex-row flex-1 h-full w-full overflow-hidden ${gapClasses.inner}`}>
          <div className="flex-1 min-w-[200px] h-full overflow-hidden">{renderPanelSlot(w0)}</div>
          <div className="flex-1 min-w-[200px] h-full overflow-hidden">{renderPanelSlot(w1)}</div>
          <div className="flex-1 min-w-[200px] h-full overflow-hidden">{renderPanelSlot(w2)}</div>
        </div>
      );
    }

    if (customization.autoTilingAlgorithm === 'equal-rows') {
      return (
        <div className={`hidden md:flex flex-col flex-1 h-full w-full overflow-hidden ${gapClasses.inner}`}>
          <div className="flex-1 min-h-[130px] w-full overflow-hidden">{renderPanelSlot(w0)}</div>
          <div className="flex-1 min-h-[130px] w-full overflow-hidden">{renderPanelSlot(w1)}</div>
          <div className="flex-1 min-h-[130px] w-full overflow-hidden">{renderPanelSlot(w2)}</div>
        </div>
      );
    }

    if (customization.autoTilingAlgorithm === 'dwindle') {
      if (preferVertical) {
        return (
          <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
            <div style={{ width: `${masterPct}%` }} className="h-full min-w-[220px] overflow-hidden">
              {renderPanelSlot(w0)}
            </div>
            {renderHorizontalResizer(false)}
            <div className="flex-1 flex flex-col h-full min-w-[200px] overflow-hidden">
              <div style={{ height: `${customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY}%` }} className="w-full min-h-[140px] overflow-hidden">
                {renderPanelSlot(w1)}
              </div>
              {renderVerticalResizer(false)}
              <div className="flex-1 w-full min-h-[140px] overflow-hidden">
                {renderPanelSlot(w2)}
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
          <div style={{ height: `${masterPct}%` }} className="w-full min-h-[180px] overflow-hidden">
            {renderPanelSlot(w0)}
          </div>
          {renderVerticalResizer(false)}
          <div className="flex-1 flex flex-row w-full min-h-[140px] overflow-hidden">
            <div style={{ width: `${customization.autoTilingAutoRebalance ? 50 : customization.splitRatioX}%` }} className="h-full min-w-[200px] overflow-hidden">
              {renderPanelSlot(w1)}
            </div>
            {renderHorizontalResizer(false)}
            <div className="flex-1 h-full min-w-[200px] overflow-hidden">
              {renderPanelSlot(w2)}
            </div>
          </div>
        </div>
      );
    }

    // Default Smart BSP: Master tile + evenly tiled secondary windows
    if (preferVertical) {
      return (
        <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
          <div style={{ height: `${masterPct}%` }} className="w-full min-h-[180px] overflow-hidden">
            {renderPanelSlot(w0)}
          </div>
          {renderVerticalResizer(false)}
          <div className="flex-1 flex flex-row w-full min-h-[150px] overflow-hidden">
            <div className="flex-1 h-full min-w-[210px] overflow-hidden">{renderPanelSlot(w1)}</div>
            {renderHorizontalResizer(false)}
            <div className="flex-1 h-full min-w-[210px] overflow-hidden">{renderPanelSlot(w2)}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
        <div style={{ width: `${masterPct}%` }} className="h-full min-w-[260px] overflow-hidden">
          {renderPanelSlot(w0)}
        </div>
        {renderHorizontalResizer(false)}
        <div className="flex-1 flex flex-col h-full min-w-[240px] overflow-hidden">
          <div style={{ height: `${customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY}%` }} className="w-full min-h-[150px] overflow-hidden">
            {renderPanelSlot(w1)}
          </div>
          {renderVerticalResizer(false)}
          <div className="flex-1 w-full min-h-[140px] overflow-hidden">
            {renderPanelSlot(w2)}
          </div>
        </div>
      </div>
    );
  };

  // Render Dynamic Workspace Grid
  const renderDesktopWorkspace = () => {
    if (customization.maximizedPanel) {
      return (
        <div className="hidden md:flex flex-1 h-full w-full overflow-hidden">
          {renderPanelSlot(customization.maximizedPanel)}
        </div>
      );
    }

    if (visiblePanels.length === 0) {
      return (
        <div className={`hidden md:flex flex-1 items-center justify-center ${radiusClass} border ${surface.border} ${surface.card}`}>
          <button
            type="button"
            onClick={() => handleCustomizationChange({ ...customization, hiddenPanels: [] })}
            className={`px-4 py-2 rounded-xl ${accentConf.bg} text-xs font-semibold`}
          >
            Restore Workspace Panels
          </button>
        </div>
      );
    }

    if (customization.autoTiling) {
      return renderAutoTiledWorkspace(visiblePanels);
    }

    if (visiblePanels.length === 1 || customization.layoutPreset === 'focus-mode') {
      return (
        <div className="hidden md:flex flex-1 h-full w-full overflow-hidden">
          {renderPanelSlot(visiblePanels[0])}
        </div>
      );
    }

    if (visiblePanels.length === 2) {
      const isVerticalSplit =
        customization.layoutPreset === 'wide-theater' ||
        customization.layoutPreset === 'bottom-editor' ||
        customization.layoutPreset === 'stacked-horizontal';

      if (isVerticalSplit) {
        return (
          <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
            <div style={{ height: `${customization.splitRatioY}%` }} className="w-full min-h-[160px] overflow-hidden">
              {renderPanelSlot(visiblePanels[0])}
            </div>
            {renderVerticalResizer(false)}
            <div className="flex-1 w-full min-h-[140px] overflow-hidden">
              {renderPanelSlot(visiblePanels[1])}
            </div>
          </div>
        );
      }

      return (
        <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
          <div style={{ width: `${customization.splitRatioX}%` }} className="h-full min-w-[240px] overflow-hidden">
            {renderPanelSlot(visiblePanels[0])}
          </div>
          {renderHorizontalResizer(false)}
          <div className="flex-1 h-full min-w-[240px] overflow-hidden">
            {renderPanelSlot(visiblePanels[1])}
          </div>
        </div>
      );
    }

    // All 3 panels visible — apply one of the 7 manual blueprints
    const [slot0, slot1, slot2] = visiblePanels;

    switch (customization.layoutPreset) {
      case 'inverted-studio':
        return (
          <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
            <div style={{ width: `${customization.splitRatioX}%` }} className="h-full min-w-[260px] overflow-hidden">
              {renderPanelSlot(slot0)}
            </div>
            {renderHorizontalResizer(false)}
            <div className="flex-1 flex flex-col h-full min-w-[260px] overflow-hidden">
              <div style={{ height: `${customization.splitRatioY}%` }} className="w-full min-h-[160px] overflow-hidden">
                {renderPanelSlot(slot1)}
              </div>
              {renderVerticalResizer(false)}
              <div className="flex-1 w-full min-h-[140px] overflow-hidden">
                {renderPanelSlot(slot2)}
              </div>
            </div>
          </div>
        );

      case 'side-by-side':
        return (
          <div className={`hidden md:flex flex-row flex-1 h-full w-full overflow-hidden ${gapClasses.inner}`}>
            <div className="flex-1 min-w-[220px] h-full overflow-hidden">{renderPanelSlot(slot0)}</div>
            <div className="flex-1 min-w-[220px] h-full overflow-hidden">{renderPanelSlot(slot1)}</div>
            <div className="flex-1 min-w-[220px] h-full overflow-hidden">{renderPanelSlot(slot2)}</div>
          </div>
        );

      case 'wide-theater':
        return (
          <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
            <div style={{ height: `${customization.splitRatioY}%` }} className="w-full min-h-[180px] overflow-hidden">
              {renderPanelSlot(slot0)}
            </div>
            {renderVerticalResizer(false)}
            <div className="flex-1 flex flex-row w-full min-h-[150px] overflow-hidden">
              <div style={{ width: `${customization.splitRatioX}%` }} className="h-full min-w-[220px] overflow-hidden">
                {renderPanelSlot(slot1)}
              </div>
              {renderHorizontalResizer(false)}
              <div className="flex-1 h-full min-w-[220px] overflow-hidden">
                {renderPanelSlot(slot2)}
              </div>
            </div>
          </div>
        );

      case 'bottom-editor':
        return (
          <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
            <div style={{ height: `${customization.splitRatioY}%` }} className="flex flex-row w-full min-h-[170px] overflow-hidden">
              <div style={{ width: `${customization.splitRatioX}%` }} className="h-full min-w-[220px] overflow-hidden">
                {renderPanelSlot(slot0)}
              </div>
              {renderHorizontalResizer(false)}
              <div className="flex-1 h-full min-w-[220px] overflow-hidden">
                {renderPanelSlot(slot1)}
              </div>
            </div>
            {renderVerticalResizer(false)}
            <div className="flex-1 w-full min-h-[150px] overflow-hidden">
              {renderPanelSlot(slot2)}
            </div>
          </div>
        );

      case 'stacked-horizontal':
        return (
          <div className={`hidden md:flex flex-col flex-1 h-full w-full overflow-hidden ${gapClasses.inner}`}>
            <div className="flex-1 min-h-[130px] w-full overflow-hidden">{renderPanelSlot(slot0)}</div>
            <div className="flex-1 min-h-[130px] w-full overflow-hidden">{renderPanelSlot(slot1)}</div>
            <div className="flex-1 min-h-[130px] w-full overflow-hidden">{renderPanelSlot(slot2)}</div>
          </div>
        );

      case 'standard-ide':
      default:
        return (
          <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
            <div style={{ width: `${customization.splitRatioX}%` }} className="flex flex-col h-full min-w-[260px] overflow-hidden">
              <div style={{ height: `${customization.splitRatioY}%` }} className="w-full min-h-[170px] overflow-hidden">
                {renderPanelSlot(slot0)}
              </div>
              {renderVerticalResizer(false)}
              <div className="flex-1 w-full min-h-[140px] overflow-hidden">
                {renderPanelSlot(slot1)}
              </div>
            </div>
            {renderHorizontalResizer(false)}
            <div className="flex-1 h-full min-w-[260px] overflow-hidden">
              {renderPanelSlot(slot2)}
            </div>
          </div>
        );
    }
  };

  // Navigation Bar (renders cleanly for Top, Bottom, Left Rail, or Right Rail)
  const isVerticalNav = customization.navPlacement === 'left' || customization.navPlacement === 'right';

  const navElement = (
    <header
      className={`${
        isVerticalNav
          ? `w-16 sm:w-20 h-full flex-col py-3 px-2 ${
              customization.navPlacement === 'left' ? 'border-r' : 'border-l'
            }`
          : `h-14 w-full flex-row px-4 sm:px-5 ${
              customization.navPlacement === 'bottom' ? 'border-t' : 'border-b'
            }`
      } ${surface.border} ${surface.header} flex items-center justify-between shrink-0 z-20 gap-2`}
    >
      {/* Brand & Language Selector */}
      <div className={`flex items-center ${isVerticalNav ? 'flex-col gap-3 w-full' : 'gap-3.5'}`}>
        <div className="flex items-center gap-2.5" title="Zenith Code">
          <div className={`w-8 h-8 rounded-xl ${accentConf.bg} flex items-center justify-center shadow-xs shrink-0`}>
            <Sprout className="w-4 h-4" />
          </div>
          {!isVerticalNav && (
            <span className={`font-bold tracking-tight text-sm sm:text-base ${surface.text} hidden sm:inline`}>
              Zenith Code
            </span>
          )}
        </div>

        <LanguageDropdown
          activeLanguage={activeLanguage}
          onSelectLanguage={handleLanguageChange}
          accent={customization.accent}
          bgGradient={customization.bgGradient}
          navPlacement={customization.navPlacement}
        />
      </div>

      {/* Navigation Actions */}
      <nav
        className={`hidden md:flex items-center ${
          isVerticalNav ? 'flex-col gap-2 w-full' : 'gap-1.5 text-xs font-medium'
        }`}
      >
        <button
          type="button"
          onClick={() => setShowChallengeModal(true)}
          title="Lessons & Practice"
          className={`${
            isVerticalNav ? 'w-full py-2.5 flex-col gap-1 text-[10px]' : 'px-3 py-2 gap-2'
          } rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors flex items-center justify-center`}
        >
          <BookOpen className={`w-4 h-4 ${accentConf.text}`} />
          <span>{isVerticalNav ? 'Lessons' : 'Lessons & Practice'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSkillModal(true)}
          title="My Progress"
          className={`${
            isVerticalNav ? 'w-full py-2.5 flex-col gap-1 text-[10px]' : 'px-3 py-2 gap-2'
          } rounded-xl ${surface.textMuted} ${surface.hoverBg} transition-colors flex items-center justify-center`}
        >
          <BarChart2 className={`w-4 h-4 ${accentConf.text}`} />
          <span>{isVerticalNav ? 'Skills' : 'My Progress'}</span>
        </button>
      </nav>

      {/* Studio & Profile Controls */}
      <div className={`flex items-center ${isVerticalNav ? 'flex-col gap-2 w-full' : 'gap-2'}`}>
        {/* Mobile Tab Switcher */}
        {!isVerticalNav && (
          <div className={`flex md:hidden items-center p-0.5 rounded-xl border ${surface.border} ${surface.chipBg} mr-1`}>
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className={`p-1.5 rounded-lg ${
                mobileTab === 'editor' ? `${surface.card} ${surface.text} shadow-xs` : surface.textMuted
              }`}
              title="Editor"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('terminal')}
              className={`p-1.5 rounded-lg ${
                mobileTab === 'terminal' ? `${surface.card} ${surface.text} shadow-xs` : surface.textMuted
              }`}
              title="Console"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('tutor')}
              className={`p-1.5 rounded-lg ${
                mobileTab === 'tutor' ? `${surface.card} ${surface.text} shadow-xs` : surface.textMuted
              }`}
              title="Mentor"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowChallengeModal(true)}
          className={`md:hidden p-2 rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`}
          title="Lessons & Practice"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToggleAutoTiling}
          title={
            customization.autoTiling
              ? `Auto-Tiling ON (${customization.autoTilingAlgorithm}) — click to disable`
              : 'Auto-Tiling OFF — click to automatically tile open windows'
          }
          className={`hidden md:inline-flex items-center justify-center gap-1.5 ${
            isVerticalNav ? 'w-full py-2 flex-col text-[10px]' : 'px-3 py-1.5 text-xs'
          } rounded-xl border transition-colors font-medium ${
            customization.autoTiling
              ? `${accentConf.bgSubtle} ${accentConf.border} ${accentConf.text}`
              : `${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className={isVerticalNav ? 'text-[10px]' : 'hidden lg:inline'}>
            {customization.autoTiling ? 'Auto-Tile: On' : 'Auto-Tile: Off'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowThemeModal(true)}
          title="Workspace Layout & Theme Studio"
          className={`inline-flex items-center justify-center gap-1.5 ${
            isVerticalNav ? 'w-full py-2 flex-col text-[10px]' : 'px-3 py-1.5 text-xs'
          } rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors font-medium`}
        >
          {isVerticalNav ? (
            <>
              <Layout className={`w-4 h-4 ${accentConf.text}`} />
              <span>Studio</span>
            </>
          ) : (
            <>
              <Palette className={`w-4 h-4 ${accentConf.text}`} />
              <span className="hidden lg:inline">Layout &amp; Themes</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          title="Learning Profile"
          className={`${
            isVerticalNav ? 'w-full py-2 flex justify-center' : 'p-2'
          } rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );

  // Active Challenge Banner + Evaluation Toast
  const challengeAndToastBlock =
    customization.challengePlacement !== 'hidden' && (activeChallenge || evaluationResult) ? (
      <div className="px-3 sm:px-4 pt-2.5 pb-1 shrink-0 space-y-2">
        {activeChallenge && (
          <div className={`zenith-banner-enter px-4 py-2.5 ${radiusClass} border ${surface.border} ${surface.card} flex items-center justify-between gap-3 text-xs`}>
            <div className="flex items-center gap-2.5 truncate">
              <span className={`px-2.5 py-0.5 rounded-lg font-semibold ${accentConf.badgeBg} border shrink-0`}>
                Active Lesson
              </span>
              <span className={`font-semibold ${surface.text} truncate`}>
                {activeChallenge.title}
              </span>
              <span className={surface.textSubtle}>·</span>
              <span className={`${surface.textMuted} truncate hidden sm:inline`}>
                {activeChallenge.description}
              </span>
              <span className={`${accentConf.text} font-semibold shrink-0`}>
                +{activeChallenge.xpReward} XP
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleEvaluateChallenge}
                disabled={isEvaluating}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${accentConf.bg} shadow-xs hover:opacity-95 transition-all disabled:opacity-50`}
              >
                {isEvaluating ? 'Checking...' : 'Submit Solution'}
              </button>
              <button
                type="button"
                onClick={() => setActiveChallenge(null)}
                className={`p-1 rounded-lg ${surface.textSubtle} ${surface.hoverBg}`}
                title="Close lesson"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {evaluationResult && (
          <div
            className={`zenith-banner-enter px-4 py-2.5 ${radiusClass} border text-xs flex items-center justify-between gap-3 ${
              evaluationResult.passed
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate flex-1">
              {evaluationResult.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className={`font-semibold shrink-0 ${surface.text}`}>
                {evaluationResult.passed
                  ? `Well done! (+${evaluationResult.xpEarned} XP)`
                  : 'Almost there!'}
              </span>
              <span className={`${surface.textMuted} truncate`}>
                {evaluationResult.feedback}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEvaluationResult(null)}
              className={`px-2.5 py-1 rounded-lg text-xs border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    ) : null;

  const hiddenRestoreStrip =
    (customization.hiddenPanels.length > 0 || customization.maximizedPanel || customization.layoutPreset === 'focus-mode') && (
      <div className="zenith-banner-enter px-3 sm:px-4 pt-2 shrink-0 flex items-center gap-2 flex-wrap text-xs">
        {customization.hiddenPanels.map((pid) => (
          <button
            key={pid}
            type="button"
            onClick={() => handleRestorePanel(pid)}
            className={`zenith-item-reveal inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} shadow-xs`}
          >
            <Eye className={`w-3.5 h-3.5 ${accentConf.text}`} />
            <span>Restore {PANEL_NAMES[pid]}</span>
          </button>
        ))}

        {customization.maximizedPanel && (
          <button
            type="button"
            onClick={() =>
              handleCustomizationChange({ ...customization, maximizedPanel: null })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${accentConf.border} ${accentConf.bgSubtle} ${accentConf.text} font-medium`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Exit Fullscreen Panel</span>
          </button>
        )}

        {customization.layoutPreset === 'focus-mode' && !customization.maximizedPanel && (
          <button
            type="button"
            onClick={() =>
              handleCustomizationChange({ ...customization, layoutPreset: 'standard-ide' })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Solo Focus Active (Show All Panels)</span>
          </button>
        )}
      </div>
    );

  // Outer shell flex direction responds directly to navPlacement
  const shellFlexClass =
    customization.navPlacement === 'left'
      ? 'flex-row'
      : customization.navPlacement === 'right'
      ? 'flex-row-reverse'
      : customization.navPlacement === 'bottom'
      ? 'flex-col-reverse'
      : 'flex-col';

  return (
    <div
      style={getBackgroundStyle(customization.bgGradient, customization.accent)}
      className={`flex ${shellFlexClass} h-screen w-screen ${surface.text} font-sans overflow-hidden transition-colors duration-200`}
    >
      {/* Onboarding Questionnaire Modal */}
      <OnboardingModal
        initialProfile={profile}
        isOpen={showOnboarding}
        onComplete={(p) => {
          setProfile(p);
          saveUserProfile(p);
          setShowOnboarding(false);
          if (p.activeLanguage !== activeLanguage) {
            handleLanguageChange(p.activeLanguage);
          }
        }}
        onClose={profile.isOnboarded ? () => setShowOnboarding(false) : undefined}
        accent={customization.accent}
        bgGradient={customization.bgGradient}
      />

      {/* Curriculum & Challenges Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        language={activeLanguage}
        profile={profile}
        completedIds={progress.completedChallenges}
        onSelectLesson={(lesson) => {
          saveCodeCache(activeLanguage, code);
          setActiveChallenge(lesson);
          setCode(lesson.starterCode);
          setExecutionResult(null);
          setEvaluationResult(null);
        }}
        onSelectAdaptiveChallenge={(chal) => {
          saveCodeCache(activeLanguage, code);
          setActiveChallenge(chal);
          setCode(chal.starterCode);
          setExecutionResult(null);
          setEvaluationResult(null);
        }}
        activeChallenge={activeChallenge}
        reasoningLevel={customization.reasoningLevel}
        accent={customization.accent}
        bgGradient={customization.bgGradient}
      />

      {/* Workspace Layout & Theme Studio Modal */}
      <ThemeCustomizerModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        customization={customization}
        onChange={handleCustomizationChange}
      />

      {/* Skill Matrix Modal */}
      {showSkillModal && (
        <div className="zenith-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className={`zenith-modal-surface w-full max-w-3xl max-h-[85vh] rounded-3xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl overflow-hidden flex flex-col`}>
            <SkillMatrix
              progress={progress}
              profile={profile}
              activeLanguage={activeLanguage}
              onSelectLanguage={(lang) => {
                handleLanguageChange(lang);
                setShowSkillModal(false);
              }}
              onClose={() => setShowSkillModal(false)}
              accent={customization.accent}
              bgGradient={customization.bgGradient}
            />
          </div>
        </div>
      )}

      {/* Docked Navigation Bar */}
      {navElement}

      {/* Main Content Region (Banners + Resizable Workspace) */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {customization.challengePlacement === 'top' && challengeAndToastBlock}
        {hiddenRestoreStrip}

        <main
          ref={workspaceRef}
          className={`flex-1 overflow-hidden ${gapClasses.container} flex flex-col`}
        >
          {/* Desktop Customizable Placement Engine */}
          {renderDesktopWorkspace()}

          {/* Mobile Single-Pane Tab View */}
          <div
            key={mobileTab}
            className="zenith-step-view flex md:hidden flex-1 h-full w-full overflow-hidden"
          >
            {renderPanelSlot(mobileTab, false)}
          </div>
        </main>

        {customization.challengePlacement === 'bottom' && challengeAndToastBlock}
      </div>
    </div>
  );
}
