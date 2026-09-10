const GROQ_SPEECH_URL = "https://api.groq.com/openai/v1/audio/speech";
const MODEL = "canopylabs/orpheus-v1-english";
const VOICES = ["austin", "daniel", "troy"];
const MAX_INPUT = 180;

function groqKey() {
  return process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || "";
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  const apiKey = groqKey();
  if (!apiKey) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(503).json({ message: "Speech is not configured." });
    return;
  }

  const raw = String(req.body?.text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_INPUT);

  if (!raw) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(400).json({ message: "Provide text to speak." });
    return;
  }

  let lastDetail = "";
  for (const voice of VOICES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(GROQ_SPEECH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          voice,
          input: raw,
          response_format: "wav",
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (!response.ok) {
        lastDetail = `${response.status} ${voice} ${(await response.text()).slice(0, 180)}`;
        continue;
      }

      const audio = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(audio);
      return;
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : "unknown error";
    }
  }

  console.error(`tts: groq speech failed ${lastDetail}`);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(502).json({ message: "Unable to generate speech right now." });
};
