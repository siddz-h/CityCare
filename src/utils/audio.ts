/**
 * Clean Web Audio API Chime Synthesizer
 * Produces realistic 2-tone hospital queue announcement bell (D5 -> A5)
 */
export function playHospitalQueueChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack and natural exponential decay
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Tone 1: 587.33 Hz (D5)
    playTone(587.33, now, 0.45);
    // Tone 2: 880.00 Hz (A5)
    playTone(880.0, now + 0.35, 0.7);
  } catch (err) {
    console.warn('Audio chime could not be initialized:', err);
  }
}
