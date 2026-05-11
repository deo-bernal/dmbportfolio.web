import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { dateToIsoDate, isoDateToDate } from "utils/date";
import { modalDialogSx } from "styles/main_style";

export type WorkHistoryFieldKey = "fromDate" | "toDate";

type WorkHistoryModalProps = {
  open: boolean;
  title: string;
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
  jobDescription: string;
  error: string | null;
  fieldErrors?: Partial<Record<WorkHistoryFieldKey, string>>;
  onClose: () => void;
  onCompanyChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
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
  fieldErrors = {},
  onClose,
  onCompanyChange,
  onPositionChange,
  onFromDateChange,
  onToDateChange,
  onJobDescriptionChange,
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
}: WorkHistoryModalProps) {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={modalDialogSx.contentGrid}>
        <TextField autoFocus margin="dense" fullWidth label="Company" value={company} onChange={(e) => onCompanyChange(e.target.value)} />
        <TextField margin="dense" fullWidth label="Position" value={position} onChange={(e) => onPositionChange(e.target.value)} />
        <DatePicker
          label="From Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(fromDate)}
          onChange={(value) => onFromDateChange(dateToIsoDate(value))}
          slotProps={{
            textField: {
              margin: "dense",
              fullWidth: true,
              error: Boolean(fieldErrors.fromDate),
              helperText: fieldErrors.fromDate ?? " ",
            },
          }}
        />
        <DatePicker
          label="To Date"
          format="dd/MM/yyyy"
          value={isoDateToDate(toDate)}
          onChange={(value) => onToDateChange(dateToIsoDate(value))}
          slotProps={{
            textField: {
              margin: "dense",
              fullWidth: true,
              error: Boolean(fieldErrors.toDate),
              helperText: fieldErrors.toDate ?? " ",
            },
          }}
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
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void onSubmit()}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <ButtonLoadingIcon /> : null}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

