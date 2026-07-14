export const SOUND_PRESETS = [
  { id: 'beep', name: 'Classic Beep' },
  { id: 'chime', name: 'Soft Chime' },
  { id: 'radar', name: 'Radar' },
  { id: 'digital', name: 'Digital Watch' },
  { id: 'bell', name: 'Desk Bell' },
  { id: 'synth', name: 'Synth Pop' },
  { id: 'gentle', name: 'Gentle Wake' },
  { id: 'alert', name: 'High Alert' },
  { id: 'echo', name: 'Echo Drop' },
  { id: 'piano', name: 'Piano Chord' },
];

let audioCtx: AudioContext | null = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playSound(presetId: string, volume: number = 1) {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    
    // Adjust volume
    gain.gain.setValueAtTime(volume * 0.5, t);

    const playTone = (freq: number, type: OscillatorType, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + dur);
      return osc;
    };

    switch (presetId) {
      case 'beep':
        playTone(800, 'sine', t, 0.15);
        playTone(800, 'sine', t + 0.3, 0.15);
        break;
      case 'chime':
        playTone(523.25, 'sine', t, 0.4); // C5
        playTone(659.25, 'sine', t + 0.2, 0.6); // E5
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        break;
      case 'radar':
        playTone(600, 'triangle', t, 0.2);
        playTone(800, 'triangle', t + 0.2, 0.2);
        playTone(1000, 'triangle', t + 0.4, 0.4);
        break;
      case 'digital':
        playTone(2000, 'square', t, 0.05);
        playTone(2000, 'square', t + 0.1, 0.05);
        break;
      case 'bell':
        playTone(880, 'sine', t, 0.5); // A5
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        break;
      case 'synth':
        playTone(300, 'sawtooth', t, 0.2);
        playTone(400, 'sawtooth', t + 0.2, 0.2);
        playTone(500, 'sawtooth', t + 0.4, 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        break;
      case 'gentle':
        playTone(349.23, 'sine', t, 0.4); // F4
        playTone(440, 'sine', t + 0.4, 0.6); // A4
        gain.gain.linearRampToValueAtTime(0, t + 1.0);
        break;
      case 'alert':
        playTone(1000, 'square', t, 0.1);
        playTone(1000, 'square', t + 0.2, 0.1);
        playTone(1000, 'square', t + 0.4, 0.1);
        break;
      case 'echo':
        playTone(800, 'sine', t, 0.1);
        playTone(800, 'sine', t + 0.3, 0.1);
        gain.gain.setValueAtTime(volume * 0.25, t + 0.3);
        playTone(800, 'sine', t + 0.6, 0.1);
        gain.gain.setValueAtTime(volume * 0.1, t + 0.6);
        break;
      case 'piano':
        playTone(261.63, 'sine', t, 1); // C4
        playTone(329.63, 'sine', t, 1); // E4
        playTone(392.00, 'sine', t, 1); // G4
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1);
        break;
      default:
        playTone(800, 'sine', t, 0.1);
    }
  } catch(e) {
    console.error("Audio error", e);
  }
}
