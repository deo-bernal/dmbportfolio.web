/** 1987 cyborg-cop delivery: deadpan male TTS through a helmet speaker. Not a voice clone. */

type SpeakHooks = {
  onStart?: () => void;
  onEnd?: () => void;
};

let generation = 0;
let activeSource: AudioBufferSourceNode | null = null;
let activeCtx: AudioContext | null = null;
let activeAbort: AbortController | null = null;

export function formatForWellerVoice(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[—–]/g, ". ")
    .replace(/:\s+/g, ". ")
    .replace(/;\s+/g, ". ")
    .replace(/,\s+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export function chunkForHelmetSpeech(text: string, max = 170): string[] {
  const prepared = formatForWellerVoice(text);
  if (!prepared) return [];
  const parts = prepared.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current) chunks.push(current);
    current = "";
  };

  for (const part of parts) {
    if (part.length > max) {
      pushCurrent();
      for (let index = 0; index < part.length; index += max) {
        chunks.push(part.slice(index, index + max));
      }
      continue;
    }
    const next = current ? `${current} ${part}` : part;
    if (next.length > max) {
      pushCurrent();
      current = part;
    } else {
      current = next;
    }
  }
  pushCurrent();
  return chunks;
}

export function cancelRoboCopSpeech() {
  generation += 1;
  activeAbort?.abort();
  activeAbort = null;
  try {
    activeSource?.stop();
  } catch {
    // already stopped
  }
  activeSource = null;
  if (activeCtx) {
    void activeCtx.close().catch(() => undefined);
    activeCtx = null;
  }
  window.speechSynthesis?.cancel();
}

function distortionCurve(amount: number): Float32Array {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function playCommChirp(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(420, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

function playBufferThroughHelmet(ctx: AudioContext, buffer: AudioBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 0.86;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 280;
    highpass.Q.value = 0.7;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "peaking";
    bandpass.frequency.value = 1650;
    bandpass.Q.value = 1.1;
    bandpass.gain.value = 7;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2400;
    lowpass.Q.value = 0.8;

    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(18);
    shaper.oversample = "2x";

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.024;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.28;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 8;
    compressor.ratio.value = 10;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    const output = ctx.createGain();
    output.gain.value = 1.25;

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(shaper);
    shaper.connect(compressor);
    compressor.connect(output);
    shaper.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(output);
    output.connect(ctx.destination);

    activeSource = source;
    source.onended = () => {
      if (activeSource === source) activeSource = null;
      resolve();
    };
    try {
      source.start();
    } catch (error) {
      reject(error);
    }
  });
}

async function fetchSpeechChunk(text: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`tts ${response.status}`);
  }
  return response.arrayBuffer();
}

export async function speakRoboCop(text: string, hooks: SpeakHooks = {}): Promise<void> {
  const chunks = chunkForHelmetSpeech(text);
  if (chunks.length === 0) return;

  cancelRoboCopSpeech();
  const token = generation;
  const abort = new AbortController();
  activeAbort = abort;

  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  activeCtx = ctx;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  hooks.onStart?.();
  playCommChirp(ctx);
  let usedFallback = false;

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 140));
    for (const chunk of chunks) {
      if (token !== generation) return;
      const wav = await fetchSpeechChunk(chunk, abort.signal);
      if (token !== generation) return;
      const buffer = await ctx.decodeAudioData(wav.slice(0));
      if (token !== generation) return;
      await playBufferThroughHelmet(ctx, buffer);
    }
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") return;
    console.warn("roboCopVoice: falling back to browser speech", error);
    if (token === generation) {
      usedFallback = true;
      speakBrowserFallback(text, hooks);
    }
  } finally {
    if (token === generation && !usedFallback) {
      hooks.onEnd?.();
      if (activeCtx === ctx) {
        void ctx.close().catch(() => undefined);
        activeCtx = null;
      }
    }
  }
}

function speakBrowserFallback(text: string, hooks: SpeakHooks) {
  const synth = window.speechSynthesis;
  if (!synth) {
    hooks.onEnd?.();
    return;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(formatForWellerVoice(text));
  utterance.rate = 0.62;
  utterance.pitch = 0.55;
  utterance.lang = "en-US";
  const voice = synth
    .getVoices()
    .find((item) => /david|mark|troy|daniel|male/i.test(item.name) && /en/i.test(item.lang));
  if (voice) utterance.voice = voice;
  utterance.onstart = () => hooks.onStart?.();
  utterance.onend = () => hooks.onEnd?.();
  utterance.onerror = () => hooks.onEnd?.();
  synth.speak(utterance);
}
