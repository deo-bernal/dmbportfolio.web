import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import FormUtils from "components/common/FormUtils";
import type { Profile } from "models";
import { agenticPageSx } from "styles/main_style";
import { ContactTab, OverviewTab, ProjectsTab, SkillsTab } from "./Tabs";

type UserProfileTabsProps = {
  profile: Profile;
  onSave: (profile: Profile, mode: "create" | "update") => Promise<void>;
  initialMode?: "view" | "edit";
  saveMode?: "create" | "update";
};

type TabKey = "overview" | "skills" | "projects" | "contact";

function cloneProfile(profile: Profile): Profile {
  return JSON.parse(JSON.stringify(profile));
}

export default function UserProfileTabs({
  profile,
  onSave,
  initialMode = "view",
  saveMode = "update",
}: UserProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile>(() => cloneProfile(profile));

  const syncedProfile = useMemo(() => cloneProfile(profile), [profile]);

  const beginEdit = () => {
    setDraft(cloneProfile(syncedProfile));
    setSaveError(null);
    setMode("edit");
  };

  const cancelEdit = () => {
    setDraft(cloneProfile(syncedProfile));
    setSaveError(null);
    setMode(initialMode === "edit" ? "edit" : "view");
  };

  const saveEdit = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(draft, saveMode);
      setMode("view");
    } catch (error: any) {
      setSaveError(error?.response?.data?.message ?? "Unable to save profile changes.");
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
        <Tab label="Overview" value="overview" />
        <Tab label="Skills" value="skills" />
        <Tab label="Projects" value="projects" />
        <Tab label="Contact" value="contact" />
      </Tabs>

      <FormUtils mode={mode} onEdit={beginEdit} onCancel={cancelEdit} onSave={saveEdit} isSaving={isSaving}>
        {saveError ? <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert> : null}
        {activeTab === "overview" ? <OverviewTab profile={profile} draft={draft} mode={mode} setDraft={setDraft} cloneProfile={cloneProfile} /> : null}
        {activeTab === "skills" ? <SkillsTab profile={profile} draft={draft} mode={mode} setDraft={setDraft} cloneProfile={cloneProfile} /> : null}
        {activeTab === "projects" ? <ProjectsTab profile={profile} draft={draft} mode={mode} setDraft={setDraft} cloneProfile={cloneProfile} /> : null}
        {activeTab === "contact" ? <ContactTab profile={profile} draft={draft} mode={mode} setDraft={setDraft} cloneProfile={cloneProfile} /> : null}
      </FormUtils>
    </Box>
  );
}
