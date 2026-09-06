const QUOTA_MESSAGE =
  "AI is temporarily at its free-tier limit. Please wait about a minute and try again.";

export function friendlyAiErrorMessage(raw: string | undefined | null, fallback: string): string {
  const text = String(raw || "");
  if (/429|quota|Too Many Requests|rate.?limit|RESOURCE_EXHAUSTED|GoogleGenerativeAI/i.test(text)) {
    return QUOTA_MESSAGE;
  }
  if (text.length > 180 || text.includes("https://")) {
    return fallback;
  }
  return text || fallback;
}
