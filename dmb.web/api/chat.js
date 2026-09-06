const { generateAiText, streamGeminiText, friendlyAiError } = require("./_aiProvider");
const { retrieveContext } = require("./_chatKnowledge");
const { createLeadFilter } = require("./_leadMarker");
const { BOOKING_URL, captureLead, normalizeLead } = require("./_leadStore");

const SYSTEM_PROMPT = `You are DMB Assistant, the friendly AI helper for DMB Web Solutions on dmbwebsolutions.com.

DMB has three sides:
1) DMB Profiles — a free online portfolio and resume platform.
2) DMB AI Automation — Deo Bernal builds AI chat assistants, lead capture funnels, CRM and database integrations, automated follow-up, appointment booking, and voice agents for businesses.
3) DMB Real Estate — Deo Bernal's property listings in Pampanga (Porac / Mexico), PRC license 0017233. Listings: https://onepropertee.com/deo-bernal

Use retrieved context below when it answers the visitor. If it does not cover the question, use general knowledge and say it is not from the site docs.

## WEBSITE PAGES — use this EXACT link format: [[Page Name|/path]]
- [[Create free profile|/register]]
- [[Sign in|/login]]
- [[AI Profile Builder|/onboard]]
- [[Forgot password|/forgot-password]]
- [[Home|/]]
- [[AI automation services|/ai-automation]]
- [[Case studies|/case-studies]]
- [[Platforms and tools|/stack]]
- [[Book a call|{booking}]]
- [[Real estate listings|https://onepropertee.com/deo-bernal]]

Example: "You can [[Create free profile|/register]] in about a minute, then use the [[AI Profile Builder|/onboard]]."

## CONVERSATION RULES
1. Be warm, concise, and professional — like a helpful colleague, not a salesperson.
2. Keep replies SHORT (2-3 sentences) unless they ask for detail.
3. HELP FIRST. Answer the question before any call to action.
4. Never invent that a feature exists if it is not in the context.
5. Do not ask for passwords, payment cards, or government IDs.
6. If they want a live profile, guide them to register or sign in, then the AI builder.
7. If they ask about lots, land, or buying property in Pampanga, mention DMB Real Estate and [[Real estate listings|https://onepropertee.com/deo-bernal]].
8. If they are already signed in, greet them by first name when you know it, and point them to Portfolio, Resume, and AI Profile Builder.

## FORMATTING
- Use **bold** for important terms.
- Use short bullet lists (-) when listing 3+ items.
- Use [[Label|/path]] for in-site navigation.

## SOFT CONVERSION
Do not demand contact info. After you have been helpful, you may invite them to [[Create free profile|/register]] when it is natural.

## LEAD QUALIFICATION (automation enquiries only)
When someone asks about hiring Deo, automation, chatbots, funnels, CRM work, or a project for their own business:
1. Answer their question first, then ask ONE qualifying question at a time — never a list.
2. Work through, in this order: what they want automated, how soon they need it, then their name and email.
3. Once they have shared their need, offer [[Book a call|{booking}]] whether or not they leave an email.
4. Never ask for contact details from someone who is only asking about free profiles or property listings.
5. Never repeat a question they have already answered.

## LEAD HANDOFF — internal, never mention this to the visitor
The moment you have BOTH a name and a valid email address for an automation enquiry, end that one reply with this exact block on its own final line:
<<<LEAD {"name":"...","email":"...","need":"...","timeline":"...","notes":"..."}>>>
Rules for the block:
- Emit it once per conversation, only when you genuinely have the name and email the visitor typed.
- Use an empty string for anything they have not said. Never invent values.
- Write nothing after the block, and never describe or show it in your visible reply.

Retrieved context:
{context}`;

function buildConversation(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant") && msg.content)
    .slice(-20)
    .map((msg) => ({
      role: msg.role,
      content: String(msg.content).slice(0, 4000),
    }));
}

function latestUserText(conversation) {
  for (let i = conversation.length - 1; i >= 0; i -= 1) {
    if (conversation[i].role === "user") return conversation[i].content;
  }
  return "";
}

function systemPrompt(context) {
  return SYSTEM_PROMPT.replace("{context}", context).replaceAll("{booking}", BOOKING_URL);
}

function toPrompt(conversation, context) {
  const history = conversation
    .map((msg) => `${msg.role === "user" ? "Visitor" : "Assistant"}: ${msg.content}`)
    .join("\n");

  return `${systemPrompt(context)}

Conversation so far:
${history}

Respond as the Assistant. Keep it SHORT (2-3 sentences) unless they ask for detailed information.`;
}

/**
 * A lead captured mid-conversation must never break the reply, so a failed
 * capture is logged and the visitor still gets their answer.
 */
async function captureFromChat(filter) {
  const parsed = filter.lead();
  if (!parsed) return;

  const result = normalizeLead({
    name: parsed.name,
    email: parsed.email,
    need: parsed.need,
    timeline: parsed.timeline,
    message: parsed.notes,
    source: "site-chat",
  });

  if (!result.ok) {
    console.warn("chat: incomplete lead block ignored");
    return;
  }

  try {
    await captureLead(result.lead);
  } catch (error) {
    console.error(`chat: lead capture failed — ${error?.message || error}`);
  }
}

async function streamReply(res, conversation, context) {
  const prompt = toPrompt(conversation, context);
  const filter = createLeadFilter();

  try {
    const streamed = await streamGeminiText(res, prompt, filter);
    if (streamed) {
      await captureFromChat(filter);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  } catch (error) {
    if (res.headersSent) {
      throw error;
    }
  }

  const fallbackFilter = createLeadFilter();
  const raw = await generateAiText({
    system: systemPrompt(context),
    user: toPrompt(conversation, context),
    json: false,
  });
  const text = `${fallbackFilter.feed(raw)}${fallbackFilter.end()}`;
  await captureFromChat(fallbackFilter);

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  try {
    const conversation = buildConversation(req.body?.messages);
    if (conversation.length === 0) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.status(400).json({ message: "Provide at least one chat message." });
      return;
    }

    const context = retrieveContext(latestUserText(conversation));
    await streamReply(res, conversation, context);
  } catch (error) {
    if (res.headersSent) {
      res.end();
      return;
    }

    const friendly = friendlyAiError(error);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(friendly.statusCode || 500).json({
      message: friendly.message,
    });
  }
};
