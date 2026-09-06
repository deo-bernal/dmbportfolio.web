# Application packet — AI Implementation Technician

Fill the bracketed fields before sending. Everything else is already true.

## Links

| What | Where |
| --- | --- |
| Services and live lead pipeline | https://www.dmbwebsolutions.com/ai-automation |
| Case study 1 — AI chatbot in production | https://www.dmbwebsolutions.com/case-studies/dmb-assistant |
| Case study 2 — AI profile builder | https://www.dmbwebsolutions.com/case-studies/ai-profile-builder |
| Platforms and tools, honestly split | https://www.dmbwebsolutions.com/stack |
| Loom walkthrough (3–5 min) | [paste Loom URL] |
| Example generated profile | https://www.dmbwebsolutions.com/deobernal@gmail.com |
| Booking | [your Cal.com link] |

## Requirement-by-requirement

| They asked for | What I can point at |
| --- | --- |
| AI chatbots | DMB Assistant, live on every page of dmbwebsolutions.com. Grounded retrieval, streaming replies, failover across two providers and six models. |
| Sales funnels and lead capture | `/ai-automation`: hero, services, proof, form, booking. The form is the real pipeline, not a mailto. |
| CRM and database integration | Supabase `leads` table over the REST API, plus a pipeline view at `/accent-sidebar/leads` with stage changes. |
| Automated follow-up | Instant Resend confirmation from the function, then a two-step n8n nurture sequence that stops when the lead changes stage. |
| Appointment booking | Cal.com embedded on the funnel and offered by the chatbot once a visitor is qualified. |
| Lead qualification | The assistant asks need, then timeline, then contact details, one question at a time, and hands the lead off silently. |
| Workflow automation | Self-hosted n8n; workflows exported to `automation/n8n/` so they can be read without an account. |
| Voice AI | Vapi/Retell entry point wired to the same knowledge base and the same pipeline. Setup documented in `docs/runbooks/voice-agent.md`. |
| Testing, troubleshooting, documentation | Four runbooks with verification commands and symptom tables; two production incidents diagnosed and written up in the case studies. |
| API integration | Groq, Gemini, Supabase, Resend, Slack, n8n, and a .NET API behind a Vercel proxy. |

## Positioning paragraph

Twenty years building and running software, now focused on AI implementation. I do not just wire a chatbot to a page — I build the pipeline behind it: capture, storage, qualification, follow-up, booking, and the runbook for when a provider retires a model at midnight. Two providers have already broken under this system in production; both were absorbed without a rewrite, and both are written up publicly.

## Practicalities

- **Availability:** [hours per week, start date, e.g. "30 hrs/week, can start immediately"]
- **Time zone:** Asia/Manila (UTC+8), [state overlap you can commit to]
- **Desired compensation:** [rate and basis — hourly, monthly retainer, or per project]
- **Engagement preference:** [contract / part-time / full-time]
- **Location:** Pampanga, Philippines. Remote.

## Opening message

> Hi — everything you listed in the posting is running on my own domain, so you can verify it before we speak.
>
> The lead pipeline at dmbwebsolutions.com/ai-automation is live: submit the form and you will get an automated confirmation with a booking link within seconds, because it stores to Supabase, fires an n8n workflow, and sends through Resend. The chat assistant in the corner qualifies visitors and drops them into the same pipeline.
>
> Two written case studies cover the architecture and the two production incidents I had to diagnose — a dependency crash and a provider retiring the model I had pinned. A [X]-minute Loom shows the whole flow end to end: [Loom link].
>
> Availability [X], desired compensation [Y]. Happy to walk through any part of it live.

## Checklist before sending

- [ ] Loom recorded and the link works in an incognito window
- [ ] Form submission tested from a phone
- [ ] Supabase test rows deleted
- [ ] Booking link accepts a real slot
- [ ] Case study pages load without a login
- [ ] Compensation and availability filled in
