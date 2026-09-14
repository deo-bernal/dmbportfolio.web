import { Link as RouterLink } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import { Box, Button, Container, Grid, Link, Stack, Typography } from "@mui/material";
import BookingEmbed from "components/booking/BookingEmbed";
import VoiceAgentButton from "components/voice/VoiceAgentButton";
import AgentDemoReplay from "components/agent/AgentDemoReplay";
import { openInquireModal } from "components/leads/InquiryModal";
import FreeTierNotice from "components/showcase/FreeTierNotice";
import {
  CASE_STUDIES,
  PLATFORMS_SHIPPED,
  SERVICES,
  WALKTHROUGH_URL,
} from "content/showcase";
import {
  accentRedContainedButtonSx,
  landingPageSx,
  showcaseSx,
} from "styles/main_style";

export default function AiAutomationPage() {
  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 } }}>
        <Box sx={landingPageSx.heroPanel}>
          <Stack spacing={3} sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}>
            <Box sx={landingPageSx.heroBadge}>
              <AutoAwesomeIcon sx={{ fontSize: 16 }} />
              <Typography component="span" variant="caption">
                AI implementation · Automation · Funnels
              </Typography>
            </Box>

            <Typography component="h1" sx={landingPageSx.heroTitle}>
              AI systems that capture, qualify, and book your leads.
            </Typography>

            <Typography sx={landingPageSx.heroSubtitle}>
              I build the plumbing behind AI-powered sales: chat assistants grounded
              in your own content, funnels that push every lead into your CRM,
              follow-up that runs itself, and booking that closes the loop. Everything
              on this page is live on this domain — including the assistant in the
              corner. All of it runs on free-tier Groq and Gemini APIs, so performance
              is limited.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
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
                to="/deobernal@gmail.com"
                variant="outlined"
                size="large"
                sx={landingPageSx.ctaSecondary}
              >
                Sample profile
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
              <Button
                component={RouterLink}
                to="/stack"
                variant="outlined"
                size="large"
                sx={landingPageSx.ctaSecondary}
              >
                Platforms and tools
              </Button>
              {WALKTHROUGH_URL ? (
                <Button
                  href={WALKTHROUGH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="large"
                  startIcon={<PlayCircleOutlineIcon />}
                  sx={landingPageSx.ctaSecondary}
                >
                  Watch the walkthrough
                </Button>
              ) : null}
            </Stack>

            <Typography sx={landingPageSx.heroFootnote}>
              <Link
                component={RouterLink}
                to="/deobernal@gmail.com"
                underline="hover"
                sx={landingPageSx.inlineLink}
              >
                View a sample profile
              </Link>
              {" · "}
              Twenty years building software, now focused on AI implementation and
              automation. Deo Bernal, Pampanga, Philippines.
            </Typography>
          </Stack>
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>What I build</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Seven pieces, one working system
          </Typography>
          <Typography sx={showcaseSx.sectionBody}>
            Most AI projects stall because the model works but nothing around it does.
            These are the parts I wire together so a visitor becomes a booked call
            without anyone touching a keyboard.
          </Typography>

          <Grid container spacing={2.5} sx={{ mt: 2.5 }}>
            {SERVICES.map((service) => (
              <Grid key={service.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={showcaseSx.card}>
                  <Typography component="h3" sx={showcaseSx.cardTitle}>
                    {service.title}
                  </Typography>
                  <Typography sx={showcaseSx.cardBody}>{service.description}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>Verifiable work</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Shipped, live, and documented
          </Typography>
          <Typography sx={showcaseSx.sectionBody}>
            Both of these run in production on this domain. Each write-up includes the
            architecture, the decisions, and the production incidents I had to fix.
          </Typography>

          <Grid container spacing={2.5} sx={{ mt: 2.5 }}>
            {CASE_STUDIES.map((study) => (
              <Grid key={study.slug} size={{ xs: 12, md: 6 }}>
                <Box
                  component={RouterLink}
                  to={`/case-studies/${study.slug}`}
                  sx={[showcaseSx.card, showcaseSx.cardLink]}
                >
                  <Typography component="h3" sx={showcaseSx.cardTitle}>
                    {study.title}
                  </Typography>
                  <Typography sx={showcaseSx.cardBody}>{study.tagline}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                    {study.stack.slice(0, 4).map((item) => (
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
        </Box>

        <Box sx={showcaseSx.section} id="profile-agent">
          <Typography sx={showcaseSx.kicker}>Watch the agent work</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            A tool-using Agentic AI profile builder
          </Typography>
          <Typography sx={showcaseSx.sectionBody}>
            This is not the chat bubble. The agent calls tools in order — read a resume, draft a
            profile, check missing fields, then pause for Allow before any write. The replay below
            uses a public sample so the showcase still works when free-tier APIs are busy.
          </Typography>
          <Box sx={{ mt: 2.5 }}>
            <AgentDemoReplay />
          </Box>
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>Talk to the agents</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Chat or voice, same knowledge base
          </Typography>
          <Typography sx={showcaseSx.sectionBody}>
            The chat assistant in the bottom-right corner answers questions about this
            business, qualifies serious enquiries, and hands out the booking link on
            its own. The voice agent takes the same knowledge base over a phone-style
            call.
          </Typography>
          <Box sx={{ mt: 2.5 }}>
            <VoiceAgentButton />
          </Box>
        </Box>

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>Booking</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            Pick a time that suits you
          </Typography>
          <Typography sx={[showcaseSx.sectionBody, { mb: 2.5 }]}>
            Thirty minutes, no pitch. Bring the workflow you want automated and I will
            tell you honestly whether it is worth building.
          </Typography>
          <BookingEmbed />
        </Box>

        <FreeTierNotice />

        <Box sx={showcaseSx.section}>
          <Typography sx={showcaseSx.kicker}>Stack</Typography>
          <Typography component="h2" sx={showcaseSx.sectionTitle}>
            What this is built on
          </Typography>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            {PLATFORMS_SHIPPED.map((group) => (
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
          <Button
            component={RouterLink}
            to="/stack"
            variant="outlined"
            sx={[landingPageSx.ctaSecondary, { mt: 2.5 }]}
          >
            See the full platform list
          </Button>
        </Box>

        <Box sx={landingPageSx.bottomCta}>
          <Typography component="h2" sx={landingPageSx.bottomCtaTitle}>
            Have a workflow that should run itself?
          </Typography>
          <Typography sx={landingPageSx.bottomCtaBody}>
            Send an inquiry, or book a call and we will map it together.
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
              Read the case studies
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
