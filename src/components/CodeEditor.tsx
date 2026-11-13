import React, { useRef, useState, useMemo } from 'react';
import {
  AutocompleteItem,
  BackgroundGradientStyle,
  CornerRadiusStyle,
  EditorFontSize,
  SupportedLanguage,
  SyntaxTheme,
  AccentColor,
} from '../types';
import { AUTOCOMPLETE_DICTIONARY, SUPPORTED_LANGUAGES } from '../utils/languageData';
import { highlightTokensToHtml, tokenizeCode } from '../utils/highlighter';
import { ACCENT_MAP, getPanelRadiusClass, getSurfacePalette } from '../utils/themeData';
import { PanelControls } from './PanelControls';
import { Play, Sparkles, RotateCcw, Copy, Check, FileCode2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (newCode: string) => void;
  onRun: () => void;
  onAnalyze: () => void;
  onReset: () => void;
  isRunning?: boolean;
  isAnalyzing?: boolean;
  syntaxTheme?: SyntaxTheme;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
  cornerRadius?: CornerRadiusStyle;
  editorFontSize?: EditorFontSize;
  showLineNumbers?: boolean;
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
  syntaxTheme = 'warm-botanical',
  accent = 'sage',
  bgGradient = 'warm-linen',
  cornerRadius = 'rounded',
  editorFontSize = 'md',
  showLineNumbers = true,
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

  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteCoords, setAutocompleteCoords] = useState<{ top: number; left: number }>({ top: 30, left: 60 });

  const lines = useMemo(() => code.split('\n'), [code]);

  const fontClass =
    editorFontSize === 'sm'
      ? 'text-[11px] leading-5'
      : editorFontSize === 'lg'
      ? 'text-sm leading-7'
      : 'text-xs leading-6';

  const lineHeightPx = editorFontSize === 'sm' ? 20 : editorFontSize === 'lg' ? 28 : 24;

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
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
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
        indent += '    ';
      }

      if (indent) {
        e.preventDefault();
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tokens = useMemo(() => tokenizeCode(code, language), [code, language]);
  const highlightedHtml = useMemo(() => highlightTokensToHtml(tokens, syntaxTheme), [tokens, syntaxTheme]);

  const langMeta = SUPPORTED_LANGUAGES[language];
  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);
  const radiusClass = getPanelRadiusClass(cornerRadius);

  return (
    <div className={`zenith-tile-frame flex flex-col h-full ${radiusClass} border ${surface.border} ${surface.card} overflow-hidden`}>
      {/* Draggable Editor Header */}
      <div
        draggable={!!onDragStartPanel}
        onDragStart={onDragStartPanel}
        className={`flex items-center justify-between px-3.5 py-2 border-b ${surface.border} ${surface.cardMuted} text-xs shrink-0 gap-2`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentConf.bgSubtle} ${accentConf.text}`}>
            <FileCode2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className={`font-semibold text-xs ${surface.text} block leading-tight truncate`}>
              main{langMeta?.extension || '.rs'}
            </span>
            <span className={`text-[11px] ${surface.textSubtle} truncate block`}>
              {langMeta?.name} Editor
            </span>
          </div>
        </div>

        {/* Action & Placement Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onReset}
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
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${surface.border} ${surface.card} ${surface.text} ${surface.hoverBg} transition-colors disabled:opacity-50 text-xs font-medium`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${accentConf.text}`} />
            <span>{isAnalyzing ? 'Reviewing...' : 'Ask Tutor'}</span>
          </button>

          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            title="Run Code (Ctrl/Cmd + Enter)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50 text-xs ${accentConf.bg} shadow-sm hover:opacity-95 active:scale-[0.98]`}
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

      {/* Cozy Matte Slate Notebook Area */}
      <div className="relative flex-1 flex overflow-hidden bg-[#212422]">
        {showLineNumbers && (
          <div
            ref={gutterRef}
            aria-hidden="true"
            className={`select-none py-4 px-3 text-right bg-[#1C1F1D] border-r border-[#2E3330] text-[#788078] font-mono ${fontClass} min-w-11 overflow-hidden`}
          >
            {lines.map((_: string, i: number) => {
              const lineNum = i + 1;
              const isCurrent = lineNum === cursorPos.ln;
              return (
                <div
                  key={i}
                  className={`transition-colors duration-150 ${isCurrent ? 'text-[#E8E2D5] font-semibold' : ''}`}
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
            className={`absolute inset-0 p-4 m-0 font-mono ${fontClass} whitespace-pre overflow-auto pointer-events-none select-none text-[#EFEAE0]`}
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
            className={`absolute inset-0 p-4 m-0 w-full h-full font-mono ${fontClass} whitespace-pre overflow-auto bg-transparent text-transparent caret-[#F4EDE0] focus:outline-hidden resize-none selection:bg-[#49574E]/70 selection:text-white`}
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

      {/* Friendly Quiet Status Footer */}
      <div className={`flex items-center justify-between px-4 py-1.5 border-t ${surface.border} ${surface.cardMuted} text-[11px] ${surface.textSubtle} shrink-0`}>
        <div className="flex items-center gap-3 font-mono">
          <span>Ln {cursorPos.ln}, Col {cursorPos.col}</span>
          <span>·</span>
          <span>{lines.length} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Ctrl/Cmd + Enter to run</span>
          <span className="hidden sm:inline">·</span>
          <span>{langMeta?.compiler}</span>
        </div>
      </div>
    </div>
  );
};
