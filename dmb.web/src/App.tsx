import { useMemo } from "react";
import { useRoutes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { CssBaseline } from "@mui/material";
import useAuth from "./hooks/useAuth";
import createRouter from "./router";
import ThemeProvider from "./theme/ThemeProvider";

function App() {
  const auth = useAuth();

  const router = useMemo(
    () =>
      createRouter({
        token: auth.token,
        onLoginSuccess: auth.onLoginSuccess,
        onLogout: auth.onLogout,
      }),
    [auth.token, auth.onLoginSuccess, auth.onLogout]
  );

  const content = useRoutes(router);
  return (
    <ThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider
          maxSnack={6}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <CssBaseline />
          {auth.isInitialized ? content : null}
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
