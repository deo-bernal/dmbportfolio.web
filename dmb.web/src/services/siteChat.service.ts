import { friendlyAiErrorMessage } from "../utils/friendlyAiError";

export type SiteChatRole = "user" | "assistant";

export type SiteChatMessage = {
  role: SiteChatRole;
  content: string;
};

export async function streamSiteChat(
  messages: SiteChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let message = "Failed to get a chat response.";
    try {
      const payload = await response.json();
      if (payload?.message) message = payload.message;
    } catch {
      // keep default
    }
    throw new Error(friendlyAiErrorMessage(message, "Failed to get a chat response."));
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No chat stream available.");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as { text?: string };
        if (parsed.text) {
          fullText += parsed.text;
          onChunk(fullText);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  return fullText;
}
