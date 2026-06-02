import type { SimEvents } from "../types";

export interface AudioManager {
  /** must be called from a user gesture to satisfy autoplay policy. */
  resume(): void;
  playEvents(events: SimEvents, ballSpeed: number): void;
  setMuted(muted: boolean): void;
  setMusicOn(on: boolean): void;
  toggleMuted(): boolean;
  dispose(): void;
}

const ARP = [220, 277.18, 329.63, 440]; // A minor-ish arpeggio

export function createAudioManager(): AudioManager {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let muted = false;
  let musicOn = true;
  let arpTimer: ReturnType<typeof setInterval> | null = null;
  let arpStep = 0;

  function ensure(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = musicOn ? 0.06 : 0;
      musicGain.connect(master);
    }
    return ctx;
  }

  function blip(freq: number, type: OscillatorType, duration: number, gain: number): void {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }

  function startMusic(): void {
    if (arpTimer || !ctx || !musicGain) return;
    arpTimer = setInterval(() => {
      if (!ctx || !musicGain) return;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 800;
      osc.type = "triangle";
      osc.frequency.value = ARP[arpStep % ARP.length] ?? 220;
      arpStep++;
      const now = ctx.currentTime;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(1, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.connect(lp);
      lp.connect(env);
      env.connect(musicGain);
      osc.start(now);
      osc.stop(now + 0.35);
    }, 260);
  }

  return {
    resume(): void {
      ensure();
      void ctx?.resume();
      if (musicOn) startMusic();
    },
    playEvents(events: SimEvents, ballSpeed: number): void {
      if (!ctx) return;
      if (events.paddleHit) blip(420 + ballSpeed * 0.15, "square", 0.08, 0.2);
      if (events.wallHit) blip(160, "sine", 0.06, 0.18);
      if (events.scored === 1) blip(660, "sine", 0.25, 0.2);
      if (events.scored === 2) blip(330, "sine", 0.25, 0.2);
    },
    setMuted(value: boolean): void {
      muted = value;
      if (master && ctx) master.gain.value = muted ? 0 : 1;
    },
    setMusicOn(on: boolean): void {
      musicOn = on;
      if (musicGain) musicGain.gain.value = musicOn ? 0.06 : 0;
      if (musicOn) startMusic();
    },
    toggleMuted(): boolean {
      this.setMuted(!muted);
      return muted;
    },
    dispose(): void {
      if (arpTimer) clearInterval(arpTimer);
      arpTimer = null;
      void ctx?.close();
      ctx = null;
    },
  };
}
