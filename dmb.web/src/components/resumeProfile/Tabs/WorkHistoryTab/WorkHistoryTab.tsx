import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import DataTable from "components/common/Datatable";
import type { ResumeTabProps } from "../types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import WorkHistoryModal from "./WorkHistoryModal";
import getColumns, { type WorkHistoryGridRow } from "./columns";
import WorkHistoryFilter from "./TableSections/WorkHistoryFilter";

export default function WorkHistoryTab({ draft, setDraft }: ResumeTabProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setFromDate("");
    setToDate("");
    setJobDescription("");
    setFormError(null);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditIndex(null);
    resetForm();
  };

  const validate = () => {
    const normalizedCompany = company.trim();
    const normalizedPosition = position.trim();
    const normalizedDescription = jobDescription.trim();

    if (!normalizedCompany || !normalizedPosition) {
      return "Company and position are required.";
    }
    if (normalizedDescription.length > 2000) {
      return "Job description is too long.";
    }
    return null;
  };

  const openAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
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
    setFormError(null);
  };

  const addItem = () => {
    const error = validate();
    if (error) {
      setFormError(error);
      enqueueSnackbar(error, { variant: "error" });
      return;
    }

    setDraft((prev) => ({
      ...prev,
      workHistory: [
        ...prev.workHistory,
        { company: company.trim(), position: position.trim(), fromDate: fromDate.trim(), toDate: toDate.trim(), jobDescription: jobDescription.trim() },
      ],
    }));
    enqueueSnackbar("Work history added.", { variant: "success" });
    closeModal();
  };

  const saveEdit = () => {
    if (editIndex === null) return;
    const error = validate();
    if (error) {
      setFormError(error);
      enqueueSnackbar(error, { variant: "error" });
      return;
    }

    setDraft((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((item, i) =>
        i === editIndex
          ? { company: company.trim(), position: position.trim(), fromDate: fromDate.trim(), toDate: toDate.trim(), jobDescription: jobDescription.trim() }
          : item
      ),
    }));
    enqueueSnackbar("Work history updated.", { variant: "success" });
    closeModal();
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setDraft((prev) => ({
      ...prev,
      workHistory: prev.workHistory.filter((_, i) => i !== deleteIndex),
    }));
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
    <Box sx={{ display: "grid", gap: 2 }}>
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
        error={formError}
        onClose={closeModal}
        onCompanyChange={(value) => {
          setCompany(value);
          if (formError) setFormError(null);
        }}
        onPositionChange={(value) => {
          setPosition(value);
          if (formError) setFormError(null);
        }}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onJobDescriptionChange={(value) => {
          setJobDescription(value);
          if (formError) setFormError(null);
        }}
        onSubmit={addItem}
        submitLabel="Add"
      />

      <WorkHistoryModal
        open={editIndex !== null}
        title="Edit work history"
        company={company}
        position={position}
        fromDate={fromDate}
        toDate={toDate}
        jobDescription={jobDescription}
        error={formError}
        onClose={closeModal}
        onCompanyChange={(value) => {
          setCompany(value);
          if (formError) setFormError(null);
        }}
        onPositionChange={(value) => {
          setPosition(value);
          if (formError) setFormError(null);
        }}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onJobDescriptionChange={(value) => {
          setJobDescription(value);
          if (formError) setFormError(null);
        }}
        onSubmit={saveEdit}
      />

      <ConfirmDeleteModal
        open={deleteIndex !== null}
        title="Delete work history"
        message="Are you sure you want to delete this work history item?"
        onClose={() => setDeleteIndex(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
