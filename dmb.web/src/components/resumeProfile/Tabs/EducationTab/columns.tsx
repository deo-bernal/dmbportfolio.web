import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import type { DataTableColumn } from "components/common/Datatable";
import { isoDateToAu } from "utils/date";

export type EducationGridRow = {
  id: string;
  itemIndex: number;
  school: string;
  address: string;
  courseTaken: string;
  startDate: string;
  endDate: string;
};

type Actions = {
  onEdit: (row: EducationGridRow) => void;
  onDelete: (row: EducationGridRow) => void;
};

export default function getColumns(actions: Actions): DataTableColumn<EducationGridRow>[] {
  return [
    { key: "school", header: "School" },
    { key: "address", header: "Address" },
    { key: "courseTaken", header: "Course" },
    { key: "startDate", header: "Start", render: (row) => isoDateToAu(row.startDate) },
    { key: "endDate", header: "End", render: (row) => isoDateToAu(row.endDate) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Stack
          direction="row"
          spacing={1}
          divider={<Divider orientation="vertical" flexItem sx={{ alignSelf: "stretch", my: 0.5 }} />}
          sx={{ flexWrap: "wrap" }}
        >
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => actions.onEdit(row)} aria-label="Edit">
              <EditTwoToneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => actions.onDelete(row)} aria-label="Delete">
              <DeleteTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];
}
