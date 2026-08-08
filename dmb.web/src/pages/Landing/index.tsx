import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LanguageIcon from "@mui/icons-material/Language";
import DescriptionIcon from "@mui/icons-material/Description";
import SpeedIcon from "@mui/icons-material/Speed";
import {
  LoginMainContent,
  accentRedContainedButtonSx,
  landingPageSx,
} from "styles/main_style";

const features = [
  {
    icon: AutoAwesomeIcon,
    title: "Build with AI",
    description:
      "Paste your resume or answer a few questions — your portfolio and resume are generated for you.",
  },
  {
    icon: LanguageIcon,
    title: "Live public URL",
    description:
      "Share one link: yourname.dmbwebsolutions.com. Portfolio and resume, always online.",
  },
  {
    icon: DescriptionIcon,
    title: "Portfolio + resume",
    description:
      "Professional summary, skills, projects, work history, and education in one place.",
  },
  {
    icon: SpeedIcon,
    title: "Free to start",
    description:
      "Create and publish your online profile at no cost. Upgrade later when you need more.",
  },
];

export default function LandingPage() {
  return (
    <LoginMainContent sx={landingPageSx.root}>
      <Box component="header" sx={landingPageSx.header}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            sx={[
              landingPageSx.headerInner,
              { alignItems: "center", justifyContent: "space-between" },
            ]}
          >
            <Typography component="span" sx={landingPageSx.logo}>
              DMB Profiles
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="small"
                sx={landingPageSx.headerButtonOutline}
              >
                Sign in
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="small"
                sx={[landingPageSx.headerButtonPrimary, accentRedContainedButtonSx]}
              >
                Create free profile
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box component="main" sx={landingPageSx.main}>
        <Container maxWidth="lg">
          <Box sx={landingPageSx.heroPanel}>
            <Stack spacing={3} sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}>
              <Box sx={landingPageSx.heroBadge}>
                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                <Typography component="span" variant="caption">
                  Free online profiles with AI builder
                </Typography>
              </Box>

              <Typography component="h1" sx={landingPageSx.heroTitle}>
                Your professional story, online in minutes.
              </Typography>

              <Typography sx={landingPageSx.heroSubtitle}>
                Create a free portfolio and resume page you can share anywhere.
                Perfect for job seekers, freelancers, and students who need a
                professional web presence without building a site from scratch.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  size="large"
                  sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx]}
                >
                  Create your free profile
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={landingPageSx.ctaSecondary}
                >
                  Sign in
                </Button>
              </Stack>

              <Typography sx={landingPageSx.heroFootnote}>
                Already live?{" "}
                <Link
                  component={RouterLink}
                  to="/deobernal@gmail.com"
                  underline="hover"
                  sx={landingPageSx.inlineLink}
                >
                  View an example profile
                </Link>
              </Typography>
            </Stack>
          </Box>

          <Grid container spacing={2.5} sx={landingPageSx.featureGrid}>
            {features.map(({ icon: Icon, title, description }) => (
              <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={landingPageSx.featureCard}>
                  <Box sx={landingPageSx.featureIconWrap}>
                    <Icon sx={{ fontSize: 22, color: "#475569" }} />
                  </Box>
                  <Typography component="h2" sx={landingPageSx.featureTitle}>
                    {title}
                  </Typography>
                  <Typography sx={landingPageSx.featureBody}>{description}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={landingPageSx.bottomCta}>
            <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
              Ready to go live?
            </Typography>
            <Typography sx={landingPageSx.bottomCtaBody}>
              Register free, build your profile, and share your link today.
            </Typography>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx]}
            >
              Get started — it&apos;s free
            </Button>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={landingPageSx.footer}>
        <Container maxWidth="lg">
          <Typography sx={landingPageSx.footerText}>
            © {new Date().getFullYear()} DMB Web Solutions ·{" "}
            <Link
              href="https://www.dmbwebsolutions.com/"
              underline="hover"
              sx={landingPageSx.inlineLink}
            >
              dmbwebsolutions.com
            </Link>
          </Typography>
        </Container>
      </Box>
    </LoginMainContent>
  );
}
