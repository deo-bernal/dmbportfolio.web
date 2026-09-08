import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  LEAD_STATUSES,
  fetchLeads,
  updateLeadStatus,
  type LeadRecord,
  type LeadStatus,
} from "services/leads.service";
import { showcaseSx } from "styles/main_style";

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

function LeadCard({
  lead,
  onStatusChange,
  disabled,
}: {
  lead: LeadRecord;
  onStatusChange: (lead: LeadRecord, status: LeadStatus) => void;
  disabled: boolean;
}) {
  return (
    <Box sx={[showcaseSx.card, { mb: 2 }]}>
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
        <Typography sx={[showcaseSx.cardBody, { mt: 1.5 }]}>{lead.message}</Typography>
      ) : null}

      <Typography sx={showcaseSx.codeCaption}>{formatDate(lead.created_at)}</Typography>

      <TextField
        select
        size="small"
        label="Stage"
        value={(lead.status as LeadStatus) || "new"}
        disabled={disabled || lead.id === undefined}
        onChange={(event) => onStatusChange(lead, event.target.value as LeadStatus)}
        sx={{ mt: 1.5, minWidth: 140 }}
      >
        {LEAD_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [storage, setStorage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 3 }}
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

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {storage === "log" && !error ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Leads are being written to the function log because SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY are not set. See docs/runbooks/lead-pipeline.md.
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack sx={{ alignItems: "center", py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Grid container spacing={2.5}>
          {columns.map((column) => (
            <Grid key={column.status} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 1.5 }}>
                <Typography sx={showcaseSx.stepLabel}>{column.title}</Typography>
                <Typography sx={showcaseSx.metricLabel}>{column.items.length}</Typography>
              </Stack>
              <Typography sx={[showcaseSx.codeCaption, { mb: 1.5 }]}>{column.hint}</Typography>

              {column.items.length === 0 ? (
                <Typography sx={showcaseSx.cardBody}>Nothing here yet.</Typography>
              ) : (
                column.items.map((lead) => (
                  <LeadCard
                    key={String(lead.id ?? lead.email)}
                    lead={lead}
                    disabled={isSaving}
                    onStatusChange={(target, status) => void handleStatusChange(target, status)}
                  />
                ))
              )}
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
