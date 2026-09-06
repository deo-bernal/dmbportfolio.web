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

const QUOTA_MESSAGE =
  "AI is temporarily at its free-tier limit. Please wait about a minute and try again.";

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

async function streamGeminiText(res, prompt) {
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
      const result = await model.generateContentStream(prompt);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      return true;
    } catch (error) {
      lastError = error;
      logProviderError(`Gemini stream ${modelName}`, error);
      if (res.headersSent) {
        throw error;
      }
      if (!isQuotaError(error) && !isMissingModelError(error)) {
        continue;
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
  streamGeminiText,
  friendlyAiError,
  QUOTA_MESSAGE,
};
