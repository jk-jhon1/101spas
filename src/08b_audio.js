/* ============================================================
   08b_audio: efeitos sonoros sintetizados (WebAudio, sem arquivos)
   ============================================================ */
const Snd = {
  ctx: null, master: null, muted: false, vol: .5, last: {}, nbuf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); const comp = this.ctx.createDynamicsCompressor(); this.master = this.ctx.createGain(); this.master.gain.value = this.vol;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 1; this.nbuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate); const d = this.nbuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setVol(v) { this.vol = v; if (this.master) this.master.gain.value = this.muted ? 0 : v; },
  mute(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : this.vol; },
  tone(f, dur, type = 'square', vol = .15, to = 0, delay = 0) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, vol = .2, f0 = 1500, f1 = 0, type = 'bandpass', delay = 0, q = 1) {
    if (!this.ctx || this.muted || !this.nbuf) return; const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.nbuf; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  },
  play(n, v = 1) {
    if (!this.ctx || this.muted) return; const now = performance.now(); if (this.last[n] && now - this.last[n] < (n === 'hit' ? 35 : 55)) return; this.last[n] = now;
    const T = (...a) => this.tone(...a), N = (...a) => this.noise(...a);
    switch (n) {
      case 'swing': N(.13, .1 * v, 700, 2600, 'bandpass', 0, 1.2); break;
      case 'swing2': N(.2, .13 * v, 400, 2000, 'bandpass', 0, 1); T(160, .15, 'sawtooth', .04, 80); break;
      case 'hit': N(.09, .2 * v, 900, 200, 'lowpass'); T(130, .1, 'square', .1 * v, 60); break;
      case 'crit': N(.12, .22 * v, 1500, 300, 'lowpass'); T(520, .12, 'square', .1, 900); T(900, .1, 'triangle', .08, 1400, .05); break;
      case 'mine': N(.06, .12 * v, 2200, 900, 'bandpass'); T(240 + Math.random() * 60, .05, 'square', .05, 120); break;
      case 'break': N(.16, .2 * v, 1200, 200, 'lowpass'); T(110, .12, 'square', .08, 50); break;
      case 'place': T(300, .05, 'square', .07, 200); N(.04, .08, 1800, 800); break;
      case 'pickup': T(880, .07, 'square', .06, 0); T(1320, .09, 'square', .06, 0, .06); break;
      case 'hurt': T(260, .22, 'sawtooth', .16, 90); N(.18, .15, 800, 200, 'lowpass'); break;
      case 'jump': T(260, .09, 'triangle', .07, 420); break;
      case 'shot': T(900, .1, 'square', .07, 300); N(.06, .06, 3000, 1000); break;
      case 'fire': N(.3, .14 * v, 500, 1800, 'bandpass', 0, .8); T(200, .25, 'sawtooth', .04, 120); break;
      case 'ice': T(1400, .22, 'sine', .08, 2400); T(2100, .3, 'triangle', .05, 1500, .05); N(.15, .05, 5000, 3000, 'highpass'); break;
      case 'boom': N(.5, .35 * v, 500, 60, 'lowpass'); T(110, .45, 'sine', .3, 30); break;
      case 'kill': T(420, .1, 'square', .06, 80); N(.1, .1, 1000, 300, 'lowpass'); break;
      case 'heal': for (let i = 0; i < 4; i++) T(500 + i * 160, .12, 'triangle', .07, 0, i * .07); break;
      case 'craft': T(1200, .08, 'square', .06, 0); T(1500, .1, 'square', .06, 0, .09); N(.05, .1, 3000, 2000); break;
      case 'splash': N(.25, .12, 900, 300, 'lowpass'); break;
      case 'laser': T(1800, .25, 'sawtooth', .06, 400); break;
      case 'portal': T(200, .4, 'sine', .1, 800); T(400, .4, 'sine', .08, 1200, .05); break;
      case 'thunder': N(.5, .3, 3000, 100, 'lowpass'); T(70, .5, 'sawtooth', .12, 30); break;
      case 'magic': T(700, .15, 'sine', .08, 1400); T(1050, .2, 'sine', .06, 1900, .06); break;
      case 'tick': T(1000, .03, 'square', .04); break;
      case 'boss': T(70, 1.2, 'sawtooth', .22, 40); N(1, .2, 200, 60, 'lowpass'); T(90, 1.4, 'square', .1, 45, .3); break;
      case 'door': N(.1, .1, 500, 300, 'lowpass'); T(150, .1, 'square', .06, 100); break;
      case 'coin': T(1300, .06, 'square', .05); T(1700, .1, 'square', .05, 0, .05); break;
    }
  },
};
function sfx(n, v) { Snd.play(n, v); }
