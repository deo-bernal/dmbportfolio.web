import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { dateToIsoDate, isoDateToDate } from "utils/date";

export type EducationFieldKey = "school" | "address" | "courseTaken" | "startDate" | "endDate";

type EducationModalProps = {
  open: boolean;
  title: string;
  school: string;
  address: string;
  courseTaken: string;
  startDate: string;
  endDate: string;
  fieldErrors: Partial<Record<EducationFieldKey, string>>;
  onClose: () => void;
  onSchoolChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCourseTakenChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export default function EducationModal({
  open,
  title,
  school,
  address,
  courseTaken,
  startDate,
  endDate,
  fieldErrors,
  onClose,
  onSchoolChange,
  onAddressChange,
  onCourseTakenChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  submitLabel = "Add",
  isSubmitting = false,
}: EducationModalProps) {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5 }}>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          required
          label="School"
          value={school}
          error={Boolean(fieldErrors.school)}
          helperText={fieldErrors.school ?? " "}
          onChange={(e) => onSchoolChange(e.target.value)}
        />
        <TextField
          margin="dense"
          fullWidth
          required
          label="Address"
          value={address}
          error={Boolean(fieldErrors.address)}
          helperText={fieldErrors.address ?? " "}
          onChange={(e) => onAddressChange(e.target.value)}
        />
        <TextField
          margin="dense"
          fullWidth
          required
          label="Course Taken"
          value={courseTaken}
          error={Boolean(fieldErrors.courseTaken)}
          helperText={fieldErrors.courseTaken ?? " "}
          onChange={(e) => onCourseTakenChange(e.target.value)}
        />
        <DatePicker
          label="Start Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(startDate)}
          onChange={(v) => onStartDateChange(dateToIsoDate(v))}
          slotProps={{
            textField: {
              margin: "dense",
              fullWidth: true,
              required: true,
              error: Boolean(fieldErrors.startDate),
              helperText: fieldErrors.startDate ?? " ",
            },
          }}
        />
        <DatePicker
          label="End Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(endDate)}
          onChange={(v) => onEndDateChange(dateToIsoDate(v))}
          slotProps={{
            textField: {
              margin: "dense",
              fullWidth: true,
              required: true,
              error: Boolean(fieldErrors.endDate),
              helperText: fieldErrors.endDate ?? " ",
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
