/**
 * Web Audio API Sound Synthesizer for MediPredict AI
 * Provides non-blocking clinical auditory feedback (clicks, confirmations, alerts).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("mp_audio_muted") === "true";
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtor) {
        this.ctx = new AudioCtor();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("mp_audio_muted", this.isMuted ? "true" : "false");
    }
    if (!this.isMuted) {
      this.playSuccess();
    }
    return this.isMuted;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", gainVal: number = 0.04) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio fallback safe
    }
  }

  public playClick() {
    this.playTone(640, 0.05, "triangle", 0.02);
  }

  public playSuccess() {
    this.playTone(523.25, 0.1, "sine", 0.03); // C5
    setTimeout(() => this.playTone(659.25, 0.12, "sine", 0.035), 80); // E5
    setTimeout(() => this.playTone(1046.5, 0.2, "sine", 0.04), 160); // C6
  }

  public playChime() {
    this.playTone(587.33, 0.15, "sine", 0.03); // D5
    setTimeout(() => this.playTone(880.0, 0.25, "sine", 0.04), 100); // A5
  }

  public playAlert() {
    this.playTone(392.0, 0.12, "sawtooth", 0.03); // G4
    setTimeout(() => this.playTone(329.63, 0.18, "sawtooth", 0.03), 90); // E4
  }

  public playHeartbeat() {
    this.playTone(90, 0.08, "triangle", 0.05);
    setTimeout(() => this.playTone(75, 0.1, "triangle", 0.04), 120);
  }
}

export const sound = new SoundEngine();
