function firstFilled(...values) {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function clip(value, max) {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
}

function sanitizePhone(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length <= 30) return text;
  const match = text.match(/(\+?\d[\d\s().-]{6,28}\d)/);
  if (match) return clip(match[1].replace(/\s+/g, " "), 30);
  return clip(text, 30);
}

function toNullableDate(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function accountEmailForSave(account, accountEmail) {
  return clip(firstFilled(account?.email, accountEmail), 255);
}

function accountFromResume(resume, fallbackEmail) {
  const info = resume?.personalInfo || {};
  return {
    firstName: firstFilled(info.firstName),
    lastName: firstFilled(info.lastName),
    contactNo: firstFilled(info.contactNo),
    email: firstFilled(info.email, fallbackEmail),
    address: firstFilled(info.address),
  };
}

function buildProfilePayload(profile, accountEmail, account) {
  const categories =
    Array.isArray(profile.projectCategories) && profile.projectCategories.length > 0
      ? profile.projectCategories
      : [{ title: "Projects", items: [{ name: "My Work", description: profile.summary || "Professional work." }] }];

  return {
    summary: clip(profile.summary || "", 8000),
    video: "",
    isViewable: true,
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((skill) => clip(String(skill), 80)).filter(Boolean).slice(0, 24)
      : [],
    contact: {
      email: accountEmailForSave(account, accountEmail),
      phone: sanitizePhone(
        firstFilled(
          profile.contact?.phone,
          profile.resume?.personalInfo?.contactNo,
          account.contactNo
        )
      ),
    },
    projectCategories: categories.slice(0, 8).map((category) => ({
      title: clip(category.title || "Projects", 100) || "Projects",
      items: (category.items || []).slice(0, 8).map((item) => ({
        name: clip(item.name, 200),
        description: clip(item.description || "", 4000),
      })).filter((item) => item.name),
    })).filter((category) => category.items.length > 0),
  };
}

function buildResumePayload(profile, accountEmail, account) {
  const personalInfo = profile.resume?.personalInfo || {};
  const email = accountEmailForSave(account, accountEmail);
  const localPart = email.split("@")[0] || "Member";
  return {
    personalInfo: {
      firstName: clip(firstFilled(personalInfo.firstName, account.firstName, localPart), 100),
      lastName: clip(firstFilled(personalInfo.lastName, account.lastName), 100),
      contactNo:
        sanitizePhone(firstFilled(personalInfo.contactNo, profile.contact?.phone, account.contactNo)) || null,
      email: clip(email, 255),
      address:
        clip(firstFilled(personalInfo.address, profile.contact?.address, account.address), 255) || null,
      summary: personalInfo.summary || profile.summary || null,
    },
    workHistory: Array.isArray(profile.resume?.workHistory)
      ? profile.resume.workHistory
          .map((item) => ({
            company: clip(item.company, 200),
            position: clip(item.position, 200),
            fromDate: toNullableDate(item.fromDate),
            toDate: toNullableDate(item.toDate),
            jobDescription: item.jobDescription || null,
          }))
          .filter((item) => item.company && item.position)
      : [],
    education: Array.isArray(profile.resume?.education)
      ? profile.resume.education
          .map((item) => ({
            school: clip(item.school, 200),
            address: clip(item.address || "", 255) || null,
            courseTaken: clip(item.courseTaken || "", 255) || null,
            startDate: toNullableDate(item.startDate),
            endDate: toNullableDate(item.endDate),
          }))
          .filter((item) => item.school)
      : [],
    affiliations: Array.isArray(profile.resume?.affiliations)
      ? profile.resume.affiliations
          .map((item) => ({
            organization: clip(item.organization, 200),
            title: clip(item.title, 200),
            issueDate: toNullableDate(item.issueDate),
            details: item.details || null,
          }))
          .filter((item) => item.organization && item.title)
      : [],
  };
}

function listMissingFields(profile, savedResume, accountEmail) {
  const account = accountFromResume(savedResume, accountEmail);
  const personal = profile?.resume?.personalInfo || {};
  const missing = [];

  if (!firstFilled(personal.firstName, account.firstName)) missing.push("first name");
  if (!firstFilled(personal.lastName, account.lastName)) missing.push("last name");
  if (!firstFilled(personal.email, account.email, accountEmail)) missing.push("email");
  if (!firstFilled(profile?.summary, personal.summary)) missing.push("summary");
  if (!Array.isArray(profile?.skills) || profile.skills.length === 0) missing.push("skills");
  if (!Array.isArray(profile?.projectCategories) || profile.projectCategories.length === 0) {
    missing.push("projects");
  }
  if (!Array.isArray(profile?.resume?.workHistory) || profile.resume.workHistory.length === 0) {
    missing.push("work history");
  }

  const optional = [];
  if (!firstFilled(personal.contactNo, profile?.contact?.phone, account.contactNo)) {
    optional.push("phone");
  }
  if (!firstFilled(personal.address, profile?.contact?.address, account.address)) {
    optional.push("address");
  }

  return {
    missing,
    optional,
    readyToSave: missing.length === 0,
  };
}

function publicProfilePath(email) {
  const username = firstFilled(email);
  if (!username) return "";
  return `/${encodeURIComponent(username)}`;
}

module.exports = {
  accountFromResume,
  buildProfilePayload,
  buildResumePayload,
  firstFilled,
  listMissingFields,
  publicProfilePath,
};
