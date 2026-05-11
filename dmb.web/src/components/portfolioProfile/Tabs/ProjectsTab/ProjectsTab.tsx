import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import { agenticPageSx } from "styles/main_style";
import { addCategorySchema, addProjectItemSchema } from "validations/schema/projectsTab";
import type { TabViewProps } from "../types";
import PageHeader from "../PageHeader";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { getCategoryColumns, getProjectColumns, type CategoryGridRow, type ProjectGridRow } from "./columns";
import CategoryModal from "./TableSections/Category/CategoryModal";
import type { AutocompleteFilterOption } from "components/common/Filter/AutocompleteFilter/AutocompleteFilter";
import Category from "./TableSections/Category/Category";
import Project from "./TableSections/Project/Project";

type DeleteTarget =
  | { kind: "category"; categoryIndex: number }
  | { kind: "project"; categoryIndex: number; itemIndex: number }
  | null;

type EditTarget =
  | { kind: "category"; categoryIndex: number }
  | { kind: "project"; categoryIndex: number; itemIndex: number }
  | null;

export default function ProjectsTab({
  profile,
  draft,
  mode,
  cloneProfile,
  onImmediatePersist,
  isPersisting = false,
}: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [categoryQuery, setCategoryQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [selectedProjectCategoryTags, setSelectedProjectCategoryTags] = useState<AutocompleteFilterOption[]>([]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [isProjectAddOpen, setIsProjectAddOpen] = useState(false);
  const [projectModalCategoryIndex, setProjectModalCategoryIndex] = useState<number | null>(null);
  const [projectModalName, setProjectModalName] = useState("");
  const [projectModalDescription, setProjectModalDescription] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [categoryEditTitle, setCategoryEditTitle] = useState("");
  const [categoryEditError, setCategoryEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const categoryOptions = useMemo(
    () =>
      (draft.projectCategories ?? []).map((c, index) => ({
        index,
        title: (c.title ?? "").toString(),
      })),
    [draft.projectCategories]
  );

  const categoryAutocompleteOptions: AutocompleteFilterOption[] = useMemo(
    () =>
      (draft.projectCategories ?? []).map((c, i) => ({
        value: i,
        label: (c.title ?? "").trim() || `Category ${i + 1}`,
      })),
    [draft.projectCategories]
  );

  useEffect(() => {
    const n = draft.projectCategories.length;
    setSelectedProjectCategoryTags((prev) => prev.filter((o) => Number(o.value) >= 0 && Number(o.value) < n));
  }, [draft.projectCategories.length]);

  const openCategoryModal = () => {
    setNewCategoryName("");
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryError(null);
  };

  const openAddProjectModal = () => {
    if (draft.projectCategories.length === 0) {
      enqueueSnackbar("Add a category before adding a project.", { variant: "warning" });
      return;
    }
    setEditTarget(null);
    setIsProjectAddOpen(true);
    setProjectModalCategoryIndex(0);
    setProjectModalName("");
    setProjectModalDescription("");
    setProjectError(null);
  };

  const closeProjectModal = () => {
    setIsProjectAddOpen(false);
    setEditTarget(null);
    setProjectModalCategoryIndex(null);
    setProjectModalName("");
    setProjectModalDescription("");
    setProjectError(null);
  };

  const isProjectModalOpen = isProjectAddOpen || editTarget?.kind === "project";

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

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories.push({ title: normalized, items: [] });
    await onImmediatePersist(nextProfile, "Category added.");
    closeCategoryModal();
  };

  const addProjectItem = async () => {
    if (projectModalCategoryIndex === null || draft.projectCategories.length === 0) return;

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
    nextProfile.projectCategories[projectModalCategoryIndex].items.push({
      name: normalizedName,
      description: normalizedDescription,
    });
    await onImmediatePersist(nextProfile, "Project added.");
    closeProjectModal();
  };

  const categoryRows: CategoryGridRow[] = useMemo(() => {
    return (draft.projectCategories ?? []).map((category, categoryIndex) => {
      const title = (category.title ?? "").toString();
      const items = category.items ?? [];
      const nonEmptyItems = items.filter(
        (item) => (item?.name ?? "").trim().length > 0 || (item?.description ?? "").trim().length > 0
      );
      return {
        id: `cat-${categoryIndex}`,
        categoryIndex,
        title,
        hasProjects: nonEmptyItems.length > 0,
      };
    });
  }, [draft.projectCategories]);

  const filteredCategoryRows = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();
    if (!normalizedQuery) return categoryRows;
    return categoryRows.filter((row) => row.title.toLowerCase().includes(normalizedQuery));
  }, [categoryRows, categoryQuery]);

  const projectRows: ProjectGridRow[] = useMemo(() => {
    const rows: ProjectGridRow[] = [];
    draft.projectCategories.forEach((category, categoryIndex) => {
      const categoryTitle = (category.title ?? "").toString();
      (category.items ?? []).forEach((item, itemIndex) => {
        const name = (item?.name ?? "").toString();
        const description = (item?.description ?? "").toString();
        if (name.trim().length === 0 && description.trim().length === 0) return;
        rows.push({
          id: `cat-${categoryIndex}-item-${itemIndex}`,
          categoryIndex,
          itemIndex,
          category: categoryTitle,
          name,
          description,
        });
      });
    });
    return rows;
  }, [draft.projectCategories]);

  const filteredProjectRows = useMemo(() => {
    let rows = projectRows;
    if (selectedProjectCategoryTags.length > 0) {
      const allowed = new Set(selectedProjectCategoryTags.map((o) => Number(o.value)));
      rows = rows.filter((row) => allowed.has(row.categoryIndex));
    }
    const normalizedQuery = projectQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(normalizedQuery) || row.description.toLowerCase().includes(normalizedQuery)
    );
  }, [projectRows, projectQuery, selectedProjectCategoryTags]);

  const categoryColumns = getCategoryColumns({
    onEditCategory: (row) => {
      setEditTarget({ kind: "category", categoryIndex: row.categoryIndex });
      setCategoryEditTitle(row.title);
      setCategoryEditError(null);
    },
    onDeleteCategory: (row) => setDeleteTarget({ kind: "category", categoryIndex: row.categoryIndex }),
  });

  const projectColumns = getProjectColumns({
    onEditProject: (row) => {
      setIsProjectAddOpen(false);
      setEditTarget({ kind: "project", categoryIndex: row.categoryIndex, itemIndex: row.itemIndex });
      setProjectModalCategoryIndex(row.categoryIndex);
      setProjectModalName(row.name);
      setProjectModalDescription(row.description);
      setProjectError(null);
    },
    onDeleteProject: (row) => setDeleteTarget({ kind: "project", categoryIndex: row.categoryIndex, itemIndex: row.itemIndex }),
  });

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
      nextProfile.projectCategories = nextProfile.projectCategories.filter((_, i) => i !== deleteTarget.categoryIndex);
      await onImmediatePersist(nextProfile, "Category deleted.");
      setDeleteTarget(null);
      setEditTarget(null);
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories[deleteTarget.categoryIndex].items =
      nextProfile.projectCategories[deleteTarget.categoryIndex].items.filter((_, i) => i !== deleteTarget.itemIndex);
    await onImmediatePersist(nextProfile, "Project deleted.");
    setDeleteTarget(null);
    setEditTarget(null);
  };

  const saveProjectEdit = async () => {
    if (!editTarget || editTarget.kind !== "project") return;
    if (projectModalCategoryIndex === null) return;

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
    const { categoryIndex: oldCat, itemIndex: oldIdx } = editTarget;
    const newCat = projectModalCategoryIndex;
    const item = { name: normalizedName, description: normalizedDescription };

    if (oldCat === newCat) {
      nextProfile.projectCategories[oldCat].items[oldIdx] = item;
    } else {
      nextProfile.projectCategories[oldCat].items = nextProfile.projectCategories[oldCat].items.filter((_, i) => i !== oldIdx);
      nextProfile.projectCategories[newCat].items.push(item);
    }

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
        i !== editTarget.categoryIndex && category.title.trim().toLowerCase() === normalized.toLowerCase()
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

  const emptyProjectsMessage =
    draft.projectCategories.length === 0 ? "Add a category, then add projects." : "No projects found.";

  return (
    <Box sx={agenticPageSx.portfolioProjectsEditRoot}>
      <PageHeader title="Projects" subtitle="Manage project categories and items" />

      <Category
        onOpenCategoryModal={openCategoryModal}
        isCategoryModalOpen={isCategoryModalOpen}
        newCategoryName={newCategoryName}
        categoryError={categoryError}
        onNewCategoryNameChange={(value) => {
          setNewCategoryName(value);
          if (categoryError) setCategoryError(null);
        }}
        onCloseCategoryModal={closeCategoryModal}
        onAddCategory={addCategory}
        isPersisting={isPersisting}
        categoryQuery={categoryQuery}
        onCategoryQueryChange={setCategoryQuery}
        filteredCategoryRows={filteredCategoryRows}
        categoryColumns={categoryColumns}
      />

      <Project
        draftHasCategories={draft.projectCategories.length > 0}
        isPersisting={isPersisting}
        onOpenAddProjectModal={openAddProjectModal}
        projectQuery={projectQuery}
        onProjectQueryChange={setProjectQuery}
        selectedProjectCategoryTags={selectedProjectCategoryTags}
        onSelectedProjectCategoryTagsChange={setSelectedProjectCategoryTags}
        categoryAutocompleteOptions={categoryAutocompleteOptions}
        filteredProjectRows={filteredProjectRows}
        projectColumns={projectColumns}
        emptyProjectsMessage={emptyProjectsMessage}
        categoryOptions={categoryOptions}
        isProjectModalOpen={isProjectModalOpen}
        isProjectAddOpen={isProjectAddOpen}
        projectModalCategoryIndex={projectModalCategoryIndex}
        projectModalName={projectModalName}
        projectModalDescription={projectModalDescription}
        projectError={projectError}
        onCloseProjectModal={closeProjectModal}
        onProjectModalCategoryChange={setProjectModalCategoryIndex}
        onProjectModalNameChange={(value) => {
          setProjectModalName(value);
          if (projectError) setProjectError(null);
        }}
        onProjectModalDescriptionChange={(value) => {
          setProjectModalDescription(value);
          if (projectError) setProjectError(null);
        }}
        onSubmitProjectModal={isProjectAddOpen ? addProjectItem : saveProjectEdit}
        projectModalSubmitLabel={isProjectAddOpen ? "Add" : "Save"}
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
        isSubmitting={isPersisting}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={deleteTarget?.kind === "category" ? "Delete category" : "Delete project"}
        message={
          deleteTarget?.kind === "category"
            ? "Are you sure you want to delete this category? Categories cannot be deleted if they have projects."
            : "Are you sure you want to delete this project?"
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isBusy={isPersisting}
      />
    </Box>
  );
}
