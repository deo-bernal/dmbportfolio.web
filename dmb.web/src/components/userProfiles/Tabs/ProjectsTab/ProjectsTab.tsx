import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "notistack";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";

export default function ProjectsTab({ profile, draft, mode, setDraft, cloneProfile }: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const openCategoryModal = () => {
    setNewCategoryName("");
    setCategoryError(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryError(null);
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
      {draft.projectCategories.map((category, categoryIndex) => (
        <Box key={categoryIndex} sx={{ display: "grid", gap: 1.5 }}>
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
            onClick={() => {
              setDraft((prev) => {
                const copy = cloneProfile(prev);
                copy.projectCategories[categoryIndex].items.push({ name: "", description: "" });
                return copy;
              });
              enqueueSnackbar("Project row added.", { variant: "success" });
            }}
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
        </Box>
      ))}
    </Box>
  );
}
