import { useMemo } from "react";
import { useRoutes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useAuth from "./hooks/useAuth";
import createRouter from "./router";
import ThemeProvider from "./theme/ThemeProvider";
import SiteChatWidget from "./components/chat/SiteChatWidget";

function App() {
  const auth = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const router = useMemo(
    () =>
      createRouter({
        token: auth.token,
        onLogout: auth.onLogout,
      }),
    [auth.token, auth.onLogout]
  );

  const content = useRoutes(router);
  return (
    <ThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider
          maxSnack={6}
          anchorOrigin={{
            vertical: "top",
            horizontal: isMobile ? "center" : "right",
          }}
        >
          <CssBaseline />
          {auth.isInitialized ? content : null}
          {auth.isInitialized ? <SiteChatWidget /> : null}
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
