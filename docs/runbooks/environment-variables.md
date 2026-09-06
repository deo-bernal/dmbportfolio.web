# Runbook: environment variables

Owner: Deo Bernal · Last reviewed: 2026-09

## The rule that matters

Create React App inlines every variable prefixed `REACT_APP_` into the browser bundle. Anything without that prefix is only readable by the serverless functions in `dmb.web/api/`.

So: **no key, token, or secret may ever be named `REACT_APP_*`.** If a secret needs to reach the browser, the design is wrong — put a function in front of it.

## Server-side only (Vercel project settings)

| Name | Used by | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | `api/_aiProvider.js` | Groq key. |
| `OPENAI_BASE_URL` | `api/_aiProvider.js` | Optional override. |
| `OPENAI_MODEL` | `api/_aiProvider.js` | Optional preferred model. |
| `GEMINI_API_KEY` | `api/_aiProvider.js` | Google AI Studio key. |
| `GEMINI_MODEL` | `api/_aiProvider.js` | Optional preferred model. |
| `SUPABASE_URL` | `api/_leadStore.js` | Project URL only, e.g. `https://ljtcgveobqdplczcxtif.supabase.co`. Not the Database host and not a URL that already ends in `/rest/v1`. |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/_leadStore.js` | Full table access. Treat as a password. |
| `SUPABASE_LEADS_TABLE` | `api/_leadStore.js` | Defaults to `leads`. |
| `N8N_LEAD_WEBHOOK_URL` | `api/_leadStore.js` | Production webhook from n8n. |
| `N8N_WEBHOOK_TOKEN` | `api/_leadStore.js` | Shared secret sent as `X-DMB-Token`. |
| `RESEND_API_KEY` | `api/_leadStore.js` | Transactional email. |
| `LEADS_FROM_EMAIL` | `api/_leadStore.js` | Verified sender. |
| `LEADS_NOTIFY_EMAIL` | `api/_leadStore.js` | Internal copy of each lead. |
| `LEADS_OWNER_EMAILS` | `api/leads.js` | Comma-separated allow-list for the pipeline view. |
| `CAL_BOOKING_URL` | `api/_leadStore.js`, `api/chat.js` | Booking link in emails and chat replies. |
| `DMB_API_UPSTREAM_URL` | `api/_upstream.js` | Overrides the .NET API base. |

## Public, safe to ship in the bundle

| Name | Used by | Notes |
| --- | --- | --- |
| `REACT_APP_CAL_BOOKING_URL` | `src/content/showcase.ts` | Public booking page. |
| `REACT_APP_CONTACT_EMAIL` | `src/content/showcase.ts` | Published contact address. |
| `REACT_APP_WALKTHROUGH_URL` | `src/content/showcase.ts` | Loom walkthrough; the button is hidden while unset. |
| `REACT_APP_VOICE_AGENT_URL` | `src/components/voice/VoiceAgentButton.tsx` | Public voice demo link. |
| `REACT_APP_VOICE_AGENT_PHONE` | `src/components/voice/VoiceAgentButton.tsx` | Public inbound number. |
| `REACT_APP_DEPLOY_PLATFORM` | `src/config.ts` | `vercel` or `azure`. |
| `REACT_APP_DMB_API_TARGET` | `src/config.ts` | `local` or `deployment`. |
| `REACT_APP_PRODUCTION_HOSTS` | `src/config.ts` | Hosts that use the `/api` proxy. |

## Setting and checking

```bash
cd dmbportfolio.web/dmb.web
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env ls
npx vercel --prod --yes            # env changes only take effect on a new deploy
```

Booking URL is duplicated on purpose: `CAL_BOOKING_URL` for the server, `REACT_APP_CAL_BOOKING_URL` for the page. Both point at the same public link, so keep them in step.

## Before committing

Verify no secret leaked into the bundle:

```bash
npm run build
Select-String -Path build/static/js/*.js -Pattern "service_role|sk-|re_[0-9a-zA-Z]{16}" -SimpleMatch
```

Nothing should match.
