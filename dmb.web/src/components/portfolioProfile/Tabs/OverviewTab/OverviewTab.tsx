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
        <Typography component="p" sx={agenticPageSx.overviewViewableLine}>
          <strong>Is Viewable:</strong> {profile.isViewable ? "Yes" : "No"}
        </Typography>
      </>
    );
  }

  return (
    <Box sx={agenticPageSx.editGrid}>
      <PageHeader title="Overview" subtitle="Update your profile summary and intro video" />
      <TextField
        label="Summary"
        required
        multiline
        minRows={4}
        error={mode === "edit" && draft.summary.trim().length === 0}
        helperText={mode === "edit" && draft.summary.trim().length === 0 ? "Summary is required." : undefined}
        value={draft.summary}
        onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
      />
      <TextField
        label="Intro video URL"
        value={draft.video}
        onChange={(e) => setDraft((prev) => ({ ...prev, video: e.target.value }))}
      />
      <Box sx={agenticPageSx.editGridTight}>
        <Box sx={agenticPageSx.overviewSettingsRow}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(draft.isViewable)}
                onChange={(e) => setDraft((prev) => ({ ...prev, isViewable: e.target.checked }))}
              />
            }
            label="Is Viewable (allow anonymous viewing)"
            sx={agenticPageSx.formControlLabelFlush}
          />
          {draft.isViewable ? (
            <Box sx={agenticPageSx.overviewPublicUrlRow}>
              <TextField
                label="Public Profile URL (for anonymous viewing)"
                value={publicPortfolioUrl}
                slotProps={{ input: { readOnly: true } }}
                sx={agenticPageSx.overviewPublicUrlField}
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

