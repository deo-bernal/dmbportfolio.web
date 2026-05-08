import Button from "@mui/material/Button";
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
            <>
              <Button size="small" onClick={() => actions.onEditCategory(row)}>
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                disabled={row.hasProjects}
                onClick={() => actions.onDeleteCategory(row)}
              >
                Delete
              </Button>
              <Button size="small" onClick={() => actions.onAddProjectItem(row.categoryIndex)}>
                Add Item
              </Button>
            </>
          );
        }

        return (
          <>
            <Button size="small" onClick={() => actions.onEditProject(row)}>
              Edit
            </Button>
            <Button size="small" color="error" onClick={() => actions.onDeleteProject(row)}>
              Delete
            </Button>
          </>
        );
      },
    },
  ];
}
