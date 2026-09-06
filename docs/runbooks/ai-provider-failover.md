# Runbook: AI provider failover

Owner: Deo Bernal · Last reviewed: 2026-09

## What this covers

Every AI call on the site: the chat assistant (`api/chat.js`) and the profile generator (`api/ai/generate-profile.js`). Both go through `api/_aiProvider.js`.

## Order of attempts

1. **Groq**, walking `OPENAI_MODEL` (if set), then `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.6-27b`.
2. **Gemini SDK**, walking `GEMINI_MODEL` (if set), then `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-flash-latest`.
3. **Gemini REST**, the same model list over `generativelanguage.googleapis.com`, so an SDK fault is not treated as a provider outage.

A model is skipped and the next one tried when the error looks like a quota problem (`429`, `RESOURCE_EXHAUSTED`, rate limit) or a missing model (`404`, "decommissioned", "does not exist"). Any other error stops that provider and moves to the next one.

Chat streams through the Gemini SDK when a key is present; if streaming cannot start, the reply falls back to a single non-streamed response written as one SSE chunk. The client cannot tell the difference.

## Environment variables

| Name | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Groq API key, despite the name — Groq is OpenAI-compatible. |
| `OPENAI_BASE_URL` | Defaults to `https://api.groq.com/openai/v1`. |
| `OPENAI_MODEL` | Optional preferred Groq model, tried first. |
| `GEMINI_API_KEY` | Google AI Studio key. |
| `GEMINI_MODEL` | Optional preferred Gemini model, tried first. |

With no key at all the endpoint returns `503 No AI provider is configured.`

## Diagnosing a failure

Function logs name the provider and the model on every failed attempt, for example `Groq openai/gpt-oss-20b: model has been decommissioned`. That line is the whole diagnosis.

```bash
vercel logs https://www.dmbwebsolutions.com --since 30m | Select-String "Groq|Gemini|AI provider"
```

Reproduce the endpoint directly:

```bash
curl -N -X POST https://www.dmbwebsolutions.com/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"What does DMB build?"}]}'
```

A healthy response streams `data: {"text":"..."}` lines and ends with `data: [DONE]`.

## Known failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| `502` with "Unable to complete the AI request right now" | Every provider and model failed. | Read the logs for the per-model reason; usually a retired model or an expired key. |
| `429` with the free-tier message | Daily or per-minute quota reached. | Wait, or add the second provider's key so traffic spills over. |
| `FUNCTION_INVOCATION_FAILED` on `/api/chat` | A module fails to load at import time. | Confirm the package is in `dmb.web/package.json`; optional SDKs must be loaded through the guarded loader in `_aiProvider.js`. |
| Model reported as decommissioned | Provider retired it, as Groq did with `llama-3.3-70b-versatile` in August 2026. | Add the replacement to the head of the model list; never pin a single model. |

## Adding a model

Edit `GROQ_MODELS` or `GEMINI_MODELS` in `api/_aiProvider.js`. Newest and cheapest first, most reliable last. Deploy, then run the curl check above. Keep at least two entries per provider so a single retirement cannot take the site down.
