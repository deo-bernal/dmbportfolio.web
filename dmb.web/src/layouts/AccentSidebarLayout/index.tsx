import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import api from "services/http.service";
import useAuth from "hooks/useAuth";
import useAccountGreeting from "hooks/useAccountGreeting";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { clearProfile, getProfile } from "slices/user";
import { useDispatch } from "store";
import {
  layoutShellLogoutButtonSx,
  layoutShellSidebarCtaButtonSx,
  layoutShellSx,
  shellNavItemSx,
} from "styles/main_style";

function ShellNavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <Box component="span" sx={shellNavItemSx(isActive)}>
          {label}
        </Box>
      )}
    </NavLink>
  );
}

export default function AccentSidebarLayout() {
  const auth = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const firstName = useAccountGreeting();
  const [logoutBusy, setLogoutBusy] = useState(false);
  const { username } = useParams<{ username?: string }>();
  const isPublicRoute = Boolean(username) && !location.pathname.startsWith("/accent-sidebar");
  const portfolioPath = isPublicRoute ? `/${username}` : "/accent-sidebar/portfolio";
  const resumePath = isPublicRoute ? `/${username}/resume` : "/accent-sidebar/resume";
  const aiProfileBuilderPath = isPublicRoute ? `/${username}/onboarding` : "/accent-sidebar/onboarding";
  const hasFetchedGreeting = useRef(false);

  useEffect(() => {
    if (!auth.isAuthenticated || isPublicRoute || hasFetchedGreeting.current) {
      return;
    }
    hasFetchedGreeting.current = true;
    dispatch(getProfile(auth.onLogout) as any);
  }, [auth.isAuthenticated, auth.onLogout, dispatch, isPublicRoute]);

  const handleLogout = async () => {
    setLogoutBusy(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Still clear session locally if request fails.
    } finally {
      auth.onLogout();
      dispatch(clearProfile());
      navigate("/login");
    }
  };

  return (
    <Box sx={layoutShellSx.root}>
      <Box component="aside" sx={layoutShellSx.sidebar}>
        <Box sx={layoutShellSx.sidebarBrand}>Online Profile</Box>
        {auth.isAuthenticated && !isPublicRoute && firstName ? (
          <Box sx={layoutShellSx.sidebarGreeting}>Hi {firstName}</Box>
        ) : auth.isAuthenticated && !isPublicRoute ? (
          <Box sx={layoutShellSx.sidebarGreeting}>Hi there</Box>
        ) : null}
        <Box sx={layoutShellSx.navStack}>
          {auth.isAuthenticated ? (
            <ShellNavItem to={aiProfileBuilderPath} label="AI Profile Builder" end />
          ) : null}
          <ShellNavItem to={portfolioPath} label="Portfolio" end />
          <ShellNavItem to={resumePath} label="Resume" end />
        </Box>

        {!auth.isAuthenticated ? (
          <Box sx={layoutShellSx.sidebarCtaWrap}>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={() => navigate("/login")}
              sx={layoutShellSidebarCtaButtonSx}
            >
              Log in
            </Button>
          </Box>
        ) : null}

        {auth.isAuthenticated && !isPublicRoute ? (
          <Box sx={layoutShellSx.sidebarCtaWrap}>
            <Button
              fullWidth
              variant="outlined"
              disableElevation
              onClick={() => void handleLogout()}
              disabled={logoutBusy}
              sx={layoutShellLogoutButtonSx}
              startIcon={logoutBusy ? <ButtonLoadingIcon /> : null}
            >
              Log out
            </Button>
          </Box>
        ) : null}
      </Box>
      <Box component="main" sx={layoutShellSx.main}>
        <Outlet />
      </Box>
    </Box>
  );
}
