# Runbook: lead pipeline

Owner: Deo Bernal · Last reviewed: 2026-09

## What this covers

Every lead that reaches DMB Web Solutions, from the funnel form at `/ai-automation` or from the site chat assistant, through storage, notification, follow-up, and the pipeline view.

## Components

| Piece | Location | Notes |
| --- | --- | --- |
| Funnel form | `dmb.web/src/components/leads/LeadForm.tsx` | Client validation plus a hidden honeypot field. |
| Capture endpoint | `dmb.web/api/leads.js` | `POST` capture, `GET` list, `PATCH` stage change. |
| Shared pipeline | `dmb.web/api/_leadStore.js` | Validation, Supabase REST, n8n webhook, Resend. |
| Chat qualifier | `dmb.web/api/chat.js` + `api/_leadMarker.js` | Assistant emits a hidden lead block; the filter strips it before streaming. |
| Storage | Supabase `public.leads` | Schema in `automation/supabase/leads.sql`. |
| Workflows | Self-hosted n8n | Exports in `automation/n8n/`. |
| Pipeline view | `/accent-sidebar/leads` | Behind the app login, owner allow-list enforced server-side. |

## Flow

1. `POST /api/leads` validates the payload. A filled `website` field means a bot, so the request gets a `202` and goes no further.
2. Per-instance rate limit: five submissions per IP per ten minutes.
3. Insert into Supabase over the REST API using the service role key.
4. In parallel: fire the n8n webhook, send the visitor a Resend confirmation, and send the owner notification if `LEADS_NOTIFY_EMAIL` is set.
5. n8n posts to Slack and runs the two-step nurture sequence, checking the lead's stage before each send.

Storage failure is the only fatal step; the visitor is told to email directly. Notification and email failures are logged and the visitor still gets a success response.

## Environment variables (Vercel)

| Name | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | for storage | Project URL, no trailing slash. |
| `SUPABASE_SERVICE_ROLE_KEY` | for storage | Server-side only. Never prefix with `REACT_APP_`. |
| `SUPABASE_LEADS_TABLE` | no | Defaults to `leads`. |
| `N8N_LEAD_WEBHOOK_URL` | for automation | Production webhook URL from n8n. |
| `N8N_WEBHOOK_TOKEN` | recommended | Sent as `X-DMB-Token`; the workflow rejects anything else. |
| `RESEND_API_KEY` | for email | Resend API key. |
| `LEADS_FROM_EMAIL` | for email | Verified sender address. |
| `LEADS_NOTIFY_EMAIL` | no | Where the internal "new lead" copy goes. |
| `LEADS_OWNER_EMAILS` | recommended | Comma-separated allow-list for reading the pipeline. |
| `CAL_BOOKING_URL` | no | Booking link used in emails and by the chatbot. |

Set them with `vercel env add NAME production`, then redeploy. Nothing here is readable from the browser: Create React App only exposes variables prefixed `REACT_APP_`.

## Verify after a deploy

```bash
# 1. Capture path (expect 201 and a confirmation email)
curl -s -X POST https://www.dmbwebsolutions.com/api/leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Runbook Check","email":"you@example.com","need":"AI chat assistant","timeline":"This month","source":"funnel-form"}'

# 2. Honeypot path (expect 202, nothing stored)
curl -s -X POST https://www.dmbwebsolutions.com/api/leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bot","email":"bot@example.com","website":"http://spam.example"}'

# 3. Read path without a token (expect 401)
curl -s https://www.dmbwebsolutions.com/api/leads
```

Then open `/accent-sidebar/leads` signed in as the owner account and confirm the test row appears in **New**. Delete it from Supabase afterwards.

## When something breaks

| Symptom | First check | Likely cause |
| --- | --- | --- |
| Form returns "Could not save that right now" | Vercel function logs for `leads: capture failed` | Supabase URL or service key wrong, or the table does not exist. |
| Leads dashboard shows "Supabase is not configured yet" | `vercel env ls` | `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing from the production environment. |
| Dashboard returns 401 for the owner | `LEADS_OWNER_EMAILS` value | Address does not match the account email or username exactly, in lower case. |
| Row lands in Supabase but no Slack ping | n8n executions list | Instance asleep, wrong `N8N_LEAD_WEBHOOK_URL`, or the shared token does not match. |
| No confirmation email | Resend dashboard | Sender domain not verified, or `LEADS_FROM_EMAIL` is not a verified address. |
| Chat captures nothing | Function logs for `chat: incomplete lead block ignored` | The model produced a lead block without a valid email; it will try again next turn. |
| Marker text visible in a chat reply | `node dmb.web/scripts/check-lead-marker.js` | Filter regression. That script fails loudly if the marker can leak. |

## Data hygiene

Test leads are real rows. Delete them:

```sql
delete from public.leads where email like '%@example.com';
```
