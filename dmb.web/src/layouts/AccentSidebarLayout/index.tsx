import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import api from "services/http.service";
import useAuth from "hooks/useAuth";
import { layoutShellSx } from "styles/main_style";

function ShellNavItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <Box
          component="span"
          sx={{
            ...layoutShellSx.navItem,
            ...(isActive ? layoutShellSx.navItemActive : {}),
          }}
        >
          {label}
        </Box>
      )}
    </NavLink>
  );
}

export default function AccentSidebarLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams<{ username?: string }>();
  const isPublicRoute = Boolean(username) && !location.pathname.startsWith("/accent-sidebar");
  const portfolioPath = isPublicRoute ? `/${username}` : "/accent-sidebar/portfolio";
  const resumePath = isPublicRoute ? `/${username}/resume` : "/accent-sidebar/resume";

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Still clear session locally if request fails.
    } finally {
      auth.onLogout();
      navigate("/login");
    }
  };

  return (
    <Box sx={layoutShellSx.root}>
      <Box component="aside" sx={layoutShellSx.sidebar}>
        <Box sx={layoutShellSx.sidebarBrand}>Online Profile</Box>
        <Box sx={layoutShellSx.navStack}>
          <ShellNavItem to={portfolioPath} label="Portfolio" end />
          <ShellNavItem to={resumePath} label="Resume" end />
        </Box>

        {auth.isAuthenticated && !isPublicRoute ? (
          <Box sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={handleLogout}
              sx={{ ...layoutShellSx.navItemActive, textTransform: "uppercase", letterSpacing: "0.08em" }}
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
