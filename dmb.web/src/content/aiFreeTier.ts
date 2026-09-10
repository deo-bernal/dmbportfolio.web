/**
 * Honest disclosure for every AI surface on this site.
 * Production chat and profile generation run only on free-tier Groq and Gemini APIs.
 */

export const AI_FREE_TIER_HEADLINE = "All AI on this site is free tier";

export const AI_FREE_TIER_PERFORMANCE =
  "Every live AI feature here — the chatbot, the resume / profile builder, the profile agent, and the voice trial — uses free-tier APIs. That is why replies can be slower, shorter, or unavailable when usage limits are hit.";

export const AI_FREE_TIER_TRADEOFFS =
  "Free tiers for AI tools and APIs offer zero-cost experimentation, but come with strict rate limits, data privacy trade-offs, and no uptime guarantees.";

export const AI_FREE_TIER_QUOTA_MESSAGE = [
  "Usage limit exceeded.",
  "All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited.",
  "Please wait about a minute and try again.",
  AI_FREE_TIER_TRADEOFFS,
].join(" ");

export const AI_FREE_TIER_GENERIC_ERROR = [
  "Unable to complete that AI request.",
  "All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited.",
  AI_FREE_TIER_TRADEOFFS,
].join(" ");

export type SiteAiModel = {
  name: string;
  provider: string;
  usedFor: string;
  tier: "Free tier";
};

export const AI_MODELS_IN_USE: SiteAiModel[] = [
  {
    name: "gemini-2.5-flash",
    provider: "Google Gemini",
    usedFor: "Chat streaming (primary) and profile agent",
    tier: "Free tier",
  },
  {
    name: "gemini-2.0-flash",
    provider: "Google Gemini",
    usedFor: "Chat and generation fallback",
    tier: "Free tier",
  },
  {
    name: "gemini-flash-latest",
    provider: "Google Gemini",
    usedFor: "Chat and generation fallback",
    tier: "Free tier",
  },
  {
    name: "openai/gpt-oss-20b",
    provider: "Groq (OpenAI-compatible)",
    usedFor: "Profile builder, profile agent, and chat fallback",
    tier: "Free tier",
  },
  {
    name: "openai/gpt-oss-120b",
    provider: "Groq (OpenAI-compatible)",
    usedFor: "Generation fallback",
    tier: "Free tier",
  },
  {
    name: "qwen/qwen3.6-27b",
    provider: "Groq (OpenAI-compatible)",
    usedFor: "Generation fallback",
    tier: "Free tier",
  },
  {
    name: "Vapi voice agent",
    provider: "Vapi",
    usedFor: "Optional voice trial on the services page",
    tier: "Free tier",
  },
];
