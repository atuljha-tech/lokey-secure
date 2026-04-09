// Web Audio API sound effects — no external files needed

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try { return new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
}

function play(build: (ac: AudioContext) => void) {
  const ac = ctx();
  if (!ac) return;
  try { build(ac); } catch {}
}

/** Short descending beep — threat/alert detected */
export function playAlert() {
  play(ac => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.35);
  });
}

/** Rising sweep — AI scan initiated */
export function playScan() {
  play(ac => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.25);
    osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.5);
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.55);
  });
}

/** Hard thud — IP blocked */
export function playBlock() {
  play(ac => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.25);
  });
}
