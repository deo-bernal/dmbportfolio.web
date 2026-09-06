-- Schema for the DMB lead pipeline (api/leads.js and the n8n workflows).
-- Run once in the Supabase SQL editor.

create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text        not null,
  email       text        not null,
  company     text,
  need        text,
  timeline    text,
  budget      text,
  message     text,
  source      text        not null default 'funnel-form',
  status      text        not null default 'new'
    check (status in ('new', 'qualified', 'booked', 'won', 'lost'))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_status_idx on public.leads (status);

-- Row level security stays on with no permissive policies: every read and write
-- goes through the service role key, which lives only in Vercel and n8n
-- environment variables. The anon key cannot touch this table.
alter table public.leads enable row level security;

revoke all on public.leads from anon, authenticated;

-- n8n on Render's free plan has no disk, so it stores workflows in this schema.
create schema if not exists n8n;
