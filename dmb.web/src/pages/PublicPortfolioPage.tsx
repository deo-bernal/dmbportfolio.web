import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortfolioProfileView } from "components/portfolioProfile";
import { DEO_PORTFOLIO, isDeoPublicUsername } from "content/deoPortfolio";
import { getPublicProfile } from "slices/user";
import { useDispatch, useSelector } from "store";
import { agenticPageSx } from "styles/main_style";
import MarketingLayout from "components/layout/MarketingLayout";
import type { Profile } from "models";

function profileMatchesUsername(profile: Profile | null, username: string): profile is Profile {
  if (!profile) {
    return false;
  }
  try {
    return decodeURIComponent(profile.username).trim().toLowerCase() ===
      decodeURIComponent(username).trim().toLowerCase();
  } catch {
    return profile.username.trim().toLowerCase() === username.trim().toLowerCase();
  }
}

export default function PublicPortfolioPage() {
  const dispatch = useDispatch();
  const { username = "" } = useParams<{ username: string }>();
  const { profile, error: loadError, isLoading } = useSelector((state) => state.user);
  const hasFetchedProfile = useRef(false);
  const snapshot = isDeoPublicUsername(username) ? DEO_PORTFOLIO : null;
  const displayProfile = profileMatchesUsername(profile, username) ? profile : snapshot;

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

  if (!displayProfile && isLoading) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>Loading portfolio...</Box>
      </Container>
    );
  }

  if (!displayProfile) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>{loadError ?? "Unable to load public profile."}</Box>
      </Container>
    );
  }

  return (
    <MarketingLayout mainSx={agenticPageSx.embeddedMain}>
      <Stack sx={agenticPageSx.stackSections}>
        <Box sx={agenticPageSx.panelBody}>
          <Box component="header" sx={agenticPageSx.headerRow}>
            <Box sx={agenticPageSx.headerLeft}>
              <Typography component="p" sx={agenticPageSx.pageKindLabel}>
                Public Portfolio
              </Typography>
              <Typography component="h1" data-testid="profile-name" sx={agenticPageSx.profileName}>
                {displayProfile.name}
              </Typography>
            </Box>
          </Box>
        </Box>
        <PortfolioProfileView profile={displayProfile} />
      </Stack>
    </MarketingLayout>
  );
}
