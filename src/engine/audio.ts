// Adaptive Generative Web Audio Synthesizer (Warm Filtered Kalimba/Marimba + Soft Pad + SFX)
// Never repeats the exact same 16-step bar: rotates A -> B -> A' -> Bridge phrases + mood by level!

export type MusicMood = 'lobby' | 'sunny' | 'lounge' | 'focus';

interface ChordSpec {
  bass: number;
  pad: number[];
  scale: number[];
}

const PROGRESSIONS: Record<MusicMood, ChordSpec[]> = {
  // Light, airy C-major lobby feel
  lobby: [
    { bass: 130.81, pad: [261.63, 329.63, 392.0], scale: [523.25, 587.33, 659.25, 783.99, 880.0] },
    { bass: 174.61, pad: [261.63, 349.23, 440.0], scale: [523.25, 659.25, 698.46, 783.99, 880.0] },
    { bass: 220.0,  pad: [261.63, 329.63, 440.0], scale: [523.25, 587.33, 659.25, 783.99, 1046.5] },
    { bass: 196.0,  pad: [246.94, 293.66, 392.0], scale: [493.88, 587.33, 659.25, 783.99, 880.0] }
  ],
  // Warm sunny puzzle groove (G major)
  sunny: [
    { bass: 196.0,  pad: [246.94, 293.66, 392.0], scale: [392.0, 440.0, 493.88, 587.33, 659.25, 783.99] },
    { bass: 164.81, pad: [246.94, 329.63, 392.0], scale: [392.0, 493.88, 587.33, 659.25, 783.99] },
    { bass: 130.81, pad: [261.63, 329.63, 392.0], scale: [523.25, 587.33, 659.25, 783.99, 987.77] },
    { bass: 146.83, pad: [293.66, 369.99, 440.0], scale: [440.0, 493.88, 587.33, 659.25, 739.99] }
  ],
  // Cozy Fmaj7 / Dm9 chill groove
  lounge: [
    { bass: 174.61, pad: [261.63, 329.63, 349.23], scale: [440.0, 523.25, 587.33, 659.25, 698.46, 880.0] },
    { bass: 146.83, pad: [261.63, 293.66, 349.23], scale: [440.0, 523.25, 587.33, 659.25, 783.99] },
    { bass: 116.54, pad: [233.08, 293.66, 349.23], scale: [466.16, 523.25, 587.33, 698.46, 783.99] },
    { bass: 130.81, pad: [261.63, 329.63, 392.0],  scale: [392.0, 440.0, 523.25, 659.25, 783.99] }
  ],
  // Focused rhythmic pulse for Hard / Super Hard levels (A minor)
  focus: [
    { bass: 110.0,  pad: [220.0, 261.63, 329.63], scale: [440.0, 523.25, 587.33, 659.25, 783.99, 880.0] },
    { bass: 174.61, pad: [220.0, 261.63, 349.23], scale: [440.0, 523.25, 659.25, 698.46, 880.0] },
    { bass: 130.81, pad: [261.63, 329.63, 392.0], scale: [523.25, 587.33, 659.25, 783.99, 987.77] },
    { bass: 164.81, pad: [246.94, 329.63, 392.0], scale: [493.88, 587.33, 659.25, 783.99, 880.0] }
  ]
};

// 4 rhythmic motif sections (A, B, A', Bridge) so phrases breathe and evolve naturally
const RHYTHM_SECTIONS: number[][] = [
  [1, 0, 1, 1, 0, 1, 0, 1], // Section A (melodic)
  [1, 1, 0, 1, 0, 0, 1, 0], // Section B (syncopated)
  [1, 0, 0, 1, 1, 0, 1, 1], // Section A' (playful variation)
  [1, 0, 0, 0, 1, 0, 0, 0]  // Bridge (airy breather so ears never fatigue!)
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private step = 0;
  private bar = 0;
  private lastNoteIdx = 2;
  private mood: MusicMood = 'lobby';
  private musicEnabled = true;
  private sfxEnabled = true;
  private wasPlayingBeforeBg = false;
  private lifecycleBound = false;

  private bindLifecycle() {
    if (this.lifecycleBound || typeof document === 'undefined' || typeof window === 'undefined') return;
    this.lifecycleBound = true;

    const pauseBg = () => {
      if (this.bgmTimer !== null) {
        this.wasPlayingBeforeBg = true;
        this.stopMusic();
      }
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    };

    const resumeBg = () => {
      if (document.hidden || !this.musicEnabled) return;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.wasPlayingBeforeBg) {
        this.wasPlayingBeforeBg = false;
        this.startMusic();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseBg();
      else resumeBg();
    });
    window.addEventListener('pagehide', pauseBg);
    window.addEventListener('pageshow', resumeBg);

    // Native Android BridgeActivity.onPause/onResume hook
    (window as unknown as { __setAppPaused?: (p: boolean) => void }).__setAppPaused = (paused: boolean) => {
      if (paused) pauseBg();
      else resumeBg();
    };
  }

  public get muted(): boolean {
    return !this.musicEnabled && !this.sfxEnabled;
  }

  public set muted(val: boolean) {
    this.setMusicEnabled(!val);
    this.setSfxEnabled(!val);
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.wasPlayingBeforeBg = false;
      this.stopMusic();
    } else if (this.ctx) {
      this.startMusic();
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setMood(nextMood: MusicMood) {
    if (this.mood === nextMood) return;
    this.mood = nextMood;
    if (this.bgmTimer !== null) {
      this.stopMusic();
      this.startMusic();
    }
  }

  private ensureCtx(forType: 'music' | 'sfx' = 'sfx'): AudioContext | null {
    if (forType === 'music' && !this.musicEnabled) return null;
    if (forType === 'sfx' && !this.sfxEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAndStartMusic() {
    this.bindLifecycle();
    if (!this.musicEnabled) return;
    const ctx = this.ensureCtx('music');
    if (!ctx) return;
    if (this.bgmTimer === null) {
      this.startMusic();
    }
  }

  private playWarmPluck(ctx: AudioContext, freq: number, vol: number, dur: number, type: OscillatorType = 'sine') {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + dur);

    gain.gain.setValueAtTime(0.0008, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0006, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + dur + 0.03);
  }

  public startMusic() {
    if (!this.musicEnabled || typeof window === 'undefined') return;
    if (this.bgmTimer !== null) return;
    this.ensureCtx('music');

    const stepMs = this.mood === 'focus' ? 245 : this.mood === 'lounge' ? 310 : 280;

    const tick = () => {
      if (!this.musicEnabled) return;
      const ctx = this.ensureCtx('music');
      if (!ctx || ctx.state !== 'running') return;

      const prog = PROGRESSIONS[this.mood];
      const stepInBar = this.step % 8;
      if (stepInBar === 0 && this.step > 0) this.bar++;
      this.step++;

      const chord = prog[this.bar % prog.length];
      const sectionIdx = Math.floor(this.bar / 4) % RHYTHM_SECTIONS.length;
      const pattern = RHYTHM_SECTIONS[sectionIdx];

      // Beat 0: Soft warm bass + gentle filtered chord pad
      if (stepInBar === 0) {
        this.playWarmPluck(ctx, chord.bass, 0.032, 0.85, 'triangle');
        // Soft breathing pad on every 2nd bar so it feels lush, not dense
        if (this.bar % 2 === 0 || sectionIdx === 3) {
          chord.pad.forEach((pFreq) => {
            this.playWarmPluck(ctx, pFreq, 0.012, 1.35, 'sine');
          });
        }
      }

      // Soft off-beat bass pulse in Focus mode
      if (this.mood === 'focus' && stepInBar === 4) {
        this.playWarmPluck(ctx, chord.bass * 1.5, 0.02, 0.35, 'triangle');
      }

      // Generative melodic pluck following smooth stepwise motion inside current chord's pentatonic scale
      if (pattern[stepInBar] === 1) {
        // Occasional gentle rest for organic human feel
        if (sectionIdx !== 3 && Math.random() < 0.14) return;
        const delta = Math.random() < 0.65 ? (Math.random() < 0.5 ? 1 : -1) : Math.random() < 0.5 ? 2 : -2;
        this.lastNoteIdx = Math.max(0, Math.min(chord.scale.length - 1, this.lastNoteIdx + delta));
        const freq = chord.scale[this.lastNoteIdx];
        const vel = stepInBar === 0 ? 0.036 : 0.026 + Math.random() * 0.01;
        this.playWarmPluck(ctx, freq, vel, 0.42, 'sine');
      }
    };

    tick();
    this.bgmTimer = window.setInterval(tick, stepMs);
  }

  public stopMusic() {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public playUnscrew() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playLocked() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playBoxSnap(combo = 1) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const base = notes[Math.min(combo - 1, notes.length - 1)];
    [base, base * 1.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.16, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.17);
    });
  }

  public playPlateDrop() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playWin() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playFail() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [310, 240, 180].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.11;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }
}

export const sound = new SoundEngine();
