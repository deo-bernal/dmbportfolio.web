const HEALTH_URLS = [
  "https://dmbportfolio-api.onrender.com/health",
  "https://dmb-crm-api.onrender.com/health",
  "https://dmb-lms-api.onrender.com/health",
  "https://dmb-commerce-api.onrender.com/health",
  "https://dmb-agent-api.onrender.com/health",
];

module.exports = async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const results = await Promise.all(
      HEALTH_URLS.map(async (url) => {
        try {
          const upstream = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          return { url, ok: upstream.ok, status: upstream.status };
        } catch (error) {
          return {
            url,
            ok: false,
            error: error?.name === "AbortError" ? "timed out" : error?.message || "failed",
          };
        }
      })
    );

    const ok = results.some((r) => r.ok);
    res.status(ok ? 200 : 502).json({ ok, results });
  } catch (error) {
    res.status(504).json({
      ok: false,
      error: error?.name === "AbortError" ? "timed out" : error?.message || "warmup failed",
    });
  } finally {
    clearTimeout(timeout);
  }
};
