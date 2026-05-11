import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { formUtilsSx } from "styles/main_style";

type FormMode = "view" | "edit";

type FormUtilsProps = {
  mode: FormMode;
  isSaving?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void> | void;
  showSaveCancelActions?: boolean;
  editActionLabel?: string;
  onEditAction?: () => void;
  editActionDisabled?: boolean;
  children: React.ReactNode;
};

export default function FormUtils({
  mode,
  isSaving = false,
  onEdit,
  onCancel,
  onSave,
  showSaveCancelActions = true,
  editActionLabel,
  onEditAction,
  editActionDisabled = false,
  children,
}: FormUtilsProps) {
  return (
    <Box>
      <Box sx={formUtilsSx.actionsRow}>
        {mode === "view" ? (
          <Button variant="contained" onClick={onEdit}>
            Edit
          </Button>
        ) : (
          <>
            {editActionLabel && onEditAction ? (
              <Button variant="outlined" onClick={onEditAction} disabled={isSaving || editActionDisabled}>
                {editActionLabel}
              </Button>
            ) : null}
            {showSaveCancelActions ? (
              <>
                <Button variant="outlined" onClick={onCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void onSave()}
                  disabled={isSaving}
                  startIcon={isSaving ? <ButtonLoadingIcon /> : null}
                >
                  Save
                </Button>
              </>
            ) : null}
          </>
        )}
      </Box>
      {children}
    </Box>
  );
}
