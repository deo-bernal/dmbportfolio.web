import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ResumeTabProps } from "../types";

export default function WorkHistoryTab({ draft, setDraft }: ResumeTabProps) {
  return (
    <Stack spacing={2}>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() =>
          setDraft((prev) => ({
            ...prev,
            workHistory: [
              ...prev.workHistory,
              { company: "", position: "", fromDate: "", toDate: "", jobDescription: "" },
            ],
          }))
        }
      >
        Add Work History
      </Button>
      {draft.workHistory.map((item, index) => (
        <Paper key={`wh-edit-${index}`} variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton
              color="error"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: prev.workHistory.filter((_, rowIndex) => rowIndex !== index),
                }))
              }
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Stack spacing={2}>
            <TextField
              label="Company"
              value={item.company}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: prev.workHistory.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, company: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              label="Position"
              value={item.position}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: prev.workHistory.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, position: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              type="date"
              label="From Date"
              value={item.fromDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: prev.workHistory.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, fromDate: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              type="date"
              label="To Date"
              value={item.toDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: prev.workHistory.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, toDate: event.target.value } : entry
                  ),
                }))
              }
            />
            <TextField
              multiline
              minRows={3}
              label="Job Description"
              value={item.jobDescription}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  workHistory: prev.workHistory.map((entry, rowIndex) =>
                    rowIndex === index ? { ...entry, jobDescription: event.target.value } : entry
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
