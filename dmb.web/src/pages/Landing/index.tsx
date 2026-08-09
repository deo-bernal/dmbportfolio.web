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
import MarketingLayout from "components/layout/MarketingLayout";
import {
  accentRedContainedButtonSx,
  landingPageSx,
} from "styles/main_style";
import { getOnboardLoginPath } from "utils/navigation";

const features = [
  {
    icon: AutoAwesomeIcon,
    title: "Build with AI",
    description:
      "Paste your resume or answer a few questions — your portfolio and resume are generated for you.",
    href: getOnboardLoginPath(),
    cta: "Start AI builder",
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
    <MarketingLayout>
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
                to={getOnboardLoginPath()}
                variant="outlined"
                size="large"
                sx={landingPageSx.ctaSecondary}
              >
                Build with AI
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
          {features.map(({ icon: Icon, title, description, href, cta }) => {
            const card = (
              <>
                <Box sx={landingPageSx.featureIconWrap}>
                  <Icon sx={{ fontSize: 22, color: "#475569" }} />
                </Box>
                <Typography component="h2" sx={landingPageSx.featureTitle}>
                  {title}
                </Typography>
                <Typography sx={landingPageSx.featureBody}>{description}</Typography>
                {href && cta ? (
                  <Typography sx={landingPageSx.featureLink}>{cta} →</Typography>
                ) : null}
              </>
            );

            return (
              <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
                {href ? (
                  <Box
                    component={RouterLink}
                    to={href}
                    sx={[landingPageSx.featureCard, landingPageSx.featureCardLink]}
                  >
                    {card}
                  </Box>
                ) : (
                  <Box sx={landingPageSx.featureCard}>{card}</Box>
                )}
              </Grid>
            );
          })}
        </Grid>

        <Box sx={landingPageSx.bottomCta}>
          <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
            Ready to go live?
          </Typography>
          <Typography sx={landingPageSx.bottomCtaBody}>
            Register free, build your profile, and share your link today.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "center" }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx]}
            >
              Get started — it&apos;s free
            </Button>
            <Button
              component={RouterLink}
              to={getOnboardLoginPath()}
              variant="outlined"
              size="large"
              sx={landingPageSx.ctaSecondary}
            >
              Build with AI
            </Button>
          </Stack>
        </Box>
      </Container>
    </MarketingLayout>
  );
}
