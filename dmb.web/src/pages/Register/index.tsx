import { forwardRef, useState, type ReactElement, type Ref } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import axios from "axios";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { registerSchema } from "validations/schema/auth";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { LoginMainContent, LoginTopWrapper, authFlowSx, loginPageSx, loginJwtSx } from "styles/main_style";
import api from "services/http.service";
import type { ApiMessageResponse, RegisterFormValues, RegisterRequest } from "models";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function Register() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      contactNumber: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const payload: RegisterRequest = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        contactNumber: values.contactNumber,
      };
      await api.post("/registration/register", payload);
      setDialogOpen(true);
    } catch (error: unknown) {
      let errorMessage = "Registration failed. Please try again.";
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
                Create account
              </Typography>
              <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
                Register with your email and details. We will send a link to activate your account.
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
              <TextField
                sx={loginJwtSx.textField}
                label="First name"
                fullWidth
                autoComplete="given-name"
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                {...register("firstName")}
              />
              <TextField
                sx={loginJwtSx.textField}
                label="Last name"
                fullWidth
                autoComplete="family-name"
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                {...register("lastName")}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    sx={loginJwtSx.textField}
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    autoComplete="new-password"
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                              <IconButton
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                edge="end"
                                aria-label="toggle password visibility"
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
              <TextField
                sx={loginJwtSx.textField}
                label="Contact number"
                fullWidth
                autoComplete="tel"
                error={Boolean(errors.contactNumber)}
                helperText={errors.contactNumber?.message}
                {...register("contactNumber")}
              />
              <Button
                sx={loginJwtSx.submitButton}
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                disableElevation
                disabled={isSubmitting}
                startIcon={isSubmitting ? <ButtonLoadingIcon /> : null}
              >
                Register
              </Button>
              {errors.root ? (
                <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
                  {errors.root.message}
                </FormHelperText>
              ) : null}
            </Box>

            <Box sx={authFlowSx.footerRow}>
              <Typography component="span" variant="subtitle2" color="text.primary" sx={authFlowSx.footerStrong}>
                Already have an account?{" "}
              </Typography>
              <Link component={RouterLink} to="/login" sx={authFlowSx.footerLink}>
                Sign in
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
        <Box sx={authFlowSx.dialogContent}>
          <Typography variant="h3" sx={authFlowSx.dialogHeading}>
            Check your email
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={authFlowSx.dialogBody}>
            We sent an activation link to your address. Open it to confirm your email before signing in. The link expires
            in 48 hours.
          </Typography>
          <Button component={RouterLink} to="/login" fullWidth size="large" variant="contained">
            Continue to login
          </Button>
        </Box>
      </Dialog>
    </LoginMainContent>
  );
}
