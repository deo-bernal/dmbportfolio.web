import { AI_FREE_TIER_GENERIC_ERROR, AI_FREE_TIER_QUOTA_MESSAGE, AI_FREE_TIER_TRADEOFFS } from "content/aiFreeTier";

export const QUOTA_MESSAGE = AI_FREE_TIER_QUOTA_MESSAGE;

export function isAiQuotaError(raw: string | undefined | null): boolean {
  return /429|quota|Too Many Requests|rate.?limit|RESOURCE_EXHAUSTED|GoogleGenerativeAI|usage limit/i.test(
    String(raw || "")
  );
}

export function friendlyAiErrorMessage(raw: string | undefined | null, fallback: string): string {
  const text = String(raw || "");
  if (isAiQuotaError(text)) {
    return QUOTA_MESSAGE;
  }
  if (text.length > 180 || text.includes("https://")) {
    return fallback;
  }
  return text || fallback;
}

export function resumeParserErrorMessage(raw: string | undefined | null): string {
  if (isAiQuotaError(raw)) {
    return QUOTA_MESSAGE;
  }
  const mapped = friendlyAiErrorMessage(raw, AI_FREE_TIER_GENERIC_ERROR);
  if (mapped.includes("free-tier") || mapped.includes("Free tiers")) {
    return mapped;
  }
  return `${mapped} ${AI_FREE_TIER_TRADEOFFS}`;
}
