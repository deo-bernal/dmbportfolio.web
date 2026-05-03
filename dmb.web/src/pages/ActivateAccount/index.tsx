import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Box, Button, Card, Container, FormHelperText, Link, Typography, CircularProgress } from "@mui/material";
import axios from "axios";
import { LoginMainContent, LoginTopWrapper, loginPageSx } from "styles/main_style";
import { loginJwtSx } from "styles/main_style";
import api from "services/http.service";
import type { ActivateAccountRequest, ActivateStatus, ApiMessageResponse } from "models";

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [status, setStatus] = useState<ActivateStatus>(() => (tokenFromUrl ? "loading" : "error"));
  const [message, setMessage] = useState(() =>
    tokenFromUrl ? "" : "This page needs a valid activation link from your email."
  );

  useEffect(() => {
    if (!tokenFromUrl) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const payload: ActivateAccountRequest = { token: tokenFromUrl };
        await api.post("/registration/activate", payload);
        if (!cancelled) {
          setStatus("success");
          setMessage("Your account is activated. You can sign in now.");
        }
      } catch (error: unknown) {
        let errorMessage = "Activation failed. The link may have expired.";
        if (axios.isAxiosError(error)) {
          if (!error.response) {
            errorMessage = "Unable to reach API. Check API URL and backend status.";
          } else {
            const data = error.response.data as Partial<ApiMessageResponse>;
            errorMessage = data?.message ?? errorMessage;
          }
        }
        if (!cancelled) {
          setStatus("error");
          setMessage(errorMessage);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl]);

  return (
    <LoginMainContent>
      <LoginTopWrapper>
        <Container maxWidth="sm">
          <Card elevation={0} sx={loginPageSx.card}>
            <Box>
              <Typography variant="h2" sx={loginPageSx.titleSignIn}>
                Account activation
              </Typography>
              <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
                {tokenFromUrl
                  ? "Confirming your email address."
                  : "Open the activation link from your registration email."}
              </Typography>
            </Box>

            <Box sx={loginJwtSx.form}>
              {status === "loading" ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : null}

              {status === "success" ? (
                <Typography color="success.main" sx={{ mb: 2 }}>
                  {message}
                </Typography>
              ) : null}

              {status === "error" ? <FormHelperText error sx={loginJwtSx.rootErrorHelper}>{message}</FormHelperText> : null}

              {status === "success" || status === "error" ? (
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={loginJwtSx.submitButton}
                  fullWidth
                  size="large"
                  variant="contained"
                  disableElevation
                >
                  Back to login
                </Button>
              ) : null}
            </Box>

            {status === "error" && tokenFromUrl ? (
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Link component={RouterLink} to="/register" sx={{ fontWeight: 700 }}>
                  Register again
                </Link>
              </Box>
            ) : null}
          </Card>
        </Container>
      </LoginTopWrapper>
    </LoginMainContent>
  );
}
