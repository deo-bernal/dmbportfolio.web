const RENDER_AUTH_BASE = "https://dmbportfolio-api.onrender.com/api/auth/external";
const CRM_AUTH_BASE = "https://dmb-crm-api.onrender.com/api/auth/external";
const LMS_AUTH_BASE = "https://dmb-lms-api.onrender.com/api/auth/external";
const COMMERCE_AUTH_BASE = "https://dmb-commerce-api.onrender.com/api/auth/external";
const AGENT_AUTH_BASE = "https://dmb-agent-api.onrender.com/api/auth/external";

function publicCallback(provider) {
  return `https://www.dmbwebsolutions.com/api/auth/external/${provider}/callback`;
}

function workspaceFromRequest(incoming) {
  const app = (incoming.searchParams.get("app") || "").toLowerCase();
  if (app === "crm" || app === "lms" || app === "commerce" || app === "agent") {
    return app;
  }

  const state = incoming.searchParams.get("state") || "";
  if (state.startsWith("crm.")) {
    return "crm";
  }
  if (state.startsWith("lms.")) {
    return "lms";
  }
  if (state.startsWith("commerce.")) {
    return "commerce";
  }
  if (state.startsWith("agent.")) {
    return "agent";
  }
  return "portfolio";
}

function rewriteOAuthLocation(location, suffix) {
  try {
    const url = new URL(location);
    const redirectUri = url.searchParams.get("redirect_uri");
    if (!redirectUri) {
      return location;
    }
    const provider = String(suffix).split("/")[0].toLowerCase();
    // Google Cloud still lists the Render callback. Rewriting it to www causes redirect_uri_mismatch.
    if (
      (provider === "facebook" || provider === "linkedin") &&
      (/onrender\.com/i.test(redirectUri) || /localhost/i.test(redirectUri))
    ) {
      url.searchParams.set("redirect_uri", publicCallback(provider));
      return url.toString();
    }
  } catch {
    // Keep the upstream location if it is not a URL we can parse.
  }
  return location;
}

function createExternalAuthHandler(suffix) {
  return async (req, res) => {
    if (!/^(google|linkedin|facebook)\/(start|callback)$/i.test(suffix)) {
      res.status(404).json({ message: "Unknown auth route." });
      return;
    }

    const incoming = new URL(req.url, "https://www.dmbwebsolutions.com");
    const workspace = workspaceFromRequest(incoming);
    // Keep CRM/LMS Facebook (and other social) callbacks on the public domain so
    // the browser never lands on Render's wake page, and so the code is exchanged
    // once by the target API instead of being consumed by a server-side proxy fetch.
    if (/\/callback$/i.test(suffix) && (workspace === "crm" || workspace === "lms" || workspace === "commerce" || workspace === "agent")) {
      const dest = new URL(`https://www.dmbwebsolutions.com/${workspace}/api/auth/external/${suffix}`);
      incoming.searchParams.forEach((value, key) => {
        if (key !== "path" && key !== "provider" && key !== "action") {
          dest.searchParams.append(key, value);
        }
      });
      res.redirect(302, dest.toString());
      return;
    }

    const authBase = workspace === "crm"
      ? CRM_AUTH_BASE
      : workspace === "lms"
        ? LMS_AUTH_BASE
        : workspace === "commerce"
          ? COMMERCE_AUTH_BASE
          : workspace === "agent"
            ? AGENT_AUTH_BASE
            : RENDER_AUTH_BASE;
    const target = new URL(`${authBase}/${suffix}`);
    incoming.searchParams.forEach((value, key) => {
      if (key !== "path" && key !== "provider" && key !== "action") {
        target.searchParams.append(key, value);
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    try {
      const upstream = await fetch(target, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "dmb-oauth-proxy",
        },
      });

      let location = upstream.headers.get("location");
      if (location && /\/start$/i.test(suffix)) {
        location = rewriteOAuthLocation(location, suffix);
      }
      if (location && upstream.status >= 300 && upstream.status < 400) {
        res.redirect(upstream.status, location);
        return;
      }

      const body = await upstream.text();
      const contentType = upstream.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      res.status(upstream.status).send(body);
    } catch (error) {
      const timedOut = error?.name === "AbortError";
      res.status(504).json({
        message: timedOut ? "Auth upstream timed out." : "Auth upstream unavailable.",
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}

module.exports = createExternalAuthHandler;
