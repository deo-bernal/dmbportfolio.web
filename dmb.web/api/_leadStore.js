/**
 * Lead pipeline shared by the funnel form (api/leads.js) and the chat assistant
 * (api/chat.js). Every credential here is server-side only and must be set with
 * `vercel env add` — none of these names are prefixed REACT_APP_, so none of
 * them can reach the browser bundle.
 *
 * Required for storage:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional:               SUPABASE_LEADS_TABLE (default "leads")
 *                         N8N_LEAD_WEBHOOK_URL, N8N_WEBHOOK_TOKEN
 *                         RESEND_API_KEY, LEADS_FROM_EMAIL, LEADS_NOTIFY_EMAIL
 *                         CAL_BOOKING_URL, LEADS_OWNER_EMAILS
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_TABLE = process.env.SUPABASE_LEADS_TABLE || "leads";

const N8N_WEBHOOK_URL = process.env.N8N_LEAD_WEBHOOK_URL || "";
const N8N_WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN || "";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.LEADS_FROM_EMAIL || "";
const NOTIFY_EMAIL = process.env.LEADS_NOTIFY_EMAIL || "";

const BOOKING_URL = process.env.CAL_BOOKING_URL || "https://cal.com/deo-bernal/30min";

const MAX_FIELD = 2000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/** Best-effort per-instance throttle. Serverless instances are short lived, so
 * this stops a burst from one client without pretending to be a global limit. */
const recentSubmissions = new Map();

function clean(value, limit = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const hits = (recentSubmissions.get(ip) || []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS
  );

  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(ip, hits);
    return true;
  }

  hits.push(now);
  recentSubmissions.set(ip, hits);
  return false;
}

/**
 * Validates and normalises a submission. `website` is the honeypot: it is
 * invisible to people, so anything in it means a bot filled the form.
 */
function normalizeLead(input = {}) {
  if (clean(input.website)) {
    return { ok: false, dropped: true, message: "Thanks — your request is in." };
  }

  const name = clean(input.name, 120);
  const email = clean(input.email, 160).toLowerCase();

  if (!name) {
    return { ok: false, message: "Add your name so I know who I am replying to." };
  }
  if (!isEmail(email)) {
    return { ok: false, message: "That email address does not look right." };
  }

  return {
    ok: true,
    lead: {
      name,
      email,
      company: clean(input.company, 160) || null,
      need: clean(input.need, 160) || null,
      timeline: clean(input.timeline, 120) || null,
      budget: clean(input.budget, 120) || null,
      message: clean(input.message, MAX_FIELD) || null,
      source: clean(input.source, 60) || "funnel-form",
      status: "new",
    },
  };
}

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function insertLead(lead) {
  if (!supabaseConfigured()) {
    // Storage is optional so the funnel still works before Supabase is wired.
    // The lead is written to the function log instead of being lost.
    console.warn("leads: Supabase not configured, logging lead only", JSON.stringify(lead));
    return { stored: false, storage: "log" };
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`,
    {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify([lead]),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase insert failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const rows = await response.json().catch(() => []);
  return { stored: true, storage: "supabase", row: rows?.[0] || null };
}

async function listLeads() {
  if (!supabaseConfigured()) {
    return { leads: [], storage: "log" };
  }

  const query = "select=*&order=created_at.desc&limit=200";
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}?${query}`,
    { headers: supabaseHeaders() }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase read failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  return { leads: await response.json(), storage: "supabase" };
}

const LEAD_STATUSES = ["new", "qualified", "booked", "won", "lost"];

async function updateLeadStatus(id, status) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error(`Unknown status "${status}".`);
  }
  if (!supabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase update failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const rows = await response.json().catch(() => []);
  return rows?.[0] || null;
}

/** n8n owns Slack notification and the nurture sequence. */
async function notifyWorkflow(lead) {
  if (!N8N_WEBHOOK_URL) return false;

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_WEBHOOK_TOKEN ? { "X-DMB-Token": N8N_WEBHOOK_TOKEN } : {}),
      },
      body: JSON.stringify({ ...lead, bookingUrl: BOOKING_URL, receivedAt: new Date().toISOString() }),
    });
    if (!response.ok) {
      console.error(`leads: n8n webhook returned ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`leads: n8n webhook failed — ${error?.message || error}`);
    return false;
  }
}

function confirmationHtml(lead) {
  return `<p>Hi ${lead.name.split(" ")[0]},</p>
<p>Thanks for reaching out about <strong>${lead.need || "AI automation"}</strong>. Your request is logged and I will reply personally within one business day.</p>
<p>If you would rather skip the email thread, grab a 30-minute slot here: <a href="${BOOKING_URL}">${BOOKING_URL}</a></p>
<p>In the meantime, the case studies at <a href="https://www.dmbwebsolutions.com/case-studies">dmbwebsolutions.com/case-studies</a> show exactly how the pipeline you just used was built.</p>
<p>— Deo Bernal<br/>DMB Web Solutions</p>`;
}

async function sendEmail({ to, subject, html, replyTo }) {
  if (!RESEND_API_KEY || !FROM_EMAIL || !to) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`leads: Resend returned ${response.status} — ${detail.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`leads: Resend failed — ${error?.message || error}`);
    return false;
  }
}

/**
 * Stores the lead, then fans out. Storage failure is fatal (the caller should
 * report it); notification and email failures are logged but never block the
 * visitor's confirmation.
 */
async function captureLead(lead) {
  const inserted = await insertLead(lead);

  const [notified, confirmed] = await Promise.all([
    notifyWorkflow(lead),
    sendEmail({
      to: lead.email,
      subject: "Thanks — your request is in",
      html: confirmationHtml(lead),
    }),
    NOTIFY_EMAIL
      ? sendEmail({
          to: NOTIFY_EMAIL,
          subject: `New lead: ${lead.name} (${lead.need || lead.source})`,
          replyTo: lead.email,
          html: `<pre>${JSON.stringify(lead, null, 2)}</pre>`,
        })
      : Promise.resolve(false),
  ]);

  return {
    ...inserted,
    notified,
    confirmed,
    bookingUrl: BOOKING_URL,
  };
}

module.exports = {
  BOOKING_URL,
  LEAD_STATUSES,
  captureLead,
  isRateLimited,
  listLeads,
  normalizeLead,
  supabaseConfigured,
  updateLeadStatus,
};
