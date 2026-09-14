import { useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  confirmAgentTool,
  denyAgentTool,
  runProfileAgent,
  type AgentConfirm,
  type AgentEvent,
  type AgentStep,
  type AgentType,
  type AutomationBrief,
} from "services/agent.service";
import type { GeneratedProfile } from "models/aiProfile";
import {
  AI_FREE_TIER_PERFORMANCE,
  AI_FREE_TIER_TRADEOFFS,
} from "content/aiFreeTier";
import {
  parseResumeFile,
  resumeAcceptAttribute,
} from "utils/parseResumeFile";
import { resumeParserErrorMessage } from "utils/friendlyAiError";
import { getProfile } from "slices/user";
import { useDispatch } from "store";
import { publishGeneratedProfile } from "utils/publishGeneratedProfile";
import {
  accentRedContainedButtonSx,
  agenticPageSx,
  onboardingPageSx,
} from "styles/main_style";
import { DASHBOARD_PATH } from "utils/navigation";
import { getBookingHref, HAS_BOOKING_PAGE } from "content/showcase";

const PROFILE_GOAL = "Build my public portfolio and resume from this resume, then give me the live URL.";
const AUTOMATION_GOAL = "Plan an automation for this workflow, then submit an inquiry after I Allow.";

function toolLabel(tool: string) {
  switch (tool) {
    case "generate_profile":
      return "Draft profile";
    case "get_profile":
      return "Read saved portfolio";
    case "get_resume":
      return "Read saved resume";
    case "list_missing_fields":
      return "Check missing fields";
    case "save_portfolio":
      return "Save portfolio";
    case "save_resume":
      return "Save resume";
    case "get_public_url":
      return "Public URL";
    case "extract_requirements":
      return "Extract requirements";
    case "propose_pipeline":
      return "Propose pipeline";
    case "draft_brief":
      return "Draft inquiry";
    case "submit_inquiry":
      return "Submit inquiry";
    default:
      return tool;
  }
}

function stepDetail(step: AgentStep) {
  const result = step.result as
    | {
        summary?: { name?: string; skills?: string[] } | string;
        missing?: string[];
        path?: string;
        error?: string;
        saved?: string;
        need?: string;
        timeline?: string;
        services?: string[] | string;
        submitted?: boolean;
        brief?: AutomationBrief;
        requirements?: { need?: string; timeline?: string; summary?: string };
        scope?: string;
        message?: string;
        stopRun?: boolean;
      }
    | undefined;
  if (result?.error) return result.error;
  if (result?.stopRun || (result?.scope && result.scope !== "in_scope")) {
    return result.message || "Out of scope for this feature.";
  }
  if (result?.brief?.need) {
    return `${result.brief.need}${result.brief.timeline ? ` · ${result.brief.timeline}` : ""}`;
  }
  if (result?.requirements?.need) {
    return `${result.requirements.need}${result.requirements.timeline ? ` · ${result.requirements.timeline}` : ""}`;
  }
  const services = result?.services;
  if (Array.isArray(services) && services.length) {
    return services.slice(0, 4).join(", ");
  }
  if (typeof services === "string" && services) return services;
  if (result?.submitted) return "Sent through the live inquiry pipeline";
  if (result?.summary && typeof result.summary === "object" && result.summary.name) {
    const skills = result.summary.skills?.slice(0, 4).join(", ");
    return skills ? `${result.summary.name} · ${skills}` : result.summary.name;
  }
  const missing = result?.missing;
  if (Array.isArray(missing)) {
    return missing.length ? `Missing: ${missing.join(", ")}` : "Ready to save";
  }
  if (result?.path) return result.path;
  if (result?.saved) return `Saved ${result.saved}`;
  if (step.status === "running") return "Working…";
  if (step.status === "pending") return "Waiting for Allow";
  return String(step.status);
}

export default function AgentPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pageTopRef = useRef<HTMLDivElement | null>(null);
  const publishedBothRef = useRef(false);
  const [savedToAccount, setSavedToAccount] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [agentType, setAgentType] = useState<AgentType>("profile");
  const [goal, setGoal] = useState(PROFILE_GOAL);
  const [resumeText, setResumeText] = useState("");
  const [workflowText, setWorkflowText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const [draft, setDraft] = useState<GeneratedProfile | null>(null);
  const draftRef = useRef<GeneratedProfile | null>(null);
  draftRef.current = draft;
  const [brief, setBrief] = useState<AutomationBrief | null>(null);
  const briefRef = useRef<AutomationBrief | null>(null);
  briefRef.current = brief;
  const [confirm, setConfirm] = useState<AgentConfirm | null>(null);

  const isAutomation = agentType === "automation";
  const canRun =
    (isAutomation ? workflowText.trim().length >= 24 : resumeText.trim().length > 0) && !isRunning;

  const selectRecipe = (next: AgentType) => {
    if (next === agentType || isRunning) return;
    setAgentType(next);
    setGoal(next === "automation" ? AUTOMATION_GOAL : PROFILE_GOAL);
    setError(null);
    setStatusMessage("");
    setPublicUrl("");
    setSteps([]);
    setConfirm(null);
    setInquirySent(false);
    setSavedToAccount(false);
  };

  useEffect(() => {
    const openFromChat = () => window.scrollTo({ top: 0, behavior: "smooth" });
    window.addEventListener("dmb:open-agent", openFromChat);
    return () => window.removeEventListener("dmb:open-agent", openFromChat);
  }, []);

  const handleResumeFile = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    setIsParsingFile(true);
    try {
      const parsed = await parseResumeFile(file);
      setResumeText(parsed.text);
      setUploadedFileName(parsed.fileName);
    } catch (err: unknown) {
      setUploadedFileName(null);
      setError(err instanceof Error ? err.message : "Unable to read that resume file.");
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const applyEvent = (event: AgentEvent) => {
    if (event.type === "run") {
      setRunId(event.runId ?? null);
      return;
    }
    if (event.type === "step") {
      setSteps((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.tool === event.step.tool && last.status === "running") {
          return [...prev.slice(0, -1), event.step];
        }
        return [...prev, event.step];
      });
      if (event.draft) {
        draftRef.current = event.draft;
        setDraft(event.draft);
      }
      if (event.brief) {
        briefRef.current = event.brief;
        setBrief(event.brief);
      }
      if (event.step.tool === "submit_inquiry" && event.step.status === "ok") {
        setInquirySent(true);
      }
      return;
    }
    if (event.type === "confirm") {
      if (event.draft) {
        draftRef.current = event.draft;
        setDraft(event.draft);
      }
      if (event.brief) {
        briefRef.current = event.brief;
        setBrief(event.brief);
      }
      if (
        publishedBothRef.current &&
        (event.tool === "save_portfolio" || event.tool === "save_resume")
      ) {
        void confirmAgentTool(
          {
            runId: event.runId ?? runId,
            tool: event.tool,
            arguments: event.arguments,
            goal,
            resumeText,
            workflowText,
            draft: event.draft || draftRef.current,
            brief: event.brief || briefRef.current,
            alreadySaved: true,
            agentType,
          },
          applyEvent
        );
        return;
      }
      setConfirm({
        tool: event.tool,
        arguments: event.arguments,
        message: event.message,
        draft: event.draft,
        brief: event.brief || briefRef.current,
        runId: event.runId,
      });
      setSteps((prev) => [...prev, { tool: event.tool, status: "pending" }]);
      return;
    }
    if (event.type === "done") {
      if (event.runId) setRunId(event.runId);
      const liveDraft = draftRef.current;
      const askedToAllow = /click ["']?allow/i.test(event.message || "");
      if (askedToAllow && isAutomation && briefRef.current && !inquirySent) {
        setConfirm({
          tool: "submit_inquiry",
          arguments: { brief: briefRef.current },
          message: "Allow sending this plan as an inquiry? This does not build or run the automation.",
          brief: briefRef.current,
          runId: event.runId ?? runId,
        });
        setSteps((prev) => {
          const last = prev[prev.length - 1];
          if (last?.tool === "submit_inquiry" && last.status === "pending") return prev;
          return [...prev, { tool: "submit_inquiry", status: "pending" }];
        });
        return;
      }
      if (askedToAllow && liveDraft && !publishedBothRef.current) {
        setConfirm({
          tool: "save_portfolio",
          arguments: {},
          message: "Allow saving this draft to your portfolio and resume pages?",
          draft: liveDraft,
          runId: event.runId ?? runId,
        });
        setSteps((prev) => {
          const last = prev[prev.length - 1];
          if (last?.tool === "save_portfolio" && last.status === "pending") return prev;
          return [...prev, { tool: "save_portfolio", status: "pending" }];
        });
        setStatusMessage(askedToAllow ? "" : event.message);
        return;
      }
      setStatusMessage(event.message);
      if (event.publicUrl) setPublicUrl(event.publicUrl);
      if (event.submitted) setInquirySent(true);
      setConfirm(null);
      return;
    }
    if (event.type === "error") {
      setError(event.message);
      setConfirm(null);
    }
  };

  const scrollAgentToTop = () => {
    const main = pageTopRef.current?.closest("main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRun = async () => {
    if (!canRun) {
      setError(isAutomation ? "Describe the workflow you want automated first." : "Upload or paste a resume first.");
      return;
    }
    scrollAgentToTop();
    setError(null);
    setStatusMessage("");
    setPublicUrl("");
    setSteps([]);
    setConfirm(null);
    publishedBothRef.current = false;
    setSavedToAccount(false);
    setInquirySent(false);
    setIsRunning(true);
    try {
      await runProfileAgent(
        {
          goal,
          resumeText,
          workflowText,
          draft,
          brief,
          agentType,
        },
        applyEvent
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? resumeParserErrorMessage(err.message) : "Unable to run the agent.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAllow = async () => {
    if (!confirm) return;
    setIsRunning(true);
    setError(null);
    const pending = confirm;
    const liveDraft = pending.draft || draft;
    setConfirm(null);
    const saveFailedRef = { current: null as { tool: string; clientFallback?: boolean } | null };

    const track = (event: AgentEvent) => {
      applyEvent(event);
      if (event.type === "error") {
        saveFailedRef.current = { tool: event.tool || pending.tool, clientFallback: event.clientFallback };
      }
      if (event.type === "step" && event.step.status === "error" && event.step.tool.startsWith("save_")) {
        saveFailedRef.current = { tool: event.step.tool, clientFallback: true };
      }
    };

    try {
      if (liveDraft && (pending.tool === "save_portfolio" || pending.tool === "save_resume")) {
        await publishGeneratedProfile(liveDraft);
        publishedBothRef.current = true;
        setSavedToAccount(true);
        await dispatch(getProfile() as any);
        setError(null);
        setConfirm(null);
        setSteps((prev) =>
          prev.map((step) =>
            step.status === "pending" && (step.tool === "save_portfolio" || step.tool === "save_resume")
              ? { ...step, status: "ok", result: { saved: "portfolio and resume" } }
              : step
          )
        );
        setStatusMessage("Saved to your portfolio and resume.");
        try {
          await confirmAgentTool(
            {
              runId: pending.runId ?? runId,
              tool: pending.tool,
              arguments: pending.arguments,
              goal,
              resumeText,
              workflowText,
              draft: liveDraft,
              brief: pending.brief || briefRef.current,
              alreadySaved: true,
              agentType,
            },
            (event) => {
              if (event.type === "error") return;
              applyEvent(event);
            }
          );
        } catch {
          // Browser save already succeeded; Groq follow-up is optional.
        }
        return;
      }

      await confirmAgentTool(
        {
          runId: pending.runId ?? runId,
          tool: pending.tool,
          arguments: pending.arguments,
          goal,
          resumeText,
          workflowText,
          draft: liveDraft,
          brief: pending.brief || briefRef.current,
          agentType,
        },
        track
      );

      if (saveFailedRef.current && liveDraft) {
        const tool = saveFailedRef.current.tool || pending.tool;
        await publishGeneratedProfile(liveDraft);
        publishedBothRef.current = true;
        setSavedToAccount(true);
        await dispatch(getProfile() as any);
        setError(null);
        saveFailedRef.current = null;
        await confirmAgentTool(
          {
            runId: pending.runId ?? runId,
            tool,
            arguments: pending.arguments,
            goal,
            resumeText,
            workflowText,
            draft: liveDraft,
            brief: pending.brief || briefRef.current,
            alreadySaved: true,
            agentType,
          },
          applyEvent
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save.");
      setConfirm(pending);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeny = async () => {
    if (!confirm) return;
    setIsRunning(true);
    const pending = confirm;
    setConfirm(null);
    try {
      await denyAgentTool(
        { runId: pending.runId ?? runId, tool: pending.tool, goal, agentType },
        applyEvent
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to cancel.");
    } finally {
      setIsRunning(false);
    }
  };

  const liveHref = publicUrl
    ? publicUrl.startsWith("http")
      ? publicUrl
      : `${window.location.origin}${publicUrl}`
    : "";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Box ref={pageTopRef} sx={agenticPageSx.panelBody}>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <AutoAwesomeIcon sx={{ color: "#475569" }} />
              <Typography sx={onboardingPageSx.kicker}>Agentic AI</Typography>
            </Stack>
            <Typography component="h1" sx={onboardingPageSx.title}>
              A tool-using agent, not a chatbot
            </Typography>
            <Typography sx={onboardingPageSx.subtitle}>
              Pick a process. The agent calls tools in order and waits for Allow before it writes anything.{" "}
              {AI_FREE_TIER_PERFORMANCE}
            </Typography>
          </Box>

          <Box sx={agenticPageSx.recipeRow}>
            <Button
              variant={isAutomation ? "outlined" : "contained"}
              disableElevation
              disabled={isRunning}
              onClick={() => selectRecipe("profile")}
              sx={isAutomation ? agenticPageSx.recipeButton : [agenticPageSx.recipeButton, agenticPageSx.recipeButtonActive]}
            >
              Build public profile
            </Button>
            <Button
              variant={isAutomation ? "contained" : "outlined"}
              disableElevation
              disabled={isRunning}
              onClick={() => selectRecipe("automation")}
              sx={isAutomation ? [agenticPageSx.recipeButton, agenticPageSx.recipeButtonActive] : agenticPageSx.recipeButton}
            >
              Plan an automation
            </Button>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {!error ? (
            <Alert severity="info">
              {AI_FREE_TIER_TRADEOFFS} Writes never run until you click Allow.
            </Alert>
          ) : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "stretch" }}>
            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              {isAutomation ? (
                <>
                  <Alert severity="warning">
                    This does not build or run an automation. It only maps your text onto capture, store, notify,
                    follow up, and booking — then waits for Allow before filing an inquiry. Nothing is emailed,
                    posted to Slack, or created in n8n from this run.
                  </Alert>
                  <Typography sx={onboardingPageSx.uploadHint}>
                    You can describe: a form or chat that captures a lead, storing it in a CRM or database, a Slack
                    or email ping, a follow-up sequence, and a booking link. Anything else is out of scope.
                  </Typography>
                  <TextField
                    label="What should run itself? (plan only)"
                    placeholder="Example: After someone fills our quote form, store the lead, ping Slack, send a confirmation email, then offer a booking link."
                    value={workflowText}
                    onChange={(event) => setWorkflowText(event.target.value)}
                    multiline
                    minRows={10}
                    fullWidth
                    helperText="Must be a sales/ops pipeline I actually build. Trading bots, scraping, or “just make it happen” will be refused."
                  />
                  <TextField label="Goal" value={goal} fullWidth disabled />
                </>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={resumeAcceptAttribute()}
                    hidden
                    onChange={(event) => void handleResumeFile(event.target.files?.[0])}
                  />
                  <Box
                    role="button"
                    tabIndex={0}
                    aria-label="Upload resume PDF or Word file"
                    onClick={() => !isParsingFile && fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!isParsingFile) fileInputRef.current?.click();
                      }
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setIsDragActive(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setIsDragActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setIsDragActive(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setIsDragActive(false);
                      void handleResumeFile(event.dataTransfer.files[0]);
                    }}
                    sx={[
                      onboardingPageSx.uploadZone,
                      isDragActive ? onboardingPageSx.uploadZoneActive : null,
                      isParsingFile ? { opacity: 0.75, pointerEvents: "none" } : null,
                    ]}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      {isParsingFile ? (
                        <CircularProgress size={28} />
                      ) : uploadedFileName ? (
                        <DescriptionOutlinedIcon sx={{ color: "#b91c1c", fontSize: 28 }} />
                      ) : (
                        <CloudUploadOutlinedIcon sx={{ color: "#64748b", fontSize: 28 }} />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={onboardingPageSx.uploadTitle}>
                          {isParsingFile ? "Reading your resume..." : uploadedFileName || "Upload PDF or Word resume"}
                        </Typography>
                        <Typography sx={onboardingPageSx.uploadHint}>
                          Drag and drop, or click to browse (.pdf, .docx · max 8 MB)
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <TextField
                    label="Resume text"
                    value={resumeText}
                    onChange={(event) => setResumeText(event.target.value)}
                    multiline
                    minRows={8}
                    fullWidth
                  />
                  <TextField
                    label="Goal"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    fullWidth
                  />
                </>
              )}
              <Button
                variant="contained"
                disabled={!canRun}
                onClick={() => void handleRun()}
                sx={[onboardingPageSx.primaryButton, accentRedContainedButtonSx]}
              >
                {isRunning && !confirm ? "Agent running…" : "Run agent"}
              </Button>
              <Typography sx={onboardingPageSx.uploadHint}>
                {isAutomation ? (
                  "Allow only sends an inquiry. It does not create the automation."
                ) : (
                  <>
                    Prefer the old wizard?{" "}
                    <Link component={RouterLink} to="/accent-sidebar/onboarding">
                      AI Profile Builder
                    </Link>
                  </>
                )}
              </Typography>
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={onboardingPageSx.kicker}>Run log</Typography>
              <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                {steps.length === 0 ? (
                  <Typography sx={onboardingPageSx.subtitle}>
                    {isAutomation
                      ? "In-scope runs show extract → pipeline → brief, then Allow to file an inquiry. Out-of-scope text stops there."
                      : "Steps appear here as the agent calls tools."}
                  </Typography>
                ) : (
                  steps.map((step, index) => (
                    <Box key={`${step.tool}-${index}`} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {index + 1}. {toolLabel(step.tool)}
                      </Typography>
                      <Typography sx={{ color: "#64748b", fontSize: 13 }}>{stepDetail(step)}</Typography>
                    </Box>
                  ))
                )}
              </Stack>

              {confirm ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {confirm.message || "Allow this write?"}
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={isRunning}
                      onClick={() => void handleAllow()}
                      sx={accentRedContainedButtonSx}
                    >
                      Allow
                    </Button>
                    <Button variant="outlined" size="small" disabled={isRunning} onClick={() => void handleDeny()}>
                      Deny
                    </Button>
                  </Stack>
                </Alert>
              ) : null}

              {confirm?.brief?.need ? (
                <Typography sx={{ mt: 1.5, color: "#64748b", fontSize: 13 }}>
                  Brief: {confirm.brief.need}
                  {confirm.brief.timeline ? ` · ${confirm.brief.timeline}` : ""}
                  {confirm.brief.company ? ` · ${confirm.brief.company}` : ""}
                </Typography>
              ) : null}

              {statusMessage && !confirm ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {statusMessage}
                </Alert>
              ) : null}

              {inquirySent && !confirm ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                  <Button
                    component="a"
                    href={getBookingHref()}
                    target={HAS_BOOKING_PAGE ? "_blank" : undefined}
                    rel={HAS_BOOKING_PAGE ? "noopener noreferrer" : undefined}
                    variant="contained"
                    sx={accentRedContainedButtonSx}
                  >
                    {HAS_BOOKING_PAGE ? "Book a 30-minute call" : "Email to book a time"}
                  </Button>
                </Stack>
              ) : null}

              {!isAutomation && (savedToAccount || (liveHref && !confirm)) ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                  <Button component={RouterLink} to={DASHBOARD_PATH} variant="contained" sx={accentRedContainedButtonSx}>
                    Open portfolio
                  </Button>
                  <Button component={RouterLink} to="/accent-sidebar/resume" variant="outlined">
                    Open resume
                  </Button>
                  {liveHref ? (
                    <Button component="a" href={liveHref} target="_blank" rel="noopener noreferrer">
                      Open live profile
                    </Button>
                  ) : null}
                </Stack>
              ) : null}

              {!isAutomation && draft?.skills?.length ? (
                <Typography sx={{ mt: 2, color: "#64748b", fontSize: 13 }}>
                  Draft skills: {draft.skills.slice(0, 8).join(", ")}
                </Typography>
              ) : null}

              {isAutomation && (brief?.message || confirm?.brief?.message) ? (
                <Typography sx={{ mt: 2, color: "#64748b", fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {(confirm?.brief?.message || brief?.message || "").slice(0, 600)}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
