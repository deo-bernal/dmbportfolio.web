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
const {
  executeAutomationTool,
  getRecipe,
  guardAutomationWrite,
  normalizeAgentType,
  shouldPauseForInquiry,
} = require("./_agentRecipes");

const MAX_STEPS = 8;
const MAX_RESUME = 20000;
const MAX_WORKFLOW = 8000;

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

function inferAgentType(body) {
  const fromBody = normalizeAgentType(body?.agentType);
  if (body?.agentType) return fromBody;
  const tool = String(body?.confirm?.tool || body?.tool || "");
  if (tool === "submit_inquiry") return "automation";
  return fromBody;
}

async function decideNextAction(messages, recipe) {
  try {
    const result = await callGroqChat({ messages, tools: recipe.tools });
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
    system: recipe.jsonFallbackPrompt,
    user: transcript,
    json: true,
  });
  const parsed = parseJsonObject(content);
  if (parsed?.done) return { kind: "done", message: parsed.message || "Done." };
  if (parsed?.tool) {
    return { kind: "tool", name: parsed.tool, arguments: parsed.arguments || {}, assistantMessage: "" };
  }
  return {
    kind: "done",
    message:
      recipe.type === "automation"
        ? "I could not choose a next tool. Add more detail about the workflow and run again."
        : "I could not choose a next tool. Try again with more resume detail.",
  };
}

async function loadAccountInfo(token, email) {
  const [resume, profile] = await Promise.all([
    getUpstreamJson("/resume", { token, timeoutMs: 20000 }),
    getUpstreamJson("/profiledetails", { token, timeoutMs: 20000 }),
  ]);
  const fromResume = accountFromResume(resume, email);
  return {
    firstName: firstFilled(fromResume.firstName, profile?.firstName),
    lastName: firstFilled(fromResume.lastName, profile?.lastName),
    contactNo: firstFilled(fromResume.contactNo, profile?.contactNo),
    email: firstFilled(fromResume.email, profile?.email, profile?.username, email),
    address: firstFilled(fromResume.address),
  };
}

async function saveResumeRecord(payload, token) {
  return sendUpstreamJson("/resume", {
    token,
    method: "PUT",
    body: payload,
    timeoutMs: 45000,
  });
}

async function saveDraftToAccount(context) {
  const { token, account, draft } = context;
  const email = account?.email || "";
  if (!draft) return { ok: false, error: "No draft to save.", clientFallback: true };

  const accountInfo = await loadAccountInfo(token, email);
  const profilePayload = buildProfilePayload(draft, email, accountInfo);
  const resumePayload = buildResumePayload(draft, email, accountInfo);

  const portfolioResult = await savePortfolioRecord(profilePayload, token);
  if (!portfolioResult.ok) {
    return {
      ok: false,
      status: portfolioResult.status,
      clientFallback: true,
      error: upstreamErrorMessage(portfolioResult, "Unable to save portfolio."),
    };
  }

  const resumeResult = await saveResumeRecord(resumePayload, token);
  if (!resumeResult.ok) {
    return {
      ok: false,
      status: resumeResult.status,
      clientFallback: true,
      error: upstreamErrorMessage(resumeResult, "Unable to save resume."),
    };
  }

  context.savedPortfolio = true;
  context.savedResumeRecord = true;
  const path = publicProfilePath(firstFilled(email, accountInfo.email));
  context.publicUrl = path;
  return { ok: true, saved: "portfolio and resume", path };
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
  if (context.recipe?.type === "automation") {
    return executeAutomationTool(name, context);
  }

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
    const listed = listMissingFields(context.draft, savedResume, email);
    context.missingFields = listed.missing || [];
    return { ok: true, ...listed };
  }

  if (name === "get_public_url") {
    const path = publicProfilePath(email);
    context.publicUrl = path;
    return { ok: Boolean(path), path, hint: path ? "Prefix with the site origin in the browser." : "Email missing." };
  }

  if (name === "save_portfolio" || name === "save_resume") {
    return saveDraftToAccount(context);
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

async function pauseForWrite(res, context, tool, args) {
  const recipe = context.recipe || getRecipe("profile");
  const name = recipe.writeTools.has(tool) ? tool : recipe.defaultWriteTool;
  await safeUpdateRun(context.runId, { status: "awaiting_confirmation" });
  await safeStep(context.runId, {
    tool: name,
    status: "pending",
    arguments: args || {},
    result: { needsConfirmation: true },
  });
  writeEvent(res, {
    type: "confirm",
    tool: name,
    arguments: {
      ...(args || {}),
      ...(context.brief ? { brief: context.brief } : {}),
    },
    draft: context.draft || null,
    brief: context.brief || null,
    runId: context.runId,
    message: recipe.confirmMessage,
  });
}

function shouldPauseForSave(context) {
  if (context?.recipe?.type === "automation") return shouldPauseForInquiry(context);
  if (!context?.draft) return false;
  if (context.savedPortfolio || context.savedResumeRecord) return false;
  const missing = context.missingFields;
  if (Array.isArray(missing) && missing.length > 0) return false;
  return true;
}

function finishPayload(context, message) {
  if (context.recipe?.type === "automation") {
    return {
      type: "done",
      message,
      publicUrl: "",
      bookingUrl: context.bookingUrl || "",
      submitted: Boolean(context.submittedInquiry),
      runId: context.runId,
    };
  }
  const saved = Boolean(context.savedPortfolio || context.savedResumeRecord);
  const path = saved ? context.publicUrl || publicProfilePath(context.account?.email) : "";
  return {
    type: "done",
    message,
    publicUrl: path || "",
    runId: context.runId,
  };
}

async function runLoop(res, context, messages, remaining) {
  const recipe = context.recipe || getRecipe("profile");
  for (let i = 0; i < remaining; i += 1) {
    const action = await decideNextAction(messages, recipe);
    if (action.kind === "done") {
      if (shouldPauseForSave(context)) {
        await pauseForWrite(res, context, recipe.defaultWriteTool, {});
        return;
      }
      const event = finishPayload(context, action.message);
      await safeUpdateRun(context.runId, { status: "completed", public_url: event.publicUrl || null });
      writeEvent(res, event);
      return;
    }

    const name = String(action.name || "").trim();
    if (!name) {
      writeEvent(res, { type: "error", message: "The agent did not choose a tool." });
      await safeUpdateRun(context.runId, { status: "failed" });
      return;
    }

    if (recipe.writeTools.has(name)) {
      if (recipe.type === "automation") {
        const gate = guardAutomationWrite(context);
        if (gate.scope !== "in_scope") {
          const event = finishPayload(context, gate.message || context.blockMessage);
          await safeUpdateRun(context.runId, { status: "completed", public_url: null });
          writeEvent(res, event);
          return;
        }
        if (!context.brief) {
          writeEvent(res, {
            type: "step",
            step: {
              tool: name,
              status: "error",
              result: { error: "Draft an in-scope brief before submit_inquiry." },
            },
          });
          messages.push({
            role: "user",
            content: "submit_inquiry was blocked. Call extract_requirements, propose_pipeline, and draft_brief first. Do not submit yet.",
          });
          continue;
        }
      }
      await pauseForWrite(res, context, name, action.arguments || {});
      return;
    }

    writeEvent(res, { type: "step", step: { tool: name, status: "running" } });
    const result = await executeTool(name, context);
    await safeStep(context.runId, {
      tool: name,
      status: result.stopRun ? "ok" : result.ok ? "ok" : "error",
      arguments: action.arguments || {},
      result: name === "generate_profile" ? { ok: result.ok, summary: result.summary } : result,
    });
    writeEvent(res, {
      type: "step",
      step: {
        tool: name,
        status: result.stopRun ? "ok" : result.ok ? "ok" : "error",
        result: name === "generate_profile" ? { summary: result.summary } : result,
      },
      draft: context.draft || undefined,
      brief: context.brief || undefined,
    });

    if (result.stopRun) {
      const event = finishPayload(context, result.message || context.blockMessage);
      await safeUpdateRun(context.runId, { status: "completed", public_url: event.publicUrl || null });
      writeEvent(res, event);
      return;
    }

    messages.push({
      role: "assistant",
      content: action.assistantMessage || `Calling ${name}.`,
    });
    messages.push({
      role: "user",
      content: `Tool ${name} result: ${toolResultForModel(name, result)}`,
    });
  }

  if (shouldPauseForSave(context)) {
    await pauseForWrite(res, context, recipe.defaultWriteTool, {});
    return;
  }

  const event = finishPayload(
    context,
    "Reached the tool-call limit. Review the steps and run again if needed."
  );
  await safeUpdateRun(context.runId, {
    status: "completed",
    public_url: event.publicUrl || null,
  });
  writeEvent(res, event);
}

function buildMessages({ recipe, goal, resumeText, workflowText, extra }) {
  const parts =
    recipe.type === "automation"
      ? [
          `Goal: ${String(goal || recipe.defaultGoal).trim()}`,
          String(workflowText || "").trim()
            ? `Workflow to automate:\n${String(workflowText).trim().slice(0, MAX_WORKFLOW)}`
            : "No workflow description was provided. Ask the user to describe what should run itself.",
        ]
      : [
          `Goal: ${String(goal || recipe.defaultGoal).trim()}`,
          String(resumeText || "").trim()
            ? `Resume text:\n${String(resumeText).trim().slice(0, MAX_RESUME)}`
            : "No resume text was provided. Use get_resume or ask the user to paste a resume.",
        ];
  if (extra) parts.push(extra);
  return [
    { role: "system", content: recipe.systemPrompt },
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
  const recipe = getRecipe(inferAgentType(body));
  const goal = String(body.goal || recipe.defaultGoal).trim();
  const resumeText = String(body.resumeText || "").trim().slice(0, MAX_RESUME);
  const workflowText = String(body.workflowText || body.resumeText || "").trim().slice(0, MAX_WORKFLOW);

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const context = {
    token,
    account,
    recipe,
    resumeText,
    workflowText,
    goal,
    draft: body.draft || null,
    brief: body.brief || null,
    savedResume: null,
    runId: null,
    publicUrl: "",
    submittedInquiry: false,
    bookingUrl: "",
  };

  try {
    if (recipe.type === "automation" && !context.accountInfo) {
      try {
        context.accountInfo = await loadAccountInfo(token, account.email);
      } catch {
        context.accountInfo = { email: account.email };
      }
    }

    if (body.deny && body.runId) {
      const run = await getAgentRun(account, body.runId).catch(() => null);
      context.runId = run?.id || body.runId;
      await safeUpdateRun(context.runId, { status: "denied" });
      await safeStep(context.runId, {
        tool: String(body.tool || recipe.defaultWriteTool),
        status: "denied",
        result: { denied: true },
      });
      writeEvent(res, {
        type: "done",
        message: recipe.denyMessage,
        publicUrl: "",
        runId: context.runId,
      });
      res.end();
      return;
    }

    if (body.confirm?.tool && recipe.writeTools.has(body.confirm.tool)) {
      let run = null;
      if (body.runId) {
        run = await getAgentRun(account, body.runId).catch(() => null);
      }
      if (!run) {
        run = await createAgentRun(account, goal).catch(() => null);
      }
      context.runId = run?.id || null;
      writeEvent(res, { type: "run", runId: context.runId });

      if (recipe.type === "automation") {
        context.brief = body.brief || body.confirm?.arguments?.brief || context.brief;
        if (!context.brief && context.runId) {
          const steps = await listAgentSteps(context.runId).catch(() => []);
          const last = [...steps].reverse().find((step) => step.tool === "draft_brief" && step.result?.brief);
          if (last?.result?.brief) context.brief = last.result.brief;
        }
      }

      if (body.alreadySaved && recipe.type === "profile") {
        context.savedPortfolio = true;
        context.savedResumeRecord = true;
        context.publicUrl = context.publicUrl || publicProfilePath(account.email);
        await safeStep(context.runId, {
          tool: body.confirm.tool,
          status: "ok",
          result: { ok: true, saved: "portfolio and resume", via: "browser" },
        });
        writeEvent(res, {
          type: "step",
          step: {
            tool: body.confirm.tool,
            status: "ok",
            result: { saved: "portfolio and resume" },
          },
          draft: context.draft || undefined,
        });
        const messages = buildMessages({
          recipe,
          goal,
          resumeText,
          workflowText,
          extra: `The user allowed the write. Both the portfolio and resume are already saved on this account. Call get_public_url and finish. Do not call save_portfolio or save_resume again.`,
        });
        await runLoop(res, context, messages, MAX_STEPS);
        res.end();
        return;
      }

      if (body.alreadySaved && recipe.type === "automation") {
        context.submittedInquiry = true;
        context.bookingUrl = String(body.bookingUrl || "");
        await safeStep(context.runId, {
          tool: body.confirm.tool,
          status: "ok",
          result: { ok: true, submitted: true, via: "browser" },
        });
        writeEvent(res, {
          type: "step",
          step: {
            tool: body.confirm.tool,
            status: "ok",
            result: { submitted: true },
          },
          brief: context.brief || undefined,
        });
        const messages = buildMessages({
          recipe,
          goal,
          resumeText,
          workflowText,
          extra: `The user allowed the write. The inquiry is already submitted through the live lead pipeline. Return done with a short confirmation. Do not call submit_inquiry again.`,
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
        brief: context.brief || undefined,
      });

      if (!result.ok) {
        await safeUpdateRun(context.runId, { status: "failed" });
        writeEvent(res, {
          type: "error",
          message: result.error || (recipe.type === "automation" ? "Unable to send that inquiry." : "Save failed."),
          clientFallback: Boolean(result.clientFallback),
          tool: body.confirm.tool,
        });
        res.end();
        return;
      }

      const followUp =
        recipe.type === "automation"
          ? `The user allowed the write. Result: ${toolResultForModel(body.confirm.tool, result)}. The inquiry is submitted. Return done with a short confirmation. Do not call submit_inquiry again.`
          : `The user allowed the write. Result: ${toolResultForModel(body.confirm.tool, result)}. Both portfolio and resume are saved. Call get_public_url and finish. Do not save again.`;
      const messages = buildMessages({
        recipe,
        goal,
        resumeText,
        workflowText,
        extra: followUp,
      });
      await runLoop(res, context, messages, MAX_STEPS);
      res.end();
      return;
    }

    if (recipe.type === "profile" && !resumeText && !context.draft) {
      writeEvent(res, {
        type: "error",
        message: recipe.emptyInputMessage,
      });
      res.end();
      return;
    }

    if (recipe.type === "automation" && !workflowText) {
      writeEvent(res, {
        type: "error",
        message: recipe.emptyInputMessage,
      });
      res.end();
      return;
    }

    if (recipe.type === "automation") {
      const gate = guardAutomationWrite(context);
      if (gate.scope !== "in_scope") {
        const run = await createAgentRun(account, goal).catch(() => null);
        context.runId = run?.id || null;
        writeEvent(res, { type: "run", runId: context.runId });
        writeEvent(res, {
          type: "step",
          step: {
            tool: "extract_requirements",
            status: "ok",
            result: { scope: gate.scope, message: gate.message || context.blockMessage },
          },
        });
        const event = finishPayload(context, gate.message || context.blockMessage);
        await safeUpdateRun(context.runId, { status: "completed", public_url: null });
        writeEvent(res, event);
        res.end();
        return;
      }
    }

    const run = await createAgentRun(account, goal).catch((error) => {
      console.warn(`agent: create run failed — ${error?.message || error}`);
      return null;
    });
    context.runId = run?.id || null;
    writeEvent(res, { type: "run", runId: context.runId });

    const messages = buildMessages({ recipe, goal, resumeText, workflowText });
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
