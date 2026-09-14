import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Card,
  Container,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import MarketingLayout from "components/layout/MarketingLayout";
import useAuth from "hooks/useAuth";
import api from "services/http.service";
import { resolvePostLoginPath } from "services/postLoginNavigation";
import { authFlowSx, loginJwtSx, loginPageSx, onboardingPageSx } from "styles/main_style";
import type { ApiMessageResponse } from "models";

type EmailForm = {
  email: string;
  phone: string;
};

type CodeForm = {
  code: string;
};

export default function AuthComplete() {
  const { onLoginSuccess } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticket = useMemo(() => searchParams.get("ticket")?.trim() ?? "", [searchParams]);
  const [step, setStep] = useState<"email" | "code">("email");
  const [rootError, setRootError] = useState("");

  const emailForm = useForm<EmailForm>({
    defaultValues: { email: "", phone: "" },
  });
  const codeForm = useForm<CodeForm>({
    defaultValues: { code: "" },
  });

  const onSendCode = async ({ email, phone }: EmailForm) => {
    setRootError("");
    try {
      await api.post("/auth/external/complete", {
        ticket,
        email: email.trim(),
        phone: phone.trim() || null,
      });
      setStep("code");
    } catch (error: unknown) {
      setRootError(readApiError(error, "Could not send the verification code."));
    }
  };

  const onVerify = async ({ code }: CodeForm) => {
    setRootError("");
    try {
      const { data } = await api.post<{ token: string }>("/auth/external/verify", {
        ticket,
        code: code.trim(),
      });
      if (!data?.token) {
        setRootError("Sign-in did not return a session. Try again.");
        return;
      }
      onLoginSuccess(data.token);
      navigate(await resolvePostLoginPath(), { replace: true });
    } catch (error: unknown) {
      setRootError(readApiError(error, "That code could not be verified."));
    }
  };

  return (
    <MarketingLayout mainSx={onboardingPageSx.container}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={loginPageSx.card}>
          <Box>
            <Typography variant="h2" sx={loginPageSx.titleSignIn}>
              Finish signing up
            </Typography>
            <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
              {step === "email"
                ? "This social account did not share an email. Enter yours to finish — phone-only Facebook accounts often need this step."
                : "Enter the 6-digit code we emailed you."}
            </Typography>
          </Box>

          {!ticket ? (
            <Box sx={loginJwtSx.form}>
              <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                This sign-up session is missing. Start again with Google, LinkedIn, or Facebook.
              </FormHelperText>
              <Button component={RouterLink} to="/login" fullWidth size="large" variant="contained" sx={loginJwtSx.submitButton}>
                Back to sign in
              </Button>
            </Box>
          ) : step === "email" ? (
            <Box component="form" onSubmit={emailForm.handleSubmit(onSendCode)} noValidate sx={loginJwtSx.form}>
              <TextField
                sx={loginJwtSx.textField}
                label="Email"
                type="email"
                fullWidth
                autoComplete="email"
                autoFocus
                error={Boolean(emailForm.formState.errors.email)}
                helperText={emailForm.formState.errors.email?.message}
                {...emailForm.register("email", { required: "Email is required." })}
              />
              <TextField
                sx={loginJwtSx.textField}
                label="Phone (optional)"
                fullWidth
                autoComplete="tel"
                {...emailForm.register("phone")}
              />
              <Button
                sx={loginJwtSx.submitButton}
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disableElevation
                disabled={emailForm.formState.isSubmitting}
                startIcon={emailForm.formState.isSubmitting ? <ButtonLoadingIcon /> : null}
              >
                Send code
              </Button>
              {rootError ? (
                <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                  {rootError}
                </FormHelperText>
              ) : null}
            </Box>
          ) : (
            <Box component="form" onSubmit={codeForm.handleSubmit(onVerify)} noValidate sx={loginJwtSx.form}>
              <TextField
                sx={loginJwtSx.textField}
                label="6-digit code"
                fullWidth
                autoComplete="one-time-code"
                autoFocus
                slotProps={{
                  htmlInput: { maxLength: 6, inputMode: "numeric" },
                }}
                error={Boolean(codeForm.formState.errors.code)}
                helperText={codeForm.formState.errors.code?.message}
                {...codeForm.register("code", { required: "Enter the code from your email." })}
              />
              <Button
                sx={loginJwtSx.submitButton}
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disableElevation
                disabled={codeForm.formState.isSubmitting}
                startIcon={codeForm.formState.isSubmitting ? <ButtonLoadingIcon /> : null}
              >
                Verify and continue
              </Button>
              {rootError ? (
                <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                  {rootError}
                </FormHelperText>
              ) : null}
            </Box>
          )}

          <Box sx={authFlowSx.footerRow}>
            <Link component={RouterLink} to="/login" sx={authFlowSx.footerLink}>
              Back to sign in
            </Link>
          </Box>
        </Card>
      </Container>
    </MarketingLayout>
  );
}

function readApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Unable to reach API. Check API URL and backend status.";
    }
    const data = error.response.data as Partial<ApiMessageResponse>;
    return data?.message ?? fallback;
  }
  return fallback;
}
