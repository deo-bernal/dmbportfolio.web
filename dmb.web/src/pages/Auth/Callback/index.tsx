import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Card, Container, FormHelperText, Typography, CircularProgress } from "@mui/material";
import useAuth from "hooks/useAuth";
import MarketingLayout from "components/layout/MarketingLayout";
import { authFlowSx, loginPageSx, loginJwtSx, onboardingPageSx } from "styles/main_style";
import { resolvePostLoginPath } from "services/postLoginNavigation";
import { getSafeRedirectPath } from "utils/navigation";

export default function AuthCallback() {
  const { onLoginSuccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Sign-in did not return a session. Try again from the login page.");
      return;
    }

    let cancelled = false;
    onLoginSuccess(token);
    (async () => {
      const nextPath = redirectPath ?? (await resolvePostLoginPath());
      if (!cancelled) {
        navigate(nextPath, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, onLoginSuccess, navigate, redirectPath]);

  return (
    <MarketingLayout mainSx={onboardingPageSx.container}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={loginPageSx.card}>
          <Box>
            <Typography variant="h2" sx={loginPageSx.titleSignIn}>
              Signing you in
            </Typography>
            <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
              Finishing social sign-in.
            </Typography>
          </Box>
          <Box sx={loginJwtSx.form}>
            {error ? (
              <>
                <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                  {error}
                </FormHelperText>
                <Button component={RouterLink} to="/login" fullWidth size="large" variant="contained" sx={loginJwtSx.submitButton}>
                  Back to sign in
                </Button>
              </>
            ) : (
              <Box sx={authFlowSx.activateLoadingBox}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </Card>
      </Container>
    </MarketingLayout>
  );
}
