# n8n workflows

Exported so the automation can be read without logging into anything.

| File | Trigger | What it does |
| --- | --- | --- |
| `dmb-lead-pipeline.json` | Webhook `POST /webhook/dmb-lead` | Verifies the shared token, posts the lead to Slack, then runs a two-step nurture sequence that stops as soon as the lead leaves the `new` stage. |
| `dmb-lead-digest.json` | Schedule, Mondays 08:00 | Reads the last seven days from Supabase and posts a pipeline summary to Slack. |
| `render.yaml` | — | Render Blueprint for self-hosting n8n on the free plan. |

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

## Free-plan caveat

Render's free web service sleeps after fifteen minutes of inactivity. Wait-node resumes fire when the instance next wakes, so a two-day wait can run a little late. Incoming webhooks wake the instance, so lead capture and the Slack ping are not affected.
