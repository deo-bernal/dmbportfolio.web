/** Approximate Peter Weller's 1987 RoboCop delivery: flat, clipped, unhurried. Not a voice clone. */

const PREFERRED_VOICE_PATTERNS = [
  /microsoft david/i,
  /microsoft mark/i,
  /google uk english male/i,
  /\balex\b/i,
  /\bdaniel\b/i,
  /en-us.*male/i,
  /english.*male/i,
];

const AVOID_VOICE_PATTERNS = /female|zira|samantha|susan|hazel|eva|aria|jenny|google us english$/i;

export function pickWellerVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => /^en(-|_)?/i.test(voice.lang));
  const pool = english.length > 0 ? english : voices;

  for (const pattern of PREFERRED_VOICE_PATTERNS) {
    const match = pool.find(
      (voice) => pattern.test(`${voice.name} ${voice.lang}`) && !AVOID_VOICE_PATTERNS.test(voice.name)
    );
    if (match) return match;
  }

  return (
    pool.find((voice) => /en-US/i.test(voice.lang) && !AVOID_VOICE_PATTERNS.test(voice.name)) ??
    pool[0] ??
    null
  );
}

export function formatForWellerVoice(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[—–]/g, ". ")
    .replace(/:\s+/g, ". ")
    .replace(/;\s+/g, ". ")
    .replace(/,\s+/g, ". ")
    .replace(/\?\s+/g, "? ... ")
    .replace(/!\s+/g, ". ")
    .replace(/\.\s+/g, ". ... ")
    .replace(/\s+/g, " ")
    .trim();
}

export function playCommChirp() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(920, ctx.currentTime);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    osc.onended = () => void ctx.close();
  } catch {
    // Speech still works if the chirp cannot play.
  }
}
