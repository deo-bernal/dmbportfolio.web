function firstFilled(...values) {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function toNullableDate(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
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
  return {
    summary: profile.summary,
    video: "",
    isViewable: true,
    skills: profile.skills,
    contact: {
      email: firstFilled(profile.resume?.personalInfo?.email, account.email, accountEmail),
      phone: firstFilled(
        profile.contact?.phone,
        profile.resume?.personalInfo?.contactNo,
        account.contactNo
      ),
    },
    projectCategories:
      Array.isArray(profile.projectCategories) && profile.projectCategories.length > 0
        ? profile.projectCategories
        : [{ title: "Projects", items: [{ name: "My Work", description: profile.summary || "Professional work." }] }],
  };
}

function buildResumePayload(profile, accountEmail, account) {
  const personalInfo = profile.resume?.personalInfo || {};
  return {
    personalInfo: {
      firstName: firstFilled(personalInfo.firstName, account.firstName),
      lastName: firstFilled(personalInfo.lastName, account.lastName),
      contactNo:
        firstFilled(personalInfo.contactNo, profile.contact?.phone, account.contactNo) || null,
      email: firstFilled(personalInfo.email, account.email, accountEmail),
      address:
        firstFilled(personalInfo.address, profile.contact?.address, account.address) || null,
      summary: personalInfo.summary || profile.summary || null,
    },
    workHistory: Array.isArray(profile.resume?.workHistory)
      ? profile.resume.workHistory.map((item) => ({
          company: item.company,
          position: item.position,
          fromDate: toNullableDate(item.fromDate),
          toDate: toNullableDate(item.toDate),
          jobDescription: item.jobDescription || null,
        }))
      : [],
    education: Array.isArray(profile.resume?.education)
      ? profile.resume.education.map((item) => ({
          school: item.school,
          address: item.address || null,
          courseTaken: item.courseTaken || null,
          startDate: toNullableDate(item.startDate),
          endDate: toNullableDate(item.endDate),
        }))
      : [],
    affiliations: Array.isArray(profile.resume?.affiliations)
      ? profile.resume.affiliations.map((item) => ({
          organization: item.organization,
          title: item.title,
          issueDate: toNullableDate(item.issueDate),
          details: item.details || null,
        }))
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
