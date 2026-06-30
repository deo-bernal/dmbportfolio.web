const PROFILE_CACHE_PREFIX = "dmb:public-profile:";
const EARLY_PROFILE_CACHE_PREFIX = "dmb:early-public-profile:";
const CACHE_TTL_MS = 30 * 60 * 1000;

type CachedProfile<T> = {
  data: T;
  cachedAt: number;
};

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function readCacheEntry<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedProfile<T>;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeCacheEntry<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
      } satisfies CachedProfile<T>)
    );
  } catch {
    // Ignore quota errors.
  }
}

export function readPublicProfileCache<T>(username: string): T | null {
  const normalized = normalizeUsername(username);
  return (
    readCacheEntry<T>(`${PROFILE_CACHE_PREFIX}${normalized}`) ??
    consumeEarlyPublicProfileCache<T>(normalized)
  );
}

export function writePublicProfileCache<T>(username: string, data: T): void {
  writeCacheEntry(`${PROFILE_CACHE_PREFIX}${normalizeUsername(username)}`, data);
}

export function consumeEarlyPublicProfileCache<T>(username: string): T | null {
  const key = `${EARLY_PROFILE_CACHE_PREFIX}${normalizeUsername(username)}`;
  const cached = readCacheEntry<T>(key);
  if (cached) {
    sessionStorage.removeItem(key);
  }
  return cached;
}

export function storeEarlyPublicProfileCache<T>(username: string, data: T): void {
  writeCacheEntry(`${EARLY_PROFILE_CACHE_PREFIX}${normalizeUsername(username)}`, data);
}

export function readPublicResumeCache<T>(username: string): T | null {
  return readCacheEntry<T>(`${PROFILE_CACHE_PREFIX}resume:${normalizeUsername(username)}`);
}

export function writePublicResumeCache<T>(username: string, data: T): void {
  writeCacheEntry(`${PROFILE_CACHE_PREFIX}resume:${normalizeUsername(username)}`, data);
}

export function prefetchPublicProfile(username: string): void {
  const normalized = normalizeUsername(username);
  if (!normalized || !normalized.includes("@")) {
    return;
  }

  if (readPublicProfileCache(normalized)) {
    return;
  }

  const base =
    typeof window !== "undefined" &&
    (window.location.hostname === "dmbwebsolutions.com" ||
      window.location.hostname === "www.dmbwebsolutions.com")
      ? "/api"
      : null;

  if (!base) {
    return;
  }

  fetch(`${base}/publicprofile?username=${encodeURIComponent(normalized)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data) {
        storeEarlyPublicProfileCache(normalized, data);
      }
    })
    .catch(() => {
      // Best-effort warm-up only.
    });
}
