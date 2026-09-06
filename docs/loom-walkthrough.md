# Loom walkthrough script (3–5 minutes)

Goal: prove the pipeline is real, in one take, without narrating code.

## Before recording

- Open tabs in this order: `/ai-automation`, Supabase table editor on `leads`, n8n executions list, a webmail inbox you can show, `/accent-sidebar/leads`.
- Sign in to the site as the owner account so the leads dashboard is ready.
- Clear old test rows: `delete from public.leads where email like '%@example.com';`
- Use a real inbox you control for the demo email, and hide anything private.

## Script

**0:00–0:25 — Who and what**

"I'm Deo Bernal. I build AI systems that capture, qualify, and book leads. Everything I'm about to show is running on my own domain right now — the chatbot, the pipeline, the follow-up. Nothing here is a mockup."

**0:25–1:00 — The funnel**

Scroll `/ai-automation`. "Six things I build, two case studies you can read, and below that the pipeline itself. Watch what happens when I submit this form."

Fill it in: name, real email, "AI chat assistant", "This month", one line about the workflow. Submit. Show the confirmation state.

**1:00–1:35 — Storage**

Switch to Supabase. Refresh. Point at the new row. "Straight into Postgres through the REST API. The service key is server-side only — it isn't in the browser bundle, and I have a build check that fails if it ever is."

**1:35–2:10 — Automation**

Switch to n8n. Open the latest execution. "Same submission fires this workflow: verify the shared token, notify Slack, then a two-step nurture sequence. Each step re-reads the lead's stage first, so nobody who's already booked gets chased."

**2:10–2:35 — Follow-up**

Switch to the inbox. Show the confirmation email that arrived within seconds. "Sent through Resend from the function itself, so the visitor gets a reply even if the automation host is asleep. The booking link is in every message."

**2:35–3:05 — Booking**

Back to the site, scroll to the calendar. Pick a slot and confirm. "That's capture to booked call with nobody touching a keyboard."

**3:05–3:50 — The chatbot as qualifier**

Open the assistant. Type: "I run a dental clinic and I want a chatbot that books appointments." Let it answer and ask its qualifying question. Give a name and email. "It answers first, qualifies one question at a time, and when it has a name and email it drops the lead into the same pipeline — invisibly, in the same reply."

Refresh the leads dashboard. Show the chat lead in **New**. Move it to **Qualified**.

**3:50–4:20 — Failure handling**

"Two things broke in production while building this: a missing dependency crashed the chat endpoint, and Groq retired the model I'd pinned. Both are written up in the case study — architecture, diagnosis, and the fix. The fix wasn't a new model name, it was a fallback chain across two providers and six models."

**4:20–4:40 — Close**

"Case studies at /case-studies, the honest tool list at /stack, runbooks and exported workflows in the repo. Everything you've seen was built on free tiers. Happy to walk through any part of it."

## After recording

- Delete the demo lead and cancel the demo booking.
- Put the Loom link in `docs/application-packet.md`, on `/ai-automation`, and at the top of the application.
