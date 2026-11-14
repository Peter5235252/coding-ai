import React, { useRef, useState, useMemo } from 'react';
import {
  AutocompleteItem,
  BackgroundGradientStyle,
  CornerRadiusStyle,
  EditorFontSize,
  EditorLineHeight,
  EditorSurfaceStyle,
  HydrogenCodeEdit,
  HydrogenReviewResult,
  PanelHeaderStyle,
  SurfaceStyle,
  SupportedLanguage,
  SyntaxTheme,
  AccentColor,
} from '../types';
import { AUTOCOMPLETE_DICTIONARY, SUPPORTED_LANGUAGES } from '../utils/languageData';
import { highlightTokensToHtml, tokenizeCode } from '../utils/highlighter';
import {
  getAccentConfig,
  getEditorSurfaceColors,
  getPanelRadiusClass,
  getSurfacePalette,
} from '../utils/themeData';
import { PanelControls } from './PanelControls';
import { playSound } from '../utils/soundEngine';
import {
  Play,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  FileCode2,
  Atom,
  X,
  AlertCircle,
  Undo2,
  CheckCircle2,
} from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (newCode: string) => void;
  onRun: () => void;
  onAnalyze: () => void;
  onReset: () => void;
  isRunning?: boolean;
  isAnalyzing?: boolean;
  hydrogenReview?: HydrogenReviewResult | null;
  isHydrogenAnalyzing?: boolean;
  onAnalyzeWithHydrogen?: () => void;
  onApproveHydrogenEdit?: (editId: string) => void;
  onDenyHydrogenEdit?: (editId: string) => void;
  onUndoHydrogenEdit?: (editId: string) => void;
  onRestoreHydrogenEdit?: (editId: string) => void;
  onApproveAllHydrogenEdits?: () => void;
  onDenyAllHydrogenEdits?: () => void;
  onDismissHydrogenReview?: () => void;
  syntaxTheme?: SyntaxTheme;
  accent?: AccentColor;
  customAccentHex?: string;
  bgGradient?: BackgroundGradientStyle;
  surfaceStyle?: SurfaceStyle;
  editorSurface?: EditorSurfaceStyle;
  panelHeaderStyle?: PanelHeaderStyle;
  cornerRadius?: CornerRadiusStyle;
  editorFontSize?: EditorFontSize;
  editorLineHeight?: EditorLineHeight;
  editorTabSize?: 2 | 4;
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  showStatusBar?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onCyclePosition?: () => void;
  onHidePanel?: () => void;
  onDragStartPanel?: (e: React.DragEvent) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onRun,
  onAnalyze,
  onReset,
  isRunning = false,
  isAnalyzing = false,
  hydrogenReview = null,
  isHydrogenAnalyzing = false,
  onAnalyzeWithHydrogen,
  onApproveHydrogenEdit,
  onDenyHydrogenEdit,
  onUndoHydrogenEdit,
  onRestoreHydrogenEdit,
  onApproveAllHydrogenEdits,
  onDenyAllHydrogenEdits,
  onDismissHydrogenReview,
  syntaxTheme = 'warm-botanical',
  accent = 'sage',
  customAccentHex,
  bgGradient = 'warm-linen',
  surfaceStyle = 'crisp',
  editorSurface = 'matte-slate',
  panelHeaderStyle = 'detailed',
  cornerRadius = 'rounded',
  editorFontSize = 'md',
  editorLineHeight = 'comfortable',
  editorTabSize = 4,
  showLineNumbers = true,
  wordWrap = false,
  showStatusBar = true,
  isMaximized = false,
  onToggleMaximize,
  onCyclePosition,
  onHidePanel,
  onDragStartPanel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [copied, setCopied] = useState(false);
  const [hoveredEditId, setHoveredEditId] = useState<string | null>(null);

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteCoords, setAutocompleteCoords] = useState<{ top: number; left: number }>({ top: 30, left: 60 });

  const lines = useMemo(() => code.split('\n'), [code]);

  const highlightedEditRange = useMemo(() => {
    if (!hoveredEditId || !hydrogenReview) return null;
    const found = hydrogenReview.edits.find((e) => e.id === hoveredEditId);
    return found ? { start: found.lineStart, end: found.lineEnd } : null;
  }, [hoveredEditId, hydrogenReview]);

  const fontSizeClass =
    editorFontSize === 'sm'
      ? 'text-[11px]'
      : editorFontSize === 'lg'
      ? 'text-sm'
      : editorFontSize === 'xl'
      ? 'text-base'
      : 'text-xs';

  const lineHeightMap: Record<EditorFontSize, Record<EditorLineHeight, number>> = {
    sm: { compact: 18, comfortable: 20, relaxed: 24 },
    md: { compact: 20, comfortable: 24, relaxed: 28 },
    lg: { compact: 24, comfortable: 28, relaxed: 32 },
    xl: { compact: 26, comfortable: 32, relaxed: 36 },
  };
  const lineHeightPx = lineHeightMap[editorFontSize]?.[editorLineHeight] ?? 24;
  const indentUnit = editorTabSize === 2 ? '  ' : '    ';

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const lineList = textBefore.split('\n');
    const currentLine = lineList.length;
    const currentCol = lineList[lineList.length - 1].length + 1;
    setCursorPos({ ln: currentLine, col: currentCol });

    const match = textBefore.match(/([a-zA-Z_@:.]+)$/);
    if (match && match[1].length >= 1) {
      const query = match[1];
      setAutocompleteQuery(query);
      setShowAutocomplete(true);
      setAutocompleteIndex(0);

      const charWidth = editorFontSize === 'lg' ? 9 : 8.2;
      const top = Math.min(360, (currentLine - 1) * lineHeightPx - (textareaRef.current.scrollTop || 0) + 36);
      const left = Math.min(500, Math.max(48, currentCol * charWidth - (textareaRef.current.scrollLeft || 0) + 36));
      setAutocompleteCoords({ top, left });
    } else {
      setShowAutocomplete(false);
    }
  };

  const filteredSuggestions: AutocompleteItem[] = useMemo(() => {
    if (!autocompleteQuery) return [];
    const dict = AUTOCOMPLETE_DICTIONARY[language] || [];
    const userTokens = Array.from(new Set(code.match(/\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g) || []));
    const dynamicItems: AutocompleteItem[] = userTokens.map((t) => ({
      label: t,
      insertText: t,
      type: 'keyword',
      detail: 'In file',
    }));

    const combined = [...dict, ...dynamicItems];
    const q = autocompleteQuery.toLowerCase();

    return combined
      .filter((item) => item.label.toLowerCase().includes(q) || item.label.toLowerCase().startsWith(q))
      .slice(0, 7);
  }, [autocompleteQuery, language, code]);

  const applyAutocomplete = (item: AutocompleteItem) => {
    if (!textareaRef.current) return;
    const selStart = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, selStart);
    const textAfter = code.substring(selStart);

    const replaced = textBefore.replace(new RegExp(`${autocompleteQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
    const cleanInsert = item.insertText.replace(/\$\{\d+:?(.*?)\}/g, '$1').replace(/\$0/g, '');

    const newCode = replaced + cleanInsert + textAfter;
    onChange(newCode);
    setShowAutocomplete(false);
    playSound('select');

    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = replaced.length + cleanInsert.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to Run Code quickly
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isRunning) onRun();
      return;
    }

    if (showAutocomplete && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex((prev) => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applyAutocomplete(filteredSuggestions[autocompleteIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        playSound('dropdownClose');
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      playSound('keystroke');
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = code.substring(0, start) + indentUnit + code.substring(end);
      onChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + indentUnit.length;
          updateCursorPosition();
        }
      }, 0);
      return;
    }

    if (e.key === 'Enter') {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const textBefore = code.substring(0, start);
      const currentLine = textBefore.split('\n').pop() || '';
      const indentMatch = currentLine.match(/^(\s+)/);
      let indent = indentMatch ? indentMatch[1] : '';

      const trimmed = currentLine.trim();
      if (
        trimmed.endsWith('{') ||
        trimmed.endsWith(':') ||
        trimmed.endsWith('then') ||
        trimmed.endsWith('do')
      ) {
        indent += indentUnit;
      }

      if (indent) {
        e.preventDefault();
        playSound('keystroke');
        const newVal = code.substring(0, start) + '\n' + indent + code.substring(end);
        onChange(newVal);
        setTimeout(() => {
          if (textareaRef.current) {
            const nextPos = start + 1 + indent.length;
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = nextPos;
            updateCursorPosition();
          }
        }, 0);
        return;
      }
    }

    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
    };

    if (pairs[e.key]) {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const selected = code.substring(start, end);

      e.preventDefault();
      playSound('keystroke');
      const newVal =
        code.substring(0, start) + e.key + selected + pairs[e.key] + code.substring(end);
      onChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 1;
          textareaRef.current.selectionEnd = start + 1 + selected.length;
          updateCursorPosition();
        }
      }, 0);
      return;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    playSound('copy');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tokens = useMemo(() => tokenizeCode(code, language), [code, language]);
  const highlightedHtml = useMemo(() => highlightTokensToHtml(tokens, syntaxTheme), [tokens, syntaxTheme]);

  const langMeta = SUPPORTED_LANGUAGES[language];
  const accentConf = getAccentConfig(accent, customAccentHex);
  const surface = getSurfacePalette(bgGradient, surfaceStyle);
  const editorColors = getEditorSurfaceColors(editorSurface);
  const radiusClass = getPanelRadiusClass(cornerRadius);
  const wrapClass = wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre';

  return (
    <div className={`zenith-tile-frame flex flex-col h-full ${radiusClass} border ${surface.border} ${surface.card} overflow-hidden`}>
      {/* Draggable Editor Header */}
      <div
        draggable={!!onDragStartPanel}
        onDragStart={onDragStartPanel}
        className={`flex items-center justify-between ${
          panelHeaderStyle === 'minimal'
            ? 'px-3 py-1.5'
            : panelHeaderStyle === 'compact'
            ? 'px-3.5 py-1.5'
            : 'px-3.5 py-2'
        } border-b ${surface.border} ${surface.cardMuted} text-xs shrink-0 gap-2`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {panelHeaderStyle !== 'minimal' && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentConf.bgSubtle} ${accentConf.text}`}>
              <FileCode2 className="w-4 h-4" />
            </div>
          )}
          <div className="truncate">
            <span className={`font-semibold text-xs ${surface.text} block leading-tight truncate`}>
              main{langMeta?.extension || '.rs'}
            </span>
            {panelHeaderStyle === 'detailed' && (
              <span className={`text-[11px] ${surface.textSubtle} truncate block`}>
                {langMeta?.name} Editor
              </span>
            )}
          </div>
        </div>

        {/* Action & Placement Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              playSound('reset');
              onReset();
            }}
            title="Reset to starter code"
            className={`p-1.5 rounded-xl border ${surface.border} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className={`p-1.5 rounded-xl border ${surface.border} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${surface.border} ${surface.card} ${surface.text} ${surface.hoverBg} transition-colors disabled:opacity-50 text-xs font-medium whitespace-nowrap shrink-0`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${accentConf.text}`} />
            <span>{isAnalyzing ? 'Reviewing...' : 'Ask Tutor'}</span>
          </button>

          {onAnalyzeWithHydrogen && (
            <button
              type="button"
              onClick={onAnalyzeWithHydrogen}
              disabled={isHydrogenAnalyzing || !code.trim()}
              title="Analyze script in 3 bullet points and propose live fixes with Gemini 4 Hydrogen"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${accentConf.border} ${accentConf.bgSubtle} ${surface.text} hover:opacity-90 transition-all disabled:opacity-50 text-xs font-semibold whitespace-nowrap shrink-0`}
            >
              <Atom className={`w-3.5 h-3.5 ${accentConf.text} shrink-0`} />
              <span className="hidden sm:inline">
                {isHydrogenAnalyzing ? 'Analyzing...' : 'Analyze with Hydrogen'}
              </span>
              <span className="sm:hidden">
                {isHydrogenAnalyzing ? 'Analyzing...' : 'Hydrogen'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            title="Run Code (Ctrl/Cmd + Enter)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50 text-xs ${accentConf.bg} shadow-sm hover:opacity-95 active:scale-[0.98] whitespace-nowrap shrink-0`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          <div className={`h-4 w-px ${surface.border} mx-0.5 hidden sm:block`} />

          <PanelControls
            panelId="editor"
            surface={surface}
            isMaximized={isMaximized}
            onToggleMaximize={onToggleMaximize}
            onCyclePosition={onCyclePosition}
            onHidePanel={onHidePanel}
          />
        </div>
      </div>

      {/* Notebook Code Canvas */}
      <div
        className="relative flex-1 flex overflow-hidden"
        style={{ backgroundColor: editorColors.bg }}
      >
        {showLineNumbers && (
          <div
            ref={gutterRef}
            aria-hidden="true"
            style={{
              backgroundColor: editorColors.gutterBg,
              borderColor: editorColors.border,
              lineHeight: `${lineHeightPx}px`,
            }}
            className={`select-none py-4 px-3 text-right border-r text-[#788078] font-mono ${fontSizeClass} min-w-11 overflow-hidden`}
          >
            {lines.map((_: string, i: number) => {
              const lineNum = i + 1;
              const isCurrent = lineNum === cursorPos.ln;
              const isEditTarget =
                highlightedEditRange !== null &&
                lineNum >= highlightedEditRange.start &&
                lineNum <= highlightedEditRange.end;
              return (
                <div
                  key={i}
                  className={`transition-colors duration-150 ${
                    isEditTarget
                      ? 'text-amber-300 font-semibold'
                      : isCurrent
                      ? 'text-[#E8E2D5] font-semibold'
                      : ''
                  }`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        )}

        <div className="relative flex-1 h-full overflow-hidden">
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{ lineHeight: `${lineHeightPx}px` }}
            className={`absolute inset-0 p-4 m-0 font-mono ${fontSizeClass} ${wrapClass} overflow-auto pointer-events-none select-none text-[#EFEAE0]`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
          />

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorPosition();
            }}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            style={{ lineHeight: `${lineHeightPx}px` }}
            className={`absolute inset-0 p-4 m-0 w-full h-full font-mono ${fontSizeClass} ${wrapClass} overflow-auto bg-transparent text-transparent caret-[#F4EDE0] focus:outline-hidden resize-none selection:bg-[#49574E]/70 selection:text-white`}
          />

          {showAutocomplete && filteredSuggestions.length > 0 && (
            <div
              style={{ top: `${autocompleteCoords.top}px`, left: `${autocompleteCoords.left}px` }}
              className="zenith-dropdown-menu absolute z-30 w-72 rounded-xl bg-[#272B28] border border-[#3E4540] shadow-xl max-h-56 overflow-y-auto text-xs"
            >
              <div className="px-3 py-1.5 bg-[#1F2220] border-b border-[#343A36] text-[11px] text-[#A9B0A8] flex items-center justify-between">
                <span>Suggestions for &ldquo;{autocompleteQuery}&rdquo;</span>
                <span className="text-[10px] opacity-80">Tab to insert</span>
              </div>
              <div className="p-1 space-y-0.5">
                {filteredSuggestions.map((item, idx) => {
                  const isSelected = idx === autocompleteIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyAutocomplete(item);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#3A433D] text-white font-medium'
                          : 'text-[#DDD8CE] hover:bg-[#313733]'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1D201E] text-[#A4B3A8] font-mono">
                          {item.type.slice(0, 3)}
                        </span>
                        <span className="truncate font-mono">{item.label}</span>
                      </div>
                      <span className="text-[11px] text-[#9AA29A] truncate max-w-[42%] text-right">
                        {item.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Gemini 4 Hydrogen Analysis & Selective Real-Time Edit Drawer */}
      {(isHydrogenAnalyzing || hydrogenReview) && (
        <div className={`zenith-banner-enter border-t ${surface.border} ${surface.card} max-h-[48%] flex flex-col shrink-0 overflow-hidden`}>
          {/* Drawer Header */}
          <div className={`px-4 py-2 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-3 shrink-0`}>
            <div className="flex items-center gap-2 min-w-0">
              <Atom className={`w-3.5 h-3.5 ${accentConf.text} shrink-0`} />
              <span className={`font-semibold text-xs ${surface.text} whitespace-nowrap`}>
                Hydrogen Analysis
              </span>
              <span className={`hidden sm:inline text-[11px] ${surface.textSubtle} truncate`}>
                · Gemini 4 Hydrogen
                {hydrogenReview && !isHydrogenAnalyzing && !hydrogenReview.apiError
                  ? ` · ${hydrogenReview.edits.filter((e) => e.status === 'pending').length} pending edit${
                      hydrogenReview.edits.filter((e) => e.status === 'pending').length === 1 ? '' : 's'
                    }`
                  : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!isHydrogenAnalyzing &&
                hydrogenReview &&
                hydrogenReview.edits.some((e) => e.status === 'pending') && (
                  <>
                    {onApproveAllHydrogenEdits && (
                      <button
                        type="button"
                        onClick={onApproveAllHydrogenEdits}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${accentConf.bg} hover:opacity-95 whitespace-nowrap shrink-0`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve All</span>
                      </button>
                    )}
                    {onDenyAllHydrogenEdits && (
                      <button
                        type="button"
                        onClick={onDenyAllHydrogenEdits}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap shrink-0`}
                      >
                        <X className="w-3 h-3" />
                        <span>Deny All</span>
                      </button>
                    )}
                  </>
                )}

              {onDismissHydrogenReview && (
                <button
                  type="button"
                  onClick={onDismissHydrogenReview}
                  title="Close Hydrogen analysis"
                  className={`p-1 rounded-lg ${surface.textSubtle} ${surface.hoverBg} transition-colors`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="overflow-y-auto p-4 space-y-4">
            {isHydrogenAnalyzing ? (
              <div className="space-y-2.5">
                <div className={`text-xs font-medium ${surface.textMuted} flex items-center gap-2`}>
                  <span>Inspecting {lines.length} lines with Gemini 4 Hydrogen...</span>
                </div>
                <div className="space-y-2">
                  <div className={`h-3 w-11/12 rounded ${surface.chipBg}`} />
                  <div className={`h-3 w-4/5 rounded ${surface.chipBg}`} />
                  <div className={`h-3 w-9/12 rounded ${surface.chipBg}`} />
                </div>
              </div>
            ) : hydrogenReview?.apiError ? (
              <div className={`p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs space-y-2`}>
                <div className={`font-semibold flex items-center justify-between gap-2 ${surface.isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Gemini 4 Hydrogen error
                      {hydrogenReview.apiError.code || hydrogenReview.apiError.status
                        ? ` (${[hydrogenReview.apiError.code, hydrogenReview.apiError.status].filter(Boolean).join(' ')})`
                        : ''}
                    </span>
                  </span>
                  {onAnalyzeWithHydrogen && (
                    <button
                      type="button"
                      onClick={onAnalyzeWithHydrogen}
                      className={`px-2.5 py-1 rounded-lg border border-amber-500/40 text-[11px] font-semibold hover:bg-amber-500/15 whitespace-nowrap`}
                    >
                      Retry
                    </button>
                  )}
                </div>
                <p className={`${surface.textMuted} leading-relaxed`}>
                  {hydrogenReview.apiError.message}
                </p>
              </div>
            ) : hydrogenReview ? (
              <>
                {/* Three Concise Bullet Points */}
                {hydrogenReview.bullets.length > 0 && (
                  <ol className="space-y-2">
                    {hydrogenReview.bullets.slice(0, 3).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed">
                        <span className={`font-mono tabular-nums text-[11px] font-semibold ${accentConf.text} mt-0.5 shrink-0`}>
                          0{idx + 1}
                        </span>
                        <span className={surface.text}>{bullet}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {/* Proposed Real-Time Code Edits */}
                {hydrogenReview.edits.length === 0 ? (
                  <div className={`pt-2 border-t ${surface.border} flex items-center gap-2 text-xs ${surface.textMuted}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${surface.isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span>No errors or code changes needed — your script is clean.</span>
                  </div>
                ) : (
                  <div className={`pt-3 border-t ${surface.border} space-y-2.5`}>
                    <div className={`text-[11px] font-semibold ${surface.textSubtle} flex items-center justify-between`}>
                      <span>Proposed Changes — approve or deny individually</span>
                      <span className="font-mono tabular-nums">
                        {hydrogenReview.edits.filter((e) => e.status === 'approved').length}/{hydrogenReview.edits.length} applied
                      </span>
                    </div>

                    <div className={`divide-y ${surface.border} border ${surface.border} rounded-xl overflow-hidden`}>
                      {hydrogenReview.edits.map((edit: HydrogenCodeEdit) => {
                        const isPending = edit.status === 'pending';
                        const isApproved = edit.status === 'approved';
                        const isDenied = edit.status === 'denied';
                        const targetMissing = isPending && !code.includes(edit.targetSnippet);
                        const canUndo = isApproved && code.includes(edit.replacementSnippet);

                        const severityLabel =
                          edit.severity === 'error'
                            ? 'Error fix'
                            : edit.severity === 'edge_case'
                            ? 'Edge case'
                            : 'Nuance';

                        const severityColor =
                          edit.severity === 'error'
                            ? surface.isDark
                              ? 'text-rose-300'
                              : 'text-rose-700'
                            : edit.severity === 'edge_case'
                            ? surface.isDark
                              ? 'text-amber-300'
                              : 'text-amber-700'
                            : accentConf.text;

                        const oldLines = edit.targetSnippet.split('\n');
                        const newLines = edit.replacementSnippet.split('\n');

                        return (
                          <div
                            key={edit.id}
                            onMouseEnter={() => setHoveredEditId(edit.id)}
                            onMouseLeave={() => setHoveredEditId((prev) => (prev === edit.id ? null : prev))}
                            className={`p-3 space-y-2 transition-colors ${
                              isApproved
                                ? surface.isDark
                                  ? 'bg-emerald-950/20'
                                  : 'bg-emerald-50/60'
                                : isDenied
                                ? 'opacity-65'
                                : surface.cardMuted
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold text-xs ${surface.text}`}>
                                    {edit.title}
                                  </span>
                                  <span className={`text-[11px] font-medium ${severityColor}`}>
                                    {severityLabel}
                                  </span>
                                  <span className={`text-[11px] font-mono tabular-nums ${surface.textSubtle}`}>
                                    · Ln {edit.lineStart}
                                    {edit.lineEnd > edit.lineStart ? `–${edit.lineEnd}` : ''}
                                  </span>
                                  {isApproved && (
                                    <span className={`text-[11px] font-medium ${surface.isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                      · Applied
                                    </span>
                                  )}
                                  {isDenied && (
                                    <span className={`text-[11px] ${surface.textSubtle}`}>
                                      · Denied
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] ${surface.textMuted} leading-relaxed`}>
                                  {edit.reason}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onApproveHydrogenEdit?.(edit.id)}
                                      disabled={targetMissing}
                                      title={
                                        targetMissing
                                          ? 'Source lines changed since analysis'
                                          : 'Apply this change to the editor'
                                      }
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${accentConf.bg} hover:opacity-95 disabled:opacity-40 whitespace-nowrap shrink-0`}
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDenyHydrogenEdit?.(edit.id)}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap shrink-0`}
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Deny</span>
                                    </button>
                                  </>
                                )}

                                {isApproved && canUndo && onUndoHydrogenEdit && (
                                  <button
                                    type="button"
                                    onClick={() => onUndoHydrogenEdit(edit.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap shrink-0`}
                                  >
                                    <Undo2 className="w-3 h-3" />
                                    <span>Undo</span>
                                  </button>
                                )}

                                {isDenied && onRestoreHydrogenEdit && (
                                  <button
                                    type="button"
                                    onClick={() => onRestoreHydrogenEdit(edit.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} text-[11px] font-medium whitespace-nowrap shrink-0`}
                                  >
                                    <span>Reconsider</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {targetMissing && (
                              <div className={`text-[11px] ${surface.isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                Source snippet changed manually — re-run Analyze with Hydrogen to refresh this patch.
                              </div>
                            )}

                            {/* Compact Diff Preview */}
                            <div
                              style={{ backgroundColor: editorColors.bg, borderColor: editorColors.border }}
                              className="rounded-lg border font-mono text-[11px] leading-relaxed overflow-x-auto"
                            >
                              {oldLines.map((line, i) => (
                                <div
                                  key={`old-${i}`}
                                  className="px-2.5 py-0.5 bg-rose-500/15 text-rose-200 whitespace-pre"
                                >
                                  <span className="select-none opacity-75 mr-2">-</span>
                                  {line}
                                </div>
                              ))}
                              {newLines.map((line, i) => (
                                <div
                                  key={`new-${i}`}
                                  className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-200 whitespace-pre"
                                >
                                  <span className="select-none opacity-75 mr-2">+</span>
                                  {line}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Friendly Quiet Status Footer */}
      {showStatusBar && (
        <div className={`flex items-center justify-between px-4 py-1.5 border-t ${surface.border} ${surface.cardMuted} text-[11px] ${surface.textSubtle} shrink-0`}>
          <div className="flex items-center gap-2.5 font-mono">
            <span>Ln {cursorPos.ln}, Col {cursorPos.col}</span>
            <span>·</span>
            <span>{lines.length} lines</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Spaces: {editorTabSize}</span>
            {wordWrap && (
              <>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">Wrap</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Ctrl/Cmd + Enter to run</span>
            <span className="hidden sm:inline">·</span>
            <span>{langMeta?.compiler}</span>
          </div>
        </div>
      )}
    </div>
  );
};
