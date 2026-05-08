import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useSnackbar } from "notistack";
import DataTable from "components/common/Datatable";
import type { TabViewProps } from "../types";
import PageHeader from "../PageHeader";
import getColumns, { type SkillRow } from "./columns";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import SkillModal from "./SkillModal";
import SkillFilter from "./TableSections/SkillFilter";

type DeleteTarget = SkillRow | null;
type EditTarget = SkillRow | null;

export default function SkillsTab({ profile, draft, mode, cloneProfile, onImmediatePersist }: TabViewProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [skillValue, setSkillValue] = useState("");
  const [skillError, setSkillError] = useState<string | null>(null);

  const openAddModal = () => {
    setSkillValue("");
    setSkillError(null);
    setAddOpen(true);
  };

  const closeSkillModal = () => {
    setAddOpen(false);
    setEditTarget(null);
    setSkillValue("");
    setSkillError(null);
  };

  const rows: SkillRow[] = useMemo(
    () =>
      (draft.skills ?? []).map((skill, index) => ({
        id: `${index}-${skill}`,
        index,
        skill,
      })),
    [draft.skills]
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return rows;
    }
    return rows.filter((row) => row.skill.toLowerCase().includes(normalized));
  }, [rows, query]);

  const validateSkill = (value: string, excludeIndex?: number): string | null => {
    const normalized = value.trim();
    if (!normalized) {
      return "New skill is required.";
    }
    const duplicate = (draft.skills ?? []).some(
      (skill, i) => i !== excludeIndex && skill.trim().toLowerCase() === normalized.toLowerCase()
    );
    if (duplicate) {
      return "Skill already exists.";
    }
    return null;
  };

  const addSkill = async () => {
    const error = validateSkill(skillValue);
    if (error) {
      setSkillError(error);
      enqueueSnackbar(error, { variant: "error" });
      return;
    }

    const nextProfile = cloneProfile(draft);
    nextProfile.skills.push(skillValue.trim());
    await onImmediatePersist(nextProfile, "Skill added.");
    closeSkillModal();
  };

  const saveSkillEdit = async () => {
    if (!editTarget) return;
    const error = validateSkill(skillValue, editTarget.index);
    if (error) {
      setSkillError(error);
      enqueueSnackbar(error, { variant: "error" });
      return;
    }
    const nextProfile = cloneProfile(draft);
    nextProfile.skills[editTarget.index] = skillValue.trim();
    await onImmediatePersist(nextProfile, "Skill updated.");
    closeSkillModal();
  };

  const deleteSkill = async () => {
    if (!deleteTarget) return;
    const nextProfile = cloneProfile(draft);
    nextProfile.skills = nextProfile.skills.filter((_, i) => i !== deleteTarget.index);
    await onImmediatePersist(nextProfile, "Skill deleted.");
    setDeleteTarget(null);
  };

  const columns = getColumns({
    onEdit: (row) => {
      setEditTarget(row);
      setSkillValue(row.skill);
      setSkillError(null);
    },
    onDelete: (row) => setDeleteTarget(row),
  });

  if (mode === "view") {
    return (
      <>
        <PageHeader title="Skills" subtitle="Core competencies and technologies" />
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          {profile.skills.map((s, i) => (
            <Box component="li" key={i}>
              {s}
            </Box>
          ))}
        </Box>
      </>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader title="Skills" subtitle="Manage skills" />

      <Button variant="outlined" onClick={openAddModal}>
        Add Skill
      </Button>

      <SkillFilter query={query} onQueryChange={setQuery} />

      <DataTable rows={filteredRows} columns={columns} getRowId={(row) => row.id} emptyMessage="No skills found." />

      <SkillModal
        open={addOpen}
        title="Add skill"
        value={skillValue}
        error={skillError}
        onClose={closeSkillModal}
        onValueChange={(value) => {
          setSkillValue(value);
          if (skillError) setSkillError(null);
        }}
        onSubmit={addSkill}
        submitLabel="Add"
      />

      <SkillModal
        open={Boolean(editTarget)}
        title="Edit skill"
        value={skillValue}
        error={skillError}
        onClose={closeSkillModal}
        onValueChange={(value) => {
          setSkillValue(value);
          if (skillError) setSkillError(null);
        }}
        onSubmit={saveSkillEdit}
      />

      <ConfirmDeleteModal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={deleteSkill} />
    </Box>
  );
}

