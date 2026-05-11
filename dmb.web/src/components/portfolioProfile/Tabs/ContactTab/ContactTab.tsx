import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { agenticPageSx } from "styles/main_style";
import type { TabViewProps } from "../types";
import PageHeader from "../PageHeader";

export default function ContactTab({ profile, draft, mode, setDraft }: TabViewProps) {
  if (mode === "view") {
    return (
      <>
        <PageHeader title="Contact" subtitle="Primary email and phone details" />
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Email:</strong> <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
        </Typography>
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Phone:</strong> <a href={`tel:${profile.contact.phone.replace(/\s/g, "")}`}>{profile.contact.phone}</a>
        </Typography>
      </>
    );
  }

  return (
    <Box sx={agenticPageSx.editGrid}>
      <PageHeader title="Contact" subtitle="Update your contact details" />
      <TextField
        label="Email"
        type="email"
        value={draft.contact.email}
        onChange={(e) =>
          setDraft((prev) => ({
            ...prev,
            contact: { ...prev.contact, email: e.target.value },
          }))
        }
      />
      <TextField
        label="Phone"
        value={draft.contact.phone}
        onChange={(e) =>
          setDraft((prev) => ({
            ...prev,
            contact: { ...prev.contact, phone: e.target.value },
          }))
        }
      />
    </Box>
  );
}

