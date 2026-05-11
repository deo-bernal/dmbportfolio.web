import { useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Button,
  Card,
  Container,
  FormHelperText,
  Link,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { Controller } from "react-hook-form";
import { resetPasswordSchema } from "validations/schema/auth";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { LoginMainContent, LoginTopWrapper, authFlowSx, loginPageSx, loginJwtSx } from "styles/main_style";
import api from "services/http.service";
import type { ApiMessageResponse, ResetFormValues, ResetPasswordRequest } from "models";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetFormValues) => {
    if (!tokenFromUrl) {
      setError("root", { type: "manual", message: "Missing reset token. Open the link from your email." });
      return;
    }
    try {
      const payload: ResetPasswordRequest = {
        token: tokenFromUrl,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      };
      await api.post("/auth/reset-password", payload);
      window.location.assign("/login");
    } catch (error: unknown) {
      let errorMessage = "Could not reset password. The link may have expired.";
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          errorMessage = "Unable to reach API. Check API URL and backend status.";
        } else {
          const data = error.response.data as Partial<ApiMessageResponse>;
          errorMessage = data?.message ?? errorMessage;
        }
      }
      setError("root", { type: "manual", message: errorMessage });
    }
  };

  return (
    <LoginMainContent>
      <LoginTopWrapper>
        <Container maxWidth="sm">
          <Card elevation={0} sx={loginPageSx.card}>
            <Box>
              <Typography variant="h2" sx={loginPageSx.titleSignIn}>
                Set a new password
              </Typography>
              <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
                Choose a new password for your account.
              </Typography>
            </Box>

            {!tokenFromUrl ? (
              <Typography color="error" sx={authFlowSx.errorBanner}>
                This page needs a valid reset link. Request a new one from forgot password.
              </Typography>
            ) : null}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={loginJwtSx.form}>
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    sx={loginJwtSx.textField}
                    label="New password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    autoComplete="new-password"
                    error={Boolean(errors.newPassword)}
                    helperText={errors.newPassword?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                              <IconButton
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                edge="end"
                                aria-label="toggle new password"
                                sx={loginJwtSx.visibilityIconButton}
                              >
                                {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    sx={loginJwtSx.textField}
                    label="Confirm password"
                    type={showConfirm ? "text" : "password"}
                    fullWidth
                    autoComplete="new-password"
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showConfirm ? "Hide password" : "Show password"}>
                              <IconButton
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                edge="end"
                                aria-label="toggle confirm password"
                                sx={loginJwtSx.visibilityIconButton}
                              >
                                {showConfirm ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
              <Button
                sx={loginJwtSx.submitButton}
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disableElevation
                disabled={isSubmitting || !tokenFromUrl}
                startIcon={isSubmitting ? <ButtonLoadingIcon /> : null}
              >
                Update password
              </Button>
              {errors.root ? (
                <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                  {errors.root.message}
                </FormHelperText>
              ) : null}
            </Box>

            <Box sx={authFlowSx.footerRow}>
              <Link component={RouterLink} to="/login" sx={authFlowSx.footerLink}>
                Back to login
              </Link>
            </Box>
          </Card>
        </Container>
      </LoginTopWrapper>
    </LoginMainContent>
  );
}
