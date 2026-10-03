export class SanctuaryAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Deep Sub-bass Sanctuary Drone (55Hz)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter1.Q.setValueAtTime(4, this.ctx.currentTime);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.18, this.ctx.currentTime);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start();

    // 2. Harmonic Resonant Drone (110Hz + 165Hz)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.10, this.ctx.currentTime);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start();

    // 3. Atmospheric Wind / Air Hall Reverb (Pink/White noise with resonant sweep)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.05;
      b2 = 0.85 * b2 + white * 0.05;
      output[i] = (b0 + b1 + b2) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // LFO to slowly sweep the wind frequency
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(noiseFilter.frequency);
    lfo.start();

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      this.isPlaying = false;
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.2);
      this.isPlaying = true;
    }
    return this.isPlaying;
  }
}
