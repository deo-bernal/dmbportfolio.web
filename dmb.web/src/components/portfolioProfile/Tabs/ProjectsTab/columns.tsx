import AddTwoToneIcon from "@mui/icons-material/AddTwoTone";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import type { DataTableColumn } from "components/common/Datatable";

export type CategoryGridRow = {
  kind: "category";
  id: string;
  categoryIndex: number;
  category: string;
  name: string; // used by DataTable column mapping
  description: string; // used by DataTable column mapping
  hasProjects: boolean;
};

export type ProjectGridRow = {
  kind: "project";
  id: string;
  categoryIndex: number;
  itemIndex: number;
  category: string;
  name: string;
  description: string;
};

export type ProjectsGridRow = CategoryGridRow | ProjectGridRow;

type Actions = {
  onEditCategory: (row: CategoryGridRow) => void;
  onDeleteCategory: (row: CategoryGridRow) => void;
  onAddProjectItem: (categoryIndex: number) => void;
  onEditProject: (row: ProjectGridRow) => void;
  onDeleteProject: (row: ProjectGridRow) => void;
};

export default function getColumns(actions: Actions): DataTableColumn<ProjectsGridRow>[] {
  return [
    { key: "category", header: "Category" },
    { key: "name", header: "Project Name" },
    { key: "description", header: "Description" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        if (row.kind === "category") {
          return (
            <Stack
              direction="row"
              spacing={1}
              divider={<Divider orientation="vertical" flexItem sx={{ alignSelf: "stretch", my: 0.5 }} />}
              sx={{ flexWrap: "wrap" }}
            >
              <Tooltip title="Edit category">
                <IconButton size="small" onClick={() => actions.onEditCategory(row)} aria-label="Edit category">
                  <EditTwoToneIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={row.hasProjects ? "Cannot delete category with projects" : "Delete category"}>
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
              <Tooltip title="Add item">
                <IconButton size="small" onClick={() => actions.onAddProjectItem(row.categoryIndex)} aria-label="Add item">
                  <AddTwoToneIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        }

        return (
          <Stack
            direction="row"
            spacing={1}
            divider={<Divider orientation="vertical" flexItem sx={{ alignSelf: "stretch", my: 0.5 }} />}
            sx={{ flexWrap: "wrap" }}
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
        );
      },
    },
  ];
}

