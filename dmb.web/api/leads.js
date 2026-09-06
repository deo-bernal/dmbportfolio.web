const {
  captureLead,
  isRateLimited,
  listLeads,
  normalizeLead,
  updateLeadStatus,
} = require("./_leadStore");
const { getUpstreamJson } = require("./_upstream");

const OWNER_EMAILS = (process.env.LEADS_OWNER_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : "";
}

/**
 * The dashboard is already behind the app's own login, so reuse that session:
 * the token is validated against the .NET API, then checked against the owner
 * allow-list. No second password, and no secret shipped to the browser.
 */
async function isOwner(req) {
  const token = bearerToken(req);
  if (!token) return false;

  const account = await getUpstreamJson("/profiledetails", { token });
  if (!account) return false;

  const identifiers = [account.email, account.username]
    .map((value) => String(value || "").toLowerCase())
    .filter(Boolean);

  if (OWNER_EMAILS.length === 0) {
    // Nothing configured: any authenticated account may read its own pipeline.
    return identifiers.length > 0;
  }

  return identifiers.some((value) => OWNER_EMAILS.includes(value));
}

async function handlePost(req, res) {
  const result = normalizeLead(req.body || {});

  if (!result.ok) {
    if (result.dropped) {
      // Honeypot hit: answer like a success so the bot does not retry.
      res.status(202).json({ message: result.message });
      return;
    }
    res.status(400).json({ message: result.message });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({
      message: "That is a few requests in a row — give it a minute and try again.",
    });
    return;
  }

  try {
    const outcome = await captureLead(result.lead);
    res.status(201).json({
      message: "Thanks — your request is in. Check your inbox for the confirmation.",
      bookingUrl: outcome.bookingUrl,
    });
  } catch (error) {
    console.error(`leads: capture failed — ${error?.message || error}`);
    res.status(502).json({
      message: "Could not save that right now. Email deobernal@gmail.com and I will pick it up.",
    });
  }
}

async function handleGet(req, res) {
  if (!(await isOwner(req))) {
    res.status(401).json({ message: "Sign in with the owner account to view leads." });
    return;
  }

  try {
    const { leads, storage } = await listLeads();
    res.status(200).json({ leads, storage });
  } catch (error) {
    console.error(`leads: read failed — ${error?.message || error}`);
    res.status(502).json({ message: "Could not load leads right now." });
  }
}

async function handlePatch(req, res) {
  if (!(await isOwner(req))) {
    res.status(401).json({ message: "Sign in with the owner account to update leads." });
    return;
  }

  const { id, status } = req.body || {};
  if (!id || !status) {
    res.status(400).json({ message: "Provide a lead id and a status." });
    return;
  }

  try {
    const lead = await updateLeadStatus(id, String(status));
    res.status(200).json({ lead });
  } catch (error) {
    console.error(`leads: update failed — ${error?.message || error}`);
    res.status(400).json({ message: error?.message || "Could not update that lead." });
  }
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "POST") {
    await handlePost(req, res);
    return;
  }

  if (req.method === "GET") {
    await handleGet(req, res);
    return;
  }

  if (req.method === "PATCH") {
    await handlePatch(req, res);
    return;
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  res.status(405).json({ message: "Method not allowed." });
};
