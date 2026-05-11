import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutocompleteFilter, { type AutocompleteFilterOption } from "components/common/Filter/AutocompleteFilter/AutocompleteFilter";
import { tableFilterSx } from "styles/main_style";

export type { AutocompleteFilterOption };

type ProjectFilterProps = {
  projectQuery: string;
  onProjectQueryChange: (value: string) => void;
  selectedProjectCategoryTags: AutocompleteFilterOption[];
  onSelectedProjectCategoryTagsChange: (event: SyntheticEvent, value: AutocompleteFilterOption[]) => void;

  categoryOptions: AutocompleteFilterOption[];
};

export default function ProjectFilter({
  projectQuery,
  onProjectQueryChange,
  selectedProjectCategoryTags,
  onSelectedProjectCategoryTagsChange,
  categoryOptions,
}: ProjectFilterProps) {
  const [open, setOpen] = useState(true);
  const projectSearchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      projectSearchRef.current?.focus();
    }
  }, [open]);

  return (
    <Card sx={tableFilterSx.card}>
      {!open ? (
        <Typography onClick={() => setOpen(true)} sx={tableFilterSx.title}>
          Show project filters
        </Typography>
      ) : null}
      <Collapse in={open} sx={tableFilterSx.collapse}>
        <Box sx={tableFilterSx.inner}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}>
                Projects
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                  alignItems: { xs: "stretch", md: "flex-start" },
                }}
              >
                <TextField
                  fullWidth
                  inputRef={projectSearchRef}
                  label="Search projects"
                  placeholder="Filter by project name or description"
                  value={projectQuery}
                  onChange={(e) => onProjectQueryChange(e.target.value)}
                />
                <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 260 } }}>
                  <AutocompleteFilter
                    options={categoryOptions}
                    value={selectedProjectCategoryTags}
                    onChange={onSelectedProjectCategoryTagsChange}
                    label="Category"
                    placeholder="Filter projects by category…"
                    limitTags={6}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Collapse>
      <IconButton onClick={() => setOpen((prev) => !prev)} sx={tableFilterSx.toggleIcon} aria-label="Toggle filters">
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Card>
  );
}
