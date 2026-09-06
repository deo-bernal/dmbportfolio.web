const RENDER_UPSTREAM = "https://dmbportfolio-api.onrender.com/api";
const AZURE_UPSTREAM = "https://dmbportfolio-api.azurewebsites.net/api";

function getUpstreamCandidates() {
  const configured = process.env.DMB_API_UPSTREAM_URL?.trim();
  const candidates = [];

  if (configured) {
    candidates.push(configured);
  }

  for (const fallback of [RENDER_UPSTREAM, AZURE_UPSTREAM]) {
    if (!candidates.includes(fallback)) {
      candidates.push(fallback);
    }
  }

  return candidates;
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

  for (const base of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    try {
      const { upstream, body } = await fetchUpstream(`${base}${suffix}`, controller.signal);

      if (upstream.status >= 500 && candidates.indexOf(base) < candidates.length - 1) {
        errors.push(`${base}: HTTP ${upstream.status}`);
        continue;
      }

      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(upstream.status).send(body);
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
        return null;
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

module.exports = { proxyGet, getUpstreamJson };
