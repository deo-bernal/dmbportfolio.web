import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import api from "services/http.service";
import useAuth from "hooks/useAuth";
import useAccountGreeting from "hooks/useAccountGreeting";
import useAccountRoles from "hooks/useAccountRoles";
import ButtonLoadingIcon from "components/common/ButtonLoadingIcon";
import { openInquireModal } from "components/leads/InquiryModal";
import { clearProfile, getProfile } from "slices/user";
import { PROFILE_SAVED_EVENT } from "utils/publishGeneratedProfile";
import { useDispatch } from "store";
import {
  AGENT_PATH,
  AI_AUTOMATION_PATH,
  CASE_STUDIES_PATH,
  ONBOARD_PATH,
  PROFILES_PATH,
  STACK_PATH,
  getAgentLoginPath,
  getOnboardLoginPath,
} from "utils/navigation";
import {
  layoutShellSidebarCtaButtonSx,
  layoutShellSidebarInquireButtonSx,
  layoutShellSx,
  shellNavItemSx,
} from "styles/main_style";

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

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={layoutShellSx.navSection}>
      <Box sx={layoutShellSx.navSectionLabel}>{label}</Box>
      {children}
    </Box>
  );
}

function SidebarCtaStack({ children }: { children: ReactNode }) {
  return (
    <Box sx={layoutShellSx.sidebarCtaWrap}>
      <Stack spacing={1}>
        <Button
          fullWidth
          variant="outlined"
          disableElevation
          onClick={() => openInquireModal()}
          sx={layoutShellSidebarInquireButtonSx}
        >
          Inquire
        </Button>
        {children}
      </Stack>
    </Box>
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
  const isAiAutomationPage =
    location.pathname === AI_AUTOMATION_PATH || location.pathname === "/";
  const isPublicRoute =
    (Boolean(username) || isPdfResumePage) && !location.pathname.startsWith("/accent-sidebar");
  const publicUsername = username || (isPdfResumePage ? PUBLIC_PROFILE_USERNAME : "");
  const portfolioPath = isPublicRoute ? `/${publicUsername}` : "/accent-sidebar/portfolio";
  const resumePath = isPublicRoute ? `/${publicUsername}/resume` : "/accent-sidebar/resume";
  const showSignedInTools = auth.isAuthenticated && !isPublicRoute;
  const showAdminNav = showSignedInTools && (isAdmin || isSuperAdmin);
  const hasFetchedGreeting = useRef(false);

  useLayoutEffect(() => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) {
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!auth.isAuthenticated || isPublicRoute) {
      return;
    }
    if (!hasFetchedGreeting.current) {
      hasFetchedGreeting.current = true;
      dispatch(getProfile(auth.onLogout) as any);
    }
    const refresh = () => {
      dispatch(getProfile(auth.onLogout) as any);
    };
    window.addEventListener(PROFILE_SAVED_EVENT, refresh);
    return () => window.removeEventListener(PROFILE_SAVED_EVENT, refresh);
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
        <Box
          component={RouterLink}
          to={AI_AUTOMATION_PATH}
          sx={[
            layoutShellSx.sidebarBrand,
            { display: "flex", alignItems: "center", gap: 1.25 },
          ]}
        >
          <Box
            component="img"
            src="/dmb-web-solutions-logo.png"
            alt="DMB Web Solutions"
            sx={{ width: 48, height: 48, borderRadius: 1.5, display: "block", flexShrink: 0 }}
          />
          DMB Web Solutions
        </Box>
        {auth.isAuthenticated ? (
          <Box sx={layoutShellSx.sidebarGreeting}>Hi {firstName || "there"}</Box>
        ) : null}

        <Box sx={layoutShellSx.navStack}>
          <NavSection label="Services">
            <ShellNavItem to={AI_AUTOMATION_PATH} label="AI Automations" end forceActive={isAiAutomationPage} />
            <ShellNavItem
              to={auth.isAuthenticated ? AGENT_PATH : getAgentLoginPath()}
              label="Agentic AI"
              end
              forceActive={location.pathname === AGENT_PATH}
            />
            <ShellNavItem
              to={auth.isAuthenticated ? ONBOARD_PATH : getOnboardLoginPath()}
              label="AI Profile Builder"
              end
              forceActive={location.pathname === ONBOARD_PATH}
            />
            <ShellNavItem
              to={CASE_STUDIES_PATH}
              label="Case studies"
              forceActive={location.pathname.startsWith(CASE_STUDIES_PATH)}
            />
            <ShellNavItem
              to={STACK_PATH}
              label="Stack"
              end
              forceActive={location.pathname === STACK_PATH}
            />
          </NavSection>

          <NavSection label="Workspace">
            <Box
              component="a"
              href="/crm"
              sx={shellNavItemSx(false)}
            >
              Customer Relationship Management (CRM)
            </Box>
            <Box
              component="a"
              href="/lms"
              sx={shellNavItemSx(false)}
            >
              Learning Management System (LMS)
            </Box>
          </NavSection>

          {isPublicRoute ? (
            <NavSection label="This profile">
              <ShellNavItem to={portfolioPath} label="Portfolio" end />
              <ShellNavItem to={resumePath} label="Resume" end forceActive={isPdfResumePage} />
            </NavSection>
          ) : null}

          {showSignedInTools ? (
            <NavSection label="Your profile">
              <ShellNavItem to="/accent-sidebar/portfolio" label="Portfolio" end />
              <ShellNavItem to="/accent-sidebar/resume" label="Resume" end />
            </NavSection>
          ) : null}

          {showAdminNav ? (
            <NavSection label="Admin">
              <ShellNavItem to="/accent-sidebar/leads" label="Leads" end />
              {canAccessUserAccess ? (
                <ShellNavItem to="/accent-sidebar/access" label="Manage users" end />
              ) : null}
            </NavSection>
          ) : null}
        </Box>

        {!auth.isAuthenticated ? (
          <SidebarCtaStack>
            <Button fullWidth variant="contained" disableElevation onClick={() => navigate("/login")} sx={layoutShellSidebarCtaButtonSx}>
              Log in
            </Button>
          </SidebarCtaStack>
        ) : null}

        {showSignedInTools ? (
          <SidebarCtaStack>
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
          </SidebarCtaStack>
        ) : null}

        {auth.isAuthenticated && isPublicRoute ? (
          <SidebarCtaStack>
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={() => navigate("/accent-sidebar/portfolio")}
              sx={layoutShellSidebarCtaButtonSx}
            >
              My workspace
            </Button>
          </SidebarCtaStack>
        ) : null}

        <Box
          component={RouterLink}
          to={`${PROFILES_PATH}#lots`}
          sx={layoutShellSx.sidebarAlsoLink}
        >
          Also: lots in Pampanga
        </Box>
      </Box>
      <Box component="main" sx={layoutShellSx.main}>
        <Outlet />
      </Box>
    </Box>
  );
}
