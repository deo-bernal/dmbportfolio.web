import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "notistack";
import { agenticPageSx } from "styles/main_style";
import { addCategorySchema, addProjectItemSchema } from "validations/schema/projectsTab";
import type { TabViewProps } from "../types";

type DeleteTarget =
  | { type: "category"; categoryIndex: number }
  | { type: "project"; categoryIndex: number; itemIndex: number };

export default function ProjectsTab({
  profile,
  draft,
  mode,
  setDraft,
  cloneProfile,
  onImmediatePersist,
}: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const openCategoryModal = () => {
    setNewCategoryName("");
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryError(null);
  };

  const openProjectModal = (categoryIndex: number) => {
    setActiveCategoryIndex(categoryIndex);
    setNewProjectName("");
    setNewProjectDescription("");
    setProjectError(null);
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setActiveCategoryIndex(null);
    setProjectError(null);
  };

  const addCategory = () => {
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

    setDraft((prev) => ({
      ...prev,
      projectCategories: [
        ...prev.projectCategories,
        { title: normalized, items: [{ name: "", description: "" }] },
      ],
    }));
    enqueueSnackbar("Category added.", { variant: "success" });
    setIsCategoryModalOpen(false);
    setCategoryError(null);
  };

  const addProjectItem = () => {
    if (activeCategoryIndex === null) {
      return;
    }

    const normalizedName = newProjectName.trim();
    const normalizedDescription = newProjectDescription.trim();
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

    setDraft((prev) => {
      const copy = cloneProfile(prev);
      copy.projectCategories[activeCategoryIndex].items.push({
        name: normalizedName,
        description: normalizedDescription,
      });
      return copy;
    });
    enqueueSnackbar("Project item added.", { variant: "success" });
    closeProjectModal();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "category") {
      const targetCategory = draft.projectCategories[deleteTarget.categoryIndex];
      if (targetCategory?.items.some((item) => item.name.trim().length > 0)) {
        enqueueSnackbar("Cannot delete category with existing projects.", { variant: "error" });
        setDeleteTarget(null);
        return;
      }
      const nextProfile = cloneProfile(draft);
      nextProfile.projectCategories = nextProfile.projectCategories.filter(
        (_, i) => i !== deleteTarget.categoryIndex
      );
      setDraft(nextProfile);
      setDeleteTarget(null);
      await onImmediatePersist(nextProfile, "Category deleted.");
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.projectCategories[deleteTarget.categoryIndex].items = nextProfile.projectCategories[
      deleteTarget.categoryIndex
    ].items.filter((_, i) => i !== deleteTarget.itemIndex);
    setDraft(nextProfile);
    setDeleteTarget(null);
    await onImmediatePersist(nextProfile, "Project deleted.");
  };

  if (mode === "view") {
    return (
      <>
        {profile.projectCategories.map((category, i) => (
          <Box component="section" key={i} sx={i === profile.projectCategories.length - 1 ? undefined : agenticPageSx.projectSectionSpaced}>
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
      <Button
        variant="outlined"
        onClick={openCategoryModal}
      >
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
      <Dialog open={isProjectModalOpen} onClose={closeProjectModal} fullWidth maxWidth="sm">
        <DialogTitle>Add project item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="Project name"
            value={newProjectName}
            onChange={(e) => {
              setNewProjectName(e.target.value);
              if (projectError) setProjectError(null);
            }}
          />
          <TextField
            margin="dense"
            fullWidth
            multiline
            minRows={3}
            label="Project description"
            value={newProjectDescription}
            error={Boolean(projectError)}
            helperText={projectError ?? ""}
            onChange={(e) => {
              setNewProjectDescription(e.target.value);
              if (projectError) setProjectError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                addProjectItem();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProjectModal}>Cancel</Button>
          <Button variant="contained" onClick={addProjectItem}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {deleteTarget?.type === "category" ? "Delete category" : "Delete project"}
        </DialogTitle>
        <DialogContent>
          {deleteTarget?.type === "category"
            ? "Are you sure you want to delete this category?"
            : "Are you sure you want to delete this project?"}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {draft.projectCategories.map((category, categoryIndex) => (
        <Paper
          key={categoryIndex}
          variant="outlined"
          sx={{ display: "grid", gap: 1.5, p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <TextField
              fullWidth
              label="Category title"
              value={category.title}
              onChange={(e) =>
                setDraft((prev) => {
                  const copy = cloneProfile(prev);
                  copy.projectCategories[categoryIndex].title = e.target.value;
                  return copy;
                })
              }
            />
            <IconButton
              aria-label="Delete category"
              color="error"
              disabled={category.items.some((item) => item.name.trim().length > 0)}
              onClick={() => setDeleteTarget({ type: "category", categoryIndex })}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Button
            size="small"
            variant="text"
            onClick={() => openProjectModal(categoryIndex)}
          >
            Add project item
          </Button>
          {category.items.map((item, itemIndex) => (
            <Box key={itemIndex} sx={{ display: "grid", gap: 1 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  fullWidth
                  label="Project name"
                  value={item.name}
                  onChange={(e) =>
                    setDraft((prev) => {
                      const copy = cloneProfile(prev);
                      copy.projectCategories[categoryIndex].items[itemIndex].name = e.target.value;
                      return copy;
                    })
                  }
                />
                <IconButton
                  aria-label="Delete project"
                  color="error"
                  onClick={() => setDeleteTarget({ type: "project", categoryIndex, itemIndex })}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                label="Project description"
                multiline
                minRows={2}
                value={item.description}
                onChange={(e) =>
                  setDraft((prev) => {
                    const copy = cloneProfile(prev);
                    copy.projectCategories[categoryIndex].items[itemIndex].description = e.target.value;
                    return copy;
                  })
                }
              />
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
}
