const { generateAiText, streamGeminiText, friendlyAiError } = require("./_aiProvider");
const { retrieveContext } = require("./_chatKnowledge");

const SYSTEM_PROMPT = `You are DMB Assistant, the friendly AI helper for DMB Web Solutions on dmbwebsolutions.com.

DMB has two sides:
1) DMB Profiles — a free online portfolio and resume platform.
2) DMB Real Estate — Deo Bernal's property listings in Pampanga (Porac / Mexico), PRC license 0017233. Listings: https://onepropertee.com/deo-bernal

Use retrieved context below when it answers the visitor. If it does not cover the question, use general knowledge and say it is not from the site docs.

## WEBSITE PAGES — use this EXACT link format: [[Page Name|/path]]
- [[Create free profile|/register]]
- [[Sign in|/login]]
- [[AI Profile Builder|/onboard]]
- [[Forgot password|/forgot-password]]
- [[Home|/]]
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

function toPrompt(conversation, context) {
  const history = conversation
    .map((msg) => `${msg.role === "user" ? "Visitor" : "Assistant"}: ${msg.content}`)
    .join("\n");

  return `${SYSTEM_PROMPT.replace("{context}", context)}

Conversation so far:
${history}

Respond as the Assistant. Keep it SHORT (2-3 sentences) unless they ask for detailed information.`;
}

async function streamReply(res, conversation, context) {
  const prompt = toPrompt(conversation, context);

  try {
    const streamed = await streamGeminiText(res, prompt);
    if (streamed) {
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  } catch (error) {
    if (res.headersSent) {
      throw error;
    }
  }

  const text = await generateAiText({
    system: SYSTEM_PROMPT.replace("{context}", context),
    user: toPrompt(conversation, context),
    json: false,
  });

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
