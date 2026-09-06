import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import MarketingLayout from "components/layout/MarketingLayout";
import { PLATFORMS_SHIPPED, PLATFORMS_WORKING, type PlatformGroup } from "content/showcase";
import {
  accentRedContainedButtonSx,
  landingPageSx,
  showcaseSx,
} from "styles/main_style";

function GroupGrid({ groups }: { groups: PlatformGroup[] }) {
  return (
    <Grid container spacing={2.5} sx={{ mt: 1 }}>
      {groups.map((group) => (
        <Grid key={group.title} size={{ xs: 12, md: 4 }}>
          <Box sx={showcaseSx.card}>
            <Typography component="h3" sx={showcaseSx.cardTitle}>
              {group.title}
            </Typography>
            <Typography sx={showcaseSx.metricLabel}>{group.note}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
              {group.items.map((item) => (
                <Box key={item} component="span" sx={showcaseSx.tag}>
                  {item}
                </Box>
              ))}
            </Stack>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

export default function StackPage() {
  return (
    <MarketingLayout mainSx={landingPageSx.main}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={landingPageSx.heroPanel}>
          <Stack spacing={2.5}>
            <Typography sx={showcaseSx.kicker}>Platforms and tools</Typography>
            <Typography component="h1" sx={landingPageSx.heroTitle}>
              An honest inventory, split two ways.
            </Typography>
            <Typography sx={landingPageSx.heroSubtitle}>
              Tool lists are cheap, so this one is divided. The first half is running
              in production on this domain and documented in the repository behind it.
              The second half is genuine working knowledge, transferable from the same
              patterns, but not something I am going to claim years on.
            </Typography>
          </Stack>
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>Built and shipped</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Running in production right now
          </Typography>
          <Typography sx={showcaseSx.sectionBody}>
            Each of these is doing real work behind this site: the chat assistant, the
            AI profile builder, and the lead pipeline on the services page.
          </Typography>
          <GroupGrid groups={PLATFORMS_SHIPPED} />
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>Working knowledge</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Comfortable, and quick to get productive
          </Typography>
          <Typography sx={showcaseSx.sectionBody}>
            These are platform-shaped versions of things I have already built by hand.
            Once you have wired webhooks, a database, an email provider, and a booking
            calendar into one flow, moving that flow onto GoHighLevel or Make is
            configuration rather than new ground.
          </Typography>
          <GroupGrid groups={PLATFORMS_WORKING} />
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>How I work</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Build it, test it, document it, keep it running
          </Typography>
          <Stack component="ul" spacing={1} sx={{ pl: 2.5, m: 0, mt: 1.5 }}>
            <Typography component="li" sx={showcaseSx.bullet}>
              Every automation ships with a runbook: what it does, which environment
              variables it needs, and what to check first when it breaks.
            </Typography>
            <Typography component="li" sx={showcaseSx.bullet}>
              Third-party failures are assumed, not hoped against — providers get
              fallbacks and errors get readable messages.
            </Typography>
            <Typography component="li" sx={showcaseSx.bullet}>
              Workflows are exported to version control so a reviewer can read the
              automation without logging into anything.
            </Typography>
            <Typography component="li" sx={showcaseSx.bullet}>
              Secrets stay server-side. Nothing that touches a database or a provider
              key is ever shipped in the browser bundle.
            </Typography>
          </Stack>
        </Box>

        <Box sx={landingPageSx.bottomCta}>
          <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
            Want to see it end to end?
          </Typography>
          <Typography sx={landingPageSx.bottomCtaBody}>
            The services page runs the whole pipeline in front of you.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "center" }}
          >
            <Button
              component={RouterLink}
              to="/ai-automation"
              variant="contained"
              size="large"
              sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx]}
            >
              Open the services page
            </Button>
            <Button
              component={RouterLink}
              to="/case-studies"
              variant="outlined"
              size="large"
              sx={landingPageSx.ctaSecondary}
            >
              Read the case studies
            </Button>
          </Stack>
        </Box>
      </Container>
    </MarketingLayout>
  );
}
