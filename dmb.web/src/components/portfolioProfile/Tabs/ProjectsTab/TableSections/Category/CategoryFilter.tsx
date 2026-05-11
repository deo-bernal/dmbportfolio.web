import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tableFilterSx } from "styles/main_style";

type CategoryFilterProps = {
  categoryQuery: string;
  onCategoryQueryChange: (value: string) => void;
};

export default function CategoryFilter({
  categoryQuery,
  onCategoryQueryChange
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
