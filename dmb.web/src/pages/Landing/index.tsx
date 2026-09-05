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
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import MarketingLayout from "components/layout/MarketingLayout";
import {
  accentRedContainedButtonSx,
  landingPageSx,
} from "styles/main_style";
import { getOnboardLoginPath } from "utils/navigation";

const REAL_ESTATE_LISTINGS_URL = "https://onepropertee.com/deo-bernal";

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
    icon: HomeWorkOutlinedIcon,
    title: "Pampanga lots",
    description:
      "DMB Real Estate — residential and semi-commercial lots in Mexico and Porac, Pampanga.",
    href: REAL_ESTATE_LISTINGS_URL,
    cta: "View listings",
    external: true,
  },
];

const listings = [
  {
    title: "Residential lot — Mexico, Pampanga",
    details: "192 sqm in Pandacaqui-Telapayong. About ₱1.50 million (₱7,812/sqm).",
  },
  {
    title: "Semi-commercial lot — Mexico, Pampanga",
    details: "180 sqm in Pandacaqui. About ₱2.50 million (₱13,888/sqm).",
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
                DMB Profiles · DMB Real Estate
              </Typography>
            </Box>

            <Typography component="h1" sx={landingPageSx.heroTitle}>
              Software profiles. Pampanga property. One DMB home.
            </Typography>

            <Typography sx={landingPageSx.heroSubtitle}>
              Build a free online portfolio with AI, or talk to Deo Bernal about lots
              in Mexico and Porac, Pampanga. PRC license 0017233.
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
                href={REAL_ESTATE_LISTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="large"
                sx={landingPageSx.ctaSecondary}
              >
                View lots for sale
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
                View Deo&apos;s profile
              </Link>
              {" · "}
              <Link
                href={REAL_ESTATE_LISTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={landingPageSx.inlineLink}
              >
                OnePropertee listings
              </Link>
            </Typography>
          </Stack>
        </Box>

        <Grid container spacing={2.5} sx={landingPageSx.featureGrid}>
          {features.map(({ icon: Icon, title, description, href, cta, external }) => {
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
                {href && external ? (
                  <Box
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={[landingPageSx.featureCard, landingPageSx.featureCardLink]}
                  >
                    {card}
                  </Box>
                ) : href ? (
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

        <Box sx={[landingPageSx.heroPanel, { mb: 3 }]}>
          <Stack spacing={1} sx={{ mb: 2.5 }}>
            <Typography component="h2" sx={landingPageSx.sectionTitle}>
              DMB Real Estate
            </Typography>
            <Typography sx={landingPageSx.heroSubtitle}>
              Lots for sale in Mexico and Porac, Pampanga. Direct from the owner —
              Deo Bernal, PRC 0017233.
            </Typography>
          </Stack>
          <Grid container spacing={2.5}>
            {listings.map((listing) => (
              <Grid key={listing.title} size={{ xs: 12, md: 6 }}>
                <Box sx={landingPageSx.featureCard}>
                  <Typography sx={landingPageSx.listingPrice}>{listing.title}</Typography>
                  <Typography sx={landingPageSx.featureBody}>{listing.details}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Button
            href={REAL_ESTATE_LISTINGS_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx, { mt: 2.5 }]}
          >
            See all listings
          </Button>
        </Box>

        <Box sx={landingPageSx.bottomCta}>
          <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
            Ready to go live?
          </Typography>
          <Typography sx={landingPageSx.bottomCtaBody}>
            Register free, build your profile, or message about Pampanga lots.
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
              href={REAL_ESTATE_LISTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              size="large"
              sx={landingPageSx.ctaSecondary}
            >
              Contact for property
            </Button>
          </Stack>
        </Box>
      </Container>
    </MarketingLayout>
  );
}
