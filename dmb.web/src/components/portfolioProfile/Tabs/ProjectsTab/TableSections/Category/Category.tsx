import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import DataTable from "components/common/Datatable";
import type { AutocompleteFilterOption } from "components/common/Filter/AutocompleteFilter/AutocompleteFilter";
import { agenticPageSx } from "styles/main_style";
import type { DataTableColumn } from "components/common/Datatable";
import CategoryFilter from "./CategoryFilter";
import type { CategoryGridRow } from "../../columns";

export type ProjectsTabCategorySectionProps = {
  onOpenCategoryModal: () => void;
  isCategoryModalOpen: boolean;
  newCategoryName: string;
  categoryError: string | null;
  onNewCategoryNameChange: (value: string) => void;
  onCloseCategoryModal: () => void;
  onAddCategory: () => void | Promise<void>;
  isPersisting: boolean;

  categoryQuery: string;
  onCategoryQueryChange: (value: string) => void;
  selectedCategoryTags: AutocompleteFilterOption[];
  onSelectedCategoryTagsChange: (value: AutocompleteFilterOption[]) => void;
  categoryAutocompleteOptions: AutocompleteFilterOption[];

  filteredCategoryRows: CategoryGridRow[];
  categoryColumns: DataTableColumn<CategoryGridRow>[];
};

export default function Category(props: ProjectsTabCategorySectionProps) {
  const {
    onOpenCategoryModal,
    isCategoryModalOpen,
    newCategoryName,
    categoryError,
    onNewCategoryNameChange,
    onCloseCategoryModal,
    onAddCategory,
    isPersisting,
    categoryQuery,
    onCategoryQueryChange,
    selectedCategoryTags,
    onSelectedCategoryTagsChange,
    categoryAutocompleteOptions,
    filteredCategoryRows,
    categoryColumns,
  } = props;

  return (
    <>
      <Dialog open={isCategoryModalOpen} onClose={isPersisting ? undefined : onCloseCategoryModal} fullWidth maxWidth="sm">
        <DialogTitle>Add project category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="Category name"
            value={newCategoryName}
            error={Boolean(categoryError)}
            helperText={categoryError ?? "Example: Finance & Banking Systems"}
            onChange={(e) => {
              onNewCategoryNameChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onAddCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCategoryModal} disabled={isPersisting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void onAddCategory()}
            disabled={isPersisting}
            startIcon={isPersisting ? <ButtonLoadingIcon /> : null}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <CategoryFilter
        categoryQuery={categoryQuery}
        onCategoryQueryChange={onCategoryQueryChange}
        selectedCategoryTags={selectedCategoryTags}
        onSelectedCategoryTagsChange={(_, value) => onSelectedCategoryTagsChange(value)}
        categoryOptions={categoryAutocompleteOptions}
      />

      <Box
        sx={{
          ...agenticPageSx.headerActionsRow,
          justifyContent: "space-between",
          width: "100%",
          mb: 1,
        }}
      >
        <Typography component="h3" sx={{ ...agenticPageSx.sectionTitle, mb: 0 }}>
          Categories
        </Typography>
        <Button variant="contained" disableElevation onClick={onOpenCategoryModal} disabled={isPersisting}>
          Add Category
        </Button>
      </Box>
      <DataTable rows={filteredCategoryRows} columns={categoryColumns} getRowId={(row) => row.id} emptyMessage="No categories found." />
    </>
  );
}
