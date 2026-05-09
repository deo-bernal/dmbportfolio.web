import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useMemo, useState } from "react";
import * as Yup from "yup";
import DataTable from "components/common/Datatable";
import { educationItemFormSchema } from "validations/schema/educationTab";
import type { ResumeTabProps } from "../types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EducationModal, { type EducationFieldKey } from "./EducationModal";
import getColumns, { type EducationGridRow } from "./columns";
import EducationFilter from "./TableSections/EducationFilter";

function mapYupFieldErrors(error: Yup.ValidationError): Partial<Record<EducationFieldKey, string>> {
  const out: Partial<Record<EducationFieldKey, string>> = {};
  for (const err of error.inner) {
    const path = err.path as EducationFieldKey | undefined;
    if (path && out[path] === undefined) {
      out[path] = err.message;
    }
  }
  if (Object.keys(out).length === 0) {
    const path = error.path as EducationFieldKey | undefined;
    if (path) {
      out[path] = error.message;
    } else if (error.message) {
      out.school = error.message;
    }
  }
  return out;
}

export default function EducationTab({ draft, setDraft, onImmediateSave }: ResumeTabProps) {
  const [query, setQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [school, setSchool] = useState("");
  const [address, setAddress] = useState("");
  const [courseTaken, setCourseTaken] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EducationFieldKey, string>>>({});

  const clearFieldError = (key: EducationFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setSchool("");
    setAddress("");
    setCourseTaken("");
    setStartDate("");
    setEndDate("");
    setFieldErrors({});
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditIndex(null);
    resetForm();
  };

  const getFormValues = () => ({
    school: school.trim(),
    address: address.trim(),
    courseTaken: courseTaken.trim(),
    startDate: startDate.trim(),
    endDate: endDate.trim(),
  });

  const validate = (): boolean => {
    try {
      educationItemFormSchema.validateSync(getFormValues(), { abortEarly: false });
      setFieldErrors({});
      return true;
    } catch (e) {
      if (e instanceof Yup.ValidationError) {
        setFieldErrors(mapYupFieldErrors(e));
      }
      return false;
    }
  };

  const persistDraft = async (nextDraft: typeof draft) => {
    if (!onImmediateSave) {
      setDraft(nextDraft);
      return;
    }
    setIsPersisting(true);
    try {
      await onImmediateSave(nextDraft);
    } finally {
      setIsPersisting(false);
    }
  };

  const openAdd = () => {
    resetForm();
    setDeleteIndex(null);
    setIsAddModalOpen(true);
  };

  const openEdit = (row: EducationGridRow) => {
    const item = draft.education[row.itemIndex];
    if (!item) return;

    setIsAddModalOpen(false);
    setEditIndex(row.itemIndex);
    setDeleteIndex(null);

    setSchool(item.school ?? "");
    setAddress(item.address ?? "");
    setCourseTaken(item.courseTaken ?? "");
    setStartDate(item.startDate ?? "");
    setEndDate(item.endDate ?? "");
    setFieldErrors({});
  };

  const addItem = async () => {
    if (!validate()) return;

    const v = getFormValues();
    const nextDraft = {
      ...draft,
      education: [...draft.education, { school: v.school, address: v.address, courseTaken: v.courseTaken, startDate: v.startDate, endDate: v.endDate }],
    };

    try {
      await persistDraft(nextDraft);
      closeModal();
    } catch {
      // Error surfaced in ResumeProfileTabs
    }
  };

  const saveEdit = async () => {
    if (editIndex === null) return;
    if (!validate()) return;

    const v = getFormValues();
    const nextDraft = {
      ...draft,
      education: draft.education.map((item, i) =>
        i === editIndex ? { school: v.school, address: v.address, courseTaken: v.courseTaken, startDate: v.startDate, endDate: v.endDate } : item
      ),
    };

    try {
      await persistDraft(nextDraft);
      closeModal();
    } catch {
      // Error surfaced in ResumeProfileTabs
    }
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;

    const nextDraft = {
      ...draft,
      education: draft.education.filter((_, i) => i !== deleteIndex),
    };

    if (onImmediateSave) {
      setIsDeleting(true);
      try {
        await onImmediateSave(nextDraft);
      } finally {
        setIsDeleting(false);
      }
    } else {
      setDraft(nextDraft);
    }

    setDeleteIndex(null);
    if (editIndex === deleteIndex) {
      closeModal();
    }
  };

  const rows: EducationGridRow[] = useMemo(() => {
    return (draft.education ?? []).map((item, itemIndex) => ({
      id: `edu-${itemIndex}`,
      itemIndex,
      school: (item.school ?? "").toString(),
      address: (item.address ?? "").toString(),
      courseTaken: (item.courseTaken ?? "").toString(),
      startDate: (item.startDate ?? "").toString(),
      endDate: (item.endDate ?? "").toString(),
    })).filter((row) => {
      const allEmpty =
        row.school.trim().length === 0 &&
        row.address.trim().length === 0 &&
        row.courseTaken.trim().length === 0 &&
        row.startDate.trim().length === 0 &&
        row.endDate.trim().length === 0;
      return !allEmpty;
    });
  }, [draft.education]);

  const columns = getColumns({
    onEdit: openEdit,
    onDelete: (row) => setDeleteIndex(row.itemIndex),
  });

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        row.school.toLowerCase().includes(q) ||
        row.address.toLowerCase().includes(q) ||
        row.courseTaken.toLowerCase().includes(q) ||
        row.startDate.toLowerCase().includes(q) ||
        row.endDate.toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Button variant="outlined" onClick={openAdd} fullWidth>
        Add Education
      </Button>

      <EducationFilter query={query} onQueryChange={setQuery} />

      <DataTable rows={filteredRows} columns={columns} getRowId={(row) => row.id} emptyMessage="No education rows found." />

      <EducationModal
        open={isAddModalOpen}
        title="Add education"
        school={school}
        address={address}
        courseTaken={courseTaken}
        startDate={startDate}
        endDate={endDate}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onSchoolChange={(v) => {
          setSchool(v);
          clearFieldError("school");
        }}
        onAddressChange={(v) => {
          setAddress(v);
          clearFieldError("address");
        }}
        onCourseTakenChange={(v) => {
          setCourseTaken(v);
          clearFieldError("courseTaken");
        }}
        onStartDateChange={(v) => {
          setStartDate(v);
          clearFieldError("startDate");
        }}
        onEndDateChange={(v) => {
          setEndDate(v);
          clearFieldError("endDate");
        }}
        onSubmit={addItem}
        submitLabel="Add"
        isSubmitting={isPersisting && isAddModalOpen}
      />

      <EducationModal
        open={editIndex !== null}
        title="Edit education"
        school={school}
        address={address}
        courseTaken={courseTaken}
        startDate={startDate}
        endDate={endDate}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onSchoolChange={(v) => {
          setSchool(v);
          clearFieldError("school");
        }}
        onAddressChange={(v) => {
          setAddress(v);
          clearFieldError("address");
        }}
        onCourseTakenChange={(v) => {
          setCourseTaken(v);
          clearFieldError("courseTaken");
        }}
        onStartDateChange={(v) => {
          setStartDate(v);
          clearFieldError("startDate");
        }}
        onEndDateChange={(v) => {
          setEndDate(v);
          clearFieldError("endDate");
        }}
        onSubmit={saveEdit}
        isSubmitting={isPersisting && editIndex !== null}
      />

      <ConfirmDeleteModal
        open={deleteIndex !== null}
        title="Delete education"
        message="Are you sure you want to delete this education item?"
        isBusy={isDeleting}
        onClose={() => {
          if (!isDeleting) setDeleteIndex(null);
        }}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
