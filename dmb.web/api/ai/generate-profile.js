const { friendlyAiError, QUOTA_MESSAGE } = require("../_aiProvider");
const { generateProfileFromInput } = require("../_generateProfile");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  try {
    const profile = await generateProfileFromInput(req.body ?? {});
    res.status(200).json({ profile });
  } catch (error) {
    if (error.name === "AbortError") {
      res.status(504).json({
        message:
          "AI request timed out. Try again with shorter input. All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited.",
      });
      return;
    }

    const quota = friendlyAiError(error);
    if (quota.statusCode === 429) {
      res.status(429).json({ message: QUOTA_MESSAGE });
      return;
    }

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Unable to generate profile. All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited.",
    });
  }
};
