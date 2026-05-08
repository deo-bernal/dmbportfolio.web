import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ResumeTabProps } from "../types";

export default function EducationTab({ draft, setDraft }: ResumeTabProps) {
  return (
    <Stack spacing={2}>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() =>
          setDraft((prev) => ({
            ...prev,
            education: [
              ...prev.education,
              { school: "", address: "", courseTaken: "", startDate: "", endDate: "" },
            ],
          }))
        }
      >
        Add Education
      </Button>
      {draft.education.map((item, index) => (
        <Paper key={`edu-edit-${index}`} variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton
              color="error"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  education: prev.education.filter((_, rowIndex) => rowIndex !== index),
                }))
              }
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Stack spacing={2}>
            <TextField
              label="School"
              value={item.school}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  education: prev.education.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, school: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              label="Address"
              value={item.address}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  education: prev.education.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, address: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              label="Course Taken"
              value={item.courseTaken}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  education: prev.education.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, courseTaken: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              type="date"
              label="Start Date"
              value={item.startDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  education: prev.education.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, startDate: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              type="date"
              label="End Date"
              value={item.endDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  education: prev.education.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, endDate: event.target.value } : entry
                  ),
                }))
              }
            />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
