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

type CategoryFilterProps = {
  categoryQuery: string;
  onCategoryQueryChange: (value: string) => void;
  selectedCategoryTags: AutocompleteFilterOption[];
  onSelectedCategoryTagsChange: (event: SyntheticEvent, value: AutocompleteFilterOption[]) => void;

  categoryOptions: AutocompleteFilterOption[];
};

export default function CategoryFilter({
  categoryQuery,
  onCategoryQueryChange,
  selectedCategoryTags,
  onSelectedCategoryTagsChange,
  categoryOptions,
}: CategoryFilterProps) {
  const [open, setOpen] = useState(true);
  const categorySearchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      categorySearchRef.current?.focus();
    }
  }, [open]);

  return (
    <Card sx={tableFilterSx.card}>
      {!open ? (
        <Typography onClick={() => setOpen(true)} sx={tableFilterSx.title}>
          Show category
        </Typography>
      ) : null}
      <Collapse in={open} sx={tableFilterSx.collapse}>
        <Box sx={tableFilterSx.inner}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}>
                Categories
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
                  inputRef={categorySearchRef}
                  label="Search categories"
                  placeholder="Filter by category name"
                  value={categoryQuery}
                  onChange={(e) => onCategoryQueryChange(e.target.value)}
                />
                {/* <Box sx={{ flex: 1, minWidth: { xs: "100%", md: 260 } }}>
                  <AutocompleteFilter
                    options={categoryOptions}
                    value={selectedCategoryTags}
                    onChange={onSelectedCategoryTagsChange}
                    label="Categories"
                    placeholder="Select categories to show…"
                    limitTags={4}
                  />
                </Box> */}
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
