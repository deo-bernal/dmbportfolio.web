import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";

export default function SkillsTab({ profile, draft, mode, setDraft }: TabViewProps) {
  if (mode === "view") {
    return (
      <Box component="ul" sx={agenticPageSx.list}>
        {profile.skills.map((s, i) => (
          <Box component="li" key={i}>
            {s}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <TextField
      fullWidth
      label="Skills (one per line)"
      multiline
      minRows={8}
      value={draft.skills.join("\n")}
      onChange={(e) =>
        setDraft((prev) => ({
          ...prev,
          skills: e.target.value
            .split(/\n|,/)
            .map((s) => s.trim())
            .filter(Boolean),
        }))
      }
    />
  );
}
