/**
 * Tool sets, prompts, and executors for the signed-in agent page.
 * The SSE loop in agent.js stays shared; this file only swaps recipes.
 */
const { generateAiText } = require("./_aiProvider");
const { captureLead, normalizeLead } = require("./_leadStore");

const NEEDS = [
  "AI chat assistant",
  "Lead capture funnel",
  "CRM or database integration",
  "Automated follow-up",
  "Appointment booking",
  "Voice AI agent",
  "Something else",
];

const TIMELINES = ["Right away", "This month", "This quarter", "Just exploring"];

const SERVICES = [
  { title: "Agentic AI", keywords: ["agent", "tool", "allow", "human in the loop"] },
  { title: "AI chat assistants", keywords: ["chat", "assistant", "faq", "widget"] },
  { title: "Lead capture funnels", keywords: ["lead", "form", "funnel", "capture", "inquiry"] },
  { title: "CRM and database integration", keywords: ["crm", "supabase", "airtable", "sheet", "database", "postgres"] },
  { title: "Automated follow-up", keywords: ["follow", "email", "nurture", "n8n", "sequence"] },
  { title: "Appointment booking", keywords: ["book", "calendar", "appointment", "call"] },
  { title: "Voice AI agents", keywords: ["voice", "phone", "call"] },
];

const PROFILE_TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_profile",
      description: "Draft portfolio and resume JSON from the resume text and goal already supplied.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_profile",
      description: "Read the user's currently saved public portfolio from the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_resume",
      description: "Read the user's currently saved resume from the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_missing_fields",
      description: "List required fields still missing from the current draft before saving.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "save_portfolio",
      description: "Save the current draft to both the public portfolio and the resume page. Requires the user to Allow first.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "save_resume",
      description: "Save the current draft to the resume page and portfolio if needed. Requires the user to Allow first.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_public_url",
      description: "Return the public portfolio path after a successful save.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const AUTOMATION_TOOLS = [
  {
    type: "function",
    function: {
      name: "extract_requirements",
      description: "Read the workflow description and extract need, timeline, company, and a short summary.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_pipeline",
      description: "Map the request onto the DMB services funnel: capture, store, notify, follow up, book.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_brief",
      description: "Compose the inquiry brief from the extracted requirements and proposed pipeline. Does not send anything.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_inquiry",
      description: "Submit the drafted inquiry through the live lead pipeline. Requires the user to Allow first.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const PROFILE_SYSTEM_PROMPT = `You are the DMB Profile Builder Agent. You use tools to turn resume text into a live public portfolio.

Rules:
- Use tools. Do not invent employers, degrees, or dates.
- Typical order: generate_profile, list_missing_fields, save_portfolio, get_public_url.
- save_portfolio writes BOTH the public portfolio and the resume page. save_resume does the same if portfolio is already saved.
- If required fields are missing, return done and tell the user what to add. Do not call save_portfolio.
- To save, you MUST call save_portfolio. That call pauses the run; the UI then shows Allow / Deny. Do not tell the user to click Allow. Do not return done before save_portfolio has run.
- Never claim the profile is saved until a save tool result says so.
- Keep user-facing messages short (2-3 sentences).
- You run on free-tier Groq and Gemini APIs.`;

const AUTOMATION_SYSTEM_PROMPT = `You are the DMB Automation Planner Agent. You only plan a lead-style workflow brief. You do not build, run, or execute any automation.

This feature CAN ONLY:
- Read a description of capture → store → notify → follow up → book
- Map it onto DMB services: Agentic AI, AI chat assistants, lead capture funnels, CRM/database integration, automated follow-up, appointment booking, voice AI agents
- Draft an inquiry and pause for Allow before submit_inquiry

This feature MUST NOT:
- Send email, Slack, SMS, or webhooks
- Create n8n workflows, CRM records, or calendar events
- Help with hacking, scraping credentials, fraud, malware, weapons, or anything illegal
- Plan trading bots, homework, medical diagnosis, or a whole product outside that funnel
- Claim the automation is live

Rules:
- First call extract_requirements. If scope is unsafe or out_of_scope, return done with that message. Do not call draft_brief or submit_inquiry.
- Typical in-scope order: extract_requirements, propose_pipeline, draft_brief, submit_inquiry.
- Do not invent company names, budgets, or contact details.
- Do not tell the user to click Allow. Keep user-facing messages short (2-3 sentences).
- You run on free-tier Groq and Gemini APIs.`;

const AUTOMATION_GOAL =
  "Plan an automation for this workflow, then submit an inquiry after I Allow.";

function jsonFallbackPrompt(systemPrompt, tools) {
  const lines = tools.map((tool) => `{"tool":"${tool.function.name}","arguments":{}}`);
  return `${systemPrompt}

Reply with JSON only, one of:
${lines.join("\n")}
{"done":true,"message":"short status for the user"}`;
}

function normalizeAgentType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "automation" || raw === "plan" || raw === "inquiry") return "automation";
  return "profile";
}

function getRecipe(agentType) {
  if (normalizeAgentType(agentType) === "automation") {
    return {
      type: "automation",
      tools: AUTOMATION_TOOLS,
      writeTools: new Set(["submit_inquiry"]),
      defaultWriteTool: "submit_inquiry",
      systemPrompt: AUTOMATION_SYSTEM_PROMPT,
      jsonFallbackPrompt: jsonFallbackPrompt(AUTOMATION_SYSTEM_PROMPT, AUTOMATION_TOOLS),
      defaultGoal: AUTOMATION_GOAL,
      confirmMessage: "Allow sending this plan as an inquiry? This does not build or run the automation.",
      denyMessage: "Inquiry cancelled. Nothing was sent.",
      emptyInputMessage: "Describe a capture, store, notify, follow-up, or booking workflow so the agent has something in scope to plan.",
    };
  }

  return {
    type: "profile",
    tools: PROFILE_TOOLS,
    writeTools: new Set(["save_portfolio", "save_resume"]),
    defaultWriteTool: "save_portfolio",
    systemPrompt: PROFILE_SYSTEM_PROMPT,
    jsonFallbackPrompt: jsonFallbackPrompt(PROFILE_SYSTEM_PROMPT, PROFILE_TOOLS),
    defaultGoal: "Build my public portfolio and resume from this resume.",
    confirmMessage: "Allow saving this draft to your portfolio and resume pages?",
    denyMessage: "Save cancelled. Nothing was published.",
    emptyInputMessage: "Upload or paste a resume so the agent has something to work with.",
  };
}

function parseJsonObject(content) {
  const trimmed = String(content || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

function pickNeed(text) {
  const lower = String(text || "").toLowerCase();
  if (/voice|phone call|inbound call/.test(lower)) return "Voice AI agent";
  if (/book|calendar|appoint/.test(lower)) return "Appointment booking";
  if (/follow.?up|nurture|email sequence/.test(lower)) return "Automated follow-up";
  if (/crm|supabase|airtable|sheet|database|postgres/.test(lower)) return "CRM or database integration";
  if (/funnel|lead capture|form|inquiry/.test(lower)) return "Lead capture funnel";
  if (/chat|assistant|faq|widget/.test(lower)) return "AI chat assistant";
  if (/agent|tool loop|human in the loop/.test(lower)) return "Something else";
  return "Something else";
}

function pickTimeline(text) {
  const lower = String(text || "").toLowerCase();
  if (/right away|asap|immediately|urgent/.test(lower)) return "Right away";
  if (/this month/.test(lower)) return "This month";
  if (/this quarter|few months/.test(lower)) return "This quarter";
  if (/explor|not sure|just looking/.test(lower)) return "Just exploring";
  return "This month";
}

function heuristicRequirements(workflowText, account) {
  const text = String(workflowText || "").trim();
  return {
    summary: text.slice(0, 400) || "No workflow text yet.",
    need: pickNeed(text),
    timeline: pickTimeline(text),
    company: "",
    name: String(account?.name || "").trim(),
    email: String(account?.email || "").trim().toLowerCase(),
  };
}

function matchServices(text) {
  const lower = String(text || "").toLowerCase();
  return SERVICES.map((service) => ({
    title: service.title,
    score: service.keywords.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.title)
    .filter((title, index, all) => all.indexOf(title) === index)
    .slice(0, 4);
}

const UNSAFE_INSTRUCTION = /\b(hack|exploit|malware|ransomware|phishing|steal (passwords?|credentials?)|unauthorized access|sql injection|child sexual|csam|bomb|weapon|bio.?weapon)\b/i;
const EXECUTE_NOW = /\b(send (the )?(email|slack|sms) now|post to slack for me|call n8n|execute (it|this) now|run the workflow now)\b/i;
const IN_SCOPE_HINT =
  /\b(form|lead|chat|crm|book|calendar|slack|follow.?up|funnel|inquir|voice|n8n|email|appoint|capture|webhook|supabase|airtable|hubspot|nurture|quote)\b/i;

const OUT_OF_SCOPE_MESSAGE =
  "This feature can only plan a lead workflow I actually build: capture, store, notify, follow up, and book. It does not run the automation or handle requests outside that funnel. Rewrite it around a form, chat, CRM, email follow-up, or booking step.";
const UNSAFE_MESSAGE =
  "I will not plan that. This tool only drafts an in-scope sales automation inquiry.";
const EXECUTE_MESSAGE =
  "This run cannot send messages or create workflows. Describe the pipeline you want built; Allow only files an inquiry.";

function classifyWorkflow(text) {
  const raw = String(text || "").trim();
  if (raw.length < 24) {
    return { scope: "out_of_scope", message: OUT_OF_SCOPE_MESSAGE };
  }
  if (UNSAFE_INSTRUCTION.test(raw)) {
    return { scope: "unsafe", message: UNSAFE_MESSAGE };
  }
  if (EXECUTE_NOW.test(raw)) {
    return { scope: "out_of_scope", message: EXECUTE_MESSAGE };
  }
  const services = matchServices(raw);
  if (services.length === 0 && !IN_SCOPE_HINT.test(raw)) {
    return { scope: "out_of_scope", message: OUT_OF_SCOPE_MESSAGE };
  }
  return { scope: "in_scope", services };
}

function applyScope(context, classified) {
  context.scope = classified.scope;
  context.blocked = classified.scope !== "in_scope";
  context.blockMessage = classified.message || "";
  if (classified.services) context.matchedServices = classified.services;
  return classified;
}

function ensureAutomationScope(context) {
  if (context.scope) {
    return { scope: context.scope, message: context.blockMessage, services: context.matchedServices };
  }
  return applyScope(context, classifyWorkflow(context.workflowText));
}

function stopResult(context, fallbackMessage) {
  const message = context.blockMessage || fallbackMessage || OUT_OF_SCOPE_MESSAGE;
  return {
    ok: true,
    stopRun: true,
    scope: context.scope || "out_of_scope",
    message,
  };
}

function pipelineSteps(services) {
  return [
    {
      label: "Capture",
      detail: services.includes("Lead capture funnels")
        ? "A form or chat qualifies the visitor and posts into your pipeline."
        : "Collect the request from the channel they already use.",
    },
    {
      label: "Store",
      detail: services.includes("CRM and database integration")
        ? "Write the lead to your CRM or database with server-side keys only."
        : "Keep a structured record of every enquiry.",
    },
    {
      label: "Notify",
      detail: "Ping Slack or email the moment a real lead lands.",
    },
    {
      label: "Follow up",
      detail: services.includes("Automated follow-up")
        ? "Send the confirmation and a short nurture sequence without anyone typing."
        : "Reply quickly so the lead does not go cold.",
    },
    {
      label: "Book",
      detail: services.includes("Appointment booking")
        ? "Hand them a calendar link once they look qualified."
        : "Close the loop with a call or a next step.",
    },
  ];
}

async function extractRequirements(context) {
  const workflowText = String(context.workflowText || "").trim();
  const classified = applyScope(context, classifyWorkflow(workflowText));
  if (classified.scope !== "in_scope") {
    return stopResult(context);
  }

  const fallback = heuristicRequirements(workflowText, {
    name: context.accountInfo?.firstName
      ? `${context.accountInfo.firstName} ${context.accountInfo.lastName || ""}`.trim()
      : "",
    email: context.account?.email || context.accountInfo?.email,
  });

  try {
    const content = await generateAiText({
      system: `Extract JSON with keys summary, need, timeline, company, scope. scope must be in_scope, out_of_scope, or unsafe. Only in_scope if the user wants a sales/ops pipeline: capture, store, notify, follow up, or book. need must be one of: ${NEEDS.join(", ")}. timeline must be one of: ${TIMELINES.join(", ")}. Do not invent a company if none is named.`,
      user: workflowText.slice(0, 8000),
      json: true,
    });
    const parsed = parseJsonObject(content);
    if (parsed.scope === "unsafe" || parsed.scope === "out_of_scope") {
      applyScope(context, {
        scope: parsed.scope,
        message: parsed.scope === "unsafe" ? UNSAFE_MESSAGE : OUT_OF_SCOPE_MESSAGE,
      });
      return stopResult(context);
    }
    context.requirements = {
      summary: String(parsed.summary || fallback.summary).slice(0, 600),
      need: NEEDS.includes(parsed.need) ? parsed.need : fallback.need,
      timeline: TIMELINES.includes(parsed.timeline) ? parsed.timeline : fallback.timeline,
      company: String(parsed.company || "").trim().slice(0, 160),
      name: fallback.name,
      email: fallback.email,
      scope: "in_scope",
    };
  } catch {
    context.requirements = { ...fallback, scope: "in_scope" };
  }

  return { ok: true, requirements: context.requirements, scope: "in_scope" };
}

function proposePipeline(context) {
  const classified = ensureAutomationScope(context);
  if (classified.scope !== "in_scope") {
    return stopResult(context);
  }

  const text = `${context.workflowText || ""}\n${context.requirements?.summary || ""}`;
  const services = matchServices(text);
  if (services.length === 0) {
    applyScope(context, { scope: "out_of_scope", message: OUT_OF_SCOPE_MESSAGE });
    return stopResult(context);
  }
  context.pipeline = {
    services,
    steps: pipelineSteps(services),
    need: context.requirements?.need || pickNeed(text),
  };
  return {
    ok: true,
    services,
    steps: context.pipeline.steps.map((step) => step.label),
    need: context.pipeline.need,
  };
}

function displayName(context) {
  const info = context.accountInfo || {};
  const fromAccount = `${info.firstName || ""} ${info.lastName || ""}`.trim();
  if (fromAccount) return fromAccount;
  const email = String(context.account?.email || "").split("@")[0];
  return email || "Website visitor";
}

function draftBrief(context) {
  const classified = ensureAutomationScope(context);
  if (classified.scope !== "in_scope") {
    return stopResult(context);
  }
  if (!context.requirements) {
    return { ok: false, error: "No requirements yet. Call extract_requirements first." };
  }
  if (!context.pipeline) {
    const proposed = proposePipeline(context);
    if (proposed.stopRun) return proposed;
  }

  const name = displayName(context);
  const email = String(context.account?.email || context.accountInfo?.email || "").trim().toLowerCase();
  const services = (context.pipeline.services || []).join(", ");
  const steps = (context.pipeline.steps || [])
    .map((step) => `${step.label}: ${step.detail}`)
    .join("\n");
  const message = [
    context.requirements.summary,
    "",
    `Recommended services: ${services}`,
    steps,
  ]
    .join("\n")
    .trim()
    .slice(0, 2000);

  context.brief = {
    name,
    email,
    company: context.requirements.company || "",
    need: context.pipeline.need || context.requirements.need,
    timeline: context.requirements.timeline,
    message,
    source: "funnel-form",
  };

  return {
    ok: true,
    brief: {
      name: context.brief.name,
      email: context.brief.email,
      company: context.brief.company,
      need: context.brief.need,
      timeline: context.brief.timeline,
      message: context.brief.message,
      source: context.brief.source,
      services,
    },
  };
}

async function submitInquiry(context) {
  const classified = ensureAutomationScope(context);
  if (classified.scope !== "in_scope") {
    return stopResult(context);
  }
  if (context.submittedInquiry) {
    return {
      ok: true,
      submitted: true,
      alreadySubmitted: true,
      bookingUrl: context.bookingUrl || "",
    };
  }
  if (!context.brief) {
    const drafted = draftBrief(context);
    if (!drafted.ok) return drafted;
  }

  const result = normalizeLead({ ...context.brief, website: "" });
  if (!result.ok) {
    return { ok: false, error: result.message || "The inquiry brief is incomplete." };
  }

  const outcome = await captureLead(result.lead);
  context.submittedInquiry = true;
  context.bookingUrl = outcome.bookingUrl || "";
  return {
    ok: true,
    submitted: true,
    stored: Boolean(outcome.stored),
    bookingUrl: context.bookingUrl,
    need: result.lead.need,
  };
}

async function executeAutomationTool(name, context) {
  if (name === "extract_requirements") return extractRequirements(context);
  if (name === "propose_pipeline") return proposePipeline(context);
  if (name === "draft_brief") return draftBrief(context);
  if (name === "submit_inquiry") return submitInquiry(context);
  return { ok: false, error: `Unknown tool: ${name}` };
}

function shouldPauseForInquiry(context) {
  if (context?.blocked) return false;
  if (context?.scope && context.scope !== "in_scope") return false;
  if (!context?.brief) return false;
  if (context.submittedInquiry) return false;
  return true;
}

module.exports = {
  AUTOMATION_GOAL,
  executeAutomationTool,
  getRecipe,
  guardAutomationWrite: ensureAutomationScope,
  normalizeAgentType,
  shouldPauseForInquiry,
};
