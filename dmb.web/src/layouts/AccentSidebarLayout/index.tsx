import { NavLink, Outlet } from "react-router-dom";
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
  return (
    <Box sx={layoutShellSx.root}>
      <Box component="aside" sx={layoutShellSx.sidebar}>
        <Box sx={layoutShellSx.sidebarBrand}>Online Profile</Box>
        <Box sx={layoutShellSx.navStack}>
          <ShellNavItem to="/accent-sidebar/portfolio" label="Portfolio" end />
          <ShellNavItem to="/accent-sidebar/resume" label="Resume" end />
        </Box>
      </Box>
      <Box component="main" sx={layoutShellSx.main}>
        <Outlet />
      </Box>
    </Box>
  );
}
