import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { useSnackbar } from "notistack";
import FormUtils from "components/common/FormUtils";
import type { Profile } from "models";
import { agenticPageSx } from "styles/main_style";
import { contactTabSchema } from "validations/schema/contactTab";
import { projectsTabSchema } from "validations/schema/projectsTab";
import { addSkillSchema, skillsTabSchema } from "validations/schema/skillsTab";
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

function normalizeProfileForSave(profile: Profile): Profile {
  const normalizedSkills = Array.from(
    new Set(
      (profile.skills ?? [])
        .map((s) => (s ?? "").trim())
        .filter(Boolean)
    )
  );

  const normalizedCategories = (profile.projectCategories ?? [])
    .map((category) => ({
      title: (category.title ?? "").trim(),
      items: (category.items ?? [])
        .map((item) => ({
          name: (item.name ?? "").trim(),
          description: (item.description ?? "").trim(),
        }))
        .filter((item) => item.name.length > 0 || item.description.length > 0),
    }))
    .filter((category) => category.title.length > 0);

  return {
    ...profile,
    summary: (profile.summary ?? "").trim(),
    video: (profile.video ?? "").trim(),
    skills: normalizedSkills,
    projectCategories: normalizedCategories,
    contact: {
      email: (profile.contact?.email ?? "").trim(),
      phone: (profile.contact?.phone ?? "").trim(),
    },
  };
}

export default function UserProfileTabs({
  profile,
  onSave,
  initialMode = "view",
  saveMode = "update",
}: UserProfileTabsProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile>(() => cloneProfile(profile));
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillTouched, setNewSkillTouched] = useState(false);

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
      const normalizedDraft = normalizeProfileForSave(draft);
      skillsTabSchema.validateSync({ skills: normalizedDraft.skills });
      projectsTabSchema.validateSync({ projectCategories: normalizedDraft.projectCategories });
      contactTabSchema.validateSync({
        email: normalizedDraft.contact.email,
        phone: normalizedDraft.contact.phone,
      });
      await onSave(normalizedDraft, saveMode);
      enqueueSnackbar("Profile changes saved successfully.", { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message ?? error?.message ?? "Unable to save profile changes.", {
        variant: "error",
      });
      setSaveError(error?.response?.data?.message ?? error?.message ?? "Unable to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const persistProfileImmediately = async (nextProfile: Profile, successMessage: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const normalizedDraft = normalizeProfileForSave(nextProfile);
      await onSave(normalizedDraft, saveMode);
      setDraft(normalizedDraft);
      enqueueSnackbar(successMessage, { variant: "success" });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? "Unable to save profile changes.";
      enqueueSnackbar(message, { variant: "error" });
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddSkillModal = () => {
    setNewSkillName("");
    setNewSkillTouched(false);
    setIsAddSkillModalOpen(true);
  };

  const closeAddSkillModal = () => {
    setIsAddSkillModalOpen(false);
    setNewSkillTouched(false);
  };

  const addSkillFromModal = async () => {
    setNewSkillTouched(true);
    const normalized = newSkillName.trim();
    try {
      addSkillSchema.validateSync({ newSkill: normalized });
    } catch (error: any) {
      enqueueSnackbar(error?.message ?? "New skill is required.", { variant: "error" });
      return;
    }
    const duplicate = draft.skills.some((skill) => skill.trim().toLowerCase() === normalized.toLowerCase());
    if (duplicate) {
      enqueueSnackbar("Skill already exists.", { variant: "error" });
      return;
    }

    const nextProfile = {
      ...draft,
      skills: [...draft.skills, normalized],
    };
    setDraft(nextProfile);
    closeAddSkillModal();
    await persistProfileImmediately(nextProfile, "Skill added.");
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

      <FormUtils
        mode={mode}
        onEdit={beginEdit}
        onCancel={cancelEdit}
        onSave={saveEdit}
        isSaving={isSaving}
        editActionLabel={activeTab === "skills" && mode === "edit" ? "Add Skill" : undefined}
        onEditAction={activeTab === "skills" && mode === "edit" ? openAddSkillModal : undefined}
      >
        {saveError ? <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert> : null}
        {activeTab === "overview" ? (
          <OverviewTab
            profile={profile}
            draft={draft}
            mode={mode}
            setDraft={setDraft}
            cloneProfile={cloneProfile}
            onImmediatePersist={persistProfileImmediately}
          />
        ) : null}
        {activeTab === "skills" ? (
          <SkillsTab
            profile={profile}
            draft={draft}
            mode={mode}
            setDraft={setDraft}
            cloneProfile={cloneProfile}
            onImmediatePersist={persistProfileImmediately}
          />
        ) : null}
        {activeTab === "projects" ? (
          <ProjectsTab
            profile={profile}
            draft={draft}
            mode={mode}
            setDraft={setDraft}
            cloneProfile={cloneProfile}
            onImmediatePersist={persistProfileImmediately}
          />
        ) : null}
        {activeTab === "contact" ? (
          <ContactTab
            profile={profile}
            draft={draft}
            mode={mode}
            setDraft={setDraft}
            cloneProfile={cloneProfile}
            onImmediatePersist={persistProfileImmediately}
          />
        ) : null}
        <Dialog open={isAddSkillModalOpen} onClose={closeAddSkillModal} fullWidth maxWidth="sm">
          <DialogTitle>Add new skill</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              required
              label="New skill"
              value={newSkillName}
              error={newSkillTouched && newSkillName.trim().length === 0}
              helperText={newSkillTouched && newSkillName.trim().length === 0 ? "New skill is required." : ""}
              onChange={(e) => setNewSkillName(e.target.value)}
              onBlur={() => setNewSkillTouched(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkillFromModal();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAddSkillModal}>Cancel</Button>
            <Button variant="contained" onClick={() => void addSkillFromModal()}>
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </FormUtils>
    </Box>
  );
}
