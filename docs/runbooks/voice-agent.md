# Runbook: voice agent

Owner: Deo Bernal · Last reviewed: 2026-09

## Design

The voice agent runs on a provider (Vapi or Retell), not inside this bundle. The site only exposes an entry point, so nothing breaks when a trial expires: with no configuration, `VoiceAgentButton` renders the chat assistant on its own and says the voice demo is available on request.

## Setting it up on a Vapi trial

1. Create an assistant in the Vapi dashboard.
2. Paste the system prompt below and the knowledge from `dmb.web/api/_chatKnowledge.js`, so voice and chat answer identically.
3. Pick a voice, keep responses short, and set the first message.
4. Publish the web demo, or attach a phone number if the trial includes one.
5. Set the public link on Vercel and redeploy:

```bash
vercel env add REACT_APP_VOICE_AGENT_URL production   # web demo link
# or
vercel env add REACT_APP_VOICE_AGENT_PHONE production # inbound number
```

Both values are public by design, which is why they carry the `REACT_APP_` prefix.

## System prompt

```
You are DMB Assistant on a voice call for DMB Web Solutions (dmbwebsolutions.com).
Deo Bernal builds AI chat assistants, lead capture funnels, CRM and database
integrations, automated follow-up, appointment booking, and workflow automation.

Rules:
- Speak in short sentences. One question at a time. Never read out a list of six things.
- Answer the caller's question first, then ask what they want automated, then when
  they need it, then their name and email.
- Spell the email address back to confirm it.
- Offer to send the booking link by email once you have the address.
- Never invent prices, timelines, or features. If you do not know, say so and offer
  to have Deo follow up.
- Do not ask for passwords, card numbers, or ID numbers.
```

## Sending the lead onward

Point the assistant's end-of-call webhook at the same n8n webhook the form uses, with a body shaped like the funnel payload and `source` set to `voice-agent`:

```json
{
  "name": "{{caller_name}}",
  "email": "{{caller_email}}",
  "need": "{{summary}}",
  "timeline": "{{timeline}}",
  "source": "voice-agent"
}
```

Everything downstream — Supabase, Slack, confirmation email, nurture sequence, pipeline view — is shared with the form and the chat assistant, so voice needs no new plumbing.

## Trial limits

Vapi's free minutes run out quickly. When they do, remove `REACT_APP_VOICE_AGENT_URL` and redeploy: the page falls back to the chat assistant with no dead buttons and no error.
