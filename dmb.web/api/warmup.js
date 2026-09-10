const RENDER_UPSTREAM =
  "https://dmbportfolio-api.onrender.com/api/publicprofile?username=" +
  encodeURIComponent("deobernal@gmail.com");

module.exports = async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 50000);

  try {
    const upstream = await fetch(RENDER_UPSTREAM, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    res.status(upstream.ok ? 200 : 502).json({
      ok: upstream.ok,
      status: upstream.status,
    });
  } catch (error) {
    res.status(504).json({
      ok: false,
      error: error?.name === "AbortError" ? "timed out" : error?.message || "warmup failed",
    });
  } finally {
    clearTimeout(timeout);
  }
};
