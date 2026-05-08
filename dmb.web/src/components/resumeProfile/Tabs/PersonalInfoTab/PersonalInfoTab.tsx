import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { ResumeTabProps } from "../types";

export default function PersonalInfoTab({ draft, setDraft }: ResumeTabProps) {
  const updateField = (key: keyof typeof draft.personalInfo, value: string) => {
    setDraft((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [key]: value,
      },
    }));
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="First Name"
        value={draft.personalInfo.firstName}
        onChange={(event) => updateField("firstName", event.target.value)}
      />
      <TextField
        label="Last Name"
        value={draft.personalInfo.lastName}
        onChange={(event) => updateField("lastName", event.target.value)}
      />
      <TextField
        label="Contact No"
        value={draft.personalInfo.contactNo}
        onChange={(event) => updateField("contactNo", event.target.value)}
      />
      <TextField
        label="Email"
        value={draft.personalInfo.email}
        onChange={(event) => updateField("email", event.target.value)}
      />
      <TextField
        label="Address"
        value={draft.personalInfo.address}
        onChange={(event) => updateField("address", event.target.value)}
      />
      <TextField
        multiline
        minRows={4}
        label="Summary"
        value={draft.personalInfo.summary}
        onChange={(event) => updateField("summary", event.target.value)}
      />
    </Stack>
  );
}
