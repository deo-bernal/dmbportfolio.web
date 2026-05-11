import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortfolioProfileTabs, PortfolioProfileView } from "components/portfolioProfile";
import api from "services/http.service";
import { getProfile } from "slices/user";
import { useDispatch, useSelector } from "store";
import { agenticPageSx } from "styles/main_style";
import type { PortfolioPageProps, Profile, UpdateProfileRequest } from "models";

const EMPTY_PROFILE: Profile = {
  username: "",
  name: "My Profile",
  summary: "",
  video: "",
  isViewable: false,
  skills: [],
  projectCategories: [{ title: "", items: [{ name: "", description: "" }] }],
  contact: { email: "", phone: "" },
};

export default function PortfolioPage({ onLogout }: PortfolioPageProps) {
  const dispatch = useDispatch();
  const { profile, error: loadError, isLoading } = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    if (hasFetchedProfile.current) {
      return;
    }
    hasFetchedProfile.current = true;
    dispatch(getProfile(onLogout) as any);
  }, [dispatch, onLogout]);

  const handleSaveProfile = async (nextProfile: Profile, mode: "create" | "update") => {
    const payload: UpdateProfileRequest = {
      summary: nextProfile.summary,
      video: nextProfile.video,
      isViewable: nextProfile.isViewable,
      skills: nextProfile.skills,
      contact: nextProfile.contact,
      projectCategories: nextProfile.projectCategories,
    };
    try {
      if (mode === "create") {
        await api.post("/profiledetails", payload);
      } else {
        await api.put("/profiledetails", payload);
      }
    } catch (error: any) {
      if (error?.response?.status === 404 && mode === "update") {
        await api.post("/profiledetails", payload);
      } else {
        throw error;
      }
    }
    await dispatch(getProfile(onLogout) as any);
  };

  const handleDeleteAccount = async () => {
    await api.delete("/account");
    onLogout();
  };

  if (!profile && isLoading) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>
          Loading...
        </Box>
      </Container>
    );
  }

  if (!profile && loadError) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>{loadError ?? "Unable to load profile details."}</Box>
      </Container>
    );
  }

  const activeProfile = profile ?? EMPTY_PROFILE;
  const isCreateMode = !profile;

  return (
    <Container sx={agenticPageSx.container}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Box component="header" sx={agenticPageSx.headerRow}>
            <Box sx={agenticPageSx.headerLeft}>
              <Typography component="p" sx={agenticPageSx.pageKindLabel}>
                Portfolio
              </Typography>
              <Typography
                component="h1"
                data-testid="profile-name"
                sx={agenticPageSx.profileName}
              >
                {activeProfile.name}
              </Typography>
            </Box>
            <Box sx={agenticPageSx.headerActionsRow}>
              {!isEditing ? (
                <Button variant="outlined" onClick={() => setIsEditing(true)} sx={agenticPageSx.headerOutlinedButton}>
                  {isCreateMode ? "Create portfolio" : "Edit portfolio"}
                </Button>
              ) : (
                <Button variant="outlined" onClick={() => setIsEditing(false)} sx={agenticPageSx.headerOutlinedButton}>
                  Back to view
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        {isEditing ? (
          <PortfolioProfileTabs
            profile={activeProfile}
            onSave={handleSaveProfile}
            onDeleteAccount={handleDeleteAccount}
            initialMode="edit"
            saveMode={isCreateMode ? "create" : "update"}
          />
        ) : (
          <PortfolioProfileView profile={activeProfile} />
        )}
      </Stack>
    </Container>
  );
}
