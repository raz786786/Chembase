// ─── Synthesized Sound Engine (Web Audio API, zero assets) ───────────────────
let ctx: AudioContext | null = null;

const MUTE_KEY = 'chembase_sound_muted';
let muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
const listeners = new Set<(m: boolean) => void>();

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  startAt: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startAt);
  g.gain.setValueAtTime(0, c.currentTime + startAt);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + startAt + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startAt + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + startAt);
  osc.stop(c.currentTime + startAt + dur + 0.05);
}

export type SoundName = 'ping' | 'warning' | 'critical' | 'success' | 'boot' | 'click';

export function playSound(name: SoundName) {
  if (muted) return;
  switch (name) {
    case 'ping':
      tone(880, 0, 0.15, 'sine', 0.06);
      break;
    case 'warning':
      tone(660, 0, 0.12, 'triangle', 0.07);
      tone(880, 0.14, 0.12, 'triangle', 0.07);
      break;
    case 'critical':
      tone(523, 0, 0.18, 'sawtooth', 0.08);
      tone(392, 0.2, 0.22, 'sawtooth', 0.09);
      tone(523, 0.45, 0.18, 'sawtooth', 0.08);
      tone(392, 0.65, 0.3, 'sawtooth', 0.09);
      break;
    case 'success':
      tone(523, 0, 0.1, 'sine', 0.06);
      tone(659, 0.1, 0.1, 'sine', 0.06);
      tone(784, 0.2, 0.16, 'sine', 0.06);
      break;
    case 'boot':
      tone(220, 0, 0.3, 'square', 0.03);
      tone(330, 0.15, 0.3, 'square', 0.03);
      tone(440, 0.3, 0.2, 'square', 0.03);
      tone(880, 0.5, 0.25, 'sine', 0.05);
      break;
    case 'click':
      tone(1200, 0, 0.05, 'sine', 0.04);
      break;
  }
}

export function isSoundMuted() {
  return muted;
}

export function toggleSoundMuted(): boolean {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch { /* ignore */ }
  listeners.forEach((l) => l(muted));
  if (!muted) playSound('ping');
  return muted;
}

export function onSoundMuteChange(cb: (m: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
