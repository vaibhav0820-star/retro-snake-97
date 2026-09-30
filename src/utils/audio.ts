// Web Audio API Synthesizer for 8-bit retro game sound effects
class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a simple synthesized retro tone
  playTone(freq: number, duration: number, type: OscillatorType = 'square', gainVal = 0.15) {
    if (!this.enabled) return;
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
      // Audio context might fail before user gesture
    }
  }

  // Retro sound presets
  playEat() {
    if (!this.enabled) return;
    this.playTone(587.33, 0.08, 'square', 0.12);
    setTimeout(() => this.playTone(880, 0.1, 'square', 0.15), 60);
  }

  playGoldenEat() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.06, 'triangle', 0.15);
    setTimeout(() => this.playTone(659.25, 0.06, 'triangle', 0.15), 60);
    setTimeout(() => this.playTone(783.99, 0.08, 'triangle', 0.18), 120);
    setTimeout(() => this.playTone(1046.5, 0.14, 'square', 0.2), 180);
  }

  playBounce() {
    if (!this.enabled) return;
    this.playTone(280, 0.05, 'triangle', 0.2);
  }

  playBrickHit() {
    if (!this.enabled) return;
    this.playTone(440, 0.06, 'square', 0.15);
  }

  playLaser() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playJump() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch {}
  }

  playStomp() {
    if (!this.enabled) return;
    this.playTone(180, 0.1, 'triangle', 0.22);
  }

  playLineClear() {
    if (!this.enabled) return;
    this.playTone(440, 0.08, 'triangle', 0.15);
    setTimeout(() => this.playTone(554.37, 0.08, 'triangle', 0.15), 70);
    setTimeout(() => this.playTone(659.25, 0.12, 'square', 0.2), 140);
  }

  playTetrisClear() {
    if (!this.enabled) return;
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.1, 'square', 0.18), idx * 60);
    });
  }

  playGameOver() {
    if (!this.enabled) return;
    this.playTone(330, 0.15, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(293, 0.15, 'sawtooth', 0.2), 140);
    setTimeout(() => this.playTone(261, 0.18, 'sawtooth', 0.2), 280);
    setTimeout(() => this.playTone(220, 0.35, 'sawtooth', 0.25), 420);
  }

  playVictory() {
    if (!this.enabled) return;
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.12, 'triangle', 0.2), i * 90);
    });
    setTimeout(() => this.playTone(659.25, 0.3, 'square', 0.25), 360);
  }
}

export const sound = new SoundController();
