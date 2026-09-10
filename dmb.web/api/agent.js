const {
  callGroqChat,
  generateAiText,
  beginSse,
  friendlyAiError,
  QUOTA_MESSAGE,
} = require("./_aiProvider");
const { getUpstreamJson, sendUpstreamJson, upstreamErrorMessage } = require("./_upstream");
const { generateProfileFromInput } = require("./_generateProfile");
const {
  accountFromResume,
  buildProfilePayload,
  buildResumePayload,
  firstFilled,
  listMissingFields,
  publicProfilePath,
} = require("./_profilePayload");
const {
  appendAgentStep,
  createAgentRun,
  getAgentRun,
  listAgentSteps,
  loadLatestAgentSession,
  updateAgentRun,
} = require("./_agentStore");

const MAX_STEPS = 8;
const MAX_RESUME = 20000;
const WRITE_TOOLS = new Set(["save_portfolio", "save_resume"]);

const TOOLS = [
  {
    type: "function",
    function: {
      name: "generate_profile",
      description: "Draft portfolio and resume JSON from the resume text and goal already supplied.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_profile",
      description: "Read the user's currently saved public portfolio from the database.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_resume",
      description: "Read the user's currently saved resume from the database.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_missing_fields",
      description: "List required fields still missing from the current draft before saving.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "save_portfolio",
      description: "Save the current draft to the public portfolio. Requires the user to Allow first.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "save_resume",
      description: "Save the current draft to the resume page. Requires the user to Allow first.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_public_url",
      description: "Return the public portfolio path after a successful save.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

const SYSTEM_PROMPT = `You are the DMB Profile Builder Agent. You use tools to turn resume text into a live public portfolio.

Rules:
- Use tools. Do not invent employers, degrees, or dates.
- Typical order: generate_profile, list_missing_fields, save_portfolio, save_resume, get_public_url.
- If required fields are missing, tell the user what to add instead of saving.
- save_portfolio and save_resume wait for the user to click Allow. Never claim they are saved until the tool result says so.
- Keep user-facing messages short (2-3 sentences).
- You run on free-tier Groq and Gemini APIs.`;

const JSON_FALLBACK_PROMPT = `${SYSTEM_PROMPT}

Reply with JSON only, one of:
{"tool":"generate_profile","arguments":{}}
{"tool":"get_profile","arguments":{}}
{"tool":"get_resume","arguments":{}}
{"tool":"list_missing_fields","arguments":{}}
{"tool":"save_portfolio","arguments":{}}
{"tool":"save_resume","arguments":{}}
{"tool":"get_public_url","arguments":{}}
{"done":true,"message":"short status for the user"}`;

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : "";
}

function parseJwtAccount(token) {
  const parts = String(token || "").split(".");
  if (parts.length < 2) return null;

  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json);
    const userId = Number(
      payload.userId ||
        payload.nameid ||
        payload.sub ||
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
    );
    if (!Number.isFinite(userId) || userId <= 0) return null;

    const email = String(
      payload.email ||
        payload.unique_name ||
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        ""
    )
      .trim()
      .toLowerCase();

    return { userId, email };
  } catch {
    return null;
  }
}

function accountFromProfile(account) {
  if (!account) return null;
  const userId = Number(account.userId ?? account.UserId);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  return {
    userId,
    email: String(account.email || account.username || "").trim().toLowerCase(),
  };
}

async function resolveAccount(req) {
  const token = bearerToken(req);
  if (!token) return { token: "", account: null };

  const fromJwt = parseJwtAccount(token);
  try {
    const profile = await getUpstreamJson("/profiledetails", { token, timeoutMs: 4000 });
    return { token, account: accountFromProfile(profile) || fromJwt };
  } catch {
    return { token, account: fromJwt };
  }
}

function writeEvent(res, event) {
  beginSse(res);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function summarizeProfile(profile) {
  if (!profile) return "No draft yet.";
  const name = firstFilled(
    `${profile.resume?.personalInfo?.firstName || ""} ${profile.resume?.personalInfo?.lastName || ""}`.trim()
  );
  return {
    name: name || "Untitled",
    skills: (profile.skills || []).slice(0, 8),
    projects: (profile.projectCategories || []).reduce((count, category) => count + (category.items?.length || 0), 0),
    summary: String(profile.summary || "").slice(0, 240),
  };
}

function parseToolArguments(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseJsonObject(content) {
  const trimmed = String(content || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function decideNextAction(messages) {
  try {
    const result = await callGroqChat({ messages, tools: TOOLS });
    if (result?.toolCalls?.length) {
      const call = result.toolCalls[0];
      return {
        kind: "tool",
        name: call.function?.name,
        arguments: parseToolArguments(call.function?.arguments),
        assistantMessage: result.content,
      };
    }
    if (result?.content) {
      try {
        const parsed = parseJsonObject(result.content);
        if (parsed?.done) return { kind: "done", message: parsed.message || result.content };
        if (parsed?.tool) {
          return { kind: "tool", name: parsed.tool, arguments: parsed.arguments || {}, assistantMessage: "" };
        }
      } catch {
        return { kind: "done", message: result.content };
      }
      return { kind: "done", message: result.content };
    }
  } catch (error) {
    console.error(`agent: tool calling failed — ${error?.message || error}`);
  }

  const transcript = messages
    .map((msg) => `${msg.role}: ${typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)}`)
    .join("\n")
    .slice(0, 12000);

  const content = await generateAiText({
    system: JSON_FALLBACK_PROMPT,
    user: transcript,
    json: true,
  });
  const parsed = parseJsonObject(content);
  if (parsed?.done) return { kind: "done", message: parsed.message || "Done." };
  if (parsed?.tool) {
    return { kind: "tool", name: parsed.tool, arguments: parsed.arguments || {}, assistantMessage: "" };
  }
  return { kind: "done", message: "I could not choose a next tool. Try again with more resume detail." };
}

async function savePortfolioRecord(payload, token) {
  const timeoutMs = 45000;
  const existing = await getUpstreamJson("/profiledetails", { token, timeoutMs: 20000 });
  if (existing) {
    return sendUpstreamJson("/profiledetails", { token, method: "PUT", body: payload, timeoutMs });
  }

  const created = await sendUpstreamJson("/profiledetails", {
    token,
    method: "POST",
    body: payload,
    timeoutMs,
  });
  if (created.ok || created.status === 201) return created;
  if (created.status === 409 || created.status === 404 || !created.ok) {
    return sendUpstreamJson("/profiledetails", { token, method: "PUT", body: payload, timeoutMs });
  }
  return created;
}

async function executeTool(name, context) {
  const { token, account, resumeText, goal, draft } = context;
  const email = account?.email || "";

  if (name === "generate_profile") {
    const profile = await generateProfileFromInput({
      resumeText,
      roleGoal: goal,
      accountEmail: email,
    });
    context.draft = profile;
    return { ok: true, summary: summarizeProfile(profile), profile };
  }

  if (name === "get_profile") {
    const profile = await getUpstreamJson("/profiledetails", { token, timeoutMs: 8000 });
    return { ok: Boolean(profile), profile: profile || null };
  }

  if (name === "get_resume") {
    const resume = await getUpstreamJson("/resume", { token, timeoutMs: 8000 });
    context.savedResume = resume;
    return { ok: Boolean(resume), resume: resume || null };
  }

  if (name === "list_missing_fields") {
    if (!context.draft) {
      return { ok: false, error: "No draft yet. Call generate_profile first." };
    }
    const savedResume = context.savedResume || (await getUpstreamJson("/resume", { token, timeoutMs: 8000 }));
    context.savedResume = savedResume;
    return { ok: true, ...listMissingFields(context.draft, savedResume, email) };
  }

  if (name === "get_public_url") {
    const path = publicProfilePath(email);
    context.publicUrl = path;
    return { ok: Boolean(path), path, hint: path ? "Prefix with the site origin in the browser." : "Email missing." };
  }

  if (name === "save_portfolio") {
    if (!draft) return { ok: false, error: "No draft to save.", clientFallback: true };
    const savedResume = context.savedResume || (await getUpstreamJson("/resume", { token, timeoutMs: 20000 }));
    const accountInfo = accountFromResume(savedResume, email);
    const payload = buildProfilePayload(draft, email, accountInfo);
    const result = await savePortfolioRecord(payload, token);
    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        clientFallback: true,
        error: upstreamErrorMessage(result, "Unable to save portfolio."),
      };
    }
    context.savedPortfolio = true;
    return { ok: true, saved: "portfolio" };
  }

  if (name === "save_resume") {
    if (!draft) return { ok: false, error: "No draft to save.", clientFallback: true };
    const savedResume = context.savedResume || (await getUpstreamJson("/resume", { token, timeoutMs: 20000 }));
    const accountInfo = accountFromResume(savedResume, email);
    const payload = buildResumePayload(draft, email, accountInfo);
    const result = await sendUpstreamJson("/resume", {
      token,
      method: "PUT",
      body: payload,
      timeoutMs: 45000,
    });
    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        clientFallback: true,
        error: upstreamErrorMessage(result, "Unable to save resume."),
      };
    }
    context.savedResumeRecord = true;
    const path = publicProfilePath(email);
    context.publicUrl = path;
    return { ok: true, saved: "resume", path };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}

function toolResultForModel(name, result) {
  const copy = { ...result };
  if (copy.profile && name === "generate_profile") {
    copy.profile = summarizeProfile(copy.profile);
  }
  if (copy.profile && name === "get_profile") {
    copy.profile = {
      summary: String(copy.profile.summary || "").slice(0, 240),
      skills: copy.profile.skills,
    };
  }
  return JSON.stringify(copy).slice(0, 4000);
}

async function safeStep(runId, step) {
  try {
    await appendAgentStep(runId, step);
  } catch (error) {
    console.warn(`agent: step persist failed — ${error?.message || error}`);
  }
}

async function safeUpdateRun(runId, patch) {
  try {
    await updateAgentRun(runId, patch);
  } catch (error) {
    console.warn(`agent: run persist failed — ${error?.message || error}`);
  }
}

async function runLoop(res, context, messages, remaining) {
  for (let i = 0; i < remaining; i += 1) {
    const action = await decideNextAction(messages);
    if (action.kind === "done") {
      const path = context.publicUrl || publicProfilePath(context.account?.email);
      await safeUpdateRun(context.runId, { status: "completed", public_url: path || null });
      writeEvent(res, { type: "done", message: action.message, publicUrl: path || "", runId: context.runId });
      return;
    }

    const name = String(action.name || "").trim();
    if (!name) {
      writeEvent(res, { type: "error", message: "The agent did not choose a tool." });
      await safeUpdateRun(context.runId, { status: "failed" });
      return;
    }

    if (WRITE_TOOLS.has(name)) {
      await safeUpdateRun(context.runId, { status: "awaiting_confirmation" });
      await safeStep(context.runId, {
        tool: name,
        status: "pending",
        arguments: action.arguments || {},
        result: { needsConfirmation: true },
      });
      writeEvent(res, {
        type: "confirm",
        tool: name,
        arguments: action.arguments || {},
        draft: context.draft || null,
        runId: context.runId,
        message: name === "save_resume" ? "Allow saving the resume draft?" : "Allow saving the public portfolio?",
      });
      return;
    }

    writeEvent(res, { type: "step", step: { tool: name, status: "running" } });
    const result = await executeTool(name, context);
    await safeStep(context.runId, {
      tool: name,
      status: result.ok ? "ok" : "error",
      arguments: action.arguments || {},
      result: name === "generate_profile" ? { ok: result.ok, summary: result.summary } : result,
    });
    writeEvent(res, {
      type: "step",
      step: {
        tool: name,
        status: result.ok ? "ok" : "error",
        result: name === "generate_profile" ? { summary: result.summary } : result,
      },
      draft: context.draft || undefined,
    });

    messages.push({
      role: "assistant",
      content: action.assistantMessage || `Calling ${name}.`,
    });
    messages.push({
      role: "user",
      content: `Tool ${name} result: ${toolResultForModel(name, result)}`,
    });
  }

  await safeUpdateRun(context.runId, {
    status: "completed",
    public_url: context.publicUrl || publicProfilePath(context.account?.email) || null,
  });
  writeEvent(res, {
    type: "done",
    message: "Reached the tool-call limit. Review the steps and run again if needed.",
    publicUrl: context.publicUrl || publicProfilePath(context.account?.email) || "",
    runId: context.runId,
  });
}

function buildMessages({ goal, resumeText, extra }) {
  const resume = String(resumeText || "").trim().slice(0, MAX_RESUME);
  const parts = [
    `Goal: ${String(goal || "Build my public portfolio and resume from this resume.").trim()}`,
    resume ? `Resume text:\n${resume}` : "No resume text was provided. Use get_resume or ask the user to paste a resume.",
  ];
  if (extra) parts.push(extra);
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n\n") },
  ];
}

async function handleGet(req, res, account) {
  try {
    const session = await loadLatestAgentSession(account);
    res.status(200).json(session);
  } catch (error) {
    console.error(`agent: load failed — ${error?.message || error}`);
    res.status(200).json({ run: null, steps: [] });
  }
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const { token, account } = await resolveAccount(req);
  if (!account) {
    res.status(401).json({ message: "Sign in to run the profile agent." });
    return;
  }

  if (req.method === "GET") {
    await handleGet(req, res, account);
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  const body = req.body || {};
  const goal = String(body.goal || "Build my public portfolio and resume from this resume.").trim();
  const resumeText = String(body.resumeText || "").trim().slice(0, MAX_RESUME);

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const context = {
    token,
    account,
    resumeText,
    goal,
    draft: body.draft || null,
    savedResume: null,
    runId: null,
    publicUrl: "",
  };

  try {
    if (body.deny && body.runId) {
      const run = await getAgentRun(account, body.runId).catch(() => null);
      context.runId = run?.id || body.runId;
      await safeUpdateRun(context.runId, { status: "denied" });
      await safeStep(context.runId, {
        tool: String(body.tool || "save_portfolio"),
        status: "denied",
        result: { denied: true },
      });
      writeEvent(res, {
        type: "done",
        message: "Save cancelled. Nothing was published.",
        publicUrl: "",
        runId: context.runId,
      });
      res.end();
      return;
    }

    if (body.confirm?.tool && WRITE_TOOLS.has(body.confirm.tool)) {
      let run = null;
      if (body.runId) {
        run = await getAgentRun(account, body.runId).catch(() => null);
      }
      if (!run) {
        run = await createAgentRun(account, goal).catch(() => null);
      }
      context.runId = run?.id || null;
      writeEvent(res, { type: "run", runId: context.runId });

      if (body.alreadySaved) {
        if (body.confirm.tool === "save_portfolio") context.savedPortfolio = true;
        if (body.confirm.tool === "save_resume") context.savedResumeRecord = true;
        context.publicUrl = context.publicUrl || publicProfilePath(account.email);
        await safeStep(context.runId, {
          tool: body.confirm.tool,
          status: "ok",
          result: { ok: true, saved: body.confirm.tool === "save_resume" ? "resume" : "portfolio", via: "browser" },
        });
        writeEvent(res, {
          type: "step",
          step: {
            tool: body.confirm.tool,
            status: "ok",
            result: { saved: body.confirm.tool === "save_resume" ? "resume" : "portfolio" },
          },
          draft: context.draft || undefined,
        });
        const messages = buildMessages({
          goal,
          resumeText,
          extra: `The user allowed ${body.confirm.tool} and the save already succeeded from the browser. Continue with remaining tools, then get_public_url.`,
        });
        await runLoop(res, context, messages, MAX_STEPS);
        res.end();
        return;
      }

      const result = await executeTool(body.confirm.tool, context);
      await safeStep(context.runId, {
        tool: body.confirm.tool,
        status: result.ok ? "ok" : "error",
        arguments: body.confirm.arguments || {},
        result,
      });
      writeEvent(res, {
        type: "step",
        step: { tool: body.confirm.tool, status: result.ok ? "ok" : "error", result },
        draft: context.draft || undefined,
      });

      if (!result.ok) {
        await safeUpdateRun(context.runId, { status: "failed" });
        writeEvent(res, {
          type: "error",
          message: result.error || "Save failed.",
          clientFallback: Boolean(result.clientFallback),
          tool: body.confirm.tool,
        });
        res.end();
        return;
      }

      const messages = buildMessages({
        goal,
        resumeText,
        extra: `The user allowed ${body.confirm.tool}. Result: ${toolResultForModel(body.confirm.tool, result)}. Continue with remaining tools, then get_public_url when both saves are done.`,
      });
      await runLoop(res, context, messages, MAX_STEPS);
      res.end();
      return;
    }

    if (!resumeText && !context.draft) {
      writeEvent(res, {
        type: "error",
        message: "Upload or paste a resume so the agent has something to work with.",
      });
      res.end();
      return;
    }

    const run = await createAgentRun(account, goal).catch((error) => {
      console.warn(`agent: create run failed — ${error?.message || error}`);
      return null;
    });
    context.runId = run?.id || null;
    writeEvent(res, { type: "run", runId: context.runId });

    const messages = buildMessages({ goal, resumeText });
    await runLoop(res, context, messages, MAX_STEPS);
    res.end();
  } catch (error) {
    console.error(`agent: ${error?.message || error}`);
    const quota = friendlyAiError(error);
    if (!res.headersSent) {
      res.status(quota.statusCode || 500).json({
        message: quota.statusCode === 429 ? QUOTA_MESSAGE : error.message || "Agent failed.",
      });
      return;
    }
    writeEvent(res, {
      type: "error",
      message: quota.statusCode === 429 ? QUOTA_MESSAGE : error.message || "Agent failed.",
    });
    if (context.runId) await safeUpdateRun(context.runId, { status: "failed" });
    res.end();
  }
};
