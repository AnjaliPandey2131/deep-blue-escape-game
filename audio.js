// Procedural Audio Engine using the Web Audio API
// This avoids loading external audio files and guarantees no 404 errors.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    
    this.musicEnabled = true;
    this.sfxEnabled = true;
    
    this.bgmInterval = null;
    this.bgmPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMusic(enabled) {
    this.musicEnabled = enabled;
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.3 : 0, this.ctx ? this.ctx.currentTime : 0);
    }
    if (enabled && !this.bgmPlaying) {
      this.startBGM();
    }
  }

  toggleSFX(enabled) {
    this.sfxEnabled = enabled;
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(enabled ? 0.6 : 0, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  // Play a soft bubble pop sound
  playBubble() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.12);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Play a soft splash sound
  playSplash() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t); // Reduced landing volume
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  // Play dice roll click tick sound
  playDiceClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(150, t + 0.02);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Play a soft high bubble tone for button hover
  playHover() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.05);

    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Play a button click sound
  playClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Sound of fish movement
  playMove() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.25);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Whirlpool sound effect (modulated pitch sweep)
  playWhirlpool() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const duration = 1.2;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(200, t + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(600, t + duration);

    filter.type = 'peaking';
    filter.frequency.setValueAtTime(400, t);
    filter.Q.setValueAtTime(10, t);

    gain.gain.setValueAtTime(0.15, t); // Softened whirlpool
    gain.gain.linearRampToValueAtTime(0.22, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration + 0.1);
  }

  // Low frequency dramatic shark attack sound
  playShark() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.25, t); // Softer dramatic shark cue
    gain.gain.linearRampToValueAtTime(0.01, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.85);
  }

  // High-pitched chirpy dolphin jump sound
  playDolphin() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(2500, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(1500, t + 0.3);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Electric Jellyfish shock sound
  playShock() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(350, t + 0.1);
    osc.frequency.linearRampToValueAtTime(120, t + 0.2);
    osc.frequency.linearRampToValueAtTime(400, t + 0.3);

    gain.gain.setValueAtTime(0.12, t); // Softer jellyfish shock
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Victory fanfare sound
  playVictory() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
    const t = this.ctx.currentTime;
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.6);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.6);
    });
  }

  // Starts the calm, ambient underwater music
  startBGM() {
    if (!this.musicEnabled) return;
    this.init();
    this.resume();

    if (this.bgmPlaying) return;
    this.bgmPlaying = true;

    // Ambient chord progression
    const chords = [
      [110.00, 164.81, 220.00, 277.18], // A maj (A2, E3, A3, C#4)
      [97.99, 146.83, 196.00, 246.94],  // G maj (G2, D3, G3, B3)
      [87.31, 130.81, 174.61, 220.00],  // F maj (F2, C3, F3, A3)
      [73.42, 110.00, 146.83, 185.00]   // D maj (D2, A2, D3, F#3)
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.musicEnabled || !this.bgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const activeChord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      activeChord.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Slow soft sine waves
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Add slow pitch modulation (LFO-like) to simulate water wave detuning
        osc.frequency.linearRampToValueAtTime(freq + Math.random() * 2 - 1, now + 5);

        // Very slow attack and release
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 2); // soft entry
        gain.gain.setValueAtTime(0.06, now + 4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);

        // Lowpass filter for deep underwater feeling
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    };

    // Trigger chord every 5.5 seconds
    playChord();
    this.bgmInterval = setInterval(playChord, 5500);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const audio = new AudioEngine();
