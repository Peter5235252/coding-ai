import React, { useState } from 'react';
import { ExecutionResult, LANGUAGE_RUNNER_OPTIONS } from '../utils/codeRunner';
import { AccentColor, BackgroundGradientStyle, CornerRadiusStyle, SupportedLanguage } from '../types';
import { ACCENT_MAP, getPanelRadiusClass, getSurfacePalette } from '../utils/themeData';
import { PanelControls } from './PanelControls';
import { Terminal, Cpu, Trash2, CheckCircle2, AlertTriangle, Activity, Keyboard, Play } from 'lucide-react';

interface TerminalOutputProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onClear: () => void;
  language: SupportedLanguage;
  accent?: AccentColor;
  bgGradient?: BackgroundGradientStyle;
  cornerRadius?: CornerRadiusStyle;
  stdin: string;
  onStdinChange: (val: string) => void;
  selectedFlag: string;
  onFlagChange: (flag: string) => void;
  onRunWithOptions?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onCyclePosition?: () => void;
  onHidePanel?: () => void;
  onDragStartPanel?: (e: React.DragEvent) => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  result,
  isRunning,
  onClear,
  language,
  accent = 'sage',
  bgGradient = 'warm-linen',
  cornerRadius = 'rounded',
  stdin,
  onStdinChange,
  selectedFlag,
  onFlagChange,
  onRunWithOptions,
  isMaximized = false,
  onToggleMaximize,
  onCyclePosition,
  onHidePanel,
  onDragStartPanel,
}) => {
  const [tab, setTab] = useState<'console' | 'trace' | 'memory'>('console');
  const [showStdin, setShowStdin] = useState(false);

  const accentConf = ACCENT_MAP[accent] || ACCENT_MAP.sage;
  const surface = getSurfacePalette(bgGradient);
  const radiusClass = getPanelRadiusClass(cornerRadius);
  const flagOptions = LANGUAGE_RUNNER_OPTIONS[language] || [];

  return (
    <div className={`zenith-tile-frame flex flex-col h-full ${radiusClass} border ${surface.border} ${surface.card} overflow-hidden`}>
      {/* Draggable Console Header */}
      <div
        draggable={!!onDragStartPanel}
        onDragStart={onDragStartPanel}
        className={`flex items-center justify-between px-3 py-2 border-b ${surface.border} ${surface.cardMuted} shrink-0 gap-2 flex-wrap`}
      >
        <div className={`flex items-center gap-1 p-0.5 rounded-xl ${surface.chipBg}`}>
          <button
            type="button"
            onClick={() => setTab('console')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              tab === 'console'
                ? `${surface.card} ${surface.text} shadow-xs`
                : `${surface.textMuted} hover:opacity-80`
            }`}
          >
            <Terminal className={`w-3.5 h-3.5 ${tab === 'console' ? accentConf.text : ''}`} />
            <span>Output</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('trace')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              tab === 'trace'
                ? `${surface.card} ${surface.text} shadow-xs`
                : `${surface.textMuted} hover:opacity-80`
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${tab === 'trace' ? accentConf.text : ''}`} />
            <span className="hidden sm:inline">Trace</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('memory')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              tab === 'memory'
                ? `${surface.card} ${surface.text} shadow-xs`
                : `${surface.textMuted} hover:opacity-80`
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${tab === 'memory' ? accentConf.text : ''}`} />
            <span className="hidden sm:inline">Memory</span>
          </button>
        </div>

        {/* Toolchain Mode, Stdin Toggle & Placement Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {flagOptions.length > 0 && (
            <select
              value={selectedFlag}
              onChange={(e) => onFlagChange(e.target.value)}
              title="Compiler / Runtime Mode"
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium ${surface.input} focus:outline-hidden max-w-[140px] truncate`}
            >
              {flagOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowStdin(!showStdin)}
            title="Provide standard input (stdin)"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              showStdin || stdin.trim()
                ? `${accentConf.bgSubtle} ${accentConf.border} ${accentConf.text}`
                : `${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg}`
            }`}
          >
            <Keyboard className="w-3 h-3" />
            <span className="hidden sm:inline">Input</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            title="Clear output"
            className={`p-1.5 rounded-lg ${surface.textSubtle} ${surface.hoverBg} transition-colors`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <PanelControls
            panelId="terminal"
            surface={surface}
            isMaximized={isMaximized}
            onToggleMaximize={onToggleMaximize}
            onCyclePosition={onCyclePosition}
            onHidePanel={onHidePanel}
          />
        </div>
      </div>

      {/* Collapsible Stdin Bar */}
      {showStdin && (
        <div className={`zenith-banner-enter px-3 py-2 border-b ${surface.border} ${surface.cardMuted} flex items-center gap-2 shrink-0`}>
          <span className={`text-[11px] font-medium ${surface.textMuted} shrink-0`}>
            stdin:
          </span>
          <input
            type="text"
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Enter lines of input for your program (use \n or spaces)..."
            className={`flex-1 px-2.5 py-1 rounded-lg border text-xs font-mono ${surface.input} focus:outline-hidden`}
          />
          {onRunWithOptions && (
            <button
              type="button"
              onClick={onRunWithOptions}
              disabled={isRunning}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${accentConf.bg} disabled:opacity-50`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          )}
        </div>
      )}

      {/* Output Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#212422] font-mono text-xs leading-5 text-[#EAE5DB]">
        {isRunning ? (
          <div className="zenith-banner-enter space-y-2.5 max-w-sm">
            <div className="text-[#D2D8D2] font-sans text-xs font-medium">
              Compiling &amp; running {language} program...
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#2B302C] overflow-hidden">
              <div className={`h-full w-2/5 rounded-full ${accentConf.bg} zenith-track-glide`} />
            </div>
          </div>
        ) : tab === 'console' ? (
          <div key="console" className="zenith-step-view space-y-3">
            {result ? (
              <>
                {/* Status Bar inside Output */}
                <div className="zenith-item-reveal flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#2E3330] font-sans text-[11px]">
                  <div className="flex items-center gap-2">
                    {result.exitCode === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#8FBE94] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Success (exit 0)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#E69788] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Exited with code {result.exitCode}</span>
                      </span>
                    )}
                    {result.compilerVersion && (
                      <span className="text-[#9AA29A]">· {result.compilerVersion}</span>
                    )}
                  </div>
                  <span className="text-[#8E968E] font-mono">{result.durationMs}ms</span>
                </div>

                {/* Warnings if any */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="zenith-item-reveal p-2.5 rounded-xl bg-[#2E2A22] border border-[#4D4330] text-[#E5C57B] text-xs space-y-1">
                    {result.warnings.map((w, idx) => (
                      <div key={idx}>warning: {w}</div>
                    ))}
                  </div>
                )}

                {/* Stdout */}
                {result.stdout && (
                  <pre className="zenith-item-reveal whitespace-pre-wrap text-[#EFEAE0]">
                    {result.stdout}
                  </pre>
                )}

                {/* Stderr */}
                {result.stderr && (
                  <pre className="zenith-item-reveal whitespace-pre-wrap text-[#E89A8A] p-3 rounded-xl bg-[#2C2220] border border-[#4D3430]">
                    {result.stderr}
                  </pre>
                )}

                {!result.stdout && !result.stderr && (
                  <span className="zenith-item-reveal inline-block text-[#9AA29A]">Program finished cleanly with no output.</span>
                )}
              </>
            ) : (
              <div className="text-[#9EA69E] font-sans text-xs space-y-1">
                <p>
                  Click <strong className="text-[#EAE5DB]">Run Code</strong> (or press <span className="font-mono text-[#D5CFC4]">Ctrl/Cmd + Enter</span>) to compile and execute your {language} program.
                </p>
                <p className="text-[#858D85]">
                  Switch compiler modes or feed custom stdin using the toolbar above.
                </p>
              </div>
            )}
          </div>
        ) : tab === 'trace' ? (
          <div key="trace" className="zenith-step-view space-y-2.5 font-sans">
            {result?.executionTrace && result.executionTrace.length > 0 ? (
              result.executionTrace.map((t, idx) => (
                <div
                  key={idx}
                  style={{ animationDelay: `${Math.min(idx, 10) * 35}ms` }}
                  className="zenith-item-reveal p-3 rounded-xl bg-[#292D2A] border border-[#39403B] flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-[#363E38] text-[#B7CAB9] font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-[#F0ECE3]">{t.step}</div>
                    <div className="text-xs text-[#B3BAB3] mt-0.5">{t.memory}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[#9EA69E] text-xs">
                Run your code to inspect step-by-step execution frames and memory events.
              </div>
            )}
          </div>
        ) : (
          <div key="memory" className="zenith-step-view space-y-3 font-sans">
            <div className="zenith-item-reveal p-3 rounded-xl bg-[#2A2E2B] border border-[#3B423D]">
              <span className="text-[11px] font-semibold text-[#A4B3A8] block mb-1">
                Active Memory Model ({language.toUpperCase()})
              </span>
              <p className="text-xs text-[#E4DFD5] leading-relaxed">
                {result?.memoryInsight ||
                  'Run your program to see how stack frames, variables, and memory ownership behave.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div style={{ animationDelay: '45ms' }} className="zenith-item-reveal p-3 rounded-xl bg-[#2A2E2B] border border-[#3B423D]">
                <span className="text-[#A4B3A8] block text-[11px] font-medium mb-0.5">Stack Frame</span>
                <span className="text-[#F2EDE4] font-semibold">Contiguous &amp; Fast</span>
                <p className="text-[11px] text-[#A9B0A8] mt-1">Released smoothly when a block ends</p>
              </div>
              <div style={{ animationDelay: '90ms' }} className="zenith-item-reveal p-3 rounded-xl bg-[#2A2E2B] border border-[#3B423D]">
                <span className="text-[#A4B3A8] block text-[11px] font-medium mb-0.5">Heap Storage</span>
                <span className="text-[#F2EDE4] font-semibold">Dynamic &amp; Flexible</span>
                <p className="text-[11px] text-[#A9B0A8] mt-1">Managed by ownership or garbage collection</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
