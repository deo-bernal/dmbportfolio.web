const { friendlyAiError, QUOTA_MESSAGE } = require("../_aiProvider");
const { generateProfileFromInput } = require("../_generateProfile");
const { listMissingFields } = require("../_profilePayload");

const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const recent = new Map();

const SAMPLE_RESUME = `SAMPLE CANDIDATE — public demo only, not a live account.

Deo Bernal is a full-stack developer with 20 years of experience delivering web, mobile, and cloud systems. Expert in Angular, React, .NET Core, SQL, TypeScript, Next.js, Docker, and AI-assisted development.

Recent work:
- Public marketing site with React, Next.js, Convex, Clerk, and Google Gemini.
- Insurance estimate workflow using React, Next.js, Convex, Clerk, and Railway PostgreSQL.
- Travel agent management platform with React, .NET Core MVC, and MS SQL.

Contact: deobernal@gmail.com`;

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  return false;
}

function summarizeProfile(profile) {
  return {
    name: `${profile.resume?.personalInfo?.firstName || ""} ${profile.resume?.personalInfo?.lastName || ""}`.trim(),
    skills: (profile.skills || []).slice(0, 8),
    projects: (profile.projectCategories || []).reduce((count, category) => count + (category.items?.length || 0), 0),
    summary: String(profile.summary || "").slice(0, 280),
  };
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({
      message: "That is a few live demos in a row — wait a minute and try again, or watch the canned replay.",
    });
    return;
  }

  try {
    const profile = await generateProfileFromInput({
      resumeText: SAMPLE_RESUME,
      roleGoal: "Build a public portfolio from this sample resume.",
      accountEmail: "deobernal@gmail.com",
    });
    const missing = listMissingFields(profile, null, "deobernal@gmail.com");

    res.status(200).json({
      profile,
      steps: [
        {
          tool: "generate_profile",
          status: "ok",
          result: { summary: summarizeProfile(profile) },
        },
        {
          tool: "list_missing_fields",
          status: "ok",
          result: missing,
        },
      ],
      message: "Live sample drafted. Sign in to save a real profile. Save tools are disabled on this public demo.",
    });
  } catch (error) {
    const quota = friendlyAiError(error);
    if (quota.statusCode === 429) {
      res.status(429).json({ message: QUOTA_MESSAGE });
      return;
    }
    res.status(error.statusCode || 502).json({
      message:
        error.message ||
        "Unable to run the live sample. All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited.",
    });
  }
};
