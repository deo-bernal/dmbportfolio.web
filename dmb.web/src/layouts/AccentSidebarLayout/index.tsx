import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import api from "services/http.service";
import useAuth from "hooks/useAuth";
import useAccountGreeting from "hooks/useAccountGreeting";
import useAccountRoles from "hooks/useAccountRoles";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { clearProfile, getProfile } from "slices/user";
import { useDispatch } from "store";
import { layoutShellSidebarCtaButtonSx, layoutShellSx, shellNavItemSx } from "styles/main_style";

function ShellNavItem({
  to,
  label,
  end,
  forceActive,
}: {
  to: string;
  label: string;
  end?: boolean;
  forceActive?: boolean;
}) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <Box component="span" sx={shellNavItemSx(isActive || Boolean(forceActive))}>
          {label}
        </Box>
      )}
    </NavLink>
  );
}

const PUBLIC_PROFILE_USERNAME = "deobernal@gmail.com";
const PDF_RESUME_PATH = "/Deo_Bernal_Resume.pdf";

export default function AccentSidebarLayout() {
  const auth = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const firstName = useAccountGreeting();
  const { isAdmin, isSuperAdmin, canAccessUserAccess } = useAccountRoles();
  const [logoutBusy, setLogoutBusy] = useState(false);
  const { username } = useParams<{ username?: string }>();
  const isPdfResumePage = location.pathname === PDF_RESUME_PATH;
  const isPublicRoute =
    (Boolean(username) || isPdfResumePage) && !location.pathname.startsWith("/accent-sidebar");
  const publicUsername = username || (isPdfResumePage ? PUBLIC_PROFILE_USERNAME : "");
  const portfolioPath = isPublicRoute ? `/${publicUsername}` : "/accent-sidebar/portfolio";
  const resumePath = isPublicRoute ? `/${publicUsername}/resume` : "/accent-sidebar/resume";
  const aiProfileBuilderPath = "/accent-sidebar/onboarding";
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
        {auth.isAuthenticated && !isPublicRoute ? (
          <Box sx={layoutShellSx.sidebarGreeting}>Hi {firstName || "there"}</Box>
        ) : null}
        <Box sx={layoutShellSx.navStack}>
          {auth.isAuthenticated ? (
            <>
              <ShellNavItem to="/accent-sidebar/agent" label="Agentic AI" end />
              <ShellNavItem to={aiProfileBuilderPath} label="AI Profile Builder" end />
            </>
          ) : null}
          <ShellNavItem to={portfolioPath} label="Portfolio" end />
          <ShellNavItem to={resumePath} label="Resume" end forceActive={isPdfResumePage} />
          <ShellNavItem to="/ai-automation" label="AI Automations" end />
          {auth.isAuthenticated && !isPublicRoute && (isAdmin || isSuperAdmin) ? (
            <ShellNavItem to="/accent-sidebar/leads" label="Leads" end />
          ) : null}
        </Box>

        {auth.isAuthenticated && !isPublicRoute && canAccessUserAccess ? (
          <Box sx={layoutShellSx.sidebarAccountNav}>
            <ShellNavItem to="/accent-sidebar/access" label="User access" end />
          </Box>
        ) : null}

        {!auth.isAuthenticated ? (  
          <Box sx={layoutShellSx.sidebarCtaWrap}>
            <Button fullWidth variant="contained" disableElevation onClick={() => navigate("/login")} sx={layoutShellSidebarCtaButtonSx}>
              Log in
            </Button>
          </Box>
        ) : null}

        {auth.isAuthenticated && !isPublicRoute ? (
          <Box sx={layoutShellSx.sidebarCtaWrap}>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={() => void handleLogout()}
              disabled={logoutBusy}
              sx={layoutShellSidebarCtaButtonSx}
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
