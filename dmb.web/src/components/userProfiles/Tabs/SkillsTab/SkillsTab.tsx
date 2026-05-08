import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";
import { useState } from "react";

export default function SkillsTab({ profile, draft, mode, setDraft, onImmediatePersist }: TabViewProps) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Dialog open={deleteIndex !== null} onClose={() => setDeleteIndex(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete skill</DialogTitle>
        <DialogContent>Are you sure you want to delete this skill?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIndex(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (deleteIndex === null) return;
              const nextProfile = {
                ...draft,
                skills: draft.skills.filter((_, i) => i !== deleteIndex),
              };
              setDraft(nextProfile);
              setDeleteIndex(null);
              await onImmediatePersist(nextProfile, "Skill deleted.");
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {draft.skills.map((skill, index) => (
        <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            label={`Skill ${index + 1}`}
            value={skill}
            onChange={(e) =>
              setDraft((prev) => {
                const updated = [...prev.skills];
                updated[index] = e.target.value;
                return {
                  ...prev,
                  skills: updated,
                };
              })
            }
          />
          <Button
            color="error"
            variant="text"
            onClick={() => setDeleteIndex(index)}
          >
            Remove
          </Button>
        </Box>
      ))}
    </Box>
  );
}
