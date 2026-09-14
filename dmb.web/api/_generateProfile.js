const { generateAiText } = require("./_aiProvider");

const SYSTEM_PROMPT = `You are a professional profile builder assistant.
Given a user's resume text and optional answers, produce a JSON object for an online portfolio and resume.

Rules:
- Use only information present in the input. Do not invent employers, degrees, or credentials.
- If a field is unknown, use an empty string or empty array.
- Write in a professional, concise tone suitable for a public portfolio.
- Fill resume.personalInfo and resume.workHistory FIRST. Skills and projects come after.
- Any section that lists jobs, employers, roles, or dates of employment belongs in resume.workHistory, no matter what the heading is called (Professional Experiences, Employment, Career, Experience, or anything else).
- Nested "Projects" under a job stay in that job's jobDescription. You may also copy notable ones into projectCategories.
- Never leave workHistory empty when the resume lists jobs. Read meaning, not the heading label.
- Skills should be specific technologies or competencies (5-12 items).
- Projects should highlight real work from the resume (1-4 projects in 1-2 categories).
- Dates must be ISO format YYYY-MM-DD or empty string if unknown. Use empty toDate for Present/Current.
- Return valid JSON only, matching the schema exactly.`;

const RESPONSE_SCHEMA = {
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
};

const WORK_HISTORY_SYSTEM = `You extract employment history from resumes.

Ignore heading names. If a block lists a company, a role, and a time period, it is a job — whether the heading says Professional Experiences, Employment, Career, Experience, Work History, or any other label.

Read like a recruiter. Every employer/role goes into workHistory. Nested "Projects" under a job belong in that job's jobDescription.

Return JSON only:
{"workHistory":[{"company":"","position":"","fromDate":"YYYY-MM-DD or empty","toDate":"YYYY-MM-DD or empty","jobDescription":""}]}

Use empty toDate for Present/Current. Do not invent employers. Do not return an empty array if jobs are in the resume.`;

const MONTHS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

const SKIP_COMPANY_WORD =
  /^(professional|experiences?|experience|work|history|employment|career|projects?|objective|highlights?|qualifications?|skills?|education|summary|contact|affiliations?|company|website)$/i;

const JOB_HEADER =
  /([A-Z][A-Za-z0-9&.']*(?: [A-Z][A-Za-z0-9&.']*){0,3})\s*[–—\-]\s+([^–—\n]{6,140}?)\s+((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[–—\-]\s*(Present|Current|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})/gi;

function isPlausibleCompany(company) {
  const words = String(company || "").trim().split(/\s+/);
  if (!words.length || words.length > 4) return false;
  return words.every((word) => !SKIP_COMPANY_WORD.test(word));
}

function experienceSection(text) {
  const source = String(text || "");
  const start = source.search(
    /professional experiences?|work(?:ing)? (?:history|experience)|employment(?: history)?|career history/i
  );
  let body = start >= 0 ? source.slice(start) : source;
  body = body.replace(/professional experiences?/gi, " ").replace(/work(?:ing)? (?:history|experience)/gi, " ");
  const end = body.search(/\b(education|academic background|affiliations?|certifications?|references)\b/i);
  if (end > 40) body = body.slice(0, end);
  return body;
}

function toIsoDate(value) {
  const text = String(value || "").trim();
  if (!text || /^(present|current|now|ongoing)$/i.test(text)) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const monthDayYear = text.match(
    /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{4})$/i
  );
  if (monthDayYear) {
    const month = MONTHS[monthDayYear[1].toLowerCase().replace(".", "").slice(0, 3)];
    const day = String(monthDayYear[2]).padStart(2, "0");
    return `${monthDayYear[3]}-${month}-${day}`;
  }

  const monthYear = text.match(
    /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{4})$/i
  );
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase().replace(".", "").slice(0, 3)];
    return `${monthYear[2]}-${month}-01`;
  }

  const slash = text.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${String(slash[1]).padStart(2, "0")}-01`;
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  return "";
}

function titleCaseName(word) {
  const text = String(word || "").trim();
  if (!text) return "";
  if (text.length <= 2 && text === text.toUpperCase()) return text.toUpperCase();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function extractNameFromText(text) {
  const source = String(text || "");
  const heading = /^(objective|highlights|professional|experience|education|skills|summary|contact|affiliations)/i;
  const lines = source.split(/\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (heading.test(line)) continue;
    const words = line
      .replace(/[^A-Za-z\s'-]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((word) => /^[A-Z][A-Za-z'-]*$/.test(word) || /^[A-Z]{2,}$/.test(word));
    if (words.length >= 2 && words.length <= 4 && words.join(" ").length <= 40) {
      return {
        firstName: titleCaseName(words[0]),
        lastName: words.slice(1).map(titleCaseName).join(" "),
      };
    }
  }

  const mashed = source.match(
    /^\s*([A-Z][A-Z' -]{2,40}?)\s+(?:Full-Stack|Software|Web|Developer|Engineer|Objective)/
  );
  if (mashed) {
    const words = mashed[1].trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return {
        firstName: titleCaseName(words[0]),
        lastName: words.slice(1).map(titleCaseName).join(" "),
      };
    }
  }

  return { firstName: "", lastName: "" };
}

function extractWorkHistoryFromText(text) {
  const source = experienceSection(text);
  if (!source.trim()) return [];

  const matches = [];
  let match;
  JOB_HEADER.lastIndex = 0;
  while ((match = JOB_HEADER.exec(source))) {
    const company = match[1].trim();
    if (!isPlausibleCompany(company)) continue;
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      company,
      position: match[2].trim().replace(/\s+/g, " "),
      fromDate: toIsoDate(match[3]),
      toDate: toIsoDate(match[4]),
    });
  }

  return matches.map((job, index) => {
    const next = matches[index + 1];
    const sliceEnd = next ? next.index : source.length;
    let description = source.slice(job.end, sliceEnd).replace(/\s+/g, " ").trim();
    description = description.replace(
      /\s+(education|academic background|affiliations?|certifications?|skills|references)\b[\s\S]*$/i,
      ""
    ).trim();
    if (description.length > 1200) description = description.slice(0, 1200).trim();
    return {
      company: job.company,
      position: job.position,
      fromDate: job.fromDate,
      toDate: job.toDate,
      jobDescription: description,
    };
  });
}

function firstNonEmptyList(...lists) {
  for (const list of lists) {
    if (Array.isArray(list) && list.length > 0) return list;
  }
  return [];
}

function normalizeWorkItem(item) {
  const highlights = Array.isArray(item?.highlights) ? item.highlights.filter(Boolean).join(" ") : "";
  return {
    company: String(item?.company ?? item?.employer ?? item?.organization ?? "").trim(),
    position: String(item?.position ?? item?.title ?? item?.role ?? item?.jobTitle ?? "").trim(),
    fromDate: toIsoDate(item?.fromDate ?? item?.startDate ?? item?.from ?? ""),
    toDate: toIsoDate(item?.toDate ?? item?.endDate ?? item?.to ?? ""),
    jobDescription: String(item?.jobDescription ?? item?.description ?? item?.duties ?? highlights ?? "").trim(),
  };
}

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
  const workItems = firstNonEmptyList(
    resume.workHistory,
    resume.work_history,
    resume.professionalExperience,
    resume.professionalExperiences,
    resume.professional_experience,
    resume.experience,
    resume.experiences,
    resume.employment,
    resume.employmentHistory,
    resume.jobs,
    raw?.workHistory,
    raw?.experience,
    raw?.experiences
  )
    .map(normalizeWorkItem)
    .filter((item) => item.company || item.position);

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
      workHistory: workItems,
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

function enrichProfileFromResumeText(profile, resumeText) {
  const text = String(resumeText || "");
  if (!text.trim() || !profile?.resume) return profile;

  const personal = profile.resume.personalInfo;
  if (!personal.firstName || !personal.lastName) {
    const extracted = extractNameFromText(text);
    if (!personal.firstName && extracted.firstName) personal.firstName = extracted.firstName;
    if (!personal.lastName && extracted.lastName) personal.lastName = extracted.lastName;
  }

  if (!personal.email) {
    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (email) personal.email = email[0];
  }

  return profile;
}

async function fillWorkHistoryWithAi(profile, resumeText) {
  if (profile.resume.workHistory.length || !String(resumeText || "").trim()) {
    return profile;
  }

  try {
    const content = await generateAiText({
      system: WORK_HISTORY_SYSTEM,
      user: `RESUME TEXT:\n${String(resumeText).trim()}\n\nExtract every job into workHistory JSON.`,
      json: true,
      maxTokens: 4096,
    });
    const raw = parseJsonContent(content);
    const jobs = firstNonEmptyList(
      raw?.workHistory,
      raw?.professionalExperience,
      raw?.professionalExperiences,
      raw?.experience,
      raw?.experiences,
      raw?.employment
    )
      .map(normalizeWorkItem)
      .filter((item) => item.company || item.position);
    if (jobs.length) {
      profile.resume.workHistory = jobs;
      return profile;
    }
  } catch (error) {
    console.warn(`profile: work-history AI fill failed — ${error?.message || error}`);
  }

  profile.resume.workHistory = extractWorkHistoryFromText(resumeText);
  return profile;
}

function parseJsonContent(content) {
  const trimmed = String(content || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("Invalid JSON");
  }
}

async function generateProfileFromInput(body) {
  const userPrompt = buildUserPrompt(body ?? {});
  if (!userPrompt) {
    const error = new Error("Provide resume text or at least one profile question answer.");
    error.statusCode = 400;
    throw error;
  }

  const content = await generateAiText({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    json: true,
    maxTokens: 8192,
  });

  let rawProfile;
  try {
    rawProfile = parseJsonContent(content);
  } catch {
    const error = new Error(
      "AI returned invalid profile JSON. All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited."
    );
    error.statusCode = 502;
    throw error;
  }

  const profile = enrichProfileFromResumeText(
    normalizeGeneratedProfile(rawProfile),
    body?.resumeText
  );
  await fillWorkHistoryWithAi(profile, body?.resumeText);
  if (!profile.summary && profile.skills.length === 0 && profile.projectCategories.length === 0) {
    const error = new Error(
      "AI could not extract enough profile content. Add more detail and try again. All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited."
    );
    error.statusCode = 422;
    throw error;
  }

  return profile;
}

module.exports = {
  SYSTEM_PROMPT,
  buildUserPrompt,
  extractWorkHistoryFromText,
  extractNameFromText,
  generateProfileFromInput,
  normalizeGeneratedProfile,
  enrichProfileFromResumeText,
};
