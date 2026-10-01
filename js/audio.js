const AudioManager = {
  synth: window.speechSynthesis,
  utterance: null,
  rate: 1.0,
  isPlaying: false,
  isPaused: false,

  speak(text, onBoundary, onEnd) {
    this.stop();
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = this.rate;
    this.utterance.pitch = 1.1;
    this.utterance.volume = 1.0;

    const voices = this.synth.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Karen') || v.lang === 'en-GB'
    );
    if (preferred) this.utterance.voice = preferred;

    if (onBoundary) this.utterance.onboundary = onBoundary;
    this.utterance.onend = () => {
      this.isPlaying = false; this.isPaused = false;
      if (onEnd) onEnd();
    };
    this.utterance.onerror = () => { this.isPlaying = false; this.isPaused = false; };

    this.synth.speak(this.utterance);
    this.isPlaying = true;
    this.isPaused = false;
  },

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause(); this.isPaused = true;
    }
  },

  resume() {
    if (this.isPaused) {
      this.synth.resume(); this.isPaused = false;
    }
  },

  stop() {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.utterance = null;
  },

  setRate(r) { this.rate = parseFloat(r); }
};

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}
