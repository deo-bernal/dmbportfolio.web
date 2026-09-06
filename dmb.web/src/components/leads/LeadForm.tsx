import { useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { submitLead, type LeadSource } from "services/leads.service";
import { CAL_BOOKING_URL } from "content/showcase";
import { accentRedContainedButtonSx, showcaseSx } from "styles/main_style";

const NEEDS = [
  "AI chat assistant",
  "Lead capture funnel",
  "CRM or database integration",
  "Automated follow-up",
  "Appointment booking",
  "Voice AI agent",
  "Something else",
];

const TIMELINES = ["Right away", "This month", "This quarter", "Just exploring"];

type LeadFormProps = {
  source?: LeadSource;
};

export default function LeadForm({ source = "funnel-form" }: LeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [need, setNeed] = useState(NEEDS[0]);
  const [timeline, setTimeline] = useState(TIMELINES[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && /.+@.+\..+/.test(email.trim());

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Add your name and a valid email so I can reply.");
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const result = await submitLead({
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        need,
        timeline,
        message: message.trim(),
        source,
        website,
      });
      setSentMessage(result.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send that right now.");
    } finally {
      setIsSending(false);
    }
  };

  if (sentMessage) {
    return (
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CheckCircleOutlineIcon sx={{ color: "#15803d" }} />
          <Typography sx={showcaseSx.stepLabel}>{sentMessage}</Typography>
        </Stack>
        <Typography sx={showcaseSx.cardBody}>
          A confirmation email is on its way. If you would rather skip the email
          thread, pick a time directly.
        </Typography>
        <Button
          href={CAL_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          size="large"
          sx={[{ textTransform: "none", fontWeight: 700 }, accentRedContainedButtonSx]}
        >
          Book a 30-minute call
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          fullWidth
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Company (optional)"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          fullWidth
        />
        <TextField
          select
          label="What do you need built?"
          value={need}
          onChange={(event) => setNeed(event.target.value)}
          fullWidth
        >
          {NEEDS.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TextField
        select
        label="Timeline"
        value={timeline}
        onChange={(event) => setTimeline(event.target.value)}
        fullWidth
      >
        {TIMELINES.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="What are you trying to automate? (optional)"
        multiline
        minRows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        fullWidth
      />

      <Box
        component="input"
        // Honeypot: hidden from people, tempting to bots.
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        name="website"
        value={website}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setWebsite(event.target.value)
        }
        sx={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <Button
        variant="contained"
        size="large"
        disabled={isSending}
        onClick={() => void handleSubmit()}
        startIcon={isSending ? <ButtonLoadingIcon /> : null}
        sx={[
          { textTransform: "none", fontWeight: 700, alignSelf: { xs: "stretch", sm: "flex-start" } },
          accentRedContainedButtonSx,
        ]}
      >
        {isSending ? "Sending..." : "Send it through the pipeline"}
      </Button>

      <Typography sx={showcaseSx.codeCaption}>
        Submitting runs the real pipeline: stored in Supabase, pushed to n8n, and
        answered by an automated email.
      </Typography>
    </Stack>
  );
}
