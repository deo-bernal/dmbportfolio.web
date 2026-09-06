# n8n workflows

Exported so the automation can be read without logging into anything.

| File | Trigger | What it does |
| --- | --- | --- |
| `dmb-lead-pipeline.json` | Webhook `POST /webhook/dmb-lead` | Verifies the shared token, posts the lead to Slack, then runs a two-step nurture sequence that stops as soon as the lead leaves the `new` stage. |
| `dmb-lead-digest.json` | Schedule, Mondays 08:00 | Reads the last seven days from Supabase and posts a pipeline summary to Slack. |
| `render.yaml` | — | Render Blueprint for n8n on the free web plan (no disk; Postgres-backed). |

## Importing

1. Open n8n, then **Workflows > Import from file**.
2. Set the environment variables listed below on the n8n instance (Render dashboard, marked secret).
3. Activate the workflow. n8n prints the production webhook URL — that value goes into Vercel as `N8N_LEAD_WEBHOOK_URL`.

## Environment variables used by these workflows

| Name | Used by | Purpose |
| --- | --- | --- |
| `N8N_WEBHOOK_TOKEN` | pipeline | Must match the `X-DMB-Token` header sent by `api/leads.js`. Requests without it are dropped. |
| `SUPABASE_URL` | pipeline, digest | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | pipeline, digest | Service role key. Never leaves the server. |
| `RESEND_API_KEY` | pipeline | Sends the nurture emails. |
| `LEADS_FROM_EMAIL` | pipeline | Verified sender, for example `deo@dmbwebsolutions.com`. |
| `SLACK_WEBHOOK_URL` | pipeline, digest | Slack incoming webhook. |

## Sequence

The instant confirmation email is sent by `api/leads.js` through Resend, not by n8n, so a visitor still gets a reply even if the n8n instance is asleep. n8n owns everything from the Slack ping onwards.

```
POST /api/leads  ->  Supabase insert
                 ->  Resend confirmation (immediate)
                 ->  n8n webhook
                       -> Slack notification
                       -> wait 2 days -> still "new"? -> nurture email 1
                       -> wait 3 days -> still "new"? -> nurture email 2
```

Marking a lead as `qualified`, `booked`, `won`, or `lost` in the dashboard at `/accent-sidebar/leads` stops the sequence at the next checkpoint. That check is why the nurture emails do not chase someone who has already booked.

## Deploy on Render (free plan)

Render's free web plan cannot attach a disk. The Blueprint therefore does **not** mount `/home/node/.n8n`. n8n writes workflows, credentials, and wait-node state to a dedicated `n8n` schema in the same Supabase Postgres used by `public.leads`.

1. Run `automation/supabase/leads.sql` in the Supabase SQL editor (creates `public.leads` and `schema n8n`).
2. In Render: **New > Blueprint**, repo `deo-bernal/dmbportfolio.web`, branch `AiAutomationShowCase`, path `automation/n8n/render.yaml`.
3. Fill the `sync: false` secrets in the Render dashboard:

| Name | Where to get it |
| --- | --- |
| `DB_POSTGRESDB_HOST` | Supabase → Project Settings → Database → Host (use the pooler host if the direct host times out) |
| `DB_POSTGRESDB_DATABASE` | Usually `postgres` |
| `DB_POSTGRESDB_USER` | Database user, often `postgres` |
| `DB_POSTGRESDB_PASSWORD` | Database password |
| `N8N_ENCRYPTION_KEY` | Any long random string. Keep it forever; changing it locks existing credentials. |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | Login for the n8n UI |
| `N8N_WEBHOOK_TOKEN` | Shared secret; same value later goes on Vercel as the token `api/leads.js` sends |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Used by the imported workflows, not by n8n startup |
| `RESEND_API_KEY` / `LEADS_FROM_EMAIL` / `SLACK_WEBHOOK_URL` | Used by the imported workflows |

4. After the service is live, import `dmb-lead-pipeline.json`, activate it, and put the production webhook URL on Vercel as `N8N_LEAD_WEBHOOK_URL`.

## Free-plan caveat

The instance still sleeps after fifteen minutes of inactivity. Workflows themselves survive sleep because they live in Postgres. Wait-node resumes fire when the instance next wakes, so a two-day wait can run a little late. Incoming webhooks wake the instance, so lead capture and the Slack ping are not affected.
