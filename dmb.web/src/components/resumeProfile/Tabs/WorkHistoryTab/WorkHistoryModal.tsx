import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { dateToIsoDate, isoDateToDate } from "utils/date";

type WorkHistoryModalProps = {
  open: boolean;
  title: string;
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
  jobDescription: string;
  error: string | null;
  onClose: () => void;
  onCompanyChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
};

export default function WorkHistoryModal({
  open,
  title,
  company,
  position,
  fromDate,
  toDate,
  jobDescription,
  error,
  onClose,
  onCompanyChange,
  onPositionChange,
  onFromDateChange,
  onToDateChange,
  onJobDescriptionChange,
  onSubmit,
  submitLabel = "Save",
}: WorkHistoryModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5 }}>
        <TextField autoFocus margin="dense" fullWidth label="Company" value={company} onChange={(e) => onCompanyChange(e.target.value)} />
        <TextField margin="dense" fullWidth label="Position" value={position} onChange={(e) => onPositionChange(e.target.value)} />
        <DatePicker
          label="From Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(fromDate)}
          onChange={(value) => onFromDateChange(dateToIsoDate(value))}
          slotProps={{ textField: { margin: "dense", fullWidth: true } }}
        />
        <DatePicker
          label="To Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(toDate)}
          onChange={(value) => onToDateChange(dateToIsoDate(value))}
          slotProps={{ textField: { margin: "dense", fullWidth: true } }}
        />
        <TextField
          margin="dense"
          fullWidth
          multiline
          minRows={3}
          label="Job Description"
          value={jobDescription}
          error={Boolean(error)}
          helperText={error ?? ""}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

