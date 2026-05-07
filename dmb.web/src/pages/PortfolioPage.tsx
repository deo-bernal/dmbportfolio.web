import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { UserProfileTabs } from "components/userProfiles";
import api from "services/http.service";
import { getProfile } from "slices/user";
import { useDispatch, useSelector } from "store";
import { agenticPageSx } from "styles/main_style";
import type { PortfolioPageProps, Profile, UpdateProfileRequest } from "models";

const DEVICON_SIZE = 28;
const EMPTY_PROFILE: Profile = {
  name: "My Profile",
  summary: "",
  video: "",
  skills: [],
  projectCategories: [{ title: "", items: [{ name: "", description: "" }] }],
  contact: { email: "", phone: "" },
};

export default function PortfolioPage({ onLogout }: PortfolioPageProps) {
  const dispatch = useDispatch();
  const { profile, error: loadError, isLoading } = useSelector((state) => state.user);
  const [loggingOut, setLoggingOut] = useState(false);
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

  if (!profile && !loadError) {
    return (
      <Container sx={agenticPageSx.container}>
        <Stack sx={agenticPageSx.stackSections}>
          <Box sx={agenticPageSx.panelBody}>
            <Typography component="h1" sx={agenticPageSx.profileName}>
              Create your profile
            </Typography>
            <Typography component="p" sx={agenticPageSx.summary}>
              Complete the tabs and save to publish your portfolio.
            </Typography>
          </Box>
          <UserProfileTabs profile={EMPTY_PROFILE} onSave={handleSaveProfile} initialMode="edit" />
        </Stack>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>{loadError ?? "Unable to load profile details."}</Box>
      </Container>
    );
  }

  return (
    <Container sx={agenticPageSx.container}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Box component="header" sx={agenticPageSx.headerRow}>
            <Box sx={agenticPageSx.headerLeft}>
              <Typography
                component="h1"
                data-testid="profile-name"
                sx={agenticPageSx.profileName}
              >
                {profile.name}
              </Typography>
              <Box sx={agenticPageSx.stackLogos} aria-label="Built with React and .NET">
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
                  alt="React logo"
                  width={DEVICON_SIZE}
                  height={DEVICON_SIZE}
                />
                <Box component="span" sx={agenticPageSx.stackPlus}>
                  +
                </Box>
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg"
                  alt=".NET logo"
                  width={DEVICON_SIZE}
                  height={DEVICON_SIZE}
                />
              </Box>
            </Box>
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
        <UserProfileTabs profile={profile} onSave={handleSaveProfile} />
      </Stack>
    </Container>
  );
}
