// Sound effects — plays the real MP3 files from /public/sounds/
// Falls back to Web Audio API synthesis if the file fails to load

// ── Cache Audio objects so they don't reload on every call ──
const cache: Record<string, HTMLAudioElement> = {};

function playFile(filename: string, volume = 1.0) {
  if (typeof window === 'undefined') return;
  try {
    if (!cache[filename]) {
      const audio = new Audio(`/sounds/${filename}`);
      audio.preload = 'auto';
      cache[filename] = audio;
    }
    const audio = cache[filename];
    // Reset to start so rapid calls work
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {
      // Autoplay blocked or file missing — fall back to synthesis
      synthFallback(filename);
    });
  } catch {
    synthFallback(filename);
  }
}

// ── Web Audio synthesis fallback ──
function synthFallback(filename: string) {
  try {
    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    if (filename.includes('Alert')) {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
      osc.start(); osc.stop(ac.currentTime + 0.35);
    } else if (filename.includes('Scan')) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.5);
      gain.gain.setValueAtTime(0.12, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
      osc.start(); osc.stop(ac.currentTime + 0.55);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      osc.start(); osc.stop(ac.currentTime + 0.25);
    }
  } catch {}
}

// ── Preload all sounds on first import ──
if (typeof window !== 'undefined') {
  ['playAlert.mp3', 'playScan.mp3', 'playBlock.mp3'].forEach(f => {
    const a = new Audio(`/sounds/${f}`);
    a.preload = 'auto';
    cache[f] = a;
  });
}

/** Threat/alert detected */
export function playAlert() { playFile('playAlert.mp3', 0.8); }

/** AI scan initiated */
export function playScan()  { playFile('playScan.mp3',  0.7); }

/** IP blocked */
export function playBlock() { playFile('playBlock.mp3', 0.9); }
