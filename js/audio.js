window.TypingAudio = {
  _ctx: null,
  _enabled: true,

  initAudio() {
    if (this._ctx) return this._ctx;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  },

  _ensureCtx() {
    const ctx = this.initAudio();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  },

  _play(freq, duration, type, endFreq) {
    if (!this._enabled) return;
    const ctx = this._ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq != null) {
      osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration / 1000);
    }
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  },

  playCorrect() {
    this._play(400, 80, 'sine');
  },

  playWrong() {
    this._play(200, 150, 'sawtooth');
  },

  playComplete() {
    this._play(500, 200, 'sine', 800);
  },

  playGameOver() {
    this._play(500, 300, 'sine', 200);
  },

  setEnabled(enabled) {
    this._enabled = enabled;
  },

  isEnabled() {
    return this._enabled;
  }
};
