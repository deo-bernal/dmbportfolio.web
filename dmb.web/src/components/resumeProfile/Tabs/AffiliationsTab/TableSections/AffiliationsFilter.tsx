import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tableFilterSx } from "styles/main_style";

type AffiliationsFilterProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export default function AffiliationsFilter({ query, onQueryChange }: AffiliationsFilterProps) {
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <Card sx={tableFilterSx.card}>
      {!open ? (
        <Typography onClick={() => setOpen(true)} sx={tableFilterSx.title}>
          Show affiliations filters
        </Typography>
      ) : null}
      <Collapse in={open} sx={tableFilterSx.collapse}>
        <Box sx={tableFilterSx.inner}>
          <TextField
            fullWidth
            inputRef={inputRef}
            label="Filter affiliations"
            placeholder="Search by organization, title, date, or details"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </Box>
      </Collapse>
      <IconButton onClick={() => setOpen((prev) => !prev)} sx={tableFilterSx.toggleIcon}>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Card>
  );
}

