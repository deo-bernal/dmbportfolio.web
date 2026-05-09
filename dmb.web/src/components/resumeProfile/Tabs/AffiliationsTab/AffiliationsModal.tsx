import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { dateToIsoDate, isoDateToDate } from "utils/date";

export type AffiliationFieldKey = "organization" | "title" | "issueDate" | "details";

type AffiliationsModalProps = {
  open: boolean;
  title: string;
  organization: string;
  titleValue: string;
  issueDate: string;
  details: string;
  fieldErrors: Partial<Record<AffiliationFieldKey, string>>;
  onClose: () => void;
  onOrganizationChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onIssueDateChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export default function AffiliationsModal({
  open,
  title,
  organization,
  titleValue,
  issueDate,
  details,
  fieldErrors,
  onClose,
  onOrganizationChange,
  onTitleChange,
  onIssueDateChange,
  onDetailsChange,
  onSubmit,
  submitLabel = "Add",
  isSubmitting = false,
}: AffiliationsModalProps) {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 1.5 }}>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          required
          label="Organization"
          value={organization}
          error={Boolean(fieldErrors.organization)}
          helperText={fieldErrors.organization ?? " "}
          onChange={(e) => onOrganizationChange(e.target.value)}
        />
        <TextField
          margin="dense"
          fullWidth
          required
          label="Title (Profession)"
          value={titleValue}
          error={Boolean(fieldErrors.title)}
          helperText={fieldErrors.title ?? " "}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <DatePicker
          label="Issue Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(issueDate)}
          onChange={(v) => onIssueDateChange(dateToIsoDate(v))}
          slotProps={{
            textField: {
              margin: "dense",
              fullWidth: true,
              required: true,
              error: Boolean(fieldErrors.issueDate),
              helperText: fieldErrors.issueDate ?? " ",
            },
          }}
        />
        <TextField
          margin="dense"
          fullWidth
          required
          multiline
          minRows={3}
          label="Details"
          value={details}
          error={Boolean(fieldErrors.details)}
          helperText={fieldErrors.details ?? " "}
          onChange={(e) => onDetailsChange(e.target.value)}
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

