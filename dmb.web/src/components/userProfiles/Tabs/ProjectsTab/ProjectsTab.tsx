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
import type { TabViewProps } from "../types";

export default function ProjectsTab({ profile, draft, mode, setDraft, cloneProfile }: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

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
    if (!normalized) {
      setCategoryError("Category name is required.");
      enqueueSnackbar("Category name is required.", { variant: "error" });
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
    if (!normalizedName && !normalizedDescription) {
      setProjectError("Project name or description is required.");
      enqueueSnackbar("Project name or description is required.", { variant: "error" });
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
              onClick={() => {
                const hasLinkedProjects = category.items.some((item) => item.name.trim().length > 0);
                if (hasLinkedProjects) {
                  enqueueSnackbar("Cannot delete category with existing projects.", { variant: "error" });
                  return;
                }
                setDraft((prev) => {
                  const copy = cloneProfile(prev);
                  copy.projectCategories = copy.projectCategories.filter((_, i) => i !== categoryIndex);
                  return copy;
                });
                enqueueSnackbar("Category deleted.", { variant: "success" });
              }}
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
                  onClick={() => {
                    setDraft((prev) => {
                      const copy = cloneProfile(prev);
                      copy.projectCategories[categoryIndex].items = copy.projectCategories[categoryIndex].items.filter(
                        (_, i) => i !== itemIndex
                      );
                      return copy;
                    });
                    enqueueSnackbar("Project deleted.", { variant: "success" });
                  }}
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
