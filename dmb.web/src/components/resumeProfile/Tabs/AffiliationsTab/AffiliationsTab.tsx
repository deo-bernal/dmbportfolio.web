import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useMemo, useState } from "react";
import * as Yup from "yup";
import DataTable from "components/common/Datatable";
import { affiliationItemFormSchema } from "validations/schema/affiliationsTab";
import type { ResumeTabProps } from "../types";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import AffiliationsModal, { type AffiliationFieldKey } from "./AffiliationsModal";
import getColumns, { type AffiliationGridRow } from "./columns";
import AffiliationsFilter from "./TableSections/AffiliationsFilter";

function mapYupFieldErrors(error: Yup.ValidationError): Partial<Record<AffiliationFieldKey, string>> {
  const out: Partial<Record<AffiliationFieldKey, string>> = {};
  for (const err of error.inner) {
    const path = err.path as AffiliationFieldKey | undefined;
    if (path && out[path] === undefined) {
      out[path] = err.message;
    }
  }
  if (Object.keys(out).length === 0) {
    const path = error.path as AffiliationFieldKey | undefined;
    if (path) {
      out[path] = error.message;
    } else if (error.message) {
      out.organization = error.message;
    }
  }
  return out;
}

export default function AffiliationsTab({ draft, setDraft, onImmediateSave }: ResumeTabProps) {
  const [query, setQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [organization, setOrganization] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [details, setDetails] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AffiliationFieldKey, string>>>({});

  const clearFieldError = (key: AffiliationFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setOrganization("");
    setTitleValue("");
    setIssueDate("");
    setDetails("");
    setFieldErrors({});
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditIndex(null);
    resetForm();
  };

  const getFormValues = () => ({
    organization: organization.trim(),
    title: titleValue.trim(),
    issueDate: issueDate.trim(),
    details: details.trim(),
  });

  const validate = (): boolean => {
    try {
      affiliationItemFormSchema.validateSync(getFormValues(), { abortEarly: false });
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

  const openEdit = (row: AffiliationGridRow) => {
    const item = draft.affiliations[row.itemIndex];
    if (!item) return;

    setIsAddModalOpen(false);
    setEditIndex(row.itemIndex);
    setDeleteIndex(null);

    setOrganization(item.organization ?? "");
    setTitleValue(item.title ?? "");
    setIssueDate(item.issueDate ?? "");
    setDetails(item.details ?? "");
    setFieldErrors({});
  };

  const addItem = async () => {
    if (!validate()) return;

    const v = getFormValues();
    const nextDraft = {
      ...draft,
      affiliations: [
        ...draft.affiliations,
        { organization: v.organization, title: v.title, issueDate: v.issueDate, details: v.details },
      ],
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
      affiliations: draft.affiliations.map((item, i) =>
        i === editIndex ? { organization: v.organization, title: v.title, issueDate: v.issueDate, details: v.details } : item
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
      affiliations: draft.affiliations.filter((_, i) => i !== deleteIndex),
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

  const rows: AffiliationGridRow[] = useMemo(() => {
    return (draft.affiliations ?? [])
      .map((item, itemIndex) => ({
        id: `aff-${itemIndex}`,
        itemIndex,
        organization: (item.organization ?? "").toString(),
        title: (item.title ?? "").toString(),
        issueDate: (item.issueDate ?? "").toString(),
        details: (item.details ?? "").toString(),
      }))
      .filter((row) => {
        const allEmpty =
          row.organization.trim().length === 0 &&
          row.title.trim().length === 0 &&
          row.issueDate.trim().length === 0 &&
          row.details.trim().length === 0;
        return !allEmpty;
      });
  }, [draft.affiliations]);

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: openEdit,
        onDelete: (row) => setDeleteIndex(row.itemIndex),
      }),
    [draft.affiliations]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        row.organization.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.issueDate.toLowerCase().includes(q) ||
        row.details.toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Button variant="outlined" onClick={openAdd} fullWidth>
        Add Affiliation
      </Button>

      <AffiliationsFilter query={query} onQueryChange={setQuery} />

      <DataTable rows={filteredRows} columns={columns} getRowId={(row) => row.id} emptyMessage="No affiliations found." />

      <AffiliationsModal
        open={isAddModalOpen}
        title="Add affiliation"
        organization={organization}
        titleValue={titleValue}
        issueDate={issueDate}
        details={details}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onOrganizationChange={(v) => {
          setOrganization(v);
          clearFieldError("organization");
        }}
        onTitleChange={(v) => {
          setTitleValue(v);
          clearFieldError("title");
        }}
        onIssueDateChange={(v) => {
          setIssueDate(v);
          clearFieldError("issueDate");
        }}
        onDetailsChange={(v) => {
          setDetails(v);
          clearFieldError("details");
        }}
        onSubmit={addItem}
        submitLabel="Add"
        isSubmitting={isPersisting && isAddModalOpen}
      />

      <AffiliationsModal
        open={editIndex !== null}
        title="Edit affiliation"
        organization={organization}
        titleValue={titleValue}
        issueDate={issueDate}
        details={details}
        fieldErrors={fieldErrors}
        onClose={closeModal}
        onOrganizationChange={(v) => {
          setOrganization(v);
          clearFieldError("organization");
        }}
        onTitleChange={(v) => {
          setTitleValue(v);
          clearFieldError("title");
        }}
        onIssueDateChange={(v) => {
          setIssueDate(v);
          clearFieldError("issueDate");
        }}
        onDetailsChange={(v) => {
          setDetails(v);
          clearFieldError("details");
        }}
        onSubmit={saveEdit}
        isSubmitting={isPersisting && editIndex !== null}
      />

      <ConfirmDeleteModal
        open={deleteIndex !== null}
        title="Delete affiliation"
        message="Are you sure you want to delete this affiliation?"
        isBusy={isDeleting}
        onClose={() => {
          if (!isDeleting) setDeleteIndex(null);
        }}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}

