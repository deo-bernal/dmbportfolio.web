import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import DataTable from "components/common/Datatable";
import { agenticPageSx } from "styles/main_style";
import { addCategorySchema, addProjectItemSchema } from "validations/schema/projectsTab";
import type { TabViewProps } from "../types";
import PageHeader from "../PageHeader";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import getColumns, { type CategoryGridRow, type ProjectGridRow, type ProjectsGridRow } from "./columns";
import ProjectModal from "./ProjectModal";
import CategoryModal from "./CategoryModal";
import ProjectFilter from "./TableSections/ProjectFilter";

type DeleteTarget =
  | { kind: "category"; categoryIndex: number }
  | { kind: "project"; categoryIndex: number; itemIndex: number }
  | null;

type EditTarget =
  | { kind: "category"; categoryIndex: number }
  | { kind: "project"; categoryIndex: number; itemIndex: number }
  | null;

export default function ProjectsTab({ profile, draft, mode, cloneProfile, onImmediatePersist }: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState("");

  // Add category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Add/edit project item (re-uses ProjectModal)
  const [addModalCategoryIndex, setAddModalCategoryIndex] = useState<number | null>(null);
  const [projectModalName, setProjectModalName] = useState("");
  const [projectModalDescription, setProjectModalDescription] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);

  // Edit category
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [categoryEditTitle, setCategoryEditTitle] = useState("");
  const [categoryEditError, setCategoryEditError] = useState<string | null>(null);

  // Delete category / project
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const openCategoryModal = () => {
    setNewCategoryName("");
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryError(null);
  };

  const openAddProjectModal = (categoryIndex: number) => {
    setEditTarget(null);
    setAddModalCategoryIndex(categoryIndex);
    setProjectModalName("");
    setProjectModalDescription("");
    setProjectError(null);
  };

  const closeProjectModal = () => {
    setAddModalCategoryIndex(null);
    setEditTarget(null);
    setProjectModalName("");
    setProjectModalDescription("");
    setProjectError(null);
  };

  const addCategory = async () => {
    const normalized = newCategoryName.trim();
    try {
      addCategorySchema.validateSync({ categoryName: normalized });
    } catch (error: any) {
      const message = error?.message ?? "Category name is required.";
      setCategoryError(message);
      enqueueSnackbar(message, { variant: "error" });
      return;
    }

    const alreadyExists = draft.projectCategories.some(
      (category) => category.title.trim().toLowerCase() === normalized.toLowerCase()
    );
    if (alreadyExists) {
      setCategoryError("Category already exists.");
      enqueueSnackbar("Category already exists.", { variant: "error" });
      return;
    }

    // New categories can exist without projects; we show the "Add Item" action per category row.
    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories.push({ title: normalized, items: [] });
    await onImmediatePersist(nextProfile, "Category added.");
    closeCategoryModal();
  };

  const addProjectItem = async () => {
    if (addModalCategoryIndex === null) return;

    const normalizedName = projectModalName.trim();
    const normalizedDescription = projectModalDescription.trim();
    try {
      addProjectItemSchema.validateSync({
        projectName: normalizedName,
        projectDescription: normalizedDescription,
      });
    } catch (error: any) {
      const message = error?.message ?? "Project details are required.";
      setProjectError(message);
      enqueueSnackbar(message, { variant: "error" });
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories[addModalCategoryIndex].items.push({
      name: normalizedName,
      description: normalizedDescription,
    });
    await onImmediatePersist(nextProfile, "Project item added.");
    closeProjectModal();
  };

  const rows: ProjectsGridRow[] = useMemo(() => {
    const result: ProjectsGridRow[] = [];

    draft.projectCategories.forEach((category, categoryIndex) => {
      const categoryTitle = category.title ?? "";
      const nonEmptyProjects = (category.items ?? []).filter(
        (item) => (item?.name ?? "").trim().length > 0 || (item?.description ?? "").trim().length > 0
      );

      result.push({
        kind: "category",
        id: `cat-${categoryIndex}`,
        categoryIndex,
        category: categoryTitle,
        name: "",
        description: "",
        hasProjects: nonEmptyProjects.length > 0,
      });

      category.items.forEach((item, itemIndex) => {
        const name = (item?.name ?? "").toString();
        const description = (item?.description ?? "").toString();
        if (name.trim().length === 0 && description.trim().length === 0) return;

        result.push({
          kind: "project",
          id: `cat-${categoryIndex}-item-${itemIndex}`,
          categoryIndex,
          itemIndex,
          category: categoryTitle,
          name,
          description,
        });
      });
    });

    return result;
  }, [draft.projectCategories]);

  const columns = getColumns({
    onEditCategory: (row: CategoryGridRow) => {
      setEditTarget({ kind: "category", categoryIndex: row.categoryIndex });
      setCategoryEditTitle(row.category);
      setCategoryEditError(null);
    },
    onDeleteCategory: (row: CategoryGridRow) =>
      setDeleteTarget({ kind: "category", categoryIndex: row.categoryIndex }),
    onAddProjectItem: (categoryIndex: number) => openAddProjectModal(categoryIndex),
    onEditProject: (row: ProjectGridRow) => {
      setEditTarget({ kind: "project", categoryIndex: row.categoryIndex, itemIndex: row.itemIndex });
      setProjectModalName(row.name);
      setProjectModalDescription(row.description);
      setProjectError(null);
    },
    onDeleteProject: (row: ProjectGridRow) =>
      setDeleteTarget({ kind: "project", categoryIndex: row.categoryIndex, itemIndex: row.itemIndex }),
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return rows;
    }
    return rows.filter((row) => {
      const category = row.category.toLowerCase();
      const name = row.name.toLowerCase();
      const description = row.description.toLowerCase();
      return (
        category.includes(normalizedQuery) ||
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }, [rows, query]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "category") {
      const targetCategory = draft.projectCategories[deleteTarget.categoryIndex];
      const hasProjects = (targetCategory?.items ?? []).some(
        (item) => (item?.name ?? "").trim().length > 0 || (item?.description ?? "").trim().length > 0
      );

      if (hasProjects) {
        enqueueSnackbar("Cannot delete category with existing projects.", { variant: "error" });
        setDeleteTarget(null);
        return;
      }

      const nextProfile = cloneProfile(draft);
      nextProfile.projectCategories = nextProfile.projectCategories.filter(
        (_, i) => i !== deleteTarget.categoryIndex
      );
      await onImmediatePersist(nextProfile, "Category deleted.");
      setDeleteTarget(null);
      setEditTarget(null);
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories[deleteTarget.categoryIndex].items =
      nextProfile.projectCategories[deleteTarget.categoryIndex].items.filter(
        (_, i) => i !== deleteTarget.itemIndex
      );
    await onImmediatePersist(nextProfile, "Project deleted.");
    setDeleteTarget(null);
    setEditTarget(null);
  };

  const saveProjectEdit = async () => {
    if (!editTarget || editTarget.kind !== "project") return;

    const normalizedName = projectModalName.trim();
    const normalizedDescription = projectModalDescription.trim();
    try {
      addProjectItemSchema.validateSync({
        projectName: normalizedName,
        projectDescription: normalizedDescription,
      });
    } catch (error: any) {
      setProjectError(error?.message ?? "Project details are required.");
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories[editTarget.categoryIndex].items[editTarget.itemIndex] = {
      name: normalizedName,
      description: normalizedDescription,
    };
    await onImmediatePersist(nextProfile, "Project updated.");
    closeProjectModal();
  };

  const saveCategoryEdit = async () => {
    if (!editTarget || editTarget.kind !== "category") return;

    const normalized = categoryEditTitle.trim();
    try {
      addCategorySchema.validateSync({ categoryName: normalized });
    } catch (error: any) {
      setCategoryEditError(error?.message ?? "Category name is required.");
      return;
    }

    const duplicate = draft.projectCategories.some(
      (category, i) =>
        i !== editTarget.categoryIndex &&
        category.title.trim().toLowerCase() === normalized.toLowerCase()
    );
    if (duplicate) {
      setCategoryEditError("Category already exists.");
      enqueueSnackbar("Category already exists.", { variant: "error" });
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories[editTarget.categoryIndex].title = normalized;
    await onImmediatePersist(nextProfile, "Category updated.");

    setEditTarget(null);
    setCategoryEditTitle("");
    setCategoryEditError(null);
  };

  if (mode === "view") {
    return (
      <>
        <PageHeader title="Projects" subtitle="Project categories and items" />
        {profile.projectCategories.map((category, i) => (
          <Box
            component="section"
            key={i}
            sx={i === profile.projectCategories.length - 1 ? undefined : agenticPageSx.projectSectionSpaced}
          >
            <Typography component="h3" sx={agenticPageSx.categoryTitle}>
              {category.title}
            </Typography>
            <Box component="ul" sx={agenticPageSx.list}>
              {category.items.map((item, j) => (
                <Box component="li" key={j}>
                  <strong>{item.name}</strong> - <span>{item.description}</span>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader title="Projects" subtitle="Manage project categories and items in a grid view" />

      <Button variant="outlined" onClick={openCategoryModal}>
        Add New Category
      </Button>

      <Dialog open={isCategoryModalOpen} onClose={closeCategoryModal} fullWidth maxWidth="sm">
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
              setNewCategoryName(e.target.value);
              if (categoryError) setCategoryError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryModal}>Cancel</Button>
          <Button variant="contained" onClick={addCategory}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <ProjectFilter query={query} onQueryChange={setQuery} />
      <DataTable
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        emptyMessage="No project rows found."
      />

      <ProjectModal
        open={addModalCategoryIndex !== null}
        title="Add project item"
        name={projectModalName}
        description={projectModalDescription}
        error={projectError}
        onClose={closeProjectModal}
        onNameChange={(value) => {
          setProjectModalName(value);
          if (projectError) setProjectError(null);
        }}
        onDescriptionChange={(value) => {
          setProjectModalDescription(value);
          if (projectError) setProjectError(null);
        }}
        onSubmit={addProjectItem}
        submitLabel="Add"
      />

      <ProjectModal
        open={editTarget?.kind === "project"}
        title="Edit project item"
        name={projectModalName}
        description={projectModalDescription}
        error={projectError}
        onClose={closeProjectModal}
        onNameChange={(value) => {
          setProjectModalName(value);
          if (projectError) setProjectError(null);
        }}
        onDescriptionChange={(value) => {
          setProjectModalDescription(value);
          if (projectError) setProjectError(null);
        }}
        onSubmit={saveProjectEdit}
      />

      <CategoryModal
        open={editTarget?.kind === "category"}
        title="Edit category"
        value={categoryEditTitle}
        error={categoryEditError}
        onClose={() => {
          setEditTarget(null);
          setCategoryEditTitle("");
          setCategoryEditError(null);
        }}
        onValueChange={(value) => {
          setCategoryEditTitle(value);
          if (categoryEditError) setCategoryEditError(null);
        }}
        onSubmit={saveCategoryEdit}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={deleteTarget?.kind === "category" ? "Delete category" : "Delete project item"}
        message={
          deleteTarget?.kind === "category"
            ? "Are you sure you want to delete this category? Categories cannot be deleted if they have projects."
            : "Are you sure you want to delete this project item?"
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

