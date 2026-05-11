import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import DataTable from "components/common/Datatable";
import type { AutocompleteFilterOption } from "components/common/Filter/AutocompleteFilter/AutocompleteFilter";
import { agenticPageSx } from "styles/main_style";
import type { DataTableColumn } from "components/common/Datatable";
import ProjectModal, { type ProjectCategoryOption } from "./ProjectModal";
import ProjectFilter from "./ProjectFilter";
import type { ProjectGridRow } from "../../columns";

export type ProjectsTabProjectSectionProps = {
  draftHasCategories: boolean;
  isPersisting: boolean;
  onOpenAddProjectModal: () => void;

  projectQuery: string;
  onProjectQueryChange: (value: string) => void;
  selectedProjectCategoryTags: AutocompleteFilterOption[];
  onSelectedProjectCategoryTagsChange: (value: AutocompleteFilterOption[]) => void;
  categoryAutocompleteOptions: AutocompleteFilterOption[];

  filteredProjectRows: ProjectGridRow[];
  projectColumns: DataTableColumn<ProjectGridRow>[];
  emptyProjectsMessage: string;

  categoryOptions: ProjectCategoryOption[];

  isProjectModalOpen: boolean;
  isProjectAddOpen: boolean;
  projectModalCategoryIndex: number | null;
  projectModalName: string;
  projectModalDescription: string;
  projectError: string | null;
  onCloseProjectModal: () => void;
  onProjectModalCategoryChange: (index: number) => void;
  onProjectModalNameChange: (value: string) => void;
  onProjectModalDescriptionChange: (value: string) => void;
  onSubmitProjectModal: () => void | Promise<void>;
  projectModalSubmitLabel: string;
};

export default function Project(props: ProjectsTabProjectSectionProps) {
  const {
    draftHasCategories,
    isPersisting,
    onOpenAddProjectModal,
    projectQuery,
    onProjectQueryChange,
    selectedProjectCategoryTags,
    onSelectedProjectCategoryTagsChange,
    categoryAutocompleteOptions,
    filteredProjectRows,
    projectColumns,
    emptyProjectsMessage,
    categoryOptions,
    isProjectModalOpen,
    isProjectAddOpen,
    projectModalCategoryIndex,
    projectModalName,
    projectModalDescription,
    projectError,
    onCloseProjectModal,
    onProjectModalCategoryChange,
    onProjectModalNameChange,
    onProjectModalDescriptionChange,
    onSubmitProjectModal,
    projectModalSubmitLabel,
  } = props;

  return (
    <>
      <Divider sx={{ my: 2 }} />

      <ProjectFilter
        projectQuery={projectQuery}
        onProjectQueryChange={onProjectQueryChange}
        selectedProjectCategoryTags={selectedProjectCategoryTags}
        onSelectedProjectCategoryTagsChange={(_, value) => onSelectedProjectCategoryTagsChange(value)}
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
          Projects
        </Typography>
        <Button
          variant="contained"
          disableElevation
          disabled={!draftHasCategories || isPersisting}
          startIcon={isPersisting ? <ButtonLoadingIcon /> : null}
          onClick={onOpenAddProjectModal}
        >
          Add Project
        </Button>
      </Box>
      <DataTable
        rows={filteredProjectRows}
        columns={projectColumns}
        getRowId={(row) => row.id}
        emptyMessage={emptyProjectsMessage}
      />

      <ProjectModal
        open={isProjectModalOpen}
        title={isProjectAddOpen ? "Add project" : "Edit project"}
        categoryOptions={categoryOptions}
        selectedCategoryIndex={projectModalCategoryIndex}
        onCategoryChange={onProjectModalCategoryChange}
        categorySelectDisabled={isPersisting}
        name={projectModalName}
        description={projectModalDescription}
        error={projectError}
        onClose={onCloseProjectModal}
        onNameChange={onProjectModalNameChange}
        onDescriptionChange={onProjectModalDescriptionChange}
        onSubmit={onSubmitProjectModal}
        submitLabel={projectModalSubmitLabel}
        isSubmitting={isPersisting}
      />
    </>
  );
}
