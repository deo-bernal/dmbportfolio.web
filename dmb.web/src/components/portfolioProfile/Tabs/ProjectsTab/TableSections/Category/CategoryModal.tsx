import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";

type CategoryModalProps = {
  open: boolean;
  title: string;
  value: string;
  error: string | null;
  onClose: () => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export default function CategoryModal({
  open,
  title,
  value,
  error,
  onClose,
  onValueChange,
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
}: CategoryModalProps) {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          fullWidth
          label="Category name"
          value={value}
          error={Boolean(error)}
          helperText={error ?? ""}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
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
