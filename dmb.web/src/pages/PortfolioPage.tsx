import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import api from "services/http.service";
import { getProfile } from "slices/user";
import { useDispatch, useSelector } from "store";
import { agenticPageSx } from "styles/main_style";
import type { PortfolioPageProps } from "models";

const DEVICON_SIZE = 28;

export default function PortfolioPage({ onLogout }: PortfolioPageProps) {
  const dispatch = useDispatch();
  const { profile, error: loadError, isLoading } = useSelector((state) => state.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const hasFetchedProfile = useRef(false);
  const visibleSkills = profile?.skills.slice(0, 11) ?? [];
  const hiddenSkills = profile?.skills.slice(11) ?? [];
  const visibleProjectCategories = profile?.projectCategories.slice(0, 2) ?? [];
  const hiddenProjectCategories = profile?.projectCategories.slice(2) ?? [];

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

  if (!profile) {
    return (
      <Container sx={agenticPageSx.container}>
        <Box sx={agenticPageSx.loadingState}>
          {loadError ?? (isLoading ? "Loading..." : "No profile found.")}
        </Box>
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
          {profile.video ? (
            <Box
              component="a"
              href={profile.video}
              target="_blank"
              rel="noopener noreferrer"
              sx={agenticPageSx.introLink}
            >
              Intro video
            </Box>
          ) : null}
          <Typography component="p" sx={agenticPageSx.summary}>
            {profile.summary}
          </Typography>
        </Box>

        <Box sx={agenticPageSx.panelBody}>
          <Typography component="h2" sx={agenticPageSx.sectionTitle}>
            Skills
          </Typography>
          <Box component="ul" sx={agenticPageSx.list}>
            {visibleSkills.map((s, i) => (
              <Box component="li" key={i}>
                {s}
              </Box>
            ))}
          </Box>
          {hiddenSkills.length > 0 ? (
            <>
              <Collapse in={showAllSkills}>
                <Box component="ul" sx={agenticPageSx.listNested}>
                  {hiddenSkills.map((s, i) => (
                    <Box component="li" key={`hidden-${i}`}>
                      {s}
                    </Box>
                  ))}
                </Box>
              </Collapse>
              <Button
                variant="text"
                onClick={() => setShowAllSkills((prev) => !prev)}
                aria-expanded={showAllSkills}
                sx={agenticPageSx.toggleButton}
              >
                {showAllSkills ? "Hide skills ▲" : "Show all skills ▼"}
              </Button>
            </>
          ) : null}
        </Box>

        <Box sx={agenticPageSx.panelBody}>
          <Typography component="h2" sx={agenticPageSx.sectionTitle}>
            Projects
          </Typography>
          {visibleProjectCategories.map((category, i) => (
            <Box
              component="section"
              key={i}
              sx={
                i === visibleProjectCategories.length - 1 ? undefined : agenticPageSx.projectSectionSpaced
              }
            >
              <Typography component="h3" sx={agenticPageSx.categoryTitle}>
                {category.title}
              </Typography>
              <Box component="ul" sx={agenticPageSx.list}>
                {category.items.map((item, j) => (
                  <Box component="li" key={j} sx={{ mb: 1 }}>
                    <strong>{item.name}</strong>
                    {" - "}
                    <span>{item.description}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
          {hiddenProjectCategories.length > 0 ? (
            <>
              <Collapse in={showAllProjects}>
                <Box sx={agenticPageSx.collapsedProjectsBlock}>
                  {hiddenProjectCategories.map((category, i) => (
                    <Box
                      component="section"
                      key={`hidden-${i}`}
                      sx={
                        i === hiddenProjectCategories.length - 1
                          ? undefined
                          : agenticPageSx.projectSectionSpaced
                      }
                    >
                      <Typography component="h3" sx={agenticPageSx.categoryTitle}>
                        {category.title}
                      </Typography>
                      <Box component="ul" sx={agenticPageSx.list}>
                        {category.items.map((item, j) => (
                          <Box component="li" key={j} sx={{ mb: 1 }}>
                            <strong>{item.name}</strong>
                            {" - "}
                            <span>{item.description}</span>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>
              <Button
                variant="text"
                onClick={() => setShowAllProjects((prev) => !prev)}
                aria-expanded={showAllProjects}
                sx={agenticPageSx.toggleButton}
              >
                {showAllProjects ? "Hide projects ▲" : "Show all projects ▼"}
              </Button>
            </>
          ) : null}
        </Box>

        <Box sx={agenticPageSx.panelBody}>
          <Typography component="h2" sx={agenticPageSx.sectionTitle}>
            Contact
          </Typography>
          <Typography component="p" sx={agenticPageSx.contactLine}>
            <strong>Email:</strong>{" "}
            <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
          </Typography>
          <Typography component="p" sx={agenticPageSx.contactLine}>
            <strong>Phone:</strong>{" "}
            <a href={`tel:${profile.contact.phone.replace(/\s/g, "")}`}>{profile.contact.phone}</a>
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
