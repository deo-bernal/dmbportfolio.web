import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortfolioProfileView } from "components/portfolioProfile";
import { getPublicProfile } from "slices/user";
import { useDispatch, useSelector } from "store";
import { agenticPageSx } from "styles/main_style";

export default function PublicPortfolioPage() {
  const dispatch = useDispatch();
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

  if (isLoading && !profile) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>Loading portfolio...</Box>
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
              <Typography component="p" sx={agenticPageSx.pageKindLabel}>
                Public Portfolio
              </Typography>
              <Typography component="h1" data-testid="profile-name" sx={agenticPageSx.profileName}>
                {profile.name}
              </Typography>
            </Box>
          </Box>
        </Box>
        <PortfolioProfileView profile={profile} />
      </Stack>
    </Container>
  );
}

