export const ONBOARD_PATH = "/onboard";

export function getSafeRedirectPath(value: string | null | undefined): string | null {
  const redirect = value?.trim();
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }
  return redirect;
}

export function getOnboardLoginPath(): string {
  return `/login?redirect=${encodeURIComponent(ONBOARD_PATH)}`;
}
