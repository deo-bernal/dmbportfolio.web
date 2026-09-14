const createExternalAuthHandler = require("./_externalAuth");

module.exports = async (req, res) => {
  const incoming = new URL(req.url, "https://www.dmbwebsolutions.com");
  const pathMatch = incoming.pathname.match(
    /\/api\/auth\/external\/(google|linkedin|facebook)\/(start|callback)/i
  );
  const provider = pathMatch?.[1] || req.query?.provider || incoming.searchParams.get("provider") || "";
  const action = pathMatch?.[2] || req.query?.action || incoming.searchParams.get("action") || "";
  const suffix = `${provider}/${action}`.replace(/^\/+|\/+$/g, "");

  return createExternalAuthHandler(suffix)(req, res);
};
