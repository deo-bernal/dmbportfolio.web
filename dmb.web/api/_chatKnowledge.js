const KNOWLEDGE_CHUNKS = [
  `DMB Web Solutions (dmbwebsolutions.com) is Deo Bernal's platform. It has two businesses: DMB Profiles (free online portfolio and resume pages) and DMB Real Estate (lots and land for sale in Pampanga).`,

  `DMB Profiles (dmbwebsolutions.com) is a free online portfolio and resume platform by DMB Web Solutions.
Create a professional public profile you can share anywhere. It is designed for job seekers, freelancers, students, and career changers who need a web presence without building a site from scratch.`,

  `DMB Real Estate is Deo Bernal's property business in Porac and Mexico, Pampanga. PRC license 0017233.
Current listings include a 192 sqm residential lot in Pandacaqui-Telapayong, Mexico (~₱1.50 million) and a 180 sqm semi-commercial lot in Pandacaqui, Mexico (~₱2.50 million).
See listings at https://onepropertee.com/deo-bernal. He also owns properties in Sinura, Porac.`,

  `Getting started is free. Register at /register, confirm your email, then sign in at /login.
After login you can use the AI Profile Builder at /onboard: paste a resume or answer a few questions and the site generates a portfolio plus resume for you.
You can also build or edit everything manually from Portfolio and Resume in the sidebar.`,

  `Your live public URL is https://www.dmbwebsolutions.com/{username} for the portfolio and https://www.dmbwebsolutions.com/{username}/resume for the resume.
Share one link. Portfolio and resume stay online. Profiles are only public when you mark them viewable.`,

  `A DMB profile includes a professional summary, skills, projects (grouped by category), optional intro video, and contact details.
The resume side includes personal info, work history, education, and affiliations. Both are edited in the Online Profile dashboard after you sign in.`,

  `The AI builder uses your resume text and optional answers (target role, years of experience, top skills, a key achievement).
It should not invent employers, degrees, or credentials. If something is missing, add it in the Portfolio or Resume editors after generation.
There is a review step before content is saved to your account.`,

  `Pricing: creating and publishing an online profile is free to start. Upgrade later when you need more (premium themes, custom domain, extra AI generations, and similar extras are planned).
There is no charge required to register, generate a first profile, or share your public URL.`,

  `Need an account? Use Create free profile / register. Already have an account? Sign in.
Forgot password is available from the login page. New accounts require email activation before you can sign in.`,

  `This assistant helps visitors understand DMB Profiles, how to register, how AI builder works, and where to go on the site.
It cannot log in for the user, reset passwords, or change account data. Direct people to the matching page with a [[link|/path]] when that helps.`,
];

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function retrieveContext(query, k = 3) {
  const terms = tokenize(query);
  const scored = KNOWLEDGE_CHUNKS.map((chunk) => {
    const hay = chunk.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (hay.includes(term)) score += 1;
    }
    return { chunk, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  if (scored.length === 0) {
    return KNOWLEDGE_CHUNKS.slice(0, 3).join("\n\n");
  }

  return scored.map((item) => item.chunk).join("\n\n");
}

module.exports = { retrieveContext, KNOWLEDGE_CHUNKS };
