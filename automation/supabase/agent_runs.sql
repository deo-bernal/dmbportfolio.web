-- Signed-in Profile Builder Agent runs (api/agent.js).
-- Run once in the Supabase SQL editor, same project as public.leads and chat_history.

create table if not exists public.agent_runs (
  id           bigint generated always as identity primary key,
  user_id      integer     not null,
  user_email   text,
  goal         text,
  status       text        not null default 'running'
               check (status in ('running', 'awaiting_confirmation', 'completed', 'failed', 'denied')),
  public_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists agent_runs_user_updated_idx
  on public.agent_runs (user_id, updated_at desc);

create table if not exists public.agent_steps (
  id           bigint generated always as identity primary key,
  run_id       bigint      not null references public.agent_runs(id) on delete cascade,
  tool         text        not null,
  status       text        not null default 'ok'
               check (status in ('ok', 'pending', 'denied', 'error')),
  arguments    jsonb,
  result       jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists agent_steps_run_created_idx
  on public.agent_steps (run_id, created_at);

alter table public.agent_runs enable row level security;
alter table public.agent_steps enable row level security;

revoke all on public.agent_runs from anon, authenticated;
revoke all on public.agent_steps from anon, authenticated;

grant all on table public.agent_runs to service_role;
grant all on table public.agent_steps to service_role;

do $$
declare
  seq text;
begin
  foreach seq in array array[
    pg_get_serial_sequence('public.agent_runs', 'id'),
    pg_get_serial_sequence('public.agent_steps', 'id')
  ]
  loop
    if seq is not null then
      execute format('grant usage, select on sequence %s to service_role', seq);
    end if;
  end loop;
end $$;
