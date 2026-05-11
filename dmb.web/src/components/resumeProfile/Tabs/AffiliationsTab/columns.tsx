import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import type { DataTableColumn } from "components/common/Datatable";
import { dataGridRowActionsSx } from "styles/main_style";
import { isoDateToAu } from "utils/date";

export type AffiliationGridRow = {
  id: string;
  itemIndex: number;
  organization: string;
  title: string;
  issueDate: string;
  details: string;
};

type Actions = {
  onEdit: (row: AffiliationGridRow) => void;
  onDelete: (row: AffiliationGridRow) => void;
};

export default function getColumns(actions: Actions): DataTableColumn<AffiliationGridRow>[] {
  return [
    { key: "organization", header: "Organization" },
    { key: "title", header: "Title" },
    { key: "issueDate", header: "Issue Date", render: (row) => isoDateToAu(row.issueDate) },
    { key: "details", header: "Details" },
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

