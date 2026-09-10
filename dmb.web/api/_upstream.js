const RENDER_UPSTREAM = "https://dmbportfolio-api.onrender.com/api";
const DEO_PUBLIC_USERNAME = "deobernal@gmail.com";
const DEO_PUBLIC_PROFILE = require("./_deoPublicProfile.json");
const UPSTREAM_TIMEOUT_MS = 8000;

function getUpstreamCandidates() {
  const configured = process.env.DMB_API_UPSTREAM_URL?.trim();
  const candidates = [];

  if (configured) {
    candidates.push(configured);
  }

  if (!candidates.includes(RENDER_UPSTREAM)) {
    candidates.push(RENDER_UPSTREAM);
  }

  return candidates;
}

function readUsername(req) {
  const raw = String(req?.query?.username || "");
  try {
    return decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

function isDeoPublicUsername(req) {
  return readUsername(req) === DEO_PUBLIC_USERNAME;
}

function sendJson(res, status, body, cacheControl) {
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).send(typeof body === "string" ? body : JSON.stringify(body));
}

function sendDeoProfileSnapshot(res) {
  sendJson(
    res,
    200,
    DEO_PUBLIC_PROFILE,
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
}

async function fetchUpstream(url, signal) {
  const upstream = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  const body = await upstream.text();
  return { upstream, body };
}

async function proxyGet(req, res, path) {
  const query = new URLSearchParams(req.query).toString();
  const suffix = `${path}${query ? `?${query}` : ""}`;
  const candidates = getUpstreamCandidates();
  const errors = [];
  const deoProfile = path === "/publicprofile" && isDeoPublicUsername(req);

  for (const base of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const { upstream, body } = await fetchUpstream(`${base}${suffix}`, controller.signal);

      if (upstream.status >= 500 && candidates.indexOf(base) < candidates.length - 1) {
        errors.push(`${base}: HTTP ${upstream.status}`);
        continue;
      }

      if (upstream.ok) {
        sendJson(res, upstream.status, body, "public, s-maxage=3600, stale-while-revalidate=86400");
        return;
      }

      if (deoProfile) {
        sendDeoProfileSnapshot(res);
        return;
      }

      sendJson(res, upstream.status, body, "public, s-maxage=60, stale-while-revalidate=300");
      return;
    } catch (error) {
      const message =
        error?.name === "AbortError"
          ? "timed out"
          : error?.message || "connection failed";
      errors.push(`${base}: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  if (deoProfile) {
    sendDeoProfileSnapshot(res);
    return;
  }

  res.status(504).json({
    message: "Upstream API unavailable.",
    details: errors,
  });
}

/**
 * Authenticated GET against the .NET API, walking the same upstream candidates
 * as the proxy. Returns null when every candidate refuses or fails.
 */
async function getUpstreamJson(path, { token, timeoutMs = 10000 } = {}) {
  for (const base of getUpstreamCandidates()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${base}${path}`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 401 || response.status === 403) {
        continue;
      }

      if (!response.ok) {
        continue;
      }

      return await response.json();
    } catch {
      // Try the next upstream.
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

async function sendUpstreamJson(path, { token, method = "POST", body, timeoutMs = 15000 } = {}) {
  let lastStatus = 0;
  let lastText = "";

  for (const base of getUpstreamCandidates()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${base}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body == null ? undefined : JSON.stringify(body),
      });

      lastStatus = response.status;
      lastText = await response.text();

      if (response.status === 401 || response.status === 403) {
        continue;
      }

      if (response.ok || response.status === 409) {
        let data = lastText;
        try {
          data = lastText ? JSON.parse(lastText) : null;
        } catch {
          data = lastText;
        }
        return { ok: response.ok, status: response.status, data };
      }
    } catch {
      // Try the next upstream.
    } finally {
      clearTimeout(timeout);
    }
  }

  return { ok: false, status: lastStatus || 502, data: lastText };
}

function upstreamErrorMessage(result, fallback) {
  const data = result?.data;
  if (data && typeof data === "object" && data.message) {
    return String(data.message);
  }
  if (typeof data === "string" && data.trim()) {
    try {
      const parsed = JSON.parse(data);
      if (parsed?.message) return String(parsed.message);
    } catch {
      return data.slice(0, 240);
    }
  }
  if (result?.status === 401 || result?.status === 403) {
    return "Sign-in expired. Refresh the page and run the agent again.";
  }
  if (!result?.status || result.status >= 500) {
    return "The profile API did not answer in time. Click Allow again.";
  }
  return `${fallback} (HTTP ${result.status}).`;
}

module.exports = {
  proxyGet,
  getUpstreamJson,
  sendUpstreamJson,
  upstreamErrorMessage,
  isDeoPublicUsername,
};
