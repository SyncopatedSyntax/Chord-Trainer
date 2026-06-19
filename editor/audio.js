// Minimal, self-contained audio preview for the editor (mirrors the trainer's
// pluck synth but without the iOS first-play hint coupling).
import { OPEN_MIDI } from '../data/theory.js';

let ctx = null, master = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function getMaster(c) {
  if (!master || master.context !== c) { master = c.createGain(); master.gain.value = 0.5; master.connect(c.destination); }
  return master;
}
const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);
function pluck(c, freq, when) {
  [[1, 1.0], [2, 0.45], [3, 0.22], [4, 0.09], [6, 0.04]].forEach(([h, a]) => {
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = freq * h; f.type = 'lowpass'; f.frequency.value = Math.min(3200, freq * h * 3);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.16 * a, when + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, when + (h === 1 ? 1.6 : 0.9));
    o.connect(f); f.connect(g); g.connect(getMaster(c)); o.start(when); o.stop(when + 2);
  });
}
export function playVoicing(v, mode = 'strum') {
  const c = getCtx(), now = c.currentTime + 0.04;
  const notes = v.str.map((fr, i) => fr >= 0 ? midiToHz(OPEN_MIDI[i] + fr) : null).filter(x => x != null);
  const gap = mode === 'arp' ? 0.10 : 0.016;
  notes.forEach((hz, i) => pluck(c, hz, now + i * gap));
}
