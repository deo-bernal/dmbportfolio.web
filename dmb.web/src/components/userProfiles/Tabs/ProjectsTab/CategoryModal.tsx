import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

type CategoryModalProps = {
  open: boolean;
  title: string;
  value: string;
  error: string | null;
  onClose: () => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
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
}: CategoryModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
