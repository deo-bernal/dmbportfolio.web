import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";

export default function ProjectsTab({ profile, draft, mode, setDraft, cloneProfile }: TabViewProps) {
  const suggestedCategoryOptions = [
    "🧳 Travel Industry Systems",
    "💰 Finance & Banking Systems",
    "🌐 Web & CMS Platforms",
    "🏢 Enterprise & Business Systems",
    "🛒 E-Commerce & Customer-Facing Apps",
  ];
  const categoryOptions = Array.from(
    new Set([
      ...suggestedCategoryOptions,
      ...draft.projectCategories.map((category) => category.title).filter(Boolean),
    ])
  );

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
      return;
    }

    const alreadyExists = draft.projectCategories.some(
      (category) => category.title.trim().toLowerCase() === normalized.toLowerCase()
    );
    if (alreadyExists) {
      setCategoryError("Category already exists.");
      return;
    }

    setDraft((prev) => ({
      ...prev,
      projectCategories: [
        ...prev.projectCategories,
        { title: normalized, items: [{ name: "", description: "" }] },
      ],
    }));
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
        Add category
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
          <Autocomplete
            freeSolo
            options={categoryOptions}
            value={category.title}
            onChange={(_, value) =>
              setDraft((prev) => {
                const copy = cloneProfile(prev);
                copy.projectCategories[categoryIndex].title = (value ?? "").toString();
                return copy;
              })
            }
            onInputChange={(_, value) =>
              setDraft((prev) => {
                const copy = cloneProfile(prev);
                copy.projectCategories[categoryIndex].title = value;
                return copy;
              })
            }
            renderInput={(params) => <TextField {...params} label="Category title" helperText="Select existing or type a new category" />}
          />
          <Button
            size="small"
            variant="text"
            onClick={() =>
              setDraft((prev) => {
                const copy = cloneProfile(prev);
                copy.projectCategories[categoryIndex].items.push({ name: "", description: "" });
                return copy;
              })
            }
          >
            Add project item
          </Button>
          {category.items.map((item, itemIndex) => (
            <Box key={itemIndex} sx={{ display: "grid", gap: 1 }}>
              <TextField
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
