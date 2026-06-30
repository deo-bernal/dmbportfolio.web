const UPSTREAM_BASE =
  process.env.DMB_API_UPSTREAM_URL || "https://dmbportfolio-api.onrender.com/api";

async function proxyGet(req, res, path) {
  const query = new URLSearchParams(req.query).toString();
  const url = `${UPSTREAM_BASE}${path}${query ? `?${query}` : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    const body = await upstream.text();

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(upstream.status).send(body);
  } catch {
    res.status(504).json({ message: "Upstream API timed out." });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { proxyGet };
