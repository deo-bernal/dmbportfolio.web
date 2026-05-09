import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type WorkHistoryFilterProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export default function WorkHistoryFilter({ query, onQueryChange }: WorkHistoryFilterProps) {
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <Card sx={{ p: 2, display: "flex", alignItems: "center" }}>
      {!open ? (
        <Typography onClick={() => setOpen(true)} sx={{ cursor: "pointer", flex: 1, fontWeight: 600, color: "#475569" }}>
          Show work history filters
        </Typography>
      ) : null}
      <Collapse in={open} sx={{ width: "100%" }}>
        <Box sx={{ width: "100%" }}>
          <TextField
            fullWidth
            inputRef={inputRef}
            label="Filter work history"
            placeholder="Search by company, position, dates, or description"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </Box>
      </Collapse>
      <IconButton onClick={() => setOpen((prev) => !prev)} sx={{ ml: 1 }}>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Card>
  );
}

