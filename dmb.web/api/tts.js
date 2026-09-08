const GROQ_BASE_URL = (
  process.env.GROQ_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "https://api.groq.com/openai/v1"
).replace(/\/$/, "");

const DIRECTION = "[deadpan] [slowly] ";
const MAX_INPUT = 200;

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
    .slice(0, Math.max(0, MAX_INPUT - DIRECTION.length));

  if (!raw) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(400).json({ message: "Provide text to speak." });
    return;
  }

  try {
    const response = await fetch(`${GROQ_BASE_URL}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        voice: "troy",
        input: `${DIRECTION}${raw}`.slice(0, MAX_INPUT),
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`tts: groq speech failed ${response.status} ${detail.slice(0, 300)}`);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(response.status === 429 ? 429 : 502).json({
        message: "Unable to generate speech right now.",
      });
      return;
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audio);
  } catch (error) {
    console.error(`tts: ${error instanceof Error ? error.message : "unknown error"}`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(502).json({ message: "Unable to generate speech right now." });
  }
};
