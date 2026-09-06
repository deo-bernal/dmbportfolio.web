/**
 * Copy and data for the AI automation showcase pages (/ai-automation, /case-studies, /stack).
 * Kept as data so the funnel, case studies, and stack page stay in sync.
 */

export const CAL_BOOKING_URL =
  process.env.REACT_APP_CAL_BOOKING_URL || "https://cal.com/deo-bernal/30min";

export const CONTACT_EMAIL =
  process.env.REACT_APP_CONTACT_EMAIL || "deobernal@gmail.com";

/** Set once the walkthrough is recorded; the button hides until then. */
export const WALKTHROUGH_URL = process.env.REACT_APP_WALKTHROUGH_URL || "";

export type ServiceItem = {
  title: string;
  description: string;
};

export const SERVICES: ServiceItem[] = [
  {
    title: "AI chat assistants",
    description:
      "Site assistants grounded in your own content, with streaming replies, in-site navigation, and provider failover so a model outage never takes the widget down.",
  },
  {
    title: "Lead capture funnels",
    description:
      "Landing pages and forms that validate input, block bots, and push every submission straight into your CRM or database within a second.",
  },
  {
    title: "CRM and database integration",
    description:
      "Supabase, Airtable, Google Sheets, HubSpot, or a Postgres pipeline, wired over REST and webhooks with server-side keys only.",
  },
  {
    title: "Automated follow-up",
    description:
      "Instant confirmation email, then a timed nurture sequence driven by n8n so no lead sits untouched while you sleep.",
  },
  {
    title: "Appointment booking",
    description:
      "Calendar booking wired into the funnel and the chatbot, so a qualified visitor can pick a slot without a single manual reply.",
  },
  {
    title: "Voice AI agents",
    description:
      "Inbound voice agents on the same knowledge base as the chat assistant, for callers who would rather talk than type.",
  },
];

export type PipelineStep = {
  label: string;
  detail: string;
};

/** What actually happens when the form on /ai-automation is submitted. */
export const PIPELINE_STEPS: PipelineStep[] = [
  {
    label: "Capture",
    detail:
      "The form posts to a serverless function that validates the payload and silently drops bot submissions.",
  },
  {
    label: "Store",
    detail:
      "The lead is inserted into a Supabase table over its REST API, with the service key held server-side only.",
  },
  {
    label: "Notify",
    detail:
      "A webhook fires into a self-hosted n8n workflow, which posts the lead to Slack and starts the follow-up sequence.",
  },
  {
    label: "Follow up",
    detail:
      "A confirmation email goes out immediately through Resend, followed by a two-step nurture sequence.",
  },
  {
    label: "Book",
    detail:
      "Every message carries the booking link, so a qualified lead can put a slot on the calendar unattended.",
  },
];

export type PlatformGroup = {
  title: string;
  note: string;
  items: string[];
};

/**
 * Split deliberately: the first group is running in production on this domain,
 * the second is honest about depth so nothing here oversells.
 */
export const PLATFORMS_SHIPPED: PlatformGroup[] = [
  {
    title: "AI platforms",
    note: "Running in production on this site",
    items: [
      "OpenAI-compatible APIs (Groq)",
      "Google Gemini (SDK + REST)",
      "Claude (Anthropic) for build tooling",
      "Streaming over SSE",
      "Prompt design and grounding",
      "Retrieval over curated knowledge",
    ],
  },
  {
    title: "Automation and integration",
    note: "Built and documented in this repository",
    items: [
      "n8n (self-hosted, workflows exported)",
      "Webhooks and REST integration",
      "Supabase (Postgres + REST)",
      "Resend transactional email",
      "Cal.com appointment booking",
      "Serverless functions on Vercel",
    ],
  },
  {
    title: "Engineering",
    note: "Twenty years of delivery experience",
    items: [
      "React and TypeScript",
      ".NET 10 Web API",
      "PostgreSQL and EF Core",
      "GitHub and CI deploys",
      "Postman and API debugging",
      "Production incident triage",
    ],
  },
];

export const PLATFORMS_WORKING: PlatformGroup[] = [
  {
    title: "CRM and funnel platforms",
    note: "Working knowledge, transferable from the pipeline above",
    items: ["GoHighLevel", "HubSpot", "Make", "Zapier"],
  },
  {
    title: "Voice AI",
    note: "Integrated on trial accounts",
    items: ["Vapi", "Retell", "Bland AI", "ElevenLabs"],
  },
  {
    title: "Data and collaboration",
    note: "Used on client and internal work",
    items: ["Airtable", "Google Sheets", "Slack", "ClickUp", "Notion", "Replit"],
  },
];

export type CaseStudySection = {
  heading: string;
  body?: string[];
  bullets?: string[];
  code?: { caption: string; language: string; content: string };
};

export type CaseStudy = {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  timeframe: string;
  stack: string[];
  liveProof: string;
  metrics: Array<{ label: string; value: string }>;
  sections: CaseStudySection[];
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "dmb-assistant",
    title: "DMB Assistant: a grounded site chatbot that survives provider outages",
    tagline:
      "An AI assistant answering questions about two businesses on this domain, with multi-provider failover after two production incidents.",
    role: "Sole designer, developer, and operator",
    timeframe: "2026",
    stack: [
      "Vercel Functions",
      "Groq (OpenAI-compatible)",
      "Google Gemini",
      "Server-sent events",
      "React + TypeScript",
      "Web Speech API",
    ],
    liveProof:
      "Open the assistant in the bottom-right corner of any page on this site and ask it anything.",
    metrics: [
      { label: "Live on", value: "dmbwebsolutions.com" },
      { label: "Providers", value: "2 vendors, 6 models" },
      { label: "Outages absorbed", value: "2 without a rebuild" },
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "This domain serves two unrelated businesses: a free online profile builder and a real estate practice in Pampanga. Visitors landed on the site with questions that neither the landing copy nor the login page answered, and every unanswered question was a lost lead.",
          "I wanted an assistant that could answer in the visitor's own words, route them to the right page, and never invent a feature or a property that does not exist.",
        ],
      },
      {
        heading: "How it works",
        bullets: [
          "A serverless function receives the conversation, retrieves the most relevant curated knowledge chunks, and builds a grounded prompt.",
          "Replies stream back token by token over server-sent events, so the visitor sees an answer forming instead of a spinner.",
          "The prompt emits in-site links in a fixed marker format, which the widget renders as real navigation instead of raw URLs.",
          "Retrieval is keyword scoring over hand-written chunks rather than a vector database, which keeps cold starts fast and the answers auditable.",
          "The widget supports voice input and spoken replies through the browser Speech APIs, with no third-party dependency.",
        ],
      },
      {
        heading: "Incident one: a missing dependency took the endpoint down",
        body: [
          "After restoring the widget onto a different branch, the chat endpoint began returning FUNCTION_INVOCATION_FAILED. The platform logs showed the real cause: the Google AI package was importing at module scope but was absent from the dependency manifest, so the function crashed before it could handle a single request.",
        ],
        bullets: [
          "Added the missing package to the manifest so the deployed bundle actually contains it.",
          "Moved the import behind a guarded loader, so a missing optional SDK now degrades to the next provider instead of killing the function.",
        ],
        code: {
          caption: "A missing optional SDK now degrades instead of crashing the endpoint",
          language: "javascript",
          content: `function loadGeminiClient(apiKey) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    return new GoogleGenerativeAI(apiKey);
  } catch {
    return null;
  }
}`,
        },
      },
      {
        heading: "Incident two: the provider retired the model underneath me",
        body: [
          "With the crash fixed, chat still failed. The configured Groq model had been decommissioned on 16 August 2026, so every request returned a 404 that surfaced to visitors as a generic failure message.",
          "Pinning a single model name is the actual defect, so I fixed the pattern rather than the value.",
        ],
        bullets: [
          "Each provider now walks an ordered list of models and moves on when one is missing, retired, or rate limited.",
          "Gemini falls back from the SDK to the raw REST endpoint, so an SDK problem is not a provider outage.",
          "Quota errors are detected and returned as a readable message with a 429, instead of a vague server error.",
          "Provider failures are logged with the provider and model name, which is what made the second incident a ten-minute diagnosis.",
        ],
      },
      {
        heading: "Result",
        bullets: [
          "The assistant is live and answering on every page of this domain.",
          "Two vendor-side failures were absorbed by configuration changes, with no rewrite of the widget or the API contract.",
          "Verified after each deploy by posting a real question to the endpoint and confirming a streamed 200 response.",
        ],
      },
    ],
  },
  {
    slug: "ai-profile-builder",
    title: "AI Profile Builder: resume file to a live public page",
    tagline:
      "Upload a PDF or Word resume and get a published portfolio and resume, with a human review step and no silent data loss.",
    role: "Sole designer, developer, and operator",
    timeframe: "2026",
    stack: [
      "Vercel Functions",
      "Groq / Gemini structured output",
      "pdfjs-dist",
      "mammoth",
      ".NET 10 Web API",
      "PostgreSQL",
    ],
    liveProof:
      "Register a free account on this site, open the AI Profile Builder, upload a resume, and publish.",
    metrics: [
      { label: "Input", value: "PDF, DOCX, or pasted text" },
      { label: "Output", value: "Portfolio + resume + public URL" },
      { label: "Publish path", value: "3 API writes, 1 review step" },
    ],
    sections: [
      {
        heading: "The problem",
        body: [
          "People who need an online presence rarely abandon the effort at the design stage. They abandon it at the blank form. The information already exists in a resume file, so asking someone to retype it into eight fields is the reason most profiles were never finished.",
        ],
      },
      {
        heading: "How it works",
        bullets: [
          "The resume is parsed in the browser: pdfjs-dist for PDF text layers, mammoth for DOCX, capped at 8 MB.",
          "If too little text comes out, the user is told to try another export or paste instead, rather than being handed an empty draft.",
          "The extracted text plus optional answers go to a serverless function that requests strict JSON matching a fixed portfolio and resume schema.",
          "The prompt forbids inventing employers, degrees, or credentials, and returns empty values for anything it cannot find.",
          "A review step shows the draft as editable fields, so nothing reaches the database without the person seeing it.",
          "Publishing writes the portfolio and the resume to the .NET API and returns the live public URL.",
        ],
      },
      {
        heading: "The bug worth writing down",
        body: [
          "The prompt instructs the model to return an empty string for unknown fields, which is correct behaviour. The API, however, wrote every field unconditionally. When a resume had no phone number, publishing overwrote the name and phone the account had registered with, and the public page fell back to the literal word Profile.",
        ],
        bullets: [
          "Every field now resolves through a precedence chain: the AI draft, then the saved account value, then the account email.",
          "The account's saved details are loaded when the builder opens and merged into the draft before review.",
          "Name and phone became editable review fields, so the person can correct them before anything is written.",
        ],
        code: {
          caption: "A blank AI field can no longer overwrite a real saved value",
          language: "typescript",
          content: `function firstFilled(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}`,
        },
      },
      {
        heading: "Result",
        bullets: [
          "A resume file becomes a shareable public URL in about thirty seconds.",
          "Publishing is non-destructive: missing AI output can no longer erase saved account details.",
          "The same provider failover as the chat assistant, so a retired model does not break onboarding.",
        ],
      },
    ],
  },
];

export function findCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
