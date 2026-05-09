import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useSnackbar } from "notistack";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";
import PageHeader from "../PageHeader";

export default function OverviewTab({ profile, draft, mode, setDraft }: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const publicPortfolioUrl = profile.username ? `https://www.dmbwebsolutions.com/${profile.username}` : "";

  const copyUrl = async (value: string, missingMessage: string) => {
    if (!value) {
      enqueueSnackbar(missingMessage, { variant: "error" });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      enqueueSnackbar("Public URL copied.", { variant: "success" });
    } catch {
      enqueueSnackbar("Unable to copy URL.", { variant: "error" });
    }
  };

  const copyPublicPortfolioUrl = async () => {
    if (!publicPortfolioUrl) {
      enqueueSnackbar("Public profile URL is unavailable.", { variant: "error" });
      return;
    }
    await copyUrl(publicPortfolioUrl, "Public portfolio URL is unavailable.");
  };

  if (mode === "view") {
    return (
      <>
        <PageHeader title="Overview" subtitle="Professional summary and intro video" />
        {profile.video ? (
          <Box component="a" href={profile.video} target="_blank" rel="noopener noreferrer" sx={agenticPageSx.introLink}>
            Intro video
          </Box>
        ) : null}
        <Typography component="p" sx={agenticPageSx.summary}>
          {profile.summary}
        </Typography>
        <Typography component="p" sx={{ mt: 1, color: "#475569" }}>
          <strong>Is Viewable:</strong> {profile.isViewable ? "Yes" : "No"}
        </Typography>
      </>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader title="Overview" subtitle="Update your profile summary and intro video" />
      <TextField
        label="Summary"
        multiline
        minRows={4}
        value={draft.summary}
        onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
      />
      <TextField
        label="Intro video URL"
        value={draft.video}
        onChange={(e) => setDraft((prev) => ({ ...prev, video: e.target.value }))}
      />
      <Box sx={{ display: "grid", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(draft.isViewable)}
                onChange={(e) => setDraft((prev) => ({ ...prev, isViewable: e.target.checked }))}
              />
            }
            label="Is Viewable (allow anonymous viewing)"
            sx={{ m: 0 }}
          />
          {draft.isViewable ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: { xs: "100%", sm: 420 }, flex: 1 }}>
              <TextField
                label="Public Profile"
                value={publicPortfolioUrl}
                slotProps={{ input: { readOnly: true } }}
                sx={{ flex: 1 }}
              />
              <Tooltip title="Copy public URL">
                <IconButton onClick={copyPublicPortfolioUrl} aria-label="Copy public profile URL">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

