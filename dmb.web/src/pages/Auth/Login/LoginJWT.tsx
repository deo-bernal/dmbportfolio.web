import type { FC } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Button,
  FormHelperText,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Typography,
  Link,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import useAuth from "hooks/useAuth";
import { authSchema } from "validations/schema/auth";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { resolvePostLoginPath } from "services/postLoginNavigation";
import { loginJwtSubmitButtonSignInSx, loginJwtSx } from "styles/main_style";
import type { ApiMessageResponse, AuthFormValues } from "models";

const LoginJWT: FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const formOptions = {
    resolver: yupResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  };

  const { register, control, handleSubmit, setError, formState } = useForm<AuthFormValues>(formOptions);
  const { errors, isSubmitting } = formState;

  const onSubmit = async ({ username, password }: AuthFormValues) => {
    try {
      await login(username, password);
      sessionStorage.setItem("dmb:account-username", username.trim());
      const nextPath = await resolvePostLoginPath();
      navigate(nextPath, { replace: true });
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred. Please try again later.";
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          errorMessage = "Unable to reach API. Check API URL and backend status.";
        } else {
          const data = error.response.data as Partial<ApiMessageResponse>;
          if (error.response.status === 403 && data?.message) {
            errorMessage = data.message;
          } else {
            errorMessage = data?.message ?? "Invalid username or password.";
          }
        }
      }
      setError("root", { type: "manual", message: errorMessage });
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={loginJwtSx.form}>
      <Box sx={loginJwtSx.gatewayRow}>
        <Box aria-hidden sx={loginJwtSx.gatewayDot} />
        <Typography variant="caption" sx={loginJwtSx.gatewayCaption}>
          Credential gateway
        </Typography>
      </Box>

      <TextField
        sx={loginJwtSx.textField}
        label="Email"
        fullWidth
        id="login-username"
        autoFocus
        autoComplete="username"
        error={Boolean(errors.username)}
        helperText={errors.username?.message}
        {...register("username")}
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
            id="login-password"
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                      <IconButton
                        onClick={handlePasswordVisibility}
                        edge="end"
                        type="button"
                        aria-label="toggle password"
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

      <Button
        sx={loginJwtSubmitButtonSignInSx}
        startIcon={isSubmitting ? <ButtonLoadingIcon /> : null}
        disabled={isSubmitting}
        type="submit"
        fullWidth
        size="large"
        variant="contained"
        disableElevation
      >
        Sign in
      </Button>
      <Box sx={loginJwtSx.authLinksRow}>
        <Link component={RouterLink} to="/register" variant="body2" underline="hover" sx={loginJwtSx.authLinkEmphasis}>
          Create account
        </Link>
        <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover" sx={loginJwtSx.authLinkEmphasis}>
          Forgot password?
        </Link>
      </Box>
      {errors.root ? (
        <FormHelperText error sx={loginJwtSx.rootErrorHelper}>
          {errors.root.message}
        </FormHelperText>
      ) : null}
    </Box>
  );
};

export default LoginJWT;
