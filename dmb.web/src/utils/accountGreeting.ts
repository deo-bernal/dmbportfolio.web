const FIRST_NAME_KEY = "dmb:account-firstName";

export function persistAccountFirstName(firstName: string): void {
  const trimmed = firstName.trim();
  if (!trimmed) {
    return;
  }
  try {
    sessionStorage.setItem(FIRST_NAME_KEY, trimmed);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function clearAccountFirstName(): void {
  try {
    sessionStorage.removeItem(FIRST_NAME_KEY);
  } catch {
    // Ignore.
  }
}

export function readAccountFirstName(): string {
  try {
    return sessionStorage.getItem(FIRST_NAME_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function firstNameFromFullName(name: string): string {
  return name.trim().split(/\s+/)[0] || "";
}
