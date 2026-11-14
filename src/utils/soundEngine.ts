export type SoundEffect =
  | 'click'
  | 'primary'
  | 'toggleOn'
  | 'toggleOff'
  | 'tab'
  | 'select'
  | 'dropdownOpen'
  | 'dropdownClose'
  | 'modalOpen'
  | 'modalClose'
  | 'sliderTick'
  | 'dragStart'
  | 'panelSwap'
  | 'copy'
  | 'clear'
  | 'reset'
  | 'keystroke'
  | 'runStart'
  | 'runPass'
  | 'runError'
  | 'tutorSend'
  | 'tutorReceive'
  | 'challengePass'
  | 'challengeAlmost';

interface SoundConfig {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
  editorKeySounds: boolean;
}

let config: SoundConfig = {
  enabled: true,
  volume: 0.65,
  editorKeySounds: true,
};

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

let lastExplicitSoundAt = 0;
let lastSliderTickAt = 0;
let lastKeystrokeAt = 0;

export function updateSoundConfig(next: Partial<SoundConfig>): void {
  config = { ...config, ...next };
  if (masterGain && audioCtx) {
    const targetGain = config.enabled ? Math.max(0, Math.min(1, config.volume)) * 0.42 : 0;
    masterGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.012);
  }
}

export function getSoundConfig(): SoundConfig {
  return config;
}

function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  if (!audioCtx) {
    audioCtx = new Ctx();
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
    compressor.knee.setValueAtTime(12, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(6, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.002, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.12, audioCtx.currentTime);

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(
      config.enabled ? Math.max(0, Math.min(1, config.volume)) * 0.42 : 0,
      audioCtx.currentTime
    );

    compressor.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Precompute tiny 0.1s white noise buffer for tactile acoustic air bursts
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * 0.1);
    noiseBuffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Autoplay lock clears automatically on next user gesture
    });
  }

  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  options: {
    type?: OscillatorType;
    startFreq: number;
    endFreq?: number;
    delay?: number;
    duration: number;
    gain: number;
    attack?: number;
    filterFreq?: number;
  }
): void {
  if (!compressor) return;
  const now = ctx.currentTime + (options.delay ?? 0);
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const attack = options.attack ?? 0.003;

  osc.type = options.type ?? 'sine';
  osc.frequency.setValueAtTime(Math.max(20, options.startFreq), now);
  if (options.endFreq && options.endFreq !== options.startFreq) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, options.endFreq),
      now + options.duration
    );
  }

  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(options.gain, now + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

  if (options.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(options.filterFreq, now);
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }

  env.connect(compressor);
  osc.start(now);
  osc.stop(now + options.duration + 0.015);
}

function playNoiseBurst(
  ctx: AudioContext,
  options: {
    delay?: number;
    duration: number;
    gain: number;
    filterType?: BiquadFilterType;
    filterFreq: number;
    q?: number;
  }
): void {
  if (!compressor || !noiseBuffer) return;
  const now = ctx.currentTime + (options.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = options.filterType ?? 'bandpass';
  filter.frequency.setValueAtTime(options.filterFreq, now);
  filter.Q.setValueAtTime(options.q ?? 2.2, now);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(options.gain, now + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

  src.connect(filter);
  filter.connect(env);
  env.connect(compressor);

  src.start(now);
  src.stop(now + options.duration + 0.01);
}

function synthesize(effect: SoundEffect): void {
  if (!config.enabled) return;
  if (effect === 'keystroke' && !config.editorKeySounds) return;

  const nowPerf = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (effect === 'sliderTick') {
    if (nowPerf - lastSliderTickAt < 38) return;
    lastSliderTickAt = nowPerf;
  }
  if (effect === 'keystroke') {
    if (nowPerf - lastKeystrokeAt < 26) return;
    lastKeystrokeAt = nowPerf;
  }

  const ctx = ensureAudioContext();
  if (!ctx || ctx.state === 'suspended') {
    // Still attempt unlock for subsequent ticks; if suspended during initial click, resume resolves asynchronously
  }
  if (!ctx) return;

  switch (effect) {
    case 'click':
      playTone(ctx, {
        type: 'triangle',
        startFreq: 245,
        endFreq: 112,
        duration: 0.024,
        gain: 0.22,
        filterFreq: 1200,
      });
      playNoiseBurst(ctx, {
        duration: 0.011,
        gain: 0.075,
        filterFreq: 1450,
        q: 2.6,
      });
      break;

    case 'primary':
      playTone(ctx, {
        type: 'triangle',
        startFreq: 310,
        endFreq: 190,
        duration: 0.028,
        gain: 0.22,
        filterFreq: 1500,
      });
      playTone(ctx, {
        type: 'sine',
        startFreq: 493.88,
        endFreq: 523.25,
        delay: 0.014,
        duration: 0.055,
        gain: 0.16,
      });
      playNoiseBurst(ctx, {
        duration: 0.012,
        gain: 0.06,
        filterFreq: 1800,
      });
      break;

    case 'toggleOn':
      playTone(ctx, {
        type: 'sine',
        startFreq: 340,
        endFreq: 560,
        duration: 0.044,
        gain: 0.2,
      });
      playNoiseBurst(ctx, {
        duration: 0.01,
        gain: 0.065,
        filterFreq: 1700,
      });
      break;

    case 'toggleOff':
      playTone(ctx, {
        type: 'sine',
        startFreq: 460,
        endFreq: 270,
        duration: 0.042,
        gain: 0.18,
      });
      playNoiseBurst(ctx, {
        duration: 0.01,
        gain: 0.055,
        filterFreq: 1200,
      });
      break;

    case 'tab':
      playTone(ctx, {
        type: 'sine',
        startFreq: 420,
        endFreq: 500,
        duration: 0.032,
        gain: 0.16,
      });
      playNoiseBurst(ctx, {
        duration: 0.014,
        gain: 0.05,
        filterFreq: 2000,
      });
      break;

    case 'select':
      playTone(ctx, {
        type: 'sine',
        startFreq: 523.25,
        endFreq: 620,
        duration: 0.04,
        gain: 0.17,
      });
      break;

    case 'dropdownOpen':
      playTone(ctx, {
        type: 'sine',
        startFreq: 340,
        endFreq: 520,
        duration: 0.045,
        gain: 0.16,
      });
      playNoiseBurst(ctx, {
        duration: 0.016,
        gain: 0.045,
        filterFreq: 2100,
      });
      break;

    case 'dropdownClose':
      playTone(ctx, {
        type: 'sine',
        startFreq: 460,
        endFreq: 300,
        duration: 0.038,
        gain: 0.14,
      });
      break;

    case 'modalOpen':
      playTone(ctx, {
        type: 'sine',
        startFreq: 293.66,
        endFreq: 440,
        duration: 0.085,
        gain: 0.16,
      });
      playTone(ctx, {
        type: 'sine',
        startFreq: 587.33,
        delay: 0.02,
        duration: 0.09,
        gain: 0.09,
      });
      break;

    case 'modalClose':
      playTone(ctx, {
        type: 'sine',
        startFreq: 420,
        endFreq: 270,
        duration: 0.068,
        gain: 0.15,
      });
      break;

    case 'sliderTick':
      playTone(ctx, {
        type: 'triangle',
        startFreq: 620,
        endFreq: 360,
        duration: 0.014,
        gain: 0.085,
        filterFreq: 1600,
      });
      break;

    case 'dragStart':
      playTone(ctx, {
        type: 'sine',
        startFreq: 250,
        endFreq: 345,
        duration: 0.038,
        gain: 0.15,
      });
      break;

    case 'panelSwap':
      playTone(ctx, {
        type: 'triangle',
        startFreq: 392,
        endFreq: 261.63,
        duration: 0.055,
        gain: 0.2,
        filterFreq: 1400,
      });
      playTone(ctx, {
        type: 'sine',
        startFreq: 523.25,
        delay: 0.018,
        duration: 0.055,
        gain: 0.12,
      });
      break;

    case 'copy':
      playTone(ctx, {
        type: 'sine',
        startFreq: 659.25,
        duration: 0.025,
        gain: 0.14,
      });
      playTone(ctx, {
        type: 'sine',
        startFreq: 880,
        delay: 0.028,
        duration: 0.036,
        gain: 0.14,
      });
      break;

    case 'clear':
    case 'reset':
      playTone(ctx, {
        type: 'triangle',
        startFreq: 310,
        endFreq: 185,
        duration: 0.055,
        gain: 0.16,
        filterFreq: 1000,
      });
      playNoiseBurst(ctx, {
        duration: 0.035,
        gain: 0.05,
        filterType: 'lowpass',
        filterFreq: 950,
      });
      break;

    case 'keystroke': {
      const jitter = 0.94 + Math.random() * 0.12;
      playTone(ctx, {
        type: 'triangle',
        startFreq: 190 * jitter,
        endFreq: 95 * jitter,
        duration: 0.015,
        gain: 0.075,
        filterFreq: 850,
      });
      playNoiseBurst(ctx, {
        duration: 0.008,
        gain: 0.032,
        filterType: 'lowpass',
        filterFreq: 950,
      });
      break;
    }

    case 'runStart':
      playTone(ctx, {
        type: 'triangle',
        startFreq: 293.66,
        endFreq: 440,
        duration: 0.06,
        gain: 0.18,
        filterFreq: 1500,
      });
      playNoiseBurst(ctx, {
        duration: 0.012,
        gain: 0.06,
        filterFreq: 1650,
      });
      break;

    case 'runPass':
      // Calm, positive ascending botanical fifth/octave chime
      playTone(ctx, {
        type: 'sine',
        startFreq: 523.25, // C5
        duration: 0.11,
        gain: 0.18,
      });
      playTone(ctx, {
        type: 'sine',
        startFreq: 659.25, // E5
        delay: 0.055,
        duration: 0.13,
        gain: 0.17,
      });
      playTone(ctx, {
        type: 'triangle',
        startFreq: 783.99, // G5
        delay: 0.11,
        duration: 0.22,
        gain: 0.16,
        filterFreq: 2400,
      });
      break;

    case 'runError':
      // Subtle, muted low wooden double-thud to signal an error clearly without harshness
      playTone(ctx, {
        type: 'triangle',
        startFreq: 185,
        endFreq: 146.83,
        duration: 0.085,
        gain: 0.24,
        filterFreq: 680,
      });
      playTone(ctx, {
        type: 'triangle',
        startFreq: 155,
        endFreq: 116.54,
        delay: 0.075,
        duration: 0.14,
        gain: 0.25,
        filterFreq: 560,
      });
      playNoiseBurst(ctx, {
        duration: 0.02,
        gain: 0.045,
        filterType: 'lowpass',
        filterFreq: 520,
      });
      break;

    case 'tutorSend':
      playTone(ctx, {
        type: 'sine',
        startFreq: 392,
        endFreq: 523.25,
        duration: 0.048,
        gain: 0.15,
      });
      break;

    case 'tutorReceive':
      playTone(ctx, {
        type: 'sine',
        startFreq: 587.33,
        duration: 0.07,
        gain: 0.12,
      });
      playTone(ctx, {
        type: 'sine',
        startFreq: 523.25,
        delay: 0.05,
        duration: 0.1,
        gain: 0.13,
      });
      break;

    case 'challengePass':
      playTone(ctx, { type: 'sine', startFreq: 587.33, duration: 0.11, gain: 0.18 }); // D5
      playTone(ctx, { type: 'sine', startFreq: 739.99, delay: 0.06, duration: 0.13, gain: 0.18 }); // F#5
      playTone(ctx, { type: 'sine', startFreq: 880.0, delay: 0.12, duration: 0.24, gain: 0.2 }); // A5
      break;

    case 'challengeAlmost':
      playTone(ctx, { type: 'sine', startFreq: 392, duration: 0.06, gain: 0.15 });
      playTone(ctx, { type: 'sine', startFreq: 349.23, delay: 0.065, duration: 0.09, gain: 0.15 });
      break;
  }
}

/**
 * Play a semantic UI or execution sound immediately.
 * Marks an explicit timestamp so global DOM delegation does not double-fire.
 */
export function playSound(effect: SoundEffect): void {
  if (effect !== 'keystroke' && effect !== 'sliderTick') {
    lastExplicitSoundAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  synthesize(effect);
}

function recentlyPlayedExplicit(): boolean {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return now - lastExplicitSoundAt < 50;
}

/**
 * Mounts global capture-phase event delegation so every single interactive UI element
 * across the workspace automatically emits subtle, context-aware tactile sound effects
 * whenever a specialized React handler didn't already trigger a semantic sound.
 */
export function initGlobalUISoundDelegation(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleClickCapture = (e: MouseEvent) => {
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget) return;

    const el = rawTarget.closest(
      'button, [role="button"], a[href], select, input[type="checkbox"], input[type="radio"], input[type="color"], summary'
    ) as HTMLElement | null;

    if (!el) return;
    if (el.dataset.sound === 'none') return;
    if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;

    const explicitHint = el.dataset.sound as SoundEffect | undefined;

    queueMicrotask(() => {
      if (recentlyPlayedExplicit()) return;
      if (explicitHint) {
        synthesize(explicitHint);
        return;
      }

      if (el.matches('select')) {
        synthesize('dropdownOpen');
        return;
      }
      if (el.matches('input[type="checkbox"], input[type="radio"]')) {
        synthesize((el as HTMLInputElement).checked ? 'toggleOn' : 'toggleOff');
        return;
      }
      if (el.matches('input[type="color"]')) {
        synthesize('dropdownOpen');
        return;
      }

      const ariaExpanded = el.getAttribute('aria-expanded');
      if (ariaExpanded === 'true') {
        synthesize('dropdownOpen');
        return;
      }
      if (ariaExpanded === 'false') {
        synthesize('dropdownClose');
        return;
      }

      if (el.getAttribute('role') === 'tab') {
        synthesize('tab');
        return;
      }

      const cls = el.className || '';
      if (typeof cls === 'string' && cls.includes('shadow-sm') && cls.includes('font-semibold')) {
        synthesize('primary');
        return;
      }

      synthesize('click');
    });
  };

  const handleChangeCapture = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.matches('select')) {
      queueMicrotask(() => {
        if (!recentlyPlayedExplicit()) synthesize('select');
      });
    } else if (target.matches('input[type="color"]')) {
      queueMicrotask(() => {
        if (!recentlyPlayedExplicit()) synthesize('select');
      });
    }
  };

  const handleInputCapture = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.matches('input[type="range"]')) {
      synthesize('sliderTick');
    } else if (target.matches('input[type="text"], input[type="search"], textarea')) {
      // CodeEditor plays its own gentle keystroke if enabled; avoid double-firing
      synthesize('keystroke');
    }
  };

  const handlePointerDownCapture = (e: PointerEvent) => {
    if (config.enabled) {
      ensureAudioContext();
    }
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget) return;

    if (rawTarget.closest('[role="separator"]')) {
      synthesize('dragStart');
      return;
    }

    const inputEl = rawTarget.closest('input[type="text"], textarea') as HTMLElement | null;
    if (inputEl && document.activeElement !== inputEl) {
      synthesize('sliderTick');
    }
  };

  const handleDragStartCapture = (e: DragEvent) => {
    const rawTarget = e.target as HTMLElement | null;
    if (rawTarget?.closest('[draggable="true"]')) {
      synthesize('dragStart');
    }
  };

  const handleDropCapture = () => {
    queueMicrotask(() => {
      if (!recentlyPlayedExplicit()) synthesize('panelSwap');
    });
  };

  document.addEventListener('click', handleClickCapture, true);
  document.addEventListener('change', handleChangeCapture, true);
  document.addEventListener('input', handleInputCapture, true);
  document.addEventListener('pointerdown', handlePointerDownCapture, true);
  document.addEventListener('dragstart', handleDragStartCapture, true);
  document.addEventListener('drop', handleDropCapture, true);

  return () => {
    document.removeEventListener('click', handleClickCapture, true);
    document.removeEventListener('change', handleChangeCapture, true);
    document.removeEventListener('input', handleInputCapture, true);
    document.removeEventListener('pointerdown', handlePointerDownCapture, true);
    document.removeEventListener('dragstart', handleDragStartCapture, true);
    document.removeEventListener('drop', handleDropCapture, true);
  };
}
