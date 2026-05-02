import { forwardRef, useState, type ReactElement, type Ref } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  FormHelperText,
  Link,
  Slide,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import axios from "axios";
import { forgotPasswordSchema } from "validations/schema/auth";
import { LoginMainContent, LoginTopWrapper, loginPageSx } from "styles/main_style";
import { loginJwtSx } from "styles/main_style";
import api from "services/http.service";

type ForgotFormValues = {
  email: string;
};

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function ForgotPassword() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      setDialogOpen(true);
    } catch (error: unknown) {
      let errorMessage = "Unable to send reset email. Try again later.";
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          errorMessage = "Unable to reach API. Check API URL and backend status.";
        } else {
          const data = error.response.data as { message?: string };
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
                Recover password
              </Typography>
              <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
                Enter the email you use for this account. If it exists, we will send a reset link.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={loginJwtSx.form}>
              <TextField
                sx={loginJwtSx.textField}
                label="Email address"
                type="email"
                fullWidth
                autoComplete="email"
                autoFocus
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register("email")}
              />
              <Button
                sx={loginJwtSx.submitButton}
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disableElevation
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size="1rem" sx={loginJwtSx.submitSpinner} /> : null}
              >
                Send reset link
              </Button>
              {errors.root ? (
                <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                  {errors.root.message}
                </FormHelperText>
              ) : null}
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Typography component="span" variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>
                Want to sign in again?{" "}
              </Typography>
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 700 }}>
                Back to login
              </Link>
            </Box>
          </Card>
        </Container>
      </LoginTopWrapper>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slots={{ transition: Transition }}
        keepMounted
      >
        <Box sx={{ px: 4, pb: 4, pt: 4 }}>
          <Typography variant="h3" align="center" sx={{ mb: 2 }}>
            Check your email
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            If that address is registered, password reset instructions have been sent. The link expires in one hour.
          </Typography>
          <Button component={RouterLink} to="/login" fullWidth size="large" variant="contained">
            Continue to login
          </Button>
        </Box>
      </Dialog>
    </LoginMainContent>
  );
}
