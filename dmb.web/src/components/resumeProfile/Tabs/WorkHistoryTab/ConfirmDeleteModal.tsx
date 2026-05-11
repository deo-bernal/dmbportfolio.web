import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  isBusy?: boolean;
};

export default function ConfirmDeleteModal({
  open,
  title,
  message,
  onClose,
  onConfirm,
  isBusy = false,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={isBusy}
          startIcon={isBusy ? <ButtonLoadingIcon /> : null}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

