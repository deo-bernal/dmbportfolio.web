import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Link, Stack, Typography } from "@mui/material";
import {
  LoginMainContent,
  accentRedContainedButtonSx,
  landingPageSx
} from "styles/main_style";
import useAuth from "hooks/useAuth";
import useAccountGreeting from "hooks/useAccountGreeting";
import {
  AI_AUTOMATION_PATH,
  AGENT_OPS_PATH,
  COMMERCE_PATH,
  CRM_PATH,
  LANGCHAT_PATH,
  LMS_PATH,
  PROFILES_PATH,
} from "utils/navigation";

type MarketingLayoutProps = {
  children: ReactNode;
  mainSx?: object;
  embedded?: boolean;
};

export default function MarketingLayout({ children, mainSx, embedded = false }: MarketingLayoutProps) {
  const auth = useAuth();
  const firstName = useAccountGreeting();

  if (embedded) {
    return <Box sx={mainSx}>{children}</Box>;
  }

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
            <Box
              component={RouterLink}
              to={AI_AUTOMATION_PATH}
              sx={[
                landingPageSx.logo,
                {
                  textDecoration: "none",
                  color: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.25,
                },
              ]}
            >
              <Box
                component="img"
                src="/dmb-web-solutions-logo.png"
                alt=""
                sx={{ width: 40, height: 40, borderRadius: 1.25, display: "block", flexShrink: 0 }}
              />
              DMB Web Solutions
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Button
              component={RouterLink}
              to="/ai-automation"
              size="small"
              sx={[
                landingPageSx.headerButtonOutline,
                { border: "none", display: { xs: "none", sm: "inline-flex" } },
              ]}
            >
              AI automation
            </Button>
            <Button
              component="a"
              href={CRM_PATH}
              size="small"
              sx={[
                landingPageSx.headerButtonOutline,
                { border: "none", display: { xs: "none", sm: "inline-flex" } },
              ]}
            >
              CRM
            </Button>
            <Button
              component="a"
              href={LMS_PATH}
              size="small"
              sx={[
                landingPageSx.headerButtonOutline,
                { border: "none", display: { xs: "none", sm: "inline-flex" } },
              ]}
            >
              LMS
            </Button>
            <Button
              component="a"
              href={COMMERCE_PATH}
              size="small"
              sx={[
                landingPageSx.headerButtonOutline,
                { border: "none", display: { xs: "none", sm: "inline-flex" } },
              ]}
            >
              Commerce
            </Button>
            <Button
              component="a"
              href={AGENT_OPS_PATH}
              size="small"
              sx={[
                landingPageSx.headerButtonOutline,
                { border: "none", display: { xs: "none", sm: "inline-flex" } },
              ]}
            >
              Agent
            </Button>
            <Button
              component="a"
              href={LANGCHAT_PATH}
              size="small"
              sx={[
                landingPageSx.headerButtonOutline,
                { border: "none", display: { xs: "none", md: "inline-flex" } },
              ]}
            >
              LangChat
            </Button>
            {auth.isAuthenticated ? (
              <>
                {firstName ? (
                  <Typography sx={landingPageSx.headerGreeting}>Hi {firstName}</Typography>
                ) : null}
                <Button
                  component={RouterLink}
                  to="/accent-sidebar/portfolio"
                  variant="outlined"
                  size="small"
                  sx={landingPageSx.headerButtonOutline}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
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
                  Create account
                </Button>
              </>
            )}

            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box component="main" sx={mainSx}>
        {children}
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
            {" · "}
            <Link href={CRM_PATH} underline="hover" sx={landingPageSx.inlineLink}>
              CRM
            </Link>
            {" · "}
            <Link href={LMS_PATH} underline="hover" sx={landingPageSx.inlineLink}>
              LMS
            </Link>
            {" · "}
            <Link href={COMMERCE_PATH} underline="hover" sx={landingPageSx.inlineLink}>
              Commerce
            </Link>
            {" · "}
            <Link href={AGENT_OPS_PATH} underline="hover" sx={landingPageSx.inlineLink}>
              Agent
            </Link>
            {" · "}
            <Link href={LANGCHAT_PATH} underline="hover" sx={landingPageSx.inlineLink}>
              LangChat
            </Link>
            {" · "}
            <Link component={RouterLink} to={`${PROFILES_PATH}#lots`} underline="hover" sx={landingPageSx.inlineLink}>
              Lots in Pampanga
            </Link>
          </Typography>
        </Container>
      </Box>
    </LoginMainContent>
  );
}
