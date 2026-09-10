function loadGeminiClient(apiKey) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    return new GoogleGenerativeAI(apiKey);
  } catch {
    return null;
  }
}

const GROQ_BASE_URL = (
  process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/$/, "");
const GROQ_MODELS = unique([
  "llama-3.1-8b-instant",
  process.env.OPENAI_MODEL,
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
]);
const GEMINI_MODELS = unique([
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
]);

const QUOTA_MESSAGE = [
  "Usage limit exceeded.",
  "All AI on this site runs on free-tier Groq and Google Gemini APIs, so performance is limited.",
  "Please wait about a minute and try again.",
  "Free tiers for AI tools and APIs offer zero-cost experimentation, but come with strict rate limits, data privacy trade-offs, and no uptime guarantees.",
].join(" ");

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function errorText(error) {
  return String(error?.message || error || "");
}

function isQuotaError(error) {
  return /429|quota|Too Many Requests|rate.?limit|RESOURCE_EXHAUSTED/i.test(errorText(error));
}

function isMissingModelError(error) {
  return /404|not found|does not exist|not supported|decommissioned/i.test(errorText(error));
}

function friendlyAiError(error) {
  const next = new Error(isQuotaError(error) ? QUOTA_MESSAGE : "Unable to complete the AI request right now.");
  next.statusCode = isQuotaError(error) ? 429 : error?.statusCode || 502;
  return next;
}

function logProviderError(provider, error) {
  console.error(`${provider}: ${errorText(error)}`);
}

async function callGroq({ system, user, json }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: json ? 0.4 : 0.3,
          ...(json ? { response_format: { type: "json_object" } } : {}),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload?.error?.message || `Groq request failed (${response.status}).`);
        error.statusCode = response.status;
        throw error;
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("AI returned an empty response.");
      }
      return content;
    } catch (error) {
      lastError = error;
      logProviderError(`Groq ${model}`, error);
      if (!isQuotaError(error) && !isMissingModelError(error)) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function callGroqChat({ messages, tools = null, json = false }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages,
          ...(tools ? { tools, tool_choice: "auto" } : {}),
          ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload?.error?.message || `Groq request failed (${response.status}).`);
        error.statusCode = response.status;
        throw error;
      }

      const message = payload?.choices?.[0]?.message;
      if (!message) {
        throw new Error("AI returned an empty response.");
      }
      return {
        content: String(message.content || "").trim(),
        toolCalls: Array.isArray(message.tool_calls) ? message.tool_calls : [],
        model,
      };
    } catch (error) {
      lastError = error;
      logProviderError(`Groq chat ${model}`, error);
      if (!isQuotaError(error) && !isMissingModelError(error)) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function callGeminiSdk({ system, user, json }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = loadGeminiClient(apiKey);
  if (!genAI) return null;
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: json ? 0.4 : 0.3,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      });
      const result = await model.generateContent(`${system}\n\n${user}`);
      const content = result?.response?.text?.() ?? "";
      if (content) {
        return content;
      }
    } catch (error) {
      lastError = error;
      logProviderError(`Gemini SDK ${modelName}`, error);
      if (!isQuotaError(error) && !isMissingModelError(error)) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function callGeminiRest({ system, user, json }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  let lastError;
  for (const modelName of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            temperature: json ? 0.4 : 0.3,
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload?.error?.message || `Gemini request failed (${response.status}).`);
        error.statusCode = response.status;
        throw error;
      }

      const content = (payload?.candidates?.[0]?.content?.parts || [])
        .map((part) => part.text || "")
        .join("");
      if (content) {
        return content;
      }
    } catch (error) {
      lastError = error;
      logProviderError(`Gemini REST ${modelName}`, error);
      if (!isQuotaError(error) && !isMissingModelError(error)) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function callGemini(options) {
  try {
    const content = await callGeminiSdk(options);
    if (content) return content;
  } catch (error) {
    logProviderError("Gemini SDK", error);
  }
  return callGeminiRest(options);
}

async function generateAiText({ system, user, json = false }) {
  const providers = [];
  if (process.env.OPENAI_API_KEY) {
    providers.push(() => callGroq({ system, user, json }));
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push(() => callGemini({ system, user, json }));
  }

  if (providers.length === 0) {
    const error = new Error("No AI provider is configured.");
    error.statusCode = 503;
    throw error;
  }

  let lastError;
  for (const run of providers) {
    try {
      const content = await run();
      if (content) {
        return content;
      }
    } catch (error) {
      lastError = error;
      logProviderError("AI provider", error);
    }
  }

  throw friendlyAiError(lastError);
}

function beginSse(res) {
  if (res.headersSent) return;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
}

function writeSseText(res, text) {
  if (!text) return;
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`${label} timed out`);
        error.statusCode = 504;
        reject(error);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function streamGroqText(res, system, user, filter = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  let lastError;
  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          stream: true,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({}));
        const error = new Error(payload?.error?.message || `Groq stream failed (${response.status}).`);
        error.statusCode = response.status;
        throw error;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          let piece = "";
          try {
            piece = JSON.parse(data)?.choices?.[0]?.delta?.content || "";
          } catch {
            continue;
          }
          if (!piece) continue;
          const text = filter ? filter.feed(piece) : piece;
          if (!text) continue;
          beginSse(res);
          started = true;
          writeSseText(res, text);
        }
      }

      if (!started) {
        throw new Error("Groq stream returned no text.");
      }
      const tail = filter ? filter.end() : "";
      writeSseText(res, tail);
      return true;
    } catch (error) {
      lastError = error;
      logProviderError(`Groq stream ${model}`, error);
      if (res.headersSent) throw error;
      if (!isQuotaError(error) && !isMissingModelError(error) && error?.name !== "AbortError") {
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError && !res.headersSent) return false;
  return false;
}

/**
 * `filter`, when supplied, sees every chunk before it is written to the client
 * and may hold text back (see _leadMarker.js).
 * Headers are not sent until the first token, so a hung stream can still fail over.
 */
async function streamGeminiText(res, prompt, filter = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return false;

  const genAI = loadGeminiClient(apiKey);
  if (!genAI) return false;
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.3 },
      });
      const result = await withTimeout(
        model.generateContentStream(prompt),
        8000,
        `Gemini stream ${modelName}`
      );
      let started = false;

      await withTimeout(
        (async () => {
          for await (const chunk of result.stream) {
            const raw = chunk.text();
            if (!raw) continue;
            const text = filter ? filter.feed(raw) : raw;
            if (!text) continue;
            beginSse(res);
            started = true;
            writeSseText(res, text);
          }
        })(),
        8000,
        `Gemini tokens ${modelName}`
      );

      if (!started) {
        throw new Error("Gemini stream returned no text.");
      }
      const tail = filter ? filter.end() : "";
      writeSseText(res, tail);
      return true;
    } catch (error) {
      lastError = error;
      logProviderError(`Gemini stream ${modelName}`, error);
      if (res.headersSent) {
        throw error;
      }
    }
  }

  if (lastError && !res.headersSent) {
    return false;
  }
  return false;
}

module.exports = {
  generateAiText,
  callGroqChat,
  streamGeminiText,
  streamGroqText,
  beginSse,
  writeSseText,
  friendlyAiError,
  QUOTA_MESSAGE,
};
