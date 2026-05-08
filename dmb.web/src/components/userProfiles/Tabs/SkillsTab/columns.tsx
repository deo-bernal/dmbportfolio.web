import Button from "@mui/material/Button";
import type { DataTableColumn } from "components/common/Datatable";

export type SkillRow = {
  id: string;
  index: number;
  skill: string;
};

type Actions = {
  onEdit: (row: SkillRow) => void;
  onDelete: (row: SkillRow) => void;
};

export default function getColumns(actions: Actions): DataTableColumn<SkillRow>[] {
  return [
    { key: "skill", header: "Skill" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <>
          <Button size="small" onClick={() => actions.onEdit(row)}>
            Edit
          </Button>
          <Button size="small" color="error" onClick={() => actions.onDelete(row)}>
            Delete
          </Button>
        </>
      ),
    },
  ];
}
