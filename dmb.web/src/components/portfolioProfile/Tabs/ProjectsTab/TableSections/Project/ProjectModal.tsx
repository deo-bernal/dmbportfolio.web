import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { modalDialogSx } from "styles/main_style";

export type ProjectCategoryOption = {
  index: number;
  title: string;
};

type ProjectModalProps = {
  open: boolean;
  title: string;
  categoryOptions: ProjectCategoryOption[];
  selectedCategoryIndex: number | null;
  onCategoryChange: (categoryIndex: number) => void;
  categorySelectDisabled?: boolean;
  categorySelectError?: boolean;
  categoryHelperText?: string;
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
  categoryOptions,
  selectedCategoryIndex,
  onCategoryChange,
  categorySelectDisabled = false,
  categorySelectError = false,
  categoryHelperText,
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
  const hasCategories = categoryOptions.length > 0;
  const selectValue = selectedCategoryIndex !== null && hasCategories ? String(selectedCategoryIndex) : "";

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={modalDialogSx.contentGrid}>
        <FormControl fullWidth margin="dense" error={categorySelectError} disabled={categorySelectDisabled || !hasCategories}>
          <InputLabel id="project-modal-category-label">Category</InputLabel>
          <Select
            labelId="project-modal-category-label"
            label="Category"
            value={selectValue}
            onChange={(e) => onCategoryChange(Number(e.target.value))}
          >
            {categoryOptions.map((opt) => (
              <MenuItem key={opt.index} value={String(opt.index)}>
                {opt.title.trim() ? opt.title : `Category ${opt.index + 1}`}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{categoryHelperText ?? (!hasCategories ? "Add a category first." : " ")}</FormHelperText>
        </FormControl>
        <TextField margin="dense" fullWidth label="Project name" value={name} onChange={(e) => onNameChange(e.target.value)} />
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
