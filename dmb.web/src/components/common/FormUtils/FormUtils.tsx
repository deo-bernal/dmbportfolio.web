import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

type FormMode = "view" | "edit";

type FormUtilsProps = {
  mode: FormMode;
  isSaving?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void> | void;
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
  editActionLabel,
  onEditAction,
  editActionDisabled = false,
  children,
}: FormUtilsProps) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
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
            <Button variant="outlined" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="contained" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </>
        )}
      </Box>
      {children}
    </Box>
  );
}
