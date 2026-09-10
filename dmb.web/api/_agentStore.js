/**
 * Signed-in Profile Builder Agent runs. Same server-side Supabase credentials
 * as leads and chat history. Never expose this to the browser.
 */

function normalizeSupabaseUrl(raw) {
  let url = String(raw || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1(?:\/.*)?$/i, "");
  url = url.replace(/\/+$/, "");
  return url;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const RUNS_TABLE = process.env.SUPABASE_AGENT_RUNS_TABLE || "agent_runs";
const STEPS_TABLE = process.env.SUPABASE_AGENT_STEPS_TABLE || "agent_steps";
const MAX_GOAL = 2000;
const MAX_STEPS = 40;

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabaseJson(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${options.method || "GET"} failed (${response.status}): ${body.slice(0, 300)}`);
  }
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function cleanGoal(value) {
  return String(value || "").trim().slice(0, MAX_GOAL);
}

async function createAgentRun(user, goal) {
  if (!supabaseConfigured() || !user?.userId) return null;

  const created = await supabaseJson(encodeURIComponent(RUNS_TABLE), {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        user_id: user.userId,
        user_email: user.email || null,
        goal: cleanGoal(goal),
        status: "running",
      },
    ]),
  });
  return Array.isArray(created) ? created[0] : created;
}

async function getAgentRun(user, runId) {
  if (!supabaseConfigured() || !user?.userId || !runId) return null;

  const rows = await supabaseJson(
    `${encodeURIComponent(RUNS_TABLE)}?id=eq.${encodeURIComponent(String(runId))}&user_id=eq.${encodeURIComponent(String(user.userId))}&select=id,user_id,user_email,goal,status,public_url,created_at,updated_at&limit=1`
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function listLatestAgentRun(user) {
  if (!supabaseConfigured() || !user?.userId) return null;

  const rows = await supabaseJson(
    `${encodeURIComponent(RUNS_TABLE)}?user_id=eq.${encodeURIComponent(String(user.userId))}&select=id,user_id,user_email,goal,status,public_url,created_at,updated_at&order=updated_at.desc&limit=1`
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function updateAgentRun(runId, patch) {
  if (!supabaseConfigured() || !runId) return null;

  const updated = await supabaseJson(
    `${encodeURIComponent(RUNS_TABLE)}?id=eq.${encodeURIComponent(String(runId))}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...patch,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  return Array.isArray(updated) ? updated[0] : updated;
}

async function listAgentSteps(runId) {
  if (!supabaseConfigured() || !runId) return [];

  const rows = await supabaseJson(
    `${encodeURIComponent(STEPS_TABLE)}?run_id=eq.${encodeURIComponent(String(runId))}&select=id,tool,status,arguments,result,created_at&order=created_at.asc&limit=${MAX_STEPS}`
  );
  return Array.isArray(rows) ? rows : [];
}

async function appendAgentStep(runId, step) {
  if (!supabaseConfigured() || !runId || !step?.tool) return null;

  const created = await supabaseJson(encodeURIComponent(STEPS_TABLE), {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        run_id: runId,
        tool: String(step.tool).slice(0, 80),
        status: step.status || "ok",
        arguments: step.arguments ?? null,
        result: step.result ?? null,
      },
    ]),
  });
  return Array.isArray(created) ? created[0] : created;
}

async function loadLatestAgentSession(user) {
  const run = await listLatestAgentRun(user);
  if (!run?.id) return { run: null, steps: [] };
  const steps = await listAgentSteps(run.id);
  return { run, steps };
}

module.exports = {
  appendAgentStep,
  createAgentRun,
  getAgentRun,
  listAgentSteps,
  loadLatestAgentSession,
  supabaseAgentConfigured: supabaseConfigured,
  updateAgentRun,
};
