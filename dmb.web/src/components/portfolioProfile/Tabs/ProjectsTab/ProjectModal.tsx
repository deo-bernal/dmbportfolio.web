import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";

type ProjectModalProps = {
  open: boolean;
  title: string;
  name: string;
  description: string;
  error: string | null;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export default function ProjectModal({
  open,
  title,
  name,
  description,
  error,
  onClose,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
}: ProjectModalProps) {
  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" fullWidth label="Project name" value={name} onChange={(e) => onNameChange(e.target.value)} />
        <TextField
          margin="dense"
          fullWidth
          multiline
          minRows={3}
          label="Project description"
          value={description}
          error={Boolean(error)}
          helperText={error ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
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

