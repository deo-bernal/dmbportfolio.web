import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import MarketingLayout from "components/layout/MarketingLayout";
import { CASE_STUDIES } from "content/showcase";
import {
  accentRedContainedButtonSx,
  landingPageSx,
  showcaseSx,
} from "styles/main_style";

export default function CaseStudiesPage() {
  return (
    <MarketingLayout mainSx={landingPageSx.main}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={landingPageSx.heroPanel}>
          <Stack spacing={2.5}>
            <Typography sx={showcaseSx.kicker}>Case studies</Typography>
            <Typography component="h1" sx={landingPageSx.heroTitle}>
              Work you can open in another tab.
            </Typography>
            <Typography sx={landingPageSx.heroSubtitle}>
              Every system below runs in production on this domain. Each write-up
              covers the problem, the architecture, the trade-offs, and the incidents
              I had to diagnose after it went live.
            </Typography>
          </Stack>
        </Box>

        <Grid container spacing={2.5}>
          {CASE_STUDIES.map((study) => (
            <Grid key={study.slug} size={{ xs: 12, md: 6 }}>
              <Box
                component={RouterLink}
                to={`/case-studies/${study.slug}`}
                sx={[showcaseSx.card, showcaseSx.cardLink]}
              >
                <Typography sx={showcaseSx.kicker}>
                  {study.timeframe} · {study.role}
                </Typography>
                <Typography component="h2" sx={[showcaseSx.cardTitle, { mt: 1 }]}>
                  {study.title}
                </Typography>
                <Typography sx={showcaseSx.cardBody}>{study.tagline}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                  {study.stack.map((item) => (
                    <Box key={item} component="span" sx={showcaseSx.tag}>
                      {item}
                    </Box>
                  ))}
                </Stack>
                <Typography sx={landingPageSx.featureLink}>Read the case study →</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={[landingPageSx.bottomCta, { mt: 3 }]}>
          <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
            See the automation running
          </Typography>
          <Typography sx={landingPageSx.bottomCtaBody}>
            The lead pipeline on the services page is live — submit it and watch the
            follow-up arrive.
          </Typography>
          <Button
            component={RouterLink}
            to="/ai-automation"
            variant="contained"
            size="large"
            sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx]}
          >
            Open the services page
          </Button>
        </Box>
      </Container>
    </MarketingLayout>
  );
}
