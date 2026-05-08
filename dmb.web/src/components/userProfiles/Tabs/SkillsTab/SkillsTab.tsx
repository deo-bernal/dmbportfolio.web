import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";

export default function SkillsTab({ profile, draft, mode, setDraft }: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [newSkill, setNewSkill] = useState("");

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
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          fullWidth
          label="New skill"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const normalized = newSkill.trim();
              if (!normalized) {
                enqueueSnackbar("Skill is required.", { variant: "error" });
                return;
              }
              const duplicate = draft.skills.some((skill) => skill.trim().toLowerCase() === normalized.toLowerCase());
              if (duplicate) {
                enqueueSnackbar("Skill already exists.", { variant: "error" });
                return;
              }
              setDraft((prev) => ({
                ...prev,
                skills: [...prev.skills, normalized],
              }));
              enqueueSnackbar("Skill added.", { variant: "success" });
              setNewSkill("");
            }
          }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            const normalized = newSkill.trim();
            if (!normalized) {
              enqueueSnackbar("Skill is required.", { variant: "error" });
              return;
            }
            const duplicate = draft.skills.some((skill) => skill.trim().toLowerCase() === normalized.toLowerCase());
            if (duplicate) {
              enqueueSnackbar("Skill already exists.", { variant: "error" });
              return;
            }
            setDraft((prev) => ({
              ...prev,
              skills: [...prev.skills, normalized],
            }));
            enqueueSnackbar("Skill added.", { variant: "success" });
            setNewSkill("");
          }}
        >
          Add skill
        </Button>
      </Box>

      {draft.skills.map((skill, index) => (
        <Box key={`${skill}-${index}`} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
            onClick={() => {
              setDraft((prev) => ({
                ...prev,
                skills: prev.skills.filter((_, i) => i !== index),
              }));
              enqueueSnackbar("Skill removed.", { variant: "success" });
            }}
          >
            Remove
          </Button>
        </Box>
      ))}
    </Box>
  );
}
