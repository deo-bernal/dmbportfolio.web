import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";
import PageHeader from "../PageHeader";

export default function OverviewTab({ profile, draft, mode, setDraft }: TabViewProps) {
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
    </Box>
  );
}
