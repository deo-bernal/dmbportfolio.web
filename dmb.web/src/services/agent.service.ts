import type { GeneratedProfile } from "models/aiProfile";
import { friendlyAiErrorMessage } from "../utils/friendlyAiError";

export type AgentStepStatus = "running" | "ok" | "pending" | "denied" | "error";

export type AgentStep = {
  tool: string;
  status: AgentStepStatus | string;
  result?: unknown;
  arguments?: unknown;
};

export type AgentConfirm = {
  tool: string;
  arguments?: Record<string, unknown>;
  message?: string;
  draft?: GeneratedProfile | null;
  runId?: number | null;
};

export type AgentEvent =
  | { type: "run"; runId: number | null }
  | { type: "step"; step: AgentStep; draft?: GeneratedProfile }
  | { type: "confirm"; tool: string; arguments?: Record<string, unknown>; draft?: GeneratedProfile | null; runId?: number | null; message?: string }
  | { type: "done"; message: string; publicUrl?: string; runId?: number | null }
  | { type: "error"; message: string; clientFallback?: boolean; tool?: string };

export type AgentSession = {
  run: {
    id: number;
    goal?: string;
    status?: string;
    public_url?: string | null;
  } | null;
  steps: Array<{
    tool: string;
    status: string;
    arguments?: unknown;
    result?: unknown;
  }>;
};

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Ignore storage access errors.
  }
  return headers;
}

async function readSse(response: Response, onEvent: (event: AgentEvent) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No agent stream available.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";
    for (const chunk of chunks) {
      const line = chunk
        .split("\n")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        onEvent(JSON.parse(data) as AgentEvent);
      } catch {
        // Ignore malformed frames.
      }
    }
  }
}

export async function loadLatestAgentSession(): Promise<AgentSession> {
  try {
    const token = localStorage.getItem("token");
    if (!token) return { run: null, steps: [] };
  } catch {
    return { run: null, steps: [] };
  }

  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 8000);
  try {
    const response = await fetch("/api/agent", {
      method: "GET",
      headers: authHeaders(),
      signal: abort.signal,
    });
    if (!response.ok) return { run: null, steps: [] };
    const payload = (await response.json()) as AgentSession;
    return {
      run: payload?.run ?? null,
      steps: Array.isArray(payload?.steps) ? payload.steps : [],
    };
  } catch {
    return { run: null, steps: [] };
  } finally {
    window.clearTimeout(timer);
  }
}

async function postAgent(body: Record<string, unknown>, onEvent: (event: AgentEvent) => void): Promise<void> {
  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 58000);

  let response: Response;
  try {
    response = await fetch("/api/agent", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: abort.signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw new Error("The agent took too long. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    let message = "Unable to run the agent.";
    try {
      const payload = await response.json();
      if (payload?.message) message = payload.message;
    } catch {
      if (response.status === 401) message = "Sign in to run the profile agent.";
    }
    throw new Error(friendlyAiErrorMessage(message, "Unable to run the agent."));
  }

  await readSse(response, onEvent);
}

export async function runProfileAgent(
  input: { goal: string; resumeText: string; draft?: GeneratedProfile | null },
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  await postAgent(input, onEvent);
}

export async function confirmAgentTool(
  input: {
    runId?: number | null;
    tool: string;
    arguments?: Record<string, unknown>;
    goal: string;
    resumeText: string;
    draft?: GeneratedProfile | null;
    alreadySaved?: boolean;
  },
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  await postAgent(
    {
      runId: input.runId,
      goal: input.goal,
      resumeText: input.resumeText,
      draft: input.draft,
      alreadySaved: Boolean(input.alreadySaved),
      confirm: { tool: input.tool, arguments: input.arguments || {} },
    },
    onEvent
  );
}

export async function denyAgentTool(
  input: { runId?: number | null; tool: string; goal: string },
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  await postAgent(
    { runId: input.runId, tool: input.tool, goal: input.goal, deny: true },
    onEvent
  );
}

export type AgentDemoResponse = {
  profile: GeneratedProfile;
  steps: AgentStep[];
  message?: string;
};

export async function runPublicAgentDemo(): Promise<AgentDemoResponse> {
  const abort = new AbortController();
  const timer = window.setTimeout(() => abort.abort(), 58000);
  try {
    const response = await fetch("/api/agent/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abort.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        friendlyAiErrorMessage(payload?.message || "Unable to run the live sample.", "Unable to run the live sample.")
      );
    }
    return payload as AgentDemoResponse;
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw new Error("The live sample took too long. Watch the canned replay, or try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}
