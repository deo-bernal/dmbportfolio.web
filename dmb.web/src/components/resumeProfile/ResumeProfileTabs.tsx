import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import FormUtils from "components/common/FormUtils";
import type { ResumeProfile } from "models";
import { agenticPageSx } from "styles/main_style";
import { EducationTab, PersonalInfoTab, WorkHistoryTab } from "./Tabs";

type ResumeProfileTabsProps = {
  profile: ResumeProfile;
  onSave: (profile: ResumeProfile) => Promise<void>;
};

type TabKey = "personalInfo" | "workHistory" | "education";

function cloneResumeProfile(profile: ResumeProfile): ResumeProfile {
  return JSON.parse(JSON.stringify(profile));
}

export default function ResumeProfileTabs({ profile, onSave }: ResumeProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("personalInfo");
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResumeProfile>(() => cloneResumeProfile(profile));

  const beginEdit = () => {
    setDraft(cloneResumeProfile(profile));
    setSaveError(null);
    setMode("edit");
  };

  const cancelEdit = () => {
    setDraft(cloneResumeProfile(profile));
    setSaveError(null);
  };

  const saveEdit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(draft);
    } catch (error: any) {
      setSaveError(error?.response?.data?.message ?? error?.message ?? "Unable to save resume changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={agenticPageSx.panelBody}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label="Personal Info" value="personalInfo" />
        <Tab label="Work History" value="workHistory" />
        <Tab label="Education" value="education" />
      </Tabs>

      <FormUtils
        mode={mode}
        onEdit={beginEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        isSaving={isSaving}
      >
        {saveError ? <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert> : null}
        {activeTab === "personalInfo" ? <PersonalInfoTab draft={draft} setDraft={setDraft} /> : null}
        {activeTab === "workHistory" ? <WorkHistoryTab draft={draft} setDraft={setDraft} /> : null}
        {activeTab === "education" ? <EducationTab draft={draft} setDraft={setDraft} /> : null}
      </FormUtils>
    </Box>
  );
}
