// Synthetic sound generator using Web Audio API.
// Avoids external files; produces short ticks and a success chord.

let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function setSoundEnabled(value) {
  enabled = !!value;
}

export function isSoundEnabled() {
  return enabled;
}

function beep({ freq = 800, duration = 0.05, type = 'square', volume = 0.08, attack = 0.005, release = 0.05 }) {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = audio.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + duration + release);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + duration + release + 0.01);
}

/** Quick tick used during roulette spin. */
export function playTick() {
  beep({ freq: 1200, duration: 0.03, type: 'square', volume: 0.05 });
}

/** Whistle-like reveal sound. */
export function playReveal() {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  // Ascending chirp
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  const now = audio.currentTime;
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
  gain.gain.linearRampToValueAtTime(0, now + 0.4);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.45);
}

/** Celebration chord when a match is confirmed. */
export function playSuccess() {
  if (!enabled) return;
  const audio = getCtx();
  if (!audio) return;
  const freqs = [523.25, 659.25, 783.99]; // C5 E5 G5
  freqs.forEach((f, i) => {
    setTimeout(() => {
      beep({ freq: f, duration: 0.18, type: 'triangle', volume: 0.09, attack: 0.01, release: 0.15 });
    }, i * 80);
  });
}

/** Error buzz. */
export function playError() {
  if (!enabled) return;
  beep({ freq: 180, duration: 0.18, type: 'sawtooth', volume: 0.1, attack: 0.005, release: 0.1 });
}
