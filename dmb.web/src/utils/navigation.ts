export const ONBOARD_PATH = "/accent-sidebar/onboarding";
export const AGENT_PATH = "/accent-sidebar/agent";
export const DASHBOARD_PATH = "/accent-sidebar/portfolio";
export const AI_AUTOMATION_PATH = "/ai-automation";
export const PROFILES_PATH = "/profiles";
export const CASE_STUDIES_PATH = "/case-studies";
export const STACK_PATH = "/stack";
export const CRM_PATH = "/crm";
export const LMS_PATH = "/lms";

const APP_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/activate-account",
  "/auth",
  "/accent-sidebar",
  "/portfolio",
  "/onboard",
  "/onboarding",
  "/ai-automation",
  "/profiles",
  "/case-studies",
  "/stack",
  "/crm",
  "/lms",
];

export function getSafeRedirectPath(value: string | null | undefined): string | null {
  const redirect = value?.trim();
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }
  if (redirect === "/onboard" || redirect === "/onboarding") {
    return ONBOARD_PATH;
  }
  return redirect;
}

export function getOnboardLoginPath(): string {
  return `/login?redirect=${encodeURIComponent(ONBOARD_PATH)}`;
}

export function getAgentLoginPath(): string {
  return `/login?redirect=${encodeURIComponent(AGENT_PATH)}`;
}

export function isAppReservedPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return APP_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
