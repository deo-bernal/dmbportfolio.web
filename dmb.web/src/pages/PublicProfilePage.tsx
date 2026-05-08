import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { UserProfileView } from "components/userProfiles";
import { getPublicProfile } from "slices/user";
import { useDispatch, useSelector } from "store";
import { agenticPageSx } from "styles/main_style";

const DEVICON_SIZE = 28;

export default function PublicProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { username = "" } = useParams<{ username: string }>();
  const { profile, error: loadError, isLoading } = useSelector((state) => state.user);
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    hasFetchedProfile.current = false;
  }, [username]);

  useEffect(() => {
    if (hasFetchedProfile.current) {
      return;
    }
    hasFetchedProfile.current = true;
    dispatch(getPublicProfile(username) as any);
  }, [dispatch, username]);

  if (isLoading) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>Loading...</Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>{loadError ?? "Unable to load public profile."}</Box>
      </Container>
    );
  }

  return (
    <Container sx={agenticPageSx.container}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Box component="header" sx={agenticPageSx.headerRow}>
            <Box sx={agenticPageSx.headerLeft}>
              <Typography component="h1" data-testid="profile-name" sx={agenticPageSx.profileName}>
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
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant="contained"
                disableElevation
                onClick={() => navigate("/login")}
                sx={agenticPageSx.logoutButton}
              >
                Log in
              </Button>
            </Box>
          </Box>
        </Box>
        <UserProfileView profile={profile} />
      </Stack>
    </Container>
  );
}
