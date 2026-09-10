import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { DEO_PORTFOLIO, DEO_PUBLIC_USERNAME } from "content/deoPortfolio";
import { runPublicAgentDemo, type AgentStep } from "services/agent.service";
import { getAgentLoginPath } from "utils/navigation";
import { accentRedContainedButtonSx, showcaseSx } from "styles/main_style";

type DemoStep = {
  tool: string;
  label: string;
  detail: string;
  confirm?: boolean;
};

const CANNED_STEPS: DemoStep[] = [
  {
    tool: "parse_resume",
    label: "Read resume",
    detail: "Extracted public sample text for Deo Bernal (PDF stays in the browser on a real run).",
  },
  {
    tool: "generate_profile",
    label: "Draft profile",
    detail: `${DEO_PORTFOLIO.skills.slice(0, 5).join(", ")} · ${DEO_PORTFOLIO.projectCategories.reduce((count, category) => count + category.items.length, 0)} projects`,
  },
  {
    tool: "list_missing_fields",
    label: "Check missing fields",
    detail: "Required fields present. Video is optional and left blank.",
  },
  {
    tool: "save_portfolio",
    label: "Save portfolio",
    detail: "Write paused until you Allow — this is the human-in-the-loop step.",
    confirm: true,
  },
];

function toolTitle(tool: string) {
  if (tool === "generate_profile") return "Draft profile";
  if (tool === "list_missing_fields") return "Check missing fields";
  if (tool === "save_portfolio") return "Save portfolio";
  if (tool === "save_resume") return "Save resume";
  if (tool === "get_public_url") return "Public URL";
  return tool.split("_").join(" ");
}

function stepLine(step: AgentStep) {
  const result = step.result as { summary?: { name?: string; skills?: string[] }; missing?: string[] } | undefined;
  if (result?.summary?.name) {
    return `${result.summary.name}${result.summary.skills?.length ? ` · ${result.summary.skills.slice(0, 4).join(", ")}` : ""}`;
  }
  const missing = result?.missing;
  if (Array.isArray(missing)) {
    return missing.length ? `Missing: ${missing.join(", ")}` : "Ready to save";
  }
  return String(step.status);
}

export default function AgentDemoReplay() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveSteps, setLiveSteps] = useState<AgentStep[] | null>(null);

  useEffect(() => {
    if (liveSteps || finished || waiting) return;
    if (visibleCount >= CANNED_STEPS.length) {
      setWaiting(true);
      return;
    }
    const timer = window.setTimeout(() => setVisibleCount((count) => count + 1), 900);
    return () => window.clearTimeout(timer);
  }, [visibleCount, waiting, finished, liveSteps]);

  const replay = () => {
    setLiveSteps(null);
    setLiveError(null);
    setFinished(false);
    setWaiting(false);
    setVisibleCount(0);
  };

  const allowCanned = () => {
    setWaiting(false);
    setFinished(true);
  };

  const runLive = async () => {
    setLiveBusy(true);
    setLiveError(null);
    try {
      const payload = await runPublicAgentDemo();
      setLiveSteps(payload.steps || []);
      setWaiting(false);
      setFinished(false);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Unable to run the live sample.");
    } finally {
      setLiveBusy(false);
    }
  };

  const publicHref = `/${encodeURIComponent(DEO_PUBLIC_USERNAME)}`;

  return (
    <Box>
      <Stack spacing={1.5}>
        {liveSteps
          ? liveSteps.map((step, index) => (
              <Stack key={`${step.tool}-${index}`} direction="row" spacing={1.5}>
                <Box sx={showcaseSx.stepIndex}>{index + 1}</Box>
                <Box>
                  <Typography sx={showcaseSx.stepLabel}>{toolTitle(step.tool)}</Typography>
                  <Typography sx={showcaseSx.cardBody}>{stepLine(step)}</Typography>
                </Box>
              </Stack>
            ))
          : CANNED_STEPS.slice(0, visibleCount).map((step, index) => (
              <Stack key={step.tool} direction="row" spacing={1.5}>
                <Box sx={showcaseSx.stepIndex}>{index + 1}</Box>
                <Box>
                  <Typography sx={showcaseSx.stepLabel}>{step.label}</Typography>
                  <Typography sx={showcaseSx.cardBody}>{step.detail}</Typography>
                </Box>
              </Stack>
            ))}

        {finished && !liveSteps ? (
          <Stack direction="row" spacing={1.5}>
            <Box sx={showcaseSx.stepIndex}>{CANNED_STEPS.length + 1}</Box>
            <Box>
              <Typography sx={showcaseSx.stepLabel}>Public URL</Typography>
              <Typography sx={showcaseSx.cardBody}>
                Live sample profile: /{DEO_PUBLIC_USERNAME}
              </Typography>
            </Box>
          </Stack>
        ) : null}
      </Stack>

      {liveError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {liveError}
        </Alert>
      ) : null}

      {liveSteps ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Live sample drafted with Groq/Gemini. Save is disabled here — sign in to publish your own profile.
        </Alert>
      ) : null}

      {waiting && !liveSteps ? (
        <Alert
          severity="warning"
          sx={{ mt: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={replay}>
                Reset
              </Button>
              <Button color="inherit" size="small" onClick={allowCanned}>
                Allow
              </Button>
            </Stack>
          }
        >
          Agent paused: Allow saving the portfolio? This canned run does not write to your account.
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={replay} sx={{ textTransform: "none", fontWeight: 600 }}>
          Replay canned run
        </Button>
        <Button
          variant="outlined"
          onClick={() => void runLive()}
          disabled={liveBusy}
          startIcon={liveBusy ? <CircularProgress size={16} /> : undefined}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {liveBusy ? "Running live sample…" : "Run live sample"}
        </Button>
        <Button
          component={RouterLink}
          to={getAgentLoginPath()}
          variant="contained"
          sx={[{ textTransform: "none", fontWeight: 700 }, accentRedContainedButtonSx]}
        >
          Log in to run it on your resume
        </Button>
        {finished || liveSteps ? (
          <Button component={RouterLink} to={publicHref} sx={{ textTransform: "none", fontWeight: 600 }}>
            Open sample profile
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
