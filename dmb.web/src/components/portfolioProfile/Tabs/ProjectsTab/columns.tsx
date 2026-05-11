import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import type { DataTableColumn } from "components/common/Datatable";
import { dataGridRowActionsSx } from "styles/main_style";

export type CategoryGridRow = {
  id: string;
  categoryIndex: number;
  title: string;
  hasProjects: boolean;
};

export type ProjectGridRow = {
  id: string;
  categoryIndex: number;
  itemIndex: number;
  category: string;
  name: string;
  description: string;
};

type CategoryActions = {
  onEditCategory: (row: CategoryGridRow) => void;
  onDeleteCategory: (row: CategoryGridRow) => void;
};

type ProjectActions = {
  onEditProject: (row: ProjectGridRow) => void;
  onDeleteProject: (row: ProjectGridRow) => void;
};

export function getCategoryColumns(actions: CategoryActions): DataTableColumn<CategoryGridRow>[] {
  return [
    { key: "title", header: "Category" },
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
          <Tooltip title="Edit category">
            <IconButton size="small" onClick={() => actions.onEditCategory(row)} aria-label="Edit category">
              <EditTwoToneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.hasProjects ? "Cannot delete category with existing projects" : "Delete category"}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={row.hasProjects}
                onClick={() => actions.onDeleteCategory(row)}
                aria-label="Delete category"
              >
                <DeleteTwoToneIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];
}

export function getProjectColumns(actions: ProjectActions): DataTableColumn<ProjectGridRow>[] {
  return [
    { key: "name", header: "Project Name" },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
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
            <IconButton size="small" onClick={() => actions.onEditProject(row)} aria-label="Edit project">
              <EditTwoToneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => actions.onDeleteProject(row)} aria-label="Delete project">
              <DeleteTwoToneIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];
}
