/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { V86 } from 'v86';
import {
  AccentColor,
  BackgroundGradientStyle,
  CornerRadiusStyle,
  EditorSurfaceStyle,
  SurfaceStyle,
  SupportedLanguage,
} from '../types';
import {
  getAccentConfig,
  getEditorSurfaceColors,
  getPanelRadiusClass,
  getSurfacePalette,
} from '../utils/themeData';
import { playSound } from '../utils/soundEngine';
import {
  Terminal as TerminalIcon,
  Power,
  RotateCcw,
  Monitor,
  Send,
  CheckCircle2,
  HardDrive,
  Cpu,
  Layers,
  ChevronDown,
  RefreshCw,
  Info,
  Check,
  Disc,
} from 'lucide-react';

export interface LinuxDistro {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  bootMode: 'kernel' | 'state' | 'cdrom';
  memoryMb: number;
  vgaMemoryMb: number;
  description: string;
  installedTools: string[];
  kernelUrl?: string;
  initrdUrl?: string;
  stateUrl?: string;
  fsBaseUrl?: string;
  fsJsonUrl?: string;
  cdromUrl?: string;
  cmdline?: string;
  defaultCommandSuggestion: string;
}

export const LINUX_DISTROS: LinuxDistro[] = [
  {
    id: 'buildroot',
    name: 'Buildroot Linux 6.8',
    badge: 'Instant Boot',
    tagline: 'Minimal Linux kernel with BusyBox & Lua',
    bootMode: 'kernel',
    memoryMb: 256,
    vgaMemoryMb: 8,
    description: 'Instant-booting 32-bit x86 Linux kernel. Perfect for rapid shell commands, file testing, pipes, and minimal memory usage.',
    installedTools: ['sh (BusyBox)', 'lua 5.3', 'vi', 'core utilities'],
    kernelUrl: '/v86/images/buildroot-bzimage.bin',
    cmdline: 'console=ttyS0 console=tty0 tsc=reliable mitigations=off random.trust_cpu=on',
    defaultCommandSuggestion: 'lua -v',
  },
  {
    id: 'archlinux',
    name: 'Arch Linux (x86)',
    badge: 'Full Toolchain',
    tagline: 'Pre-warmed memory state with real GCC, GDB, Python 3.10, and Bash',
    bootMode: 'state',
    memoryMb: 512,
    vgaMemoryMb: 8,
    description: 'Developer workstation restored from a RAM hibernation state. Ready with native GCC/G++ compilation and Python 3.10.',
    installedTools: ['gcc 12', 'g++ 12', 'gdb', 'python 3.10', 'bash 5.1', 'make'],
    stateUrl: '/v86/images/arch_state-v3.bin.zst',
    fsBaseUrl: '/api/proxy-distro?url=' + encodeURIComponent('https://i.copy.sh/arch/'),
    fsJsonUrl: '/v86/images/fs.json',
    cmdline: 'rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose init=/usr/bin/init-openrc',
    defaultCommandSuggestion: 'gcc --version; python3 --version',
  },
  {
    id: 'linux4',
    name: 'Linux 4.x Minimal',
    badge: 'Lightweight ISO',
    tagline: 'Compact 7MB Linux CD-ROM environment',
    bootMode: 'cdrom',
    memoryMb: 256,
    vgaMemoryMb: 8,
    description: 'Compact 7MB Linux 4.x environment with immediate shell access.',
    installedTools: ['sh', 'busybox', 'coreutils'],
    cdromUrl: '/v86/images/linux4.iso',
    defaultCommandSuggestion: 'uname -a',
  },
  {
    id: 'alpine',
    name: 'Alpine Linux 3.20',
    badge: 'Package Manager',
    tagline: 'Official Alpine Virt ISO with OpenRC & musl libc',
    bootMode: 'cdrom',
    memoryMb: 384,
    vgaMemoryMb: 8,
    description: 'Security-oriented, lightweight Alpine Linux virtual machine with the apk package manager.',
    installedTools: ['apk', 'openrc', 'musl libc', 'busybox', 'sh'],
    cdromUrl: '/api/proxy-distro?url=' + encodeURIComponent('https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86/alpine-virt-3.20.10-x86.iso'),
    defaultCommandSuggestion: 'cat /etc/os-release',
  },
  {
    id: 'dsl',
    name: 'Damn Small Linux',
    badge: 'Classic Suite',
    tagline: 'Historic 50MB desktop & terminal Linux',
    bootMode: 'cdrom',
    memoryMb: 256,
    vgaMemoryMb: 8,
    description: 'Lightweight modular Linux distribution with x86 utilities.',
    installedTools: ['bash', 'nano', 'gcc suite', 'x86 tools'],
    cdromUrl: '/api/proxy-distro?url=' + encodeURIComponent('https://i.copy.sh/dsl-4.11.rc2.iso'),
    defaultCommandSuggestion: 'cat /proc/version',
  },
];

function getLanguageFileName(lang: SupportedLanguage): { filename: string; runCmd: string } {
  switch (lang) {
    case 'c':
      return { filename: 'main.c', runCmd: 'gcc -Wall -O2 main.c -o app && ./app' };
    case 'cpp':
      return { filename: 'main.cpp', runCmd: 'g++ -Wall -O2 main.cpp -o app && ./app' };
    case 'python':
      return { filename: 'main.py', runCmd: 'python3 main.py' };
    case 'rust':
      return { filename: 'main.rs', runCmd: 'rustc main.rs && ./main' };
    case 'javascript':
      return { filename: 'main.js', runCmd: 'node main.js' };
    case 'lua':
      return { filename: 'main.lua', runCmd: 'lua main.lua' };
    case 'luau':
      return { filename: 'main.luau', runCmd: 'luau main.luau' };
    case 'go':
      return { filename: 'main.go', runCmd: 'go run main.go' };
    case 'java':
      return { filename: 'Main.java', runCmd: 'javac Main.java && java Main' };
    case 'csharp':
      return { filename: 'Program.cs', runCmd: 'dotnet run' };
    case 'gdscript':
    default:
      return { filename: 'script.txt', runCmd: 'cat script.txt' };
  }
}

interface LinuxTerminalProps {
  currentCode: string;
  language: SupportedLanguage;
  accent?: AccentColor;
  customAccentHex?: string;
  bgGradient?: BackgroundGradientStyle;
  surfaceStyle?: SurfaceStyle;
  editorSurface?: EditorSurfaceStyle;
  cornerRadius?: CornerRadiusStyle;
}

export const LinuxTerminal: React.FC<LinuxTerminalProps> = ({
  currentCode,
  language,
  accent = 'sage',
  customAccentHex,
  bgGradient = 'warm-linen',
  surfaceStyle = 'crisp',
  editorSurface = 'matte-slate',
  cornerRadius = 'rounded',
}) => {
  const [selectedDistroId, setSelectedDistroId] = useState<string>('buildroot');
  const [vmStatus, setVmStatus] = useState<'off' | 'booting' | 'running' | 'paused' | 'error'>('off');
  const [bootProgressMsg, setBootProgressMsg] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'serial' | 'vga'>('serial');
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [showDistroDropdown, setShowDistroDropdown] = useState(false);
  const [showHelpBanner, setShowHelpBanner] = useState(true);

  const termContainerRef = useRef<HTMLDivElement | null>(null);
  const vgaContainerRef = useRef<HTMLDivElement | null>(null);
  const v86Ref = useRef<any>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const accentConf = getAccentConfig(accent, customAccentHex);
  const surface = getSurfacePalette(bgGradient, surfaceStyle);
  const editorColors = getEditorSurfaceColors(editorSurface);
  const radiusClass = getPanelRadiusClass(cornerRadius);

  const activeDistro = LINUX_DISTROS.find((d) => d.id === selectedDistroId) || LINUX_DISTROS[0];
  const langMeta = getLanguageFileName(language);

  // Catch non-fatal internal v86 tick rejections (e.g. G.prototype.yield)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = String(reason?.message || reason || '');
      const stack = String(reason?.stack || '');
      if (
        msg.includes('yield') ||
        stack.includes('yield') ||
        stack.includes('next_tick') ||
        stack.includes('v86') ||
        msg.includes('v86')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Setup xterm.js instance with Zenith Code calm styling
  useEffect(() => {
    if (!termContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      lineHeight: 1.25,
      convertEol: true,
      theme: {
        background: editorColors.bg.startsWith('#') ? editorColors.bg : '#0b0f17',
        foreground: '#cbd5e1',
        cursor: '#94a3b8',
        selectionBackground: 'rgba(148, 163, 184, 0.25)',
        black: '#1e293b',
        red: '#f87171',
        green: '#86efac',
        yellow: '#fde047',
        blue: '#93c5fd',
        magenta: '#c4b5fd',
        cyan: '#a5f3fc',
        white: '#f1f5f9',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);
    try {
      fitAddon.fit();
    } catch {
      // ignore initial fit error before visible
    }

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[90mZenith Code Linux Subsystem (32-bit x86 Virtual Machine)\x1b[0m');
    term.writeln(`\x1b[90mDistribution:\x1b[0m ${activeDistro.name} \x1b[90m(${activeDistro.installedTools.slice(0, 3).join(', ')})\x1b[0m`);
    term.writeln('\x1b[90mPress \x1b[37m[Boot VM]\x1b[90m above to launch the virtual machine.\x1b[0m\r\n');

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      termRef.current = null;
    };
  }, [editorColors.bg]);

  // Clean VM shutdown
  const stopVm = useCallback(async () => {
    if (v86Ref.current) {
      try {
        if (typeof v86Ref.current.is_running === 'function' && v86Ref.current.is_running()) {
          v86Ref.current.stop();
        }
        v86Ref.current.destroy();
      } catch {
        // ignore destroy error
      }
      v86Ref.current = null;
    }
    setVmStatus('off');
    setBootProgressMsg('');
  }, []);

  // Boot selected Linux distro in v86
  const bootVm = useCallback(async (distroToBoot = activeDistro) => {
    await stopVm();

    const term = termRef.current;
    if (term) {
      term.clear();
      term.writeln(`\x1b[90m[system]\x1b[0m Launching ${distroToBoot.name}...`);
      term.writeln(`\x1b[90m[system] Memory: ${distroToBoot.memoryMb}MB RAM · Architecture: x86\x1b[0m\r\n`);
    }

    setVmStatus('booting');
    setBootProgressMsg(`Loading ${distroToBoot.name}...`);

    try {
      const v86Config: any = {
        wasm_path: '/v86/v86.wasm',
        memory_size: distroToBoot.memoryMb * 1024 * 1024,
        vga_memory_size: distroToBoot.vgaMemoryMb * 1024 * 1024,
        bios: { url: '/v86/seabios.bin' },
        vga_bios: { url: '/v86/vgabios.bin' },
        autostart: true,
      };

      if (vgaContainerRef.current) {
        v86Config.screen_container = vgaContainerRef.current;
      }

      if (distroToBoot.bootMode === 'kernel' && distroToBoot.kernelUrl) {
        v86Config.bzimage = { url: distroToBoot.kernelUrl };
        if (distroToBoot.initrdUrl) {
          v86Config.initrd = { url: distroToBoot.initrdUrl };
        }
        if (distroToBoot.cmdline) {
          v86Config.cmdline = distroToBoot.cmdline;
        }
        v86Config.filesystem = {};
      } else if (distroToBoot.bootMode === 'state' && distroToBoot.stateUrl) {
        v86Config.initial_state = { url: distroToBoot.stateUrl };
        if (distroToBoot.fsBaseUrl) {
          v86Config.filesystem = {
            baseurl: distroToBoot.fsBaseUrl,
            basefs: distroToBoot.fsJsonUrl ? { url: distroToBoot.fsJsonUrl } : undefined,
          };
        }
        if (distroToBoot.cmdline) {
          v86Config.cmdline = distroToBoot.cmdline;
        }
      } else if (distroToBoot.bootMode === 'cdrom' && distroToBoot.cdromUrl) {
        v86Config.cdrom = {
          url: distroToBoot.cdromUrl,
          async: true,
        };
        v86Config.filesystem = {};
      }

      const v86 = new V86(v86Config);
      v86Ref.current = v86;

      // Pipe Serial output to xterm
      v86.add_listener('serial0-output-byte', (byte: number) => {
        if (term) {
          term.write(Uint8Array.of(byte));
        }
      });

      // Forward keyboard input from xterm to VM serial
      if (term) {
        term.onData((data: string) => {
          if (v86Ref.current && v86Ref.current.is_running()) {
            v86Ref.current.serial0_send(data);
          }
        });
      }

      v86.add_listener('emulator-ready', () => {
        setVmStatus('running');
        setBootProgressMsg('');
        if (term) {
          term.writeln(`\r\n\x1b[90m[system]\x1b[0m \x1b[37m${distroToBoot.name} is ready.\x1b[0m\r\n`);
        }
      });

      v86.add_listener('emulator-stopped', () => {
        setVmStatus('paused');
      });

      // Fallback timer: set running if prompt detected or after initial boot window
      setTimeout(() => {
        setVmStatus((prev) => (prev === 'booting' ? 'running' : prev));
      }, 3500);
    } catch (err: any) {
      console.error('v86 boot error:', err);
      setVmStatus('error');
      setBootProgressMsg(`Boot error: ${err?.message || err}`);
      if (term) {
        term.writeln(`\r\n\x1b[90m[system]\x1b[0m \x1b[31mFailed to boot ${distroToBoot.name}: ${err?.message || err}\x1b[0m\r\n`);
      }
    }
  }, [activeDistro, stopVm]);

  // Clean shutdown on unmount
  useEffect(() => {
    return () => {
      if (v86Ref.current) {
        try {
          if (typeof v86Ref.current.is_running === 'function' && v86Ref.current.is_running()) {
            v86Ref.current.stop();
          }
          v86Ref.current.destroy();
        } catch {
          // ignore
        }
        v86Ref.current = null;
      }
    };
  }, []);

  // Send Editor Code to the VM
  const handleSendCodeToVm = useCallback(() => {
    if (!v86Ref.current) {
      playSound('runError');
      setSyncToast('Please boot the Linux VM first before syncing code.');
      setTimeout(() => setSyncToast(null), 3500);
      return;
    }

    playSound('toggleOn');
    const { filename, runCmd } = langMeta;

    // Use clean shell here-doc injection to write the file accurately into the user's workspace
    const encoded = currentCode.replace(/\r\n/g, '\n');
    const syncScript = `\ncat << 'EOF_ZENITH' > ~/${filename}\n${encoded}\nEOF_ZENITH\n`;

    try {
      v86Ref.current.serial0_send(syncScript);
      const msg = `Synced ${filename} to ~/${filename}. Test with: ${runCmd}`;
      setSyncToast(msg);
      setTimeout(() => setSyncToast(null), 5000);

      if (termRef.current) {
        termRef.current.writeln(`\r\n\x1b[90m[system]\x1b[0m Synced \x1b[37m${filename}\x1b[0m into VM (~/${filename})`);
        termRef.current.writeln(`\x1b[90m[system] Execute with:\x1b[0m \x1b[37m${runCmd}\x1b[0m\r\n`);
      }
    } catch (err: any) {
      setSyncToast(`Failed to sync: ${err?.message || err}`);
      setTimeout(() => setSyncToast(null), 4000);
    }
  }, [currentCode, langMeta]);

  // Send quick command snippet
  const handleSendQuickCommand = (cmd: string) => {
    if (!v86Ref.current) {
      playSound('runError');
      return;
    }
    playSound('click');
    v86Ref.current.serial0_send(`${cmd}\n`);
    if (termRef.current) {
      termRef.current.focus();
    }
  };

  return (
    <div className={`flex flex-col h-full ${surface.card} overflow-hidden`}>
      {/* Linux Terminal Header Controls */}
      <div className={`px-3 py-2 border-b ${surface.border} ${surface.cardMuted} flex items-center justify-between gap-2 flex-wrap shrink-0`}>
        {/* Distro Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              playSound('dropdownOpen');
              setShowDistroDropdown(!showDistroDropdown);
            }}
            title="Select Linux Distribution"
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${surface.input} transition-colors`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="font-medium text-slate-800 dark:text-slate-100">{activeDistro.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${accentConf.badgeBg} border hidden sm:inline`}>
              {activeDistro.badge}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDistroDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowDistroDropdown(false)}
              />
              <div className={`absolute left-0 top-full mt-1.5 w-80 max-w-[90vw] z-40 rounded-2xl border ${surface.borderStrong} ${surface.modalBg} shadow-2xl p-2 space-y-1`}>
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Select Linux Distribution
                </div>
                {LINUX_DISTROS.map((distro) => {
                  const isSelected = distro.id === selectedDistroId;
                  return (
                    <button
                      key={distro.id}
                      type="button"
                      onClick={() => {
                        playSound('select');
                        setSelectedDistroId(distro.id);
                        setShowDistroDropdown(false);
                        if (vmStatus !== 'off') {
                          bootVm(distro);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex flex-col gap-0.5 ${
                        isSelected
                          ? `${accentConf.bgSubtle} ${accentConf.border} border`
                          : `${surface.hoverBg} border border-transparent`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isSelected ? (
                            <Check className={`w-3.5 h-3.5 shrink-0 ${accentConf.text}`} />
                          ) : (
                            <HardDrive className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          )}
                          <span className={`text-xs font-semibold truncate ${isSelected ? accentConf.text : surface.text}`}>
                            {distro.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {distro.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-5">
                        {distro.tagline}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 pl-5">
                        <span>{distro.memoryMb} MB RAM</span>
                        <span>·</span>
                        <span className="truncate">{distro.installedTools.slice(0, 3).join(', ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* VM Power Controls & Status */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Status Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <span
              className={`w-2 h-2 rounded-full ${
                vmStatus === 'running'
                  ? 'bg-emerald-500'
                  : vmStatus === 'booting'
                  ? 'bg-amber-500'
                  : vmStatus === 'paused'
                  ? 'bg-blue-500'
                  : vmStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="capitalize">{vmStatus}</span>
          </div>

          {/* Boot / Reboot Button */}
          {vmStatus === 'off' ? (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                bootVm();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs ${accentConf.bg} shadow-xs hover:opacity-95 transition-all`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Boot VM</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                bootVm();
              }}
              title="Reboot Linux VM"
              className={`inline-flex items-center gap-1 p-1.5 rounded-xl border ${surface.border} ${surface.card} ${surface.textMuted} ${surface.hoverBg} transition-colors`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sync Editor Code */}
          <button
            type="button"
            onClick={handleSendCodeToVm}
            disabled={vmStatus === 'off'}
            title={`Sync active ${language} code into VM as ~/${langMeta.filename}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 ${
              vmStatus === 'running'
                ? `${accentConf.border} ${accentConf.bgSubtle} ${accentConf.text}`
                : `${surface.border} ${surface.card} ${surface.textMuted}`
            }`}
          >
            <Send className="w-3 h-3" />
            <span className="hidden sm:inline">Sync Code</span>
          </button>

          {/* Display Mode Switcher (xterm.js Serial vs VGA) */}
          <button
            type="button"
            onClick={() => {
              const next = displayMode === 'serial' ? 'vga' : 'serial';
              playSound('tab');
              setDisplayMode(next);
            }}
            title={displayMode === 'serial' ? 'Switch to VGA Display screen' : 'Switch to Serial text terminal (xterm.js)'}
            className={`p-1.5 rounded-xl border ${surface.border} ${surface.card} ${
              displayMode === 'vga' ? accentConf.text : surface.textMuted
            } ${surface.hoverBg} transition-colors`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>

          {/* Power Off button if running */}
          {vmStatus !== 'off' && (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                stopVm();
              }}
              title="Power Off VM"
              className={`p-1.5 rounded-xl border ${surface.border} ${surface.card} text-rose-500 ${surface.hoverBg} transition-colors`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className={`px-3 py-1.5 text-xs border-b ${accentConf.border} ${accentConf.bgSubtle} ${accentConf.text} flex items-center justify-between gap-2 shrink-0`}>
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-medium">{syncToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-[11px] hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Command Suggestions Strip */}
      <div className={`px-3 py-1.5 border-b ${surface.border} ${surface.cardMuted} flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 scrollbar-none`}>
        <span className={`text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 shrink-0`}>
          Quick:
        </span>
        <button
          type="button"
          onClick={() => handleSendQuickCommand(langMeta.runCmd)}
          disabled={vmStatus !== 'running'}
          className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium transition-colors disabled:opacity-40 ${accentConf.border} ${accentConf.bgSubtle} ${accentConf.text} whitespace-nowrap shrink-0`}
        >
          {langMeta.runCmd}
        </button>
        {activeDistro.installedTools.some((t) => t.includes('python')) && (
          <button
            type="button"
            onClick={() => handleSendQuickCommand('python3 --version')}
            disabled={vmStatus !== 'running'}
            className={`px-2 py-0.5 rounded-md border ${surface.border} ${surface.card} ${surface.textMuted} hover:text-slate-900 dark:hover:text-slate-100 font-mono disabled:opacity-40 whitespace-nowrap shrink-0`}
          >
            python3 --version
          </button>
        )}
        {activeDistro.installedTools.some((t) => t.includes('gcc')) && (
          <button
            type="button"
            onClick={() => handleSendQuickCommand('gcc --version')}
            disabled={vmStatus !== 'running'}
            className={`px-2 py-0.5 rounded-md border ${surface.border} ${surface.card} ${surface.textMuted} hover:text-slate-900 dark:hover:text-slate-100 font-mono disabled:opacity-40 whitespace-nowrap shrink-0`}
          >
            gcc --version
          </button>
        )}
        <button
          type="button"
          onClick={() => handleSendQuickCommand('ls -la')}
          disabled={vmStatus !== 'running'}
          className={`px-2 py-0.5 rounded-md border ${surface.border} ${surface.card} ${surface.textMuted} hover:text-slate-900 dark:hover:text-slate-100 font-mono disabled:opacity-40 whitespace-nowrap shrink-0`}
        >
          ls -la
        </button>
        <button
          type="button"
          onClick={() => handleSendQuickCommand('uname -a')}
          disabled={vmStatus !== 'running'}
          className={`px-2 py-0.5 rounded-md border ${surface.border} ${surface.card} ${surface.textMuted} hover:text-slate-900 dark:hover:text-slate-100 font-mono disabled:opacity-40 whitespace-nowrap shrink-0`}
        >
          uname -a
        </button>
        <button
          type="button"
          onClick={() => handleSendQuickCommand('clear')}
          disabled={vmStatus !== 'running'}
          className={`px-2 py-0.5 rounded-md border ${surface.border} ${surface.card} ${surface.textMuted} hover:text-slate-900 dark:hover:text-slate-100 font-mono disabled:opacity-40 whitespace-nowrap shrink-0`}
        >
          clear
        </button>
      </div>

      {/* Main Terminal Viewport (Serial xterm.js vs VGA canvas) */}
      <div className="relative flex-1 min-h-0 bg-slate-950 overflow-hidden">
        {/* xterm.js Serial Terminal container */}
        <div
          ref={termContainerRef}
          className={`w-full h-full p-2 ${displayMode === 'serial' ? 'block' : 'hidden'}`}
          style={{ backgroundColor: editorColors.bg.startsWith('#') ? editorColors.bg : '#0b0f17' }}
        />

        {/* v86 VGA Screen container (Canvas / Text VGA) */}
        <div
          ref={vgaContainerRef}
          className={`w-full h-full p-2 flex items-center justify-center overflow-auto ${
            displayMode === 'vga' ? 'block' : 'hidden'
          }`}
          style={{ backgroundColor: '#000000' }}
        >
          <div style={{ whiteSpace: 'pre', font: '13px monospace', lineHeight: '14px', color: '#ffffff' }} />
          <canvas style={{ display: 'none' }} />
        </div>

        {/* Booting Overlay Banner */}
        {vmStatus === 'booting' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl max-w-sm w-full space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-100">
                <RefreshCw className="w-4 h-4 text-slate-300" />
                <span>Booting {activeDistro.name}</span>
              </div>
              <p className="text-xs text-slate-400">
                Initializing 32-bit x86 WebAssembly JIT emulator and loading kernel...
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden mt-1">
                <div className="bg-slate-400 h-1 rounded-full w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* Powered Off State Overlay */}
        {vmStatus === 'off' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-4 text-center pointer-events-none">
            <div className="max-w-md p-5 rounded-2xl bg-slate-900/95 border border-slate-800 text-slate-200 space-y-3 shadow-2xl pointer-events-auto">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/70 flex items-center justify-center mx-auto text-slate-300">
                <TerminalIcon className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">{activeDistro.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{activeDistro.description}</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    bootVm();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${accentConf.bg} shadow-sm hover:opacity-95 transition-all`}
                >
                  Boot {activeDistro.name}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Hint */}
      {showHelpBanner && (
        <div className={`px-3 py-1.5 border-t ${surface.border} ${surface.cardMuted} text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 shrink-0`}>
          <div className="flex items-center gap-1.5 truncate">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Real Linux x86 kernel in browser · Use <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Sync Code</code> to push editor buffer into <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">~/{langMeta.filename}</code>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelpBanner(false)}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
};
