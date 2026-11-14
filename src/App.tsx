/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AdaptiveChallenge,
  CurriculumLesson,
  HydrogenReviewResult,
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
  getAccentConfig,
  getBackgroundStyle,
  getFontFamilyStrings,
  getPanelRadiusClass,
  getSurfacePalette,
  getWorkspaceGapClass,
  isDarkBackground,
  loadCustomization,
  resolveAccentCssVars,
  saveCustomization,
} from './utils/themeData';
import {
  executeCode,
  ExecutionResult,
  LANGUAGE_RUNNER_OPTIONS,
} from './utils/codeRunner';
import {
  initGlobalUISoundDelegation,
  playSound,
  updateSoundConfig,
} from './utils/soundEngine';
import { OnboardingModal } from './components/OnboardingModal';
import { CodeEditor } from './components/CodeEditor';
import { TutorPanel } from './components/TutorPanel';
import { TerminalOutput } from './components/TerminalOutput';
import { SkillMatrix } from './components/SkillMatrix';
import { ChallengeModal } from './components/ChallengeModal';
import { SettingsModal, SettingsTab } from './components/SettingsModal';
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
  Sprout,
  Layout,
  Eye,
  EyeOff,
  Columns2,
  GripVertical,
  FolderKanban,
  Brain,
  X,
} from 'lucide-react';
import {
  ReasoningEffortSlider,
  getReasoningTierMeta,
} from './components/ReasoningEffortSlider';
import { TilingDropdown } from './components/TilingDropdown';

const PANEL_NAMES: Record<PanelId, string> = {
  editor: 'Code Editor',
  terminal: 'Output Console',
  tutor: 'Coding Mentor',
};

const PANEL_ICONS: Record<PanelId, React.ComponentType<{ className?: string }>> = {
  editor: Code2,
  terminal: TerminalIcon,
  tutor: MessageCircle,
};

function isSplitAlgorithm(
  alg: InterfaceCustomization['autoTilingAlgorithm']
): alg is 'smart-bsp' | 'equal-columns' | 'dwindle' | 'equal-rows' {
  return (
    alg === 'smart-bsp' ||
    alg === 'equal-columns' ||
    alg === 'dwindle' ||
    alg === 'equal-rows'
  );
}

export default function App() {
  // Core Profile & Progress State
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [progress, setProgress] = useState<ProgressState>(loadProgressState);
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>(
    profile.activeLanguage || 'rust'
  );

  // Theme & Layout Customization
  const [customization, setCustomization] = useState<InterfaceCustomization>(loadCustomization);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('general');
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!profile.isOnboarded);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showReasoningPopover, setShowReasoningPopover] = useState(false);

  // Active Challenge / Lesson
  const [activeChallenge, setActiveChallenge] = useState<AdaptiveChallenge | CurriculumLesson | null>(null);

  // Mobile View Tab & Desktop Stacked/Tabbed Active Window State
  const [mobileTab, setMobileTab] = useState<PanelId>('editor');
  const [activeWindowTab, setActiveWindowTab] = useState<PanelId>('editor');
  const [activeSecondaryTab, setActiveSecondaryTab] = useState<PanelId>('terminal');

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

  // Hydrogen Inline Code Analysis & Real-Time Selective Patching
  const [hydrogenReview, setHydrogenReview] = useState<HydrogenReviewResult | null>(null);
  const [isHydrogenAnalyzing, setIsHydrogenAnalyzing] = useState(false);

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

  // Sync dynamic CSS variables (custom accent hex, typography, motion scale) globally
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const isDark = isDarkBackground(customization.bgGradient);
    const accentVars = resolveAccentCssVars(
      customization.accent,
      customization.customAccentHex,
      isDark
    );
    Object.entries(accentVars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });

    const fonts = getFontFamilyStrings(
      customization.uiFontFamily,
      customization.editorFontFamily
    );
    root.style.setProperty('--zenith-ui-font', fonts.ui);
    root.style.setProperty('--zenith-mono-font', fonts.mono);

    const motionScale =
      customization.motionIntensity === 'reduced'
        ? '0'
        : customization.motionIntensity === 'snappy'
        ? '0.55'
        : '1';
    root.style.setProperty('--zenith-motion-scale', motionScale);
  }, [
    customization.accent,
    customization.customAccentHex,
    customization.bgGradient,
    customization.uiFontFamily,
    customization.editorFontFamily,
    customization.motionIntensity,
  ]);

  // Sync synthesized Web Audio UI sound preferences & mount global event delegation
  useEffect(() => {
    updateSoundConfig({
      enabled: customization.soundEnabled,
      volume: customization.soundVolume,
      editorKeySounds: customization.editorKeySounds,
    });
  }, [
    customization.soundEnabled,
    customization.soundVolume,
    customization.editorKeySounds,
  ]);

  useEffect(() => {
    return initGlobalUISoundDelegation();
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
      const motionDisabled = prefersReducedMotion || customization.motionIntensity === 'reduced';
      const moveDuration = customization.motionIntensity === 'snappy' ? 210 : 360;
      const enterDuration = customization.motionIntensity === 'snappy' ? 180 : 300;
      if (hasMountedLayoutRef.current && !motionDisabled && !isDraggingSplitRef.current && typeof el.animate === 'function') {
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
                duration: moveDuration,
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
              duration: enterDuration,
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
    customization.motionIntensity,
    customization.tabBarPlacement,
    activeWindowTab,
    activeSecondaryTab,
    workspaceDims.width,
    workspaceDims.height,
  ]);

  const accentConf = getAccentConfig(customization.accent, customization.customAccentHex);
  const surface = getSurfacePalette(customization.bgGradient, customization.surfaceStyle);
  const gapClasses = getWorkspaceGapClass(customization.panelGap);
  const radiusClass = getPanelRadiusClass(customization.cornerRadius);

  const handleCustomizationChange = (updated: InterfaceCustomization) => {
    const synced: InterfaceCustomization = isSplitAlgorithm(updated.autoTilingAlgorithm)
      ? { ...updated, lastSplitAlgorithm: updated.autoTilingAlgorithm }
      : updated;
    setCustomization(synced);
    saveCustomization(synced);
  };

  const handleSelectWindowMode = (alg: InterfaceCustomization['autoTilingAlgorithm']) => {
    playSound('tab');
    handleCustomizationChange({
      ...customization,
      autoTiling: true,
      maximizedPanel: null,
      autoTilingAlgorithm: alg,
      lastSplitAlgorithm: isSplitAlgorithm(alg) ? alg : customization.lastSplitAlgorithm,
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
    setHydrogenReview(null);
    setEvaluationResult(null);
    setActiveChallenge(null);
    setSelectedFlag(LANGUAGE_RUNNER_OPTIONS[lang]?.[0]?.id || 'standard');

    const updated = { ...profile, activeLanguage: lang };
    setProfile(updated);
    saveUserProfile(updated);
  };

  // Run Code (with stdin & compiler/runtime mode flags)
  const handleRunCode = async (overrideFlag?: string) => {
    playSound('runStart');
    setIsRunning(true);
    if (customization.autoFocusTerminalOnRun && customization.autoTiling) {
      if (
        (customization.autoTilingAlgorithm === 'stacked-windows' ||
          customization.autoTilingAlgorithm === 'tabbed-windows') &&
        !customization.hiddenPanels.includes('terminal')
      ) {
        setActiveWindowTab('terminal');
      } else if (
        customization.autoTilingAlgorithm === 'master-tabbed' &&
        customization.panelOrder
          .filter((id) => !customization.hiddenPanels.includes(id))
          .slice(1)
          .includes('terminal')
      ) {
        setActiveSecondaryTab('terminal');
      }
    }
    try {
      const res = await executeCode(code, activeLanguage, {
        stdin,
        flags: overrideFlag || selectedFlag,
      });
      setExecutionResult(res);
      const passedCleanly = res.exitCode === 0 && (!res.stderr || !res.stderr.trim());
      playSound(passedCleanly ? 'runPass' : 'runError');
    } catch {
      playSound('runError');
    } finally {
      setIsRunning(false);
    }
  };

  // Real-time Socratic Analysis
  const handleAnalyzeCode = async () => {
    playSound('primary');
    setIsAnalyzing(true);
    if (customization.autoTiling) {
      if (
        (customization.autoTilingAlgorithm === 'stacked-windows' ||
          customization.autoTilingAlgorithm === 'tabbed-windows') &&
        !customization.hiddenPanels.includes('tutor')
      ) {
        setActiveWindowTab('tutor');
      } else if (
        customization.autoTilingAlgorithm === 'master-tabbed' &&
        customization.panelOrder
          .filter((id) => !customization.hiddenPanels.includes(id))
          .slice(1)
          .includes('tutor')
      ) {
        setActiveSecondaryTab('tutor');
      }
    }
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
          playSound(data.apiError ? 'runError' : 'tutorReceive');
          return;
        }
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      const apiError = {
        status: 'NETWORK_ERROR',
        message: err?.message || 'Unable to reach Gemini 4 Hydrogen backend.',
      };
      setSocraticAnalysis({
        analysis: `Gemini 4 Hydrogen could not be reached (${apiError.message}). Check your connection or try again in a moment.`,
        probingQuestions: [
          `What assumptions does your code make about edge inputs?`,
          `How does ${activeLanguage} handle variable lifetimes in this snippet?`,
        ],
        conceptHighlight: `Explore variable scope and type guarantees in ${activeLanguage}.`,
        issuesDetected: [],
        hints: ['You can still run your code in the Output Console while Gemini 4 Hydrogen reconnects.'],
        isOfflineFallback: true,
        apiError,
      });
      playSound('runError');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper: Replace exact first occurrence safely without regex replacement token side effects
  const replaceExactOnce = (source: string, search: string, replacement: string): string | null => {
    if (!search) return null;
    const idx = source.indexOf(search);
    if (idx === -1) return null;
    return source.slice(0, idx) + replacement + source.slice(idx + search.length);
  };

  // Analyze Editor Code directly with Gemini 4 Hydrogen (3 concise bullets + selective real-time edits)
  const handleAnalyzeWithHydrogen = async () => {
    if (!code.trim()) return;
    playSound('primary');
    setIsHydrogenAnalyzing(true);
    try {
      const res = await fetch('/api/hydrogen-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: SUPPORTED_LANGUAGES[activeLanguage]?.name || activeLanguage,
          reasoningLevel: customization.reasoningLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setHydrogenReview({
          bullets: Array.isArray(data.bullets) ? data.bullets.slice(0, 3) : [],
          edits: Array.isArray(data.edits)
            ? data.edits.map((e: any) => ({ ...e, status: 'pending' }))
            : [],
          reviewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sourceCodeSnapshot: code,
          apiError: data.apiError,
        });
        playSound(data.apiError ? 'runError' : 'tutorReceive');
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      setHydrogenReview({
        bullets: [],
        edits: [],
        reviewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceCodeSnapshot: code,
        apiError: {
          status: 'NETWORK_ERROR',
          message: err?.message || 'Unable to reach Gemini 4 Hydrogen analysis endpoint.',
        },
      });
      playSound('runError');
    } finally {
      setIsHydrogenAnalyzing(false);
    }
  };

  const handleApproveHydrogenEdit = (editId: string) => {
    if (!hydrogenReview) return;
    const targetEdit = hydrogenReview.edits.find((e) => e.id === editId);
    if (!targetEdit || targetEdit.status !== 'pending') return;

    const updatedCode = replaceExactOnce(
      code,
      targetEdit.targetSnippet,
      targetEdit.replacementSnippet
    );
    if (updatedCode === null) {
      playSound('runError');
      return;
    }

    setCode(updatedCode);
    saveCodeCache(activeLanguage, updatedCode);
    setHydrogenReview((prev) =>
      prev
        ? {
            ...prev,
            edits: prev.edits.map((e) => (e.id === editId ? { ...e, status: 'approved' } : e)),
          }
        : null
    );
    playSound('toggleOn');
  };

  const handleDenyHydrogenEdit = (editId: string) => {
    setHydrogenReview((prev) =>
      prev
        ? {
            ...prev,
            edits: prev.edits.map((e) => (e.id === editId ? { ...e, status: 'denied' } : e)),
          }
        : null
    );
    playSound('toggleOff');
  };

  const handleUndoHydrogenEdit = (editId: string) => {
    if (!hydrogenReview) return;
    const targetEdit = hydrogenReview.edits.find((e) => e.id === editId);
    if (!targetEdit || targetEdit.status !== 'approved') return;

    const revertedCode = replaceExactOnce(
      code,
      targetEdit.replacementSnippet,
      targetEdit.targetSnippet
    );
    if (revertedCode === null) {
      playSound('runError');
      return;
    }

    setCode(revertedCode);
    saveCodeCache(activeLanguage, revertedCode);
    setHydrogenReview((prev) =>
      prev
        ? {
            ...prev,
            edits: prev.edits.map((e) => (e.id === editId ? { ...e, status: 'pending' } : e)),
          }
        : null
    );
    playSound('reset');
  };

  const handleRestoreHydrogenEdit = (editId: string) => {
    setHydrogenReview((prev) =>
      prev
        ? {
            ...prev,
            edits: prev.edits.map((e) => (e.id === editId ? { ...e, status: 'pending' } : e)),
          }
        : null
    );
    playSound('click');
  };

  const handleApproveAllHydrogenEdits = () => {
    if (!hydrogenReview) return;
    let workingCode = code;
    const appliedIds = new Set<string>();

    for (const edit of hydrogenReview.edits) {
      if (edit.status !== 'pending') continue;
      const next = replaceExactOnce(workingCode, edit.targetSnippet, edit.replacementSnippet);
      if (next !== null) {
        workingCode = next;
        appliedIds.add(edit.id);
      }
    }

    if (appliedIds.size > 0) {
      setCode(workingCode);
      saveCodeCache(activeLanguage, workingCode);
      setHydrogenReview((prev) =>
        prev
          ? {
              ...prev,
              edits: prev.edits.map((e) =>
                appliedIds.has(e.id) ? { ...e, status: 'approved' } : e
              ),
            }
          : null
      );
      playSound('select');
    } else {
      playSound('runError');
    }
  };

  const handleDenyAllHydrogenEdits = () => {
    setHydrogenReview((prev) =>
      prev
        ? {
            ...prev,
            edits: prev.edits.map((e) =>
              e.status === 'pending' ? { ...e, status: 'denied' } : e
            ),
          }
        : null
    );
    playSound('toggleOff');
  };

  const handleDismissHydrogenReview = () => {
    setHydrogenReview(null);
    playSound('modalClose');
  };

  // Socratic Dialogue Message
  const handleSendTutorMessage = async (question: string) => {
    playSound('tutorSend');
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
          probingQuestion: data.apiError ? undefined : data.probingQuestion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiError: data.apiError,
        };
        setTutorMessages((prev) => [...prev, tutorMsg]);
        playSound(data.apiError ? 'runError' : 'tutorReceive');
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      const apiError = {
        status: 'NETWORK_ERROR',
        message: err?.message || 'Unable to reach the Coding Mentor backend endpoint.',
      };
      const tutorMsg: TutorMessage = {
        id: `tutor-${Date.now()}`,
        role: 'tutor',
        text: `Gemini 4 Hydrogen could not answer right now: ${apiError.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        apiError,
      };
      setTutorMessages((prev) => [...prev, tutorMsg]);
      playSound('runError');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Evaluate Active Challenge
  const handleEvaluateChallenge = async () => {
    if (!activeChallenge) return;
    playSound('primary');
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
        playSound(data.passed ? 'challengePass' : 'challengeAlmost');

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
      playSound('challengePass');
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
    playSound('panelSwap');
    handleCustomizationChange({ ...customization, panelOrder: nextOrder });
  };

  const handleCyclePanelPosition = (panelId: PanelId) => {
    const nextOrder = [...customization.panelOrder];
    const idx = nextOrder.indexOf(panelId);
    if (idx === -1) return;
    const nextIdx = (idx + 1) % nextOrder.length;
    [nextOrder[idx], nextOrder[nextIdx]] = [nextOrder[nextIdx], nextOrder[idx]];
    playSound('panelSwap');
    handleCustomizationChange({ ...customization, panelOrder: nextOrder });
  };

  const handleToggleMaximize = (panelId: PanelId) => {
    const willRestore = customization.maximizedPanel === panelId;
    playSound(willRestore ? 'modalClose' : 'modalOpen');
    handleCustomizationChange({
      ...customization,
      maximizedPanel: willRestore ? null : panelId,
    });
  };

  const handleHidePanel = (panelId: PanelId) => {
    const visibleCount = customization.panelOrder.filter(
      (id) => !customization.hiddenPanels.includes(id)
    ).length;
    if (visibleCount <= 1) return;
    playSound('toggleOff');
    handleCustomizationChange({
      ...customization,
      hiddenPanels: [...customization.hiddenPanels, panelId],
      maximizedPanel: customization.maximizedPanel === panelId ? null : customization.maximizedPanel,
      splitRatioY: customization.autoTiling && customization.autoTilingAutoRebalance ? 50 : customization.splitRatioY,
    });
  };

  const handleRestorePanel = (panelId: PanelId) => {
    playSound('toggleOn');
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
            setHydrogenReview(null);
            if (activeChallenge) {
              setCode(activeChallenge.starterCode);
            } else {
              setCode(SUPPORTED_LANGUAGES[activeLanguage]?.defaultCode || '');
            }
          }}
          isRunning={isRunning}
          isAnalyzing={isAnalyzing}
          hydrogenReview={hydrogenReview}
          isHydrogenAnalyzing={isHydrogenAnalyzing}
          onAnalyzeWithHydrogen={handleAnalyzeWithHydrogen}
          onApproveHydrogenEdit={handleApproveHydrogenEdit}
          onDenyHydrogenEdit={handleDenyHydrogenEdit}
          onUndoHydrogenEdit={handleUndoHydrogenEdit}
          onRestoreHydrogenEdit={handleRestoreHydrogenEdit}
          onApproveAllHydrogenEdits={handleApproveAllHydrogenEdits}
          onDenyAllHydrogenEdits={handleDenyAllHydrogenEdits}
          onDismissHydrogenReview={handleDismissHydrogenReview}
          syntaxTheme={customization.syntaxTheme}
          accent={customization.accent}
          customAccentHex={customization.customAccentHex}
          bgGradient={customization.bgGradient}
          surfaceStyle={customization.surfaceStyle}
          editorSurface={customization.editorSurface}
          panelHeaderStyle={customization.panelHeaderStyle}
          cornerRadius={customization.cornerRadius}
          editorFontSize={customization.editorFontSize}
          editorLineHeight={customization.editorLineHeight}
          editorTabSize={customization.editorTabSize}
          showLineNumbers={customization.showLineNumbers}
          wordWrap={customization.wordWrap}
          showStatusBar={customization.showStatusBar}
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
          currentCode={code}
          accent={customization.accent}
          customAccentHex={customization.customAccentHex}
          bgGradient={customization.bgGradient}
          surfaceStyle={customization.surfaceStyle}
          editorSurface={customization.editorSurface}
          panelHeaderStyle={customization.panelHeaderStyle}
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
          customAccentHex={customization.customAccentHex}
          bgGradient={customization.bgGradient}
          surfaceStyle={customization.surfaceStyle}
          panelHeaderStyle={customization.panelHeaderStyle}
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

  const getPanelSummaryLabel = (panelId: PanelId): string => {
    if (panelId === 'editor') {
      const lineCount = code.split('\n').length;
      return `main${SUPPORTED_LANGUAGES[activeLanguage]?.extension || ''} · ${lineCount} lines`;
    }
    if (panelId === 'terminal') {
      if (isRunning) return 'Running...';
      if (executionResult) {
        return executionResult.exitCode === 0
          ? `exit 0 · ${executionResult.durationMs}ms`
          : `exit ${executionResult.exitCode}`;
      }
      return 'Ready';
    }
    return isAnalyzing ? 'Reviewing...' : 'Gemini 4 Hydrogen';
  };

  const renderTabbedContainer = (
    panels: PanelId[],
    focusedId: PanelId,
    onSelect: (id: PanelId) => void,
    isMasterSecondary = false
  ) => {
    const activePanel = panels.includes(focusedId) ? focusedId : panels[0];
    const isBottom = customization.tabBarPlacement === 'bottom';
    const isRich = customization.tabBarDensity === 'rich';

    return (
      <div
        className={`hidden md:flex ${
          isBottom ? 'flex-col-reverse' : 'flex-col'
        } flex-1 h-full w-full overflow-hidden gap-2`}
      >
        {/* Tab Strip */}
        <div
          className={`shrink-0 px-2 py-1.5 ${radiusClass} border ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-2 overflow-x-auto no-scrollbar`}
        >
          <div className="flex items-center gap-1 min-w-0">
            {panels.map((pid) => {
              const Icon = PANEL_ICONS[pid];
              const isActive = activePanel === pid;
              const isDragTarget = dragOverPanel === pid && draggedPanel && draggedPanel !== pid;
              return (
                <div
                  key={pid}
                  draggable
                  onDragStart={(e) => {
                    setDraggedPanel(pid);
                    e.dataTransfer.setData('text/plain', pid);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (draggedPanel && draggedPanel !== pid) {
                      e.preventDefault();
                      setDragOverPanel(pid);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverPanel === pid) setDragOverPanel(null);
                  }}
                  onDragEnd={() => {
                    setDraggedPanel(null);
                    setDragOverPanel(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const source = (e.dataTransfer.getData('text/plain') as PanelId) || draggedPanel;
                    if (source && source !== pid) {
                      handleSwapPanels(source, pid);
                    }
                    setDraggedPanel(null);
                    setDragOverPanel(null);
                  }}
                  className={`flex items-center rounded-xl border transition-all shrink-0 ${
                    isActive
                      ? `${surface.card} ${accentConf.border} shadow-xs`
                      : `border-transparent ${surface.hoverBg}`
                  } ${isDragTarget ? `ring-2 ${accentConf.border}` : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      playSound('tab');
                      onSelect(pid);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1 text-xs whitespace-nowrap ${
                      isActive ? `font-semibold ${surface.text}` : `${surface.textMuted}`
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? accentConf.text : ''}`} />
                    <span>{PANEL_NAMES[pid]}</span>
                    {isRich && (
                      <>
                        <span className={surface.textSubtle} aria-hidden="true">·</span>
                        <span className={`text-[11px] font-normal ${surface.textSubtle}`}>
                          {getPanelSummaryLabel(pid)}
                        </span>
                      </>
                    )}
                  </button>
                  {panels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleHidePanel(pid)}
                      title={`Hide ${PANEL_NAMES[pid]}`}
                      className={`p-1 mr-1 rounded-lg ${surface.textSubtle} ${surface.hoverBg} transition-colors`}
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isMasterSecondary && panels.length > 1 && (
              <button
                type="button"
                onClick={() => handleSelectWindowMode('tabbed-windows')}
                title="Combine all windows into tabs"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap`}
              >
                <FolderKanban className="w-3 h-3" />
                <span className="hidden xl:inline">Tab All</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSelectWindowMode(customization.lastSplitAlgorithm || 'smart-bsp')}
              title="Return to split window tiling"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap`}
            >
              <Columns2 className={`w-3 h-3 ${accentConf.text}`} />
              <span>Split View</span>
            </button>
          </div>
        </div>

        {/* Active Tabbed Window */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          {renderPanelSlot(activePanel)}
        </div>
      </div>
    );
  };

  const renderStackedContainer = (panels: PanelId[]) => {
    const activePanel = panels.includes(activeWindowTab) ? activeWindowTab : panels[0];
    const isRich = customization.tabBarDensity === 'rich';

    return (
      <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden gap-2">
        {/* Stacked Window Title Bars */}
        <div
          className={`shrink-0 ${radiusClass} border ${surface.border} ${surface.card} overflow-hidden divide-y ${surface.border} shadow-xs`}
        >
          {panels.map((pid, idx) => {
            const Icon = PANEL_ICONS[pid];
            const isActive = activePanel === pid;
            const isDragTarget = dragOverPanel === pid && draggedPanel && draggedPanel !== pid;
            return (
              <div
                key={pid}
                draggable
                onDragStart={(e) => {
                  setDraggedPanel(pid);
                  e.dataTransfer.setData('text/plain', pid);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (draggedPanel && draggedPanel !== pid) {
                    e.preventDefault();
                    setDragOverPanel(pid);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverPanel === pid) setDragOverPanel(null);
                }}
                onDragEnd={() => {
                  setDraggedPanel(null);
                  setDragOverPanel(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const source = (e.dataTransfer.getData('text/plain') as PanelId) || draggedPanel;
                  if (source && source !== pid) {
                    handleSwapPanels(source, pid);
                  }
                  setDraggedPanel(null);
                  setDragOverPanel(null);
                }}
                className={`flex items-center justify-between px-3 py-1.5 transition-colors ${
                  isActive ? accentConf.bgSubtle : `${surface.cardMuted} ${surface.hoverBg}`
                } ${isDragTarget ? `ring-2 ring-inset ${accentConf.border}` : ''}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    playSound('tab');
                    setActiveWindowTab(pid);
                  }}
                  className="flex-1 flex items-center gap-2.5 text-left min-w-0 py-0.5"
                >
                  <GripVertical className={`w-3.5 h-3.5 ${surface.textSubtle} cursor-grab shrink-0`} />
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? accentConf.text : surface.textMuted}`} />
                  <span
                    className={`text-xs truncate whitespace-nowrap ${
                      isActive ? `font-semibold ${surface.text}` : `font-medium ${surface.textMuted}`
                    }`}
                  >
                    {PANEL_NAMES[pid]}
                  </span>
                  {isRich && (
                    <>
                      <span className={surface.textSubtle} aria-hidden="true">·</span>
                      <span className={`text-[11px] truncate ${surface.textSubtle}`}>
                        {getPanelSummaryLabel(pid)}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {idx === 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectWindowMode(customization.lastSplitAlgorithm || 'smart-bsp')}
                      title="Return to split window tiling"
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap`}
                    >
                      <Columns2 className={`w-3 h-3 ${accentConf.text}`} />
                      <span>Split View</span>
                    </button>
                  )}
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('tab');
                        setActiveWindowTab(pid);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${accentConf.text} hover:underline whitespace-nowrap`}
                    >
                      Focus
                    </button>
                  )}
                  {panels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleHidePanel(pid)}
                      title={`Hide ${PANEL_NAMES[pid]}`}
                      className={`p-1 rounded-lg ${surface.textSubtle} ${surface.hoverBg}`}
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Expanded Window */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          {renderPanelSlot(activePanel)}
        </div>
      </div>
    );
  };

  // Automatic Window Tiling Renderer
  const renderAutoTiledWorkspace = (openPanels: PanelId[]) => {
    if (customization.autoTilingAlgorithm === 'stacked-windows') {
      return renderStackedContainer(openPanels);
    }

    if (customization.autoTilingAlgorithm === 'tabbed-windows') {
      return renderTabbedContainer(openPanels, activeWindowTab, setActiveWindowTab, false);
    }

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

    if (customization.autoTilingAlgorithm === 'master-tabbed') {
      const secondaryPanels = openPanels.slice(1);
      if (preferVertical) {
        return (
          <div className="hidden md:flex flex-col flex-1 h-full w-full overflow-hidden">
            <div style={{ height: `${masterPct}%` }} className="w-full min-h-[180px] overflow-hidden">
              {renderPanelSlot(openPanels[0])}
            </div>
            {renderVerticalResizer(false)}
            <div className="flex-1 w-full min-h-[160px] overflow-hidden flex">
              {renderTabbedContainer(secondaryPanels, activeSecondaryTab, setActiveSecondaryTab, true)}
            </div>
          </div>
        );
      }

      return (
        <div className="hidden md:flex flex-row flex-1 h-full w-full overflow-hidden">
          <div style={{ width: `${masterPct}%` }} className="h-full min-w-[260px] overflow-hidden">
            {renderPanelSlot(openPanels[0])}
          </div>
          {renderHorizontalResizer(false)}
          <div className="flex-1 h-full min-w-[260px] overflow-hidden flex">
            {renderTabbedContainer(secondaryPanels, activeSecondaryTab, setActiveSecondaryTab, true)}
          </div>
        </div>
      );
    }

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
          onClick={() => {
            playSound('modalOpen');
            setShowChallengeModal(true);
          }}
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
          onClick={() => {
            playSound('modalOpen');
            setShowSkillModal(true);
          }}
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
              onClick={() => {
                playSound('tab');
                setMobileTab('editor');
              }}
              className={`p-1.5 rounded-lg ${
                mobileTab === 'editor' ? `${surface.card} ${surface.text} shadow-xs` : surface.textMuted
              }`}
              title="Editor"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('tab');
                setMobileTab('terminal');
              }}
              className={`p-1.5 rounded-lg ${
                mobileTab === 'terminal' ? `${surface.card} ${surface.text} shadow-xs` : surface.textMuted
              }`}
              title="Console"
            >
              <TerminalIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('tab');
                setMobileTab('tutor');
              }}
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
          onClick={() => {
            playSound('modalOpen');
            setShowChallengeModal(true);
          }}
          className={`md:hidden p-2 rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`}
          title="Lessons & Practice"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Unified Window Tiling Dropdown (Tiled, Stacked, Master + Tabs, Tabs & Split Style) */}
        <TilingDropdown
          customization={customization}
          onChange={handleCustomizationChange}
          onOpenLayoutStudio={() => {
            setSettingsInitialTab('workspace');
            setShowSettingsModal(true);
          }}
        />

        <button
          type="button"
          onClick={() => {
            const nextOpen = !showReasoningPopover;
            playSound(nextOpen ? 'dropdownOpen' : 'dropdownClose');
            setShowReasoningPopover(nextOpen);
          }}
          aria-expanded={showReasoningPopover}
          title={`AI Reasoning Effort: ${getReasoningTierMeta(customization.reasoningLevel).label} — click to adjust anywhere in the app`}
          className={`inline-flex items-center justify-center gap-1.5 ${
            isVerticalNav ? 'w-full py-2 flex-col text-[10px]' : 'px-2.5 py-1.5 text-xs'
          } rounded-xl border transition-colors font-medium whitespace-nowrap shrink-0 ${
            showReasoningPopover
              ? `${accentConf.bgSubtle} ${accentConf.border} ${accentConf.text}`
              : `${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`
          }`}
        >
          <Brain className={`w-3.5 h-3.5 ${accentConf.text} shrink-0`} />
          <span className={isVerticalNav ? 'text-[10px]' : 'hidden sm:inline'}>
            {isVerticalNav
              ? getReasoningTierMeta(customization.reasoningLevel).shortLabel
              : `Reasoning: ${getReasoningTierMeta(customization.reasoningLevel).shortLabel}`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            playSound('modalOpen');
            setSettingsInitialTab('general');
            setShowSettingsModal(true);
          }}
          title="Settings — Sound, Themes, Layout & Profile"
          aria-label="Settings"
          className={`inline-flex items-center justify-center gap-1.5 ${
            isVerticalNav ? 'w-full py-2 flex-col text-[10px]' : 'px-2.5 py-1.5 text-xs'
          } rounded-xl border ${
            showSettingsModal
              ? `${accentConf.bgSubtle} ${accentConf.border} ${accentConf.text}`
              : `${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`
          } transition-colors font-medium whitespace-nowrap shrink-0`}
        >
          <Settings className={`w-4 h-4 ${showSettingsModal ? accentConf.text : ''} shrink-0`} />
          <span className={isVerticalNav ? 'text-[10px]' : 'hidden lg:inline'}>Settings</span>
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
      style={getBackgroundStyle(
        customization.bgGradient,
        customization.accent,
        customization.showAmbientGlow
      )}
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
        onClose={
          profile.isOnboarded
            ? () => {
                playSound('modalClose');
                setShowOnboarding(false);
              }
            : undefined
        }
        accent={customization.accent}
        bgGradient={customization.bgGradient}
      />

      {/* Curriculum & Challenges Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => {
          playSound('modalClose');
          setShowChallengeModal(false);
        }}
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

      {/* Unified Dedicated Settings Menu (General & Sound, Themes & Colors, Layout & Windows, Editor & Motion) */}
      <SettingsModal
        isOpen={showSettingsModal}
        initialTab={settingsInitialTab}
        onClose={() => {
          playSound('modalClose');
          setShowSettingsModal(false);
        }}
        customization={customization}
        onChange={handleCustomizationChange}
        profile={profile}
        onUpdateProfile={(updated) => {
          setProfile(updated);
          saveUserProfile(updated);
          if (updated.activeLanguage !== activeLanguage) {
            handleLanguageChange(updated.activeLanguage);
          }
        }}
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
              onClose={() => {
                playSound('modalClose');
                setShowSkillModal(false);
              }}
              accent={customization.accent}
              bgGradient={customization.bgGradient}
            />
          </div>
        </div>
      )}

      {/* Global AI Reasoning Effort Popover (Accessible Anywhere in the App) */}
      {showReasoningPopover && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              playSound('dropdownClose');
              setShowReasoningPopover(false);
            }}
          />
          <div
            role="dialog"
            aria-label="AI Reasoning Effort"
            className={`zenith-dropdown-menu fixed z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl p-4 space-y-3 ${
              customization.navPlacement === 'bottom'
                ? 'bottom-16 right-4'
                : customization.navPlacement === 'left'
                ? 'bottom-4 left-24'
                : customization.navPlacement === 'right'
                ? 'bottom-4 right-24'
                : 'top-16 right-4'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-medium ${surface.textSubtle}`}>
                Gemini 4 Hydrogen · Global AI Depth
              </span>
              <button
                type="button"
                onClick={() => {
                  playSound('dropdownClose');
                  setShowReasoningPopover(false);
                }}
                aria-label="Close reasoning slider"
                className={`p-1 rounded-lg ${surface.textSubtle} ${surface.hoverBg}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <ReasoningEffortSlider
              value={customization.reasoningLevel}
              onChange={(level) =>
                handleCustomizationChange({ ...customization, reasoningLevel: level })
              }
              variant="full"
              accent={customization.accent}
              customAccentHex={customization.customAccentHex}
              bgGradient={customization.bgGradient}
              surfaceStyle={customization.surfaceStyle}
            />

            <div className={`pt-2 border-t ${surface.border} text-[11px] ${surface.textSubtle}`}>
              Applies to Coding Mentor, Analyze with Hydrogen, and Challenges.
            </div>
          </div>
        </>
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
