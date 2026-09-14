import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  LEAD_STATUSES,
  deleteLead,
  deleteLeadsByStatus,
  fetchLeads,
  updateLeadStatus,
  type LeadRecord,
  type LeadStatus,
} from "services/leads.service";
import { accentRedContainedButtonSx, showcaseSx } from "styles/main_style";

const PIPELINE: Array<{ status: LeadStatus; title: string; hint: string }> = [
  { status: "new", title: "New", hint: "Captured, not yet worked" },
  { status: "qualified", title: "Qualified", hint: "Need and timeline known" },
  { status: "booked", title: "Booked", hint: "Call on the calendar" },
  { status: "won", title: "Won", hint: "Engagement agreed" },
];

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString();
}

function leadLabel(lead: LeadRecord) {
  return lead.name || lead.email || "this lead";
}

function LeadCard({
  lead,
  onStatusChange,
  onDelete,
  disabled,
}: {
  lead: LeadRecord;
  onStatusChange: (lead: LeadRecord, status: LeadStatus) => void;
  onDelete: (lead: LeadRecord) => void;
  disabled: boolean;
}) {
  return (
    <Box sx={[showcaseSx.card, { height: "auto", mb: 2 }]}>
      <Typography sx={showcaseSx.cardTitle}>{lead.name || "Unnamed"}</Typography>
      <Typography sx={showcaseSx.cardBody}>{lead.email}</Typography>

      {lead.company ? (
        <Typography sx={showcaseSx.cardBody}>{lead.company}</Typography>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
        {[lead.need, lead.timeline, lead.source].filter(Boolean).map((tag) => (
          <Box key={String(tag)} component="span" sx={showcaseSx.tag}>
            {tag}
          </Box>
        ))}
      </Stack>

      {lead.message ? (
        <Typography sx={[showcaseSx.cardBody, { mt: 1.5, overflowWrap: "anywhere" }]}>
          {lead.message}
        </Typography>
      ) : null}

      <Typography sx={showcaseSx.codeCaption}>{formatDate(lead.created_at)}</Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="Stage"
          value={(lead.status as LeadStatus) || "new"}
          disabled={disabled || lead.id === undefined}
          onChange={(event) => onStatusChange(lead, event.target.value as LeadStatus)}
          sx={{ minWidth: 140, flex: 1 }}
        >
          {LEAD_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          color="error"
          size="small"
          disabled={disabled || lead.id === undefined}
          onClick={() => onDelete(lead)}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}

type PendingDelete =
  | { kind: "one"; lead: LeadRecord }
  | { kind: "status"; status: LeadStatus; count: number; title: string };

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [storage, setStorage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchLeads(localStorage.getItem("token"));
      setLeads(result.leads || []);
      setStorage(result.storage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load leads.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = async (lead: LeadRecord, status: LeadStatus) => {
    if (lead.id === undefined) return;

    const previous = leads;
    setLeads((current) =>
      current.map((item) => (item.id === lead.id ? { ...item, status } : item))
    );
    setIsSaving(true);

    try {
      await updateLeadStatus(localStorage.getItem("token"), lead.id, status);
    } catch (err: unknown) {
      setLeads(previous);
      setError(err instanceof Error ? err.message : "Unable to update that lead.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsSaving(true);
    setError(null);

    try {
      if (pendingDelete.kind === "one") {
        if (pendingDelete.lead.id === undefined) return;
        await deleteLead(localStorage.getItem("token"), pendingDelete.lead.id);
        setLeads((current) => current.filter((item) => item.id !== pendingDelete.lead.id));
      } else {
        await deleteLeadsByStatus(localStorage.getItem("token"), pendingDelete.status);
        setLeads((current) =>
          current.filter((item) => {
            const status = (item.status || "new") as LeadStatus;
            return status !== pendingDelete.status;
          })
        );
      }
      setPendingDelete(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to delete those leads.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo(
    () =>
      PIPELINE.map((column) => ({
        ...column,
        items: leads.filter((lead) => (lead.status || "new") === column.status),
      })),
    [leads]
  );

  const lostCount = leads.filter((lead) => lead.status === "lost").length;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2, flexShrink: 0 }}
      >
        <Box>
          <Typography sx={showcaseSx.kicker}>Lead pipeline</Typography>
          <Typography component="h1" sx={showcaseSx.sectionTitle}>
            Leads from the funnel and the chatbot
          </Typography>
          <Typography sx={showcaseSx.cardBody}>
            {leads.length} total · {lostCount} lost
            {storage === "log" ? " · Supabase is not configured yet" : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {lostCount > 0 ? (
            <Button
              variant="outlined"
              color="error"
              disabled={isLoading || isSaving}
              onClick={() =>
                setPendingDelete({ kind: "status", status: "lost", count: lostCount, title: "Lost" })
              }
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Delete lost
            </Button>
          ) : null}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void load()}
            disabled={isLoading}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      ) : null}

      {storage === "log" && !error ? (
        <Alert severity="info" sx={{ mb: 2, flexShrink: 0 }}>
          Leads are being written to the function log because SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY are not set. See docs/runbooks/lead-pipeline.md.
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack sx={{ alignItems: "center", py: 6, flex: 1 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" },
            gridAutoRows: { xs: "auto", sm: "minmax(0, 1fr)" },
            gap: 2.5,
            overflow: { xs: "auto", sm: "hidden" },
          }}
        >
          {columns.map((column) => (
            <Box
              key={column.status}
              sx={{
                minHeight: 0,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 1, flexShrink: 0 }}>
                <Typography sx={showcaseSx.stepLabel}>{column.title}</Typography>
                <Typography sx={showcaseSx.metricLabel}>{column.items.length}</Typography>
                {column.items.length > 0 ? (
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    disabled={isSaving}
                    onClick={() =>
                      setPendingDelete({
                        kind: "status",
                        status: column.status,
                        count: column.items.length,
                        title: column.title,
                      })
                    }
                    sx={{ ml: "auto", textTransform: "none", fontWeight: 700, minWidth: 0 }}
                  >
                    Delete all
                  </Button>
                ) : null}
              </Stack>
              <Typography sx={[showcaseSx.codeCaption, { mb: 1.5, flexShrink: 0 }]}>{column.hint}</Typography>

              <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5 }}>
                {column.items.length === 0 ? (
                  <Typography sx={showcaseSx.cardBody}>Nothing here yet.</Typography>
                ) : (
                  column.items.map((lead) => (
                    <LeadCard
                      key={String(lead.id ?? lead.email)}
                      lead={lead}
                      disabled={isSaving}
                      onStatusChange={(target, status) => void handleStatusChange(target, status)}
                      onDelete={(target) => setPendingDelete({ kind: "one", lead: target })}
                    />
                  ))
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={Boolean(pendingDelete)} onClose={isSaving ? undefined : () => setPendingDelete(null)}>
        <DialogTitle>
          {pendingDelete?.kind === "one"
            ? "Delete this lead?"
            : `Delete all ${pendingDelete?.title.toLowerCase()} leads?`}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {pendingDelete?.kind === "one"
              ? `${leadLabel(pendingDelete.lead)} will be removed from the pipeline.`
              : `${pendingDelete?.count} lead${pendingDelete?.count === 1 ? "" : "s"} in ${pendingDelete?.title} will be removed. Other stages are left alone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={() => void confirmDelete()}
            disabled={isSaving}
            variant="contained"
            sx={accentRedContainedButtonSx}
          >
            {isSaving ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
