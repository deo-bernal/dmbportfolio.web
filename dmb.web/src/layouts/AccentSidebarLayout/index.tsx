import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
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
  const location = useLocation();
  const { username } = useParams<{ username?: string }>();
  const isPublicRoute = Boolean(username) && !location.pathname.startsWith("/accent-sidebar");
  const portfolioPath = isPublicRoute ? `/${username}` : "/accent-sidebar/portfolio";
  const resumePath = isPublicRoute ? `/${username}/resume` : "/accent-sidebar/resume";

  return (
    <Box sx={layoutShellSx.root}>
      <Box component="aside" sx={layoutShellSx.sidebar}>
        <Box sx={layoutShellSx.sidebarBrand}>Online Profile</Box>
        <Box sx={layoutShellSx.navStack}>
          <ShellNavItem to={portfolioPath} label="Portfolio" end />
          <ShellNavItem to={resumePath} label="Resume" end />
        </Box>
      </Box>
      <Box component="main" sx={layoutShellSx.main}>
        <Outlet />
      </Box>
    </Box>
  );
}
