import { friendlyAiErrorMessage } from "../utils/friendlyAiError";

export type SiteChatRole = "user" | "assistant";

export type SiteChatMessage = {
  role: SiteChatRole;
  content: string;
};

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage access errors.
  }
  return headers;
}

export async function loadSiteChatHistory(): Promise<SiteChatMessage[]> {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];
  } catch {
    return [];
  }

  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 8000);
  try {
    const response = await fetch("/api/chat", {
      method: "GET",
      headers: authHeaders(),
      signal: abort.signal,
    });
    if (!response.ok) return [];
    const payload = await response.json();
    if (!Array.isArray(payload?.messages)) return [];
    return payload.messages.filter(
      (msg: SiteChatMessage) =>
        msg && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string"
    );
  } catch {
    return [];
  } finally {
    window.clearTimeout(timer);
  }
}

export async function streamSiteChat(
  messages: SiteChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 20000);

  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ messages }),
      signal: abort.signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw new Error("The assistant took too long. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    let message = "Failed to get a chat response.";
    try {
      const payload = await response.json();
      if (payload?.message) message = payload.message;
    } catch {
      if (response.status === 504 || response.status === 502) {
        message = "The assistant took too long. Please try again.";
      }
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
