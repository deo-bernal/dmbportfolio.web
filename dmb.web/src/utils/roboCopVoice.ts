/** Natural mid-baritone TTS. Not a voice clone. */

type SpeakHooks = {
  onStart?: () => void;
  onEnd?: () => void;
};

let generation = 0;
let activeSource: AudioBufferSourceNode | null = null;
let activeCtx: AudioContext | null = null;
let activeAbort: AbortController | null = null;

function audioCtor(): typeof AudioContext | null {
  return (
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

export function unlockRoboCopAudio() {
  const AudioCtx = audioCtor();
  if (!AudioCtx) return;
  if (!activeCtx || activeCtx.state === "closed") {
    activeCtx = new AudioCtx();
  }
  if (activeCtx.state === "suspended") {
    void activeCtx.resume();
  }
  const blip = activeCtx.createBuffer(1, 1, activeCtx.sampleRate);
  const source = activeCtx.createBufferSource();
  source.buffer = blip;
  source.connect(activeCtx.destination);
  try {
    source.start();
  } catch {
    // already unlocked
  }
}

export function chunkForSpeech(text: string, max = 170): string[] {
  const prepared = text.replace(/\s+/g, " ").trim();
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
  window.speechSynthesis?.cancel();
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    source.connect(gain);
    gain.connect(ctx.destination);
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

function pickMaleVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() || [];
  const english = voices.filter((voice) => /^en(-|_|$)/i.test(voice.lang));
  const preferred = english.find((voice) =>
    /andrew|guy|davis|david|james|ryan|thomas|christopher|eric|alex|baritone/i.test(voice.name)
  );
  return preferred || english.find((voice) => /male/i.test(voice.name)) || english[0];
}

function speakBrowserFallback(text: string, hooks: SpeakHooks) {
  const synth = window.speechSynthesis;
  if (!synth) {
    hooks.onEnd?.();
    return;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim());
  utterance.rate = 0.94;
  utterance.pitch = 0.9;
  utterance.lang = "en-US";
  const voice = pickMaleVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => hooks.onStart?.();
  utterance.onend = () => hooks.onEnd?.();
  utterance.onerror = () => hooks.onEnd?.();
  synth.speak(utterance);
}

async function fetchSpeechChunk(text: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort);
  const timer = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`tts ${response.status}`);
    }
    return await response.arrayBuffer();
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

export async function speakRoboCop(text: string, hooks: SpeakHooks = {}): Promise<void> {
  const chunks = chunkForSpeech(text);
  if (chunks.length === 0) return;

  cancelRoboCopSpeech();
  const token = generation;
  const abort = new AbortController();
  activeAbort = abort;

  const AudioCtx = audioCtor();
  if (!AudioCtx) {
    speakBrowserFallback(text, hooks);
    return;
  }

  const ctx = activeCtx && activeCtx.state !== "closed" ? activeCtx : new AudioCtx();
  activeCtx = ctx;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  hooks.onStart?.();
  let usedFallback = false;

  try {
    for (const chunk of chunks) {
      if (token !== generation) return;
      const wav = await fetchSpeechChunk(chunk, abort.signal);
      if (token !== generation) return;
      const buffer = await ctx.decodeAudioData(wav.slice(0));
      if (token !== generation) return;
      await playBuffer(ctx, buffer);
    }
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") return;
    if (token === generation) {
      usedFallback = true;
      speakBrowserFallback(text, { onEnd: hooks.onEnd });
    }
  } finally {
    if (token === generation && !usedFallback) {
      hooks.onEnd?.();
    }
  }
}
