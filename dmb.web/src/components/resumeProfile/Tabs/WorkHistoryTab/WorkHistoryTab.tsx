import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import DataTable from "components/common/Datatable";
import type { ResumeTabProps } from "../types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import WorkHistoryModal, { type WorkHistoryFieldKey } from "./WorkHistoryModal";
import getColumns, { type WorkHistoryGridRow } from "./columns";
import WorkHistoryFilter from "./TableSections/WorkHistoryFilter";
import { agenticPageSx } from "styles/main_style";
import * as Yup from "yup";
import { workHistoryItemFormSchema } from "validations/schema/workHistoryTab";

export default function WorkHistoryTab({ draft, setDraft, onImmediateSave }: ResumeTabProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<WorkHistoryFieldKey, string>>>({});

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setFromDate("");
    setToDate("");
    setJobDescription("");
    setFieldErrors({});
  };

  const WORK_HISTORY_FIELD_KEYS: WorkHistoryFieldKey[] = ["company", "position", "fromDate", "toDate", "jobDescription"];

  const clearFieldError = (key: WorkHistoryFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const mapYupFieldErrors = (error: Yup.ValidationError): Partial<Record<WorkHistoryFieldKey, string>> => {
    const out: Partial<Record<WorkHistoryFieldKey, string>> = {};
    for (const err of error.inner.length > 0 ? error.inner : [error]) {
      const path = err.path as WorkHistoryFieldKey | undefined;
      if (path && WORK_HISTORY_FIELD_KEYS.includes(path) && out[path] === undefined) {
        out[path] = err.message;
      }
    }
    return out;
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditIndex(null);
    resetForm();
  };

  const validate = () => {
    try {
      workHistoryItemFormSchema.validateSync(
        {
          company: company.trim(),
          position: position.trim(),
          fromDate: fromDate.trim(),
          toDate: toDate.trim(),
          jobDescription: jobDescription.trim(),
        },
        { abortEarly: false }
      );
      setFieldErrors({});
      return null;
    } catch (e) {
      if (e instanceof Yup.ValidationError) {
        setFieldErrors(mapYupFieldErrors(e));
        const firstInner = e.inner.find(Boolean);
        return firstInner?.message ?? e.message ?? "Please review the form fields.";
      }
      return "Please review the form fields.";
    }
  };

  const openAdd = () => {
    resetForm();
    setDeleteIndex(null);
    setIsAddModalOpen(true);
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

  const openEdit = (row: WorkHistoryGridRow) => {
    const item = draft.workHistory[row.itemIndex];
    if (!item) return;

    setIsAddModalOpen(false);
    setEditIndex(row.itemIndex);
    setDeleteIndex(null);

    setCompany(item.company ?? "");
    setPosition(item.position ?? "");
    setFromDate(item.fromDate ?? "");
    setToDate(item.toDate ?? "");
    setJobDescription(item.jobDescription ?? "");
    setFieldErrors({});
  };

  const addItem = async () => {
    const error = validate();
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      return;
    }

    const nextDraft = {
      ...draft,
      workHistory: [
        ...draft.workHistory,
        {
          company: company.trim(),
          position: position.trim(),
          fromDate: fromDate.trim(),
          toDate: toDate.trim(),
          jobDescription: jobDescription.trim(),
        },
      ],
    };
    try {
      await persistDraft(nextDraft);
      enqueueSnackbar("Work history added.", { variant: "success" });
      closeModal();
    } catch {
      // Error surfaced in ResumeProfileTabs
    }
  };

  const saveEdit = async () => {
    if (editIndex === null) return;
    const error = validate();
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      return;
    }

    const nextDraft = {
      ...draft,
      workHistory: draft.workHistory.map((item, i) =>
        i === editIndex
          ? {
              company: company.trim(),
              position: position.trim(),
              fromDate: fromDate.trim(),
              toDate: toDate.trim(),
              jobDescription: jobDescription.trim(),
            }
          : item
      ),
    };
    try {
      await persistDraft(nextDraft);
      enqueueSnackbar("Work history updated.", { variant: "success" });
      closeModal();
    } catch {
      // Error surfaced in ResumeProfileTabs
    }
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;

    const nextDraft = {
      ...draft,
      workHistory: draft.workHistory.filter((_, i) => i !== deleteIndex),
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

    enqueueSnackbar("Work history deleted.", { variant: "success" });
    setDeleteIndex(null);
    if (editIndex === deleteIndex) {
      closeModal();
    }
  };

  const rows: WorkHistoryGridRow[] = useMemo(() => {
    return (draft.workHistory ?? [])
      .map((item, itemIndex) => ({
        id: `wh-${itemIndex}`,
        itemIndex,
        company: (item.company ?? "").toString(),
        position: (item.position ?? "").toString(),
        fromDate: (item.fromDate ?? "").toString(),
        toDate: (item.toDate ?? "").toString(),
        jobDescription: (item.jobDescription ?? "").toString(),
      }))
      .filter((row) => {
        const allEmpty =
          row.company.trim().length === 0 &&
          row.position.trim().length === 0 &&
          row.fromDate.trim().length === 0 &&
          row.toDate.trim().length === 0 &&
          row.jobDescription.trim().length === 0;
        return !allEmpty;
      });
  }, [draft.workHistory]);

  const columns = getColumns({
    onEdit: openEdit,
    onDelete: (row) => setDeleteIndex(row.itemIndex),
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => {
      return (
        row.company.toLowerCase().includes(normalizedQuery) ||
        row.position.toLowerCase().includes(normalizedQuery) ||
        row.fromDate.toLowerCase().includes(normalizedQuery) ||
        row.toDate.toLowerCase().includes(normalizedQuery) ||
        row.jobDescription.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [rows, query]);

  return (
    <Box sx={agenticPageSx.editGrid}>
      <Button variant="outlined" onClick={openAdd} fullWidth>
        Add Work History
      </Button>

      <WorkHistoryFilter query={query} onQueryChange={setQuery} />

      <DataTable
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.id}
        emptyMessage="No work history rows found."
      />

      <WorkHistoryModal
        open={isAddModalOpen}
        title="Add work history"
        company={company}
        position={position}
        fromDate={fromDate}
        toDate={toDate}
        jobDescription={jobDescription}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onCompanyChange={(value) => {
          setCompany(value);
          clearFieldError("company");
        }}
        onPositionChange={(value) => {
          setPosition(value);
          clearFieldError("position");
        }}
        onFromDateChange={(value) => {
          setFromDate(value);
          clearFieldError("fromDate");
        }}
        onToDateChange={(value) => {
          setToDate(value);
          clearFieldError("toDate");
        }}
        onJobDescriptionChange={(value) => {
          setJobDescription(value);
          clearFieldError("jobDescription");
        }}
        onSubmit={addItem}
        submitLabel="Add"
        isSubmitting={isPersisting && isAddModalOpen}
      />

      <WorkHistoryModal
        open={editIndex !== null}
        title="Edit work history"
        company={company}
        position={position}
        fromDate={fromDate}
        toDate={toDate}
        jobDescription={jobDescription}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onCompanyChange={(value) => {
          setCompany(value);
          clearFieldError("company");
        }}
        onPositionChange={(value) => {
          setPosition(value);
          clearFieldError("position");
        }}
        onFromDateChange={(value) => {
          setFromDate(value);
          clearFieldError("fromDate");
        }}
        onToDateChange={(value) => {
          setToDate(value);
          clearFieldError("toDate");
        }}
        onJobDescriptionChange={(value) => {
          setJobDescription(value);
          clearFieldError("jobDescription");
        }}
        onSubmit={saveEdit}
        isSubmitting={isPersisting && editIndex !== null}
      />

      <ConfirmDeleteModal
        open={deleteIndex !== null}
        title="Delete work history"
        message="Are you sure you want to delete this work history item?"
        isBusy={isDeleting}
        onClose={() => {
          if (!isDeleting) setDeleteIndex(null);
        }}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
