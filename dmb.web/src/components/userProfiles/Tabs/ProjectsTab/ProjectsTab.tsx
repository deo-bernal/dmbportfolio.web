import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";

export default function ProjectsTab({ profile, draft, mode, setDraft, cloneProfile }: TabViewProps) {
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
        onClick={() =>
          setDraft((prev) => ({
            ...prev,
            projectCategories: [...prev.projectCategories, { title: "", items: [{ name: "", description: "" }] }],
          }))
        }
      >
        Add category
      </Button>
      {draft.projectCategories.map((category, categoryIndex) => (
        <Box key={categoryIndex} sx={{ display: "grid", gap: 1.5 }}>
          <TextField
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
