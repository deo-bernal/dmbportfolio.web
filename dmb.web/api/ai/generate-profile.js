const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const SYSTEM_PROMPT = `You are a professional profile builder assistant.
Given a user's resume text and optional answers, produce a JSON object for an online portfolio and resume.

Rules:
- Use only information present in the input. Do not invent employers, degrees, or credentials.
- If a field is unknown, use an empty string or empty array.
- Write in a professional, concise tone suitable for a public portfolio.
- Skills should be specific technologies or competencies (5-12 items).
- Projects should highlight real work from the resume (1-4 projects in 1-2 categories).
- Dates must be ISO format YYYY-MM-DD or empty string if unknown.
- Return valid JSON only, matching the schema exactly.`;

const RESPONSE_SCHEMA = {
  summary: "string - professional portfolio summary, 2-4 sentences",
  skills: ["string"],
  projectCategories: [
    {
      title: "string - category name e.g. Web Development",
      items: [
        {
          name: "string - project name",
          description: "string - 1-3 sentences",
        },
      ],
    },
  ],
  contact: {
    phone: "string",
    address: "string",
  },
  resume: {
    personalInfo: {
      firstName: "string",
      lastName: "string",
      email: "string",
      contactNo: "string",
      address: "string",
      summary: "string - resume objective/summary",
    },
    workHistory: [
      {
        company: "string",
        position: "string",
        fromDate: "string YYYY-MM-DD or empty",
        toDate: "string YYYY-MM-DD or empty",
        jobDescription: "string",
      },
    ],
    education: [
      {
        school: "string",
        address: "string",
        courseTaken: "string",
        startDate: "string YYYY-MM-DD or empty",
        endDate: "string YYYY-MM-DD or empty",
      },
    ],
    affiliations: [
      {
        organization: "string",
        title: "string",
        issueDate: "string YYYY-MM-DD or empty",
        details: "string",
      },
    ],
  },
};

function buildUserPrompt(body) {
  const parts = [];

  if (body.resumeText?.trim()) {
    parts.push(`RESUME / BACKGROUND TEXT:\n${body.resumeText.trim()}`);
  }

  if (body.roleGoal?.trim()) {
    parts.push(`TARGET ROLE / GOAL:\n${body.roleGoal.trim()}`);
  }

  if (body.yearsExperience?.trim()) {
    parts.push(`YEARS OF EXPERIENCE:\n${body.yearsExperience.trim()}`);
  }

  if (body.topSkills?.trim()) {
    parts.push(`TOP SKILLS (user provided):\n${body.topSkills.trim()}`);
  }

  if (body.achievement?.trim()) {
    parts.push(`KEY ACHIEVEMENT:\n${body.achievement.trim()}`);
  }

  if (body.accountEmail?.trim()) {
    parts.push(`ACCOUNT EMAIL (use for contact if resume lacks one):\n${body.accountEmail.trim()}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `${parts.join("\n\n")}\n\nRespond with JSON matching this schema:\n${JSON.stringify(RESPONSE_SCHEMA, null, 2)}`;
}

function normalizeGeneratedProfile(raw) {
  const resume = raw?.resume ?? {};
  const personalInfo = resume.personalInfo ?? {};

  return {
    summary: String(raw?.summary ?? "").trim(),
    skills: Array.isArray(raw?.skills)
      ? raw.skills.map((skill) => String(skill).trim()).filter(Boolean)
      : [],
    projectCategories: Array.isArray(raw?.projectCategories)
      ? raw.projectCategories
          .map((category) => ({
            title: String(category?.title ?? "Projects").trim() || "Projects",
            items: Array.isArray(category?.items)
              ? category.items
                  .map((item) => ({
                    name: String(item?.name ?? "").trim(),
                    description: String(item?.description ?? "").trim(),
                  }))
                  .filter((item) => item.name)
              : [],
          }))
          .filter((category) => category.items.length > 0)
      : [],
    contact: {
      phone: String(raw?.contact?.phone ?? personalInfo.contactNo ?? "").trim(),
      address: String(raw?.contact?.address ?? personalInfo.address ?? "").trim(),
    },
    resume: {
      personalInfo: {
        firstName: String(personalInfo.firstName ?? "").trim(),
        lastName: String(personalInfo.lastName ?? "").trim(),
        email: String(personalInfo.email ?? "").trim(),
        contactNo: String(personalInfo.contactNo ?? raw?.contact?.phone ?? "").trim(),
        address: String(personalInfo.address ?? raw?.contact?.address ?? "").trim(),
        summary: String(personalInfo.summary ?? raw?.summary ?? "").trim(),
      },
      workHistory: Array.isArray(resume.workHistory)
        ? resume.workHistory.map((item) => ({
            company: String(item?.company ?? "").trim(),
            position: String(item?.position ?? "").trim(),
            fromDate: String(item?.fromDate ?? "").trim(),
            toDate: String(item?.toDate ?? "").trim(),
            jobDescription: String(item?.jobDescription ?? "").trim(),
          }))
        : [],
      education: Array.isArray(resume.education)
        ? resume.education.map((item) => ({
            school: String(item?.school ?? "").trim(),
            address: String(item?.address ?? "").trim(),
            courseTaken: String(item?.courseTaken ?? "").trim(),
            startDate: String(item?.startDate ?? "").trim(),
            endDate: String(item?.endDate ?? "").trim(),
          }))
        : [],
      affiliations: Array.isArray(resume.affiliations)
        ? resume.affiliations.map((item) => ({
            organization: String(item?.organization ?? "").trim(),
            title: String(item?.title ?? "").trim(),
            issueDate: String(item?.issueDate ?? "").trim(),
            details: String(item?.details ?? "").trim(),
          }))
        : [],
    },
  };
}

function extractJsonObject(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new Error("AI returned an empty response.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("AI returned invalid JSON.");
  }
}

async function callGemini(userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${userPrompt}`);
  const content = result?.response?.text?.() ?? "";
  return extractJsonObject(content);
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  try {
    const userPrompt = buildUserPrompt(req.body ?? {});
    if (!userPrompt) {
      res.status(400).json({
        message: "Provide resume text or at least one profile question answer.",
      });
      return;
    }

    const rawProfile = await callGemini(userPrompt);
    const profile = normalizeGeneratedProfile(rawProfile);

    if (!profile.summary && profile.skills.length === 0 && profile.projectCategories.length === 0) {
      res.status(422).json({
        message: "AI could not extract enough profile content. Add more detail and try again.",
      });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === "AbortError" ? 504 : 500);
    res.status(statusCode).json({
      message:
        error.name === "AbortError"
          ? "AI request timed out. Try again with shorter input."
          : error.message || "Unable to generate profile.",
    });
  }
};
