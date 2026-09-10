/**
 * Signed-in chatbot history. Credentials are the same server-side Supabase
 * pair as leads. Never expose this to the browser.
 */

function normalizeSupabaseUrl(raw) {
  let url = String(raw || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1(?:\/.*)?$/i, "");
  url = url.replace(/\/+$/, "");
  return url;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const CONVERSATIONS_TABLE = process.env.SUPABASE_CHAT_CONVERSATIONS_TABLE || "chat_conversations";
const MESSAGES_TABLE = process.env.SUPABASE_CHAT_MESSAGES_TABLE || "chat_messages";
const MAX_MESSAGES = 20;
const MAX_CONTENT = 4000;

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

async function supabaseJson(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${options.method || "GET"} failed (${response.status}): ${body.slice(0, 300)}`);
  }
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function cleanMessage(message) {
  const role = message?.role === "assistant" ? "assistant" : message?.role === "user" ? "user" : "";
  const content = String(message?.content || "").trim().slice(0, MAX_CONTENT);
  if (!role || !content) return null;
  return { role, content };
}

async function getOrCreateConversation(user) {
  if (!supabaseConfigured() || !user?.userId) return null;

  const existing = await supabaseJson(
    `${encodeURIComponent(CONVERSATIONS_TABLE)}?user_id=eq.${encodeURIComponent(String(user.userId))}&select=id,user_id,user_email&limit=1`
  );
  if (Array.isArray(existing) && existing[0]?.id) {
    return existing[0];
  }

  const created = await supabaseJson(encodeURIComponent(CONVERSATIONS_TABLE), {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        user_id: user.userId,
        user_email: user.email || null,
      },
    ]),
  });
  return Array.isArray(created) ? created[0] : created;
}

async function listChatMessages(user) {
  if (!supabaseConfigured() || !user?.userId) return [];

  const conversation = await getOrCreateConversation(user);
  if (!conversation?.id) return [];

  const rows = await supabaseJson(
    `${encodeURIComponent(MESSAGES_TABLE)}?conversation_id=eq.${encodeURIComponent(String(conversation.id))}&select=role,content,created_at&order=created_at.asc&limit=${MAX_MESSAGES}`
  );

  if (!Array.isArray(rows)) return [];
  return rows.map(cleanMessage).filter(Boolean);
}

async function trimConversation(conversationId) {
  const rows = await supabaseJson(
    `${encodeURIComponent(MESSAGES_TABLE)}?conversation_id=eq.${encodeURIComponent(String(conversationId))}&select=id&order=created_at.asc`
  );
  if (!Array.isArray(rows) || rows.length <= MAX_MESSAGES) return;

  const extra = rows.slice(0, rows.length - MAX_MESSAGES).map((row) => row.id).filter(Boolean);
  if (extra.length === 0) return;

  await supabaseJson(
    `${encodeURIComponent(MESSAGES_TABLE)}?id=in.(${extra.join(",")})`,
    { method: "DELETE" }
  );
}

async function appendChatTurn(user, userText, assistantText) {
  const userMessage = cleanMessage({ role: "user", content: userText });
  const assistantMessage = cleanMessage({ role: "assistant", content: assistantText });
  if (!userMessage || !assistantMessage || !supabaseConfigured() || !user?.userId) {
    return { stored: false };
  }

  const conversation = await getOrCreateConversation(user);
  if (!conversation?.id) return { stored: false };

  await supabaseJson(encodeURIComponent(MESSAGES_TABLE), {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      { conversation_id: conversation.id, role: userMessage.role, content: userMessage.content },
      { conversation_id: conversation.id, role: assistantMessage.role, content: assistantMessage.content },
    ]),
  });

  await supabaseJson(
    `${encodeURIComponent(CONVERSATIONS_TABLE)}?id=eq.${encodeURIComponent(String(conversation.id))}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        updated_at: new Date().toISOString(),
        user_email: user.email || conversation.user_email || null,
      }),
    }
  );

  await trimConversation(conversation.id);
  return { stored: true };
}

module.exports = {
  appendChatTurn,
  listChatMessages,
  supabaseChatConfigured: supabaseConfigured,
};
