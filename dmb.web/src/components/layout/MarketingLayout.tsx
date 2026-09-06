import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Link, Stack, Typography } from "@mui/material";
import {
  LoginMainContent,
  accentRedContainedButtonSx,
  landingPageSx
} from "styles/main_style";
import useAuth from "hooks/useAuth";

type MarketingLayoutProps = {
  children: ReactNode;
  mainSx?: object;
};

export default function MarketingLayout({ children, mainSx }: MarketingLayoutProps) {
  const auth = useAuth();
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
            <Typography
              component={RouterLink}
              to="/"
              sx={[landingPageSx.logo, { textDecoration: "none", color: "inherit" }]}
            >
              DMB Web Solutions
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {auth.isAuthenticated ? (
              <Button
                component={RouterLink}
                to="/accent-sidebar/portfolio"
                variant="outlined"
                size="small"
                sx={landingPageSx.headerButtonOutline}
              >
                Dashboard
              </Button>
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
                  Create free profile
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
          </Typography>
        </Container>
      </Box>
    </LoginMainContent>
  );
}
