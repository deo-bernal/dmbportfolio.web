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

  `DMB AI Automation is Deo Bernal's services side, at /ai-automation. Deo builds AI systems that capture, qualify, and book leads for businesses:
AI chat assistants grounded in your own content, lead capture funnels, CRM and database integration (Supabase, Airtable, Sheets, HubSpot, GoHighLevel), automated email follow-up, appointment booking, workflow automation with n8n, Make and Zapier, and voice AI agents with Vapi or Retell.
Deo has twenty years of software delivery experience and is available for AI implementation work.`,

  `Proof of the automation work is on this site. /case-studies has two written case studies: DMB Assistant (this chatbot — multi-provider failover across Groq and Gemini, keyword retrieval, streaming replies, and two production incidents that were diagnosed and fixed) and the AI Profile Builder (PDF and DOCX parsing, structured JSON generation, a human review step, and a data-overwrite bug that was found and guarded).
/stack lists the platforms split into what is shipped in production versus working knowledge.`,

  `The lead pipeline on /ai-automation is live, not a mockup. A submitted form is validated by a serverless function, stored in Supabase, pushed to a self-hosted n8n workflow that notifies Slack and starts a nurture sequence, and answered by an automated confirmation email through Resend. Every message includes the booking link so a qualified lead can book a 30-minute call unattended.`,

  `To hire Deo or discuss an automation project: book a 30-minute call, or leave a name, email, what needs automating, and a timeline in this chat and it goes straight into the same pipeline. There is no charge for the first call. Deo is based in Pampanga, Philippines and works with clients remotely.`,

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
