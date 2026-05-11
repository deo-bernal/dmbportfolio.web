import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";

type ConfirmDeleteModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isBusy?: boolean;
};

export default function ConfirmDeleteModal({ open, onClose, onConfirm, isBusy = false }: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete skill</DialogTitle>
      <DialogContent>Are you sure you want to delete this skill?</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => void onConfirm()}
          disabled={isBusy}
          startIcon={isBusy ? <ButtonLoadingIcon /> : null}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

