# Runbooks

Operational notes for the parts of dmbwebsolutions.com that can fail at three in the morning.

| Runbook | Covers |
| --- | --- |
| [lead-pipeline.md](lead-pipeline.md) | Capture, storage, notification, follow-up, and the pipeline view. |
| [ai-provider-failover.md](ai-provider-failover.md) | How the chat assistant and profile generator survive a provider outage. |
| [environment-variables.md](environment-variables.md) | Which variables exist, where they live, and which ones must never reach the browser. |
| [voice-agent.md](voice-agent.md) | Wiring a Vapi or Retell agent into the same lead pipeline. |

Related: workflow exports and the Supabase schema live in [`automation/`](../../automation).

Each runbook names an owner and a review date, lists the environment variables involved, gives a copy-pasteable verification command, and ends with a symptom-to-cause table. New automation is not finished until it has one.
