-- Signed-in site chatbot history (api/chat.js).
-- Run once in the Supabase SQL editor, same project as public.leads.

create table if not exists public.chat_conversations (
  id           bigint generated always as identity primary key,
  user_id      integer     not null unique,
  user_email   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id                bigint generated always as identity primary key,
  conversation_id   bigint      not null references public.chat_conversations(id) on delete cascade,
  role              text        not null check (role in ('user', 'assistant')),
  content           text        not null,
  created_at        timestamptz not null default now()
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

revoke all on public.chat_conversations from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;

grant all on table public.chat_conversations to service_role;
grant all on table public.chat_messages to service_role;

do $$
declare
  seq text;
begin
  foreach seq in array array[
    pg_get_serial_sequence('public.chat_conversations', 'id'),
    pg_get_serial_sequence('public.chat_messages', 'id')
  ]
  loop
    if seq is not null then
      execute format('grant usage, select on sequence %s to service_role', seq);
    end if;
  end loop;
end $$;
