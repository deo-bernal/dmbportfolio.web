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
  loadLatestAgentSession,
  runProfileAgent,
  type AgentConfirm,
  type AgentEvent,
  type AgentStep,
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
import { publishGeneratedPortfolio, publishGeneratedResume } from "utils/publishGeneratedProfile";
import {
  accentRedContainedButtonSx,
  agenticPageSx,
  onboardingPageSx,
} from "styles/main_style";

const DEFAULT_GOAL = "Build my public portfolio and resume from this resume, then give me the live URL.";

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
    default:
      return tool;
  }
}

function stepDetail(step: AgentStep) {
  const result = step.result as
    | { summary?: { name?: string; skills?: string[] }; missing?: string[]; path?: string; error?: string; saved?: string }
    | undefined;
  if (result?.error) return result.error;
  if (result?.summary?.name) {
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [resumeText, setResumeText] = useState("");
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
  const [confirm, setConfirm] = useState<AgentConfirm | null>(null);

  const canRun = resumeText.trim().length > 0 && !isRunning;

  useEffect(() => {
    let cancelled = false;
    void loadLatestAgentSession().then((session) => {
      if (cancelled || !session.run) return;
      setRunId(session.run.id);
      if (session.run.goal) setGoal(session.run.goal);
      if (session.run.public_url) setPublicUrl(session.run.public_url);
      setSteps(
        (session.steps || []).map((step) => ({
          tool: step.tool,
          status: step.status,
          result: step.result,
          arguments: step.arguments,
        }))
      );
      if (session.run.status === "completed") {
        setStatusMessage("Last saved run. Upload a resume and run again to start a new one.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (event.draft) setDraft(event.draft);
      return;
    }
    if (event.type === "confirm") {
      setConfirm({
        tool: event.tool,
        arguments: event.arguments,
        message: event.message,
        draft: event.draft,
        runId: event.runId,
      });
      if (event.draft) setDraft(event.draft);
      setSteps((prev) => [...prev, { tool: event.tool, status: "pending" }]);
      return;
    }
    if (event.type === "done") {
      setStatusMessage(event.message);
      if (event.publicUrl) setPublicUrl(event.publicUrl);
      if (event.runId) setRunId(event.runId);
      setConfirm(null);
      return;
    }
    if (event.type === "error") {
      setError(event.message);
      setConfirm(null);
    }
  };

  const handleRun = async () => {
    if (!canRun) {
      setError("Upload or paste a resume first.");
      return;
    }
    setError(null);
    setStatusMessage("");
    setPublicUrl("");
    setSteps([]);
    setConfirm(null);
    setIsRunning(true);
    try {
      await runProfileAgent({ goal, resumeText, draft }, applyEvent);
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
      await confirmAgentTool(
        {
          runId: pending.runId ?? runId,
          tool: pending.tool,
          arguments: pending.arguments,
          goal,
          resumeText,
          draft: liveDraft,
        },
        track
      );

      if (saveFailedRef.current && liveDraft) {
        const tool = saveFailedRef.current.tool || pending.tool;
        if (tool === "save_resume") {
          await publishGeneratedResume(liveDraft);
        } else if (tool === "save_portfolio") {
          await publishGeneratedPortfolio(liveDraft);
        }
        setError(null);
        saveFailedRef.current = null;
        await confirmAgentTool(
          {
            runId: pending.runId ?? runId,
            tool,
            arguments: pending.arguments,
            goal,
            resumeText,
            draft: liveDraft,
            alreadySaved: true,
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
      await denyAgentTool({ runId: pending.runId ?? runId, tool: pending.tool, goal }, applyEvent);
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
      <Box sx={agenticPageSx.panelBody}>
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
              Paste or upload a resume. The agent drafts a portfolio, checks missing fields, and waits for Allow
              before it writes anything. {AI_FREE_TIER_PERFORMANCE}
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {!error ? (
            <Alert severity="info">
              {AI_FREE_TIER_TRADEOFFS} Writes never run until you click Allow.
            </Alert>
          ) : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "stretch" }}>
            <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
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
              <Button
                variant="contained"
                disabled={!canRun}
                onClick={() => void handleRun()}
                sx={[onboardingPageSx.primaryButton, accentRedContainedButtonSx]}
              >
                {isRunning && !confirm ? "Agent running…" : "Run agent"}
              </Button>
              <Typography sx={onboardingPageSx.uploadHint}>
                Prefer the old wizard?{" "}
                <Link component={RouterLink} to="/accent-sidebar/onboarding">
                  AI Profile Builder
                </Link>
              </Typography>
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={onboardingPageSx.kicker}>Run log</Typography>
              <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                {steps.length === 0 ? (
                  <Typography sx={onboardingPageSx.subtitle}>Steps appear here as the agent calls tools.</Typography>
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
                <Alert
                  severity="warning"
                  sx={{ mt: 2 }}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button color="inherit" size="small" disabled={isRunning} onClick={() => void handleDeny()}>
                        Deny
                      </Button>
                      <Button color="inherit" size="small" disabled={isRunning} onClick={() => void handleAllow()}>
                        Allow
                      </Button>
                    </Stack>
                  }
                >
                  {confirm.message || "Allow this write?"}
                </Alert>
              ) : null}

              {statusMessage ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {statusMessage}
                </Alert>
              ) : null}

              {liveHref ? (
                <Button component="a" href={liveHref} target="_blank" rel="noopener noreferrer" sx={{ mt: 2 }}>
                  Open live profile
                </Button>
              ) : null}

              {draft?.skills?.length ? (
                <Typography sx={{ mt: 2, color: "#64748b", fontSize: 13 }}>
                  Draft skills: {draft.skills.slice(0, 8).join(", ")}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
