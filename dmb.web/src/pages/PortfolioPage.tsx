import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { UserProfileTabs, UserProfileView } from "components/userProfiles";
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
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const hasFetchedProfile = useRef(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Still clear the session locally if the request fails (e.g. offline).
    } finally {
      setLoggingOut(false);
      onLogout();
    }
  };

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
              <Typography
                component="p"
                sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", mb: 0.5 }}
              >
                Portfolio Profile
              </Typography>
              <Typography
                component="h1"
                data-testid="profile-name"
                sx={agenticPageSx.profileName}
              >
                {activeProfile.name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
              {!isEditing ? (
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(true)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  {isCreateMode ? "Create profile" : "Edit profile"}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  Back to view
                </Button>
              )}
              <Button
                variant="contained"
                disableElevation
                onClick={handleLogout}
                disabled={loggingOut}
                sx={agenticPageSx.logoutButton}
              >
                {loggingOut ? "Signing out..." : "Log out"}
              </Button>
            </Box>
          </Box>
        </Box>
        {isEditing ? (
          <UserProfileTabs
            profile={activeProfile}
            onSave={handleSaveProfile}
            initialMode="edit"
            saveMode={isCreateMode ? "create" : "update"}
          />
        ) : (
          <UserProfileView profile={activeProfile} />
        )}
      </Stack>
    </Container>
  );
}
