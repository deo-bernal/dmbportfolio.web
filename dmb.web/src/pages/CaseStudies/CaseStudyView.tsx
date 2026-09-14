import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import MarketingLayout from "components/layout/MarketingLayout";
import { openInquireModal } from "components/leads/InquiryModal";
import FreeTierNotice from "components/showcase/FreeTierNotice";
import { findCaseStudy, type CaseStudySection } from "content/showcase";
import {
  accentRedContainedButtonSx,
  agenticPageSx,
  landingPageSx,
  showcaseSx,
} from "styles/main_style";

function Section({ section }: { section: CaseStudySection }) {
  return (
    <Box sx={showcaseSx.section}>
      <Typography component="h2" sx={showcaseSx.bodyHeading}>
        {section.heading}
      </Typography>

      <Stack spacing={1.5}>
        {section.body?.map((paragraph) => (
          <Typography key={paragraph.slice(0, 40)} sx={showcaseSx.sectionBody}>
            {paragraph}
          </Typography>
        ))}

        {section.bullets?.length ? (
          <Stack component="ul" spacing={1} sx={{ pl: 2.5, m: 0 }}>
            {section.bullets.map((bullet) => (
              <Typography component="li" key={bullet.slice(0, 40)} sx={showcaseSx.bullet}>
                {bullet}
              </Typography>
            ))}
          </Stack>
        ) : null}

        {section.code ? (
          <Box>
            <Box component="pre" sx={showcaseSx.codeBlock}>
              <code>{section.code.content}</code>
            </Box>
            <Typography sx={showcaseSx.codeCaption}>{section.code.caption}</Typography>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function CaseStudyView() {
  const { slug } = useParams<{ slug: string }>();
  const study = slug ? findCaseStudy(slug) : undefined;

  if (!study) {
    return <Navigate to="/case-studies" replace />;
  }

  return (
    <MarketingLayout mainSx={agenticPageSx.embeddedMain} embedded>
      <Container maxWidth="md" sx={{ py: { xs: 1, md: 2 } }}>
        <Box sx={landingPageSx.heroPanel}>
          <Stack spacing={2.5}>
            <Typography sx={showcaseSx.kicker}>
              Case study · {study.timeframe} · {study.role}
            </Typography>
            <Typography component="h1" sx={[landingPageSx.heroTitle, { maxWidth: "26ch" }]}>
              {study.title}
            </Typography>
            <Typography sx={landingPageSx.heroSubtitle}>{study.tagline}</Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              {study.stack.map((item) => (
                <Box key={item} component="span" sx={showcaseSx.tag}>
                  {item}
                </Box>
              ))}
            </Stack>

            <Grid container spacing={2}>
              {study.metrics.map((metric) => (
                <Grid key={metric.label} size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
                  <Typography sx={showcaseSx.metricLabel}>{metric.label}</Typography>
                  <Typography sx={showcaseSx.metricValue}>{metric.value}</Typography>
                </Grid>
              ))}
            </Grid>

            <Typography sx={showcaseSx.codeCaption}>
              Verify it yourself: {study.liveProof}
            </Typography>
          </Stack>
        </Box>

        {study.sections.map((section) => (
          <Section key={section.heading} section={section} />
        ))}

        <FreeTierNotice />

        <Box sx={landingPageSx.bottomCta}>
          <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
            Want one of these for your business?
          </Typography>
          <Typography sx={landingPageSx.bottomCtaBody}>
            The same capture, qualify, follow-up, and booking loop takes days, not
            months.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "center" }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => openInquireModal()}
              sx={[landingPageSx.ctaPrimary, accentRedContainedButtonSx]}
            >
              Inquire
            </Button>
            <Button
              component={RouterLink}
              to="/case-studies"
              variant="outlined"
              size="large"
              sx={landingPageSx.ctaSecondary}
            >
              All case studies
            </Button>
          </Stack>
        </Box>
      </Container>
    </MarketingLayout>
  );
}
