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
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import LanguageIcon from "@mui/icons-material/Language";
import DescriptionIcon from "@mui/icons-material/Description";
import SpeedIcon from "@mui/icons-material/Speed";
import MarketingLayout from "components/layout/MarketingLayout";
import {
  accentRedContainedButtonSx,
  landingPageSx,
} from "styles/main_style";
import { getOnboardLoginPath } from "utils/navigation";

const REAL_ESTATE_LISTINGS_URL = "https://onepropertee.com/deo-bernal";

const listings = [
  {
    title: "Two adjacent residential lots in Pandacaqui-Telapayong",
    price: "₱1.50 million",
    meta: "192 sqm · Mexico, Pampanga · For sale",
  },
  {
    title: "Semi-commercial lot in Pandacaqui",
    price: "₱2.50 million",
    meta: "180 sqm · Mexico, Pampanga · For sale",
  },
];

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
    <MarketingLayout mainSx={landingPageSx.main}>
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
              DMB Web Solutions builds free online profiles with AI — and also
              lists real estate in Pampanga. Create a professional web presence,
              or browse lots for sale in Mexico and Porac.
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

        <Box sx={landingPageSx.businessSection}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <SmartToyIcon sx={{ color: "#475569" }} />
              <Typography component="span" variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>
                AI implementation · Automation · Funnels
              </Typography>
            </Stack>
            <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
              AI automation for businesses
            </Typography>
            <Typography sx={landingPageSx.heroSubtitle}>
              Chat assistants, lead capture funnels, CRM integration, automated
              follow-up, and appointment booking — built and running on this domain,
              not just described. See the case studies and the live lead pipeline.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={RouterLink}
                to="/ai-automation"
                variant="contained"
                size="large"
                sx={[
                  landingPageSx.ctaPrimary,
                  accentRedContainedButtonSx,
                  { alignSelf: { xs: "stretch", sm: "flex-start" } },
                ]}
              >
                See AI automation services
              </Button>
              <Button
                component={RouterLink}
                to="/case-studies"
                variant="outlined"
                size="large"
                sx={[landingPageSx.ctaSecondary, { alignSelf: { xs: "stretch", sm: "flex-start" } }]}
              >
                Read the case studies
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box sx={landingPageSx.businessSection}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <HomeWorkIcon sx={{ color: "#475569" }} />
              <Typography component="span" variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>
                Real estate · Porac and Mexico, Pampanga
              </Typography>
            </Stack>
            <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
              Properties for sale
            </Typography>
            <Typography sx={landingPageSx.heroSubtitle}>
              Independent property listings by Deo Bernal (PRC 0017233). Residential
              and commercial lots in NHA Pandacaqui, Mexico, and Sinura, Porac.
            </Typography>
            <Grid container spacing={2.5}>
              {listings.map((listing) => (
                <Grid key={listing.title} size={{ xs: 12, md: 6 }}>
                  <Box sx={landingPageSx.listingCard}>
                    <Typography sx={landingPageSx.listingMeta}>{listing.meta}</Typography>
                    <Typography sx={landingPageSx.listingPrice}>{listing.price}</Typography>
                    <Typography sx={landingPageSx.featureTitle}>{listing.title}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Button
              href={REAL_ESTATE_LISTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
              sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx, { alignSelf: { xs: "stretch", sm: "flex-start" } }]}
            >
              View listings on OnePropertee
            </Button>
          </Stack>
        </Box>

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
