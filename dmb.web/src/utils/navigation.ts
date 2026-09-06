export const ONBOARD_PATH = "/accent-sidebar/onboarding";
export const DASHBOARD_PATH = "/accent-sidebar/portfolio";

const APP_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/activate-account",
  "/accent-sidebar",
  "/portfolio",
  "/onboard",
  "/onboarding",
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

export function isAppReservedPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return APP_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
