const KNOWLEDGE_CHUNKS = [
  `DMB Web Solutions (dmbwebsolutions.com) is Deo Bernal's platform. It has two businesses: DMB Profiles (free online portfolio and resume pages) and DMB Real Estate (lots and land for sale in Pampanga).`,

  `DMB Profiles (dmbwebsolutions.com) is a free online portfolio and resume platform by DMB Web Solutions.
Create a professional public profile you can share anywhere. It is designed for job seekers, freelancers, students, and career changers who need a web presence without building a site from scratch.`,

  `DMB Real Estate is Deo Bernal's property business in Porac and Mexico, Pampanga. PRC license 0017233.
Current listings include a 192 sqm residential lot in Pandacaqui-Telapayong, Mexico (~₱1.50 million) and a 180 sqm semi-commercial lot in Pandacaqui, Mexico (~₱2.50 million).
See listings at https://onepropertee.com/deo-bernal. He also owns properties in Sinura, Porac.`,

  `Getting started is free. Register at /register, confirm your email, then sign in at /login.
After login you can use Agentic AI at /accent-sidebar/agent: it calls tools to draft a portfolio, pause for Allow, then save. The older wizard is still at /onboard.
You can also build or edit everything manually from Portfolio and Resume in the sidebar.`,

  `Your live public URL is https://www.dmbwebsolutions.com/{username} for the portfolio and https://www.dmbwebsolutions.com/{username}/resume for the resume.
Share one link. Portfolio and resume stay online. Profiles are only public when you mark them viewable.`,

  `A DMB profile includes a professional summary, skills, projects (grouped by category), optional intro video, and contact details.
The resume side includes personal info, work history, education, and affiliations. Both are edited from Your profile in the DMB Web Solutions sidebar after you sign in.`,

  `The AI builder uses your resume text and optional answers (target role, years of experience, top skills, a key achievement).
It should not invent employers, degrees, or credentials. If something is missing, add it in the Portfolio or Resume editors after generation.
There is a review step before content is saved to your account.`,

  `The AI on this site is entirely free tier. Chat streams Google Gemini Flash (gemini-3.6-flash, then gemini-flash-latest). Profile generation and chat fallback use Groq OpenAI-compatible models: openai/gpt-oss-20b, openai/gpt-oss-120b, and qwen/qwen3.6-27b. The optional voice agent is a Vapi trial. Performance is limited because these are free-tier APIs: strict rate limits, data privacy trade-offs, and no uptime guarantees. If a visitor hits a usage limit, tell them to wait about a minute and try again, and point them to /ai-automation#ai-models for the model list.`,

  `Pricing: creating and publishing an online profile is free to start. Upgrade later when you need more (premium themes, custom domain, extra AI generations, and similar extras are planned).
There is no charge required to register, generate a first profile, or share your public URL.`,

  `Need an account? Use Create account / register. Already have an account? Sign in.
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

  `DMB LangChat is live at [[LangChat|/langchat]] (also https://www.dmbwebsolutions.com/langchat/).
It is a standalone demo product separate from DMB Profiles, CRM, LMS, Commerce, and Agent.
Purpose: prove durable chat memory — threads survive refresh — using Python LangChain plus Convex Free as the database, not RAM-only lab memory.`,

  `How LangChat works end to end:
1) The chat UI is a Vite React app on Vercel, proxied under /langchat on dmbwebsolutions.com.
2) The browser talks to Convex in realtime for thread lists and messages (tables: threads, messages).
3) When you send a message, the UI POSTs to the Python FastAPI on Render (dmb-langchat-api.onrender.com /chat).
4) That API loads recent history from Convex via convex-py, runs LangChain (Google Gemini when GOOGLE_API_KEY is set, otherwise OpenAI, otherwise a demo-echo fallback), then appends the human and AI turns back to Convex.
5) The UI updates live through Convex subscriptions. Refresh keeps the thread.`,

  `What LangChain is in this product: LangChain is the Python orchestration layer around the LLM.
It builds a message list (system + prior human/AI turns from Convex), invokes the chat model, and returns the reply string.
Convex is the durable memory store (the database cylinder from the LangChain architecture diagram). Vercel hosts the front end. Render hosts the Python brain.
Free tiers: Convex Free, Render Free, Vercel Hobby. Cold starts on Render can delay the first reply.`,

  `LangChat Phase 1 auth is anonymous sessionId stored in the browser (localStorage), not the marketing Google/LinkedIn/Facebook SSO hub.
Threads are scoped to that sessionId. Full SSO into LangChat is planned later and documented in the LangChat Documentations PDFs (SSO, System Architecture, User Guide) in the dmb-langchat repo.
Workspace sidebar links from LangChat go to CRM, LMS, Commerce, Agent, Portfolio, and the main website.
The floating DMB Assistant (Robocop) on LangChat is the same site chatbot as the main site and talks through /api/chat.`,

  `If someone asks how LangChat differs from this Robocop assistant: Robocop is the marketing-site helper grounded in DMB docs (profiles, automation, real estate).
LangChat is the LangChain+Convex durable-memory demo — its main pane stores conversations in Convex permanently for that browser session.
Both can appear on the LangChat page: main pane = LangChat memory demo; floating widget = Robocop site assistant.`,
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
