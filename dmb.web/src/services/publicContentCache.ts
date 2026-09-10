import { dmbApiConfig, isProductionSiteHost, usesPublicApiProxy } from "config";
import { DEO_PUBLIC_USERNAME } from "content/deoResume";

const PROFILE_CACHE_PREFIX = "dmb:public-profile:";
const EARLY_PROFILE_CACHE_PREFIX = "dmb:early-public-profile:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedProfile<T> = {
  data: T;
  cachedAt: number;
};

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeUsername(username: string): string {
  try {
    return decodeURIComponent(username).trim().toLowerCase();
  } catch {
    return username.trim().toLowerCase();
  }
}

function readFromStorage<T>(storage: Storage | null, key: string): T | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedProfile<T>;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      storage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readCacheEntry<T>(key: string): T | null {
  return readFromStorage<T>(getStorage(), key) ?? readFromStorage<T>(getSessionStorage(), key);
}

function writeCacheEntry<T>(key: string, data: T): void {
  try {
    getStorage()?.setItem(
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
    try {
      getStorage()?.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
    try {
      getSessionStorage()?.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
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

export function prefetchPublicProfile(username: string = DEO_PUBLIC_USERNAME): void {
  const normalized = normalizeUsername(username);
  if (!normalized || !normalized.includes("@")) {
    return;
  }

  if (readPublicProfileCache(normalized)) {
    return;
  }

  if (typeof window === "undefined" || !isProductionSiteHost(window.location.hostname)) {
    return;
  }

  const base = usesPublicApiProxy() ? "/api" : dmbApiConfig.dmb_api_url;
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), 8000);

  fetch(`${base}/publicprofile?username=${encodeURIComponent(normalized)}`, {
    signal: controller.signal,
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data) {
        storeEarlyPublicProfileCache(normalized, data);
        writePublicProfileCache(normalized, data);
      }
    })
    .catch(() => {
      // Best-effort warm-up only.
    });
}
