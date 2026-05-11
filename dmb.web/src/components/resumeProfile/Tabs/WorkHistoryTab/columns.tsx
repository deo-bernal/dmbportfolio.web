import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import type { DataTableColumn } from "components/common/Datatable";
import { dataGridRowActionsSx } from "styles/main_style";
import { isoDateToAu } from "utils/date";

export type WorkHistoryGridRow = {
  id: string;
  itemIndex: number;
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
  jobDescription: string;
};

type Actions = {
  onEdit: (row: WorkHistoryGridRow) => void;
  onDelete: (row: WorkHistoryGridRow) => void;
};

export default function getColumns(actions: Actions): DataTableColumn<WorkHistoryGridRow>[] {
  return [
    { key: "company", header: "Company" },
    { key: "position", header: "Position" },
    { key: "fromDate", header: "From", render: (row) => isoDateToAu(row.fromDate) },
    { key: "toDate", header: "To", render: (row) => (row.toDate ? isoDateToAu(row.toDate) : "Present") },
    { key: "jobDescription", header: "Description" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Stack
          direction="row"
          spacing={1}
          divider={<Divider orientation="vertical" flexItem sx={dataGridRowActionsSx.stackDivider} />}
          sx={dataGridRowActionsSx.stack}
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

