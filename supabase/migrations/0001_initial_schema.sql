-- =====================================================================
-- Spiritual Reminder & Support — initial database schema
-- Target: Supabase (PostgreSQL)
-- Run via the Supabase SQL Editor or `supabase db push`.
-- Safe to re-run: guarded with IF NOT EXISTS / DROP ... IF EXISTS.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ---------- Enums ----------
do $$ begin
  create type faith_tradition as enum ('christianity', 'islam', 'judaism', 'hinduism', 'buddhism', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prayer_status as enum ('active', 'completed', 'answered', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_id as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_sender as enum ('user', 'ai');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('scheduled', 'sent', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sermon_status as enum ('recording', 'uploaded', 'transcribing', 'completed', 'failed');
exception when duplicate_object then null; end $$;

-- ---------- Generic updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =====================================================================
-- profiles  (1:1 with auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  faith        faith_tradition not null default 'general',
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =====================================================================
-- user_settings
-- =====================================================================
create table if not exists public.user_settings (
  user_id              uuid primary key references public.profiles (id) on delete cascade,
  notifications_enabled boolean not null default true,
  reminder_sound       boolean not null default true,
  daily_verse_enabled  boolean not null default true,
  theme                text not null default 'light',
  timezone             text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- =====================================================================
-- prayer_requests
-- =====================================================================
create table if not exists public.prayer_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  topic         text not null,
  faith         faith_tradition not null default 'general',
  status        prayer_status not null default 'active',
  reminder_time time,
  reminder_date date,
  recurring     boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists prayer_requests_user_status_idx on public.prayer_requests (user_id, status);
create index if not exists prayer_requests_reminder_idx on public.prayer_requests (user_id, reminder_date, reminder_time);

-- =====================================================================
-- prayer_logs  (history of actions on a prayer)
-- =====================================================================
create table if not exists public.prayer_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles (id) on delete cascade,
  prayer_id uuid not null references public.prayer_requests (id) on delete cascade,
  action    text not null,           -- prayed | completed | answered | archived | reactivated
  note      text,
  logged_at timestamptz not null default now()
);
create index if not exists prayer_logs_user_idx on public.prayer_logs (user_id, logged_at desc);
create index if not exists prayer_logs_prayer_idx on public.prayer_logs (prayer_id);

-- =====================================================================
-- saved_verses
-- =====================================================================
create table if not exists public.saved_verses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  reference  text not null,
  text       text not null,
  faith      faith_tradition,
  source     text,
  created_at timestamptz not null default now(),
  unique (user_id, reference)
);
create index if not exists saved_verses_user_idx on public.saved_verses (user_id, created_at desc);

-- =====================================================================
-- ai_usage  (per-day counter for the free-tier limit)
-- =====================================================================
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  usage_date    date not null default current_date,
  message_count integer not null default 0,
  tokens_used   integer not null default 0,
  updated_at    timestamptz not null default now(),
  unique (user_id, usage_date)
);

-- =====================================================================
-- ai_messages  (AI Guide chat history, cloud-synced)
-- =====================================================================
create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  sender     message_sender not null,
  content    text not null,
  faith      faith_tradition,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_user_idx on public.ai_messages (user_id, created_at);

-- =====================================================================
-- subscriptions
-- =====================================================================
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references public.profiles (id) on delete cascade,
  plan                     plan_id not null default 'free',
  status                   subscription_status not null default 'active',
  provider                 text,                 -- stripe | revenuecat | ...
  provider_customer_id     text,
  provider_subscription_id text,
  current_period_end       timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- =====================================================================
-- sermons  (Pro: recording + transcription)
-- =====================================================================
create table if not exists public.sermons (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  title            text,
  audio_url        text,
  duration_seconds integer,
  transcript       text,
  summary          text,
  notes            text,
  status           sermon_status not null default 'uploaded',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists sermons_user_idx on public.sermons (user_id, created_at desc);

-- =====================================================================
-- notifications  (scheduled reminders / push log)
-- =====================================================================
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  prayer_id     uuid references public.prayer_requests (id) on delete set null,
  title         text not null,
  body          text,
  scheduled_for timestamptz,
  status        notification_status not null default 'scheduled',
  push_token    text,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, scheduled_for);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_settings','prayer_requests','ai_usage','subscriptions','sermons'
  ] loop
    execute format('drop trigger if exists set_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger set_%1$s_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =====================================================================
-- New-user bootstrap: create profile + settings + free subscription
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
    on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id)
    on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active')
    on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RPC: atomically increment today's AI usage and return the new count
-- =====================================================================
create or replace function public.increment_ai_usage(p_tokens integer default 0)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  insert into public.ai_usage (user_id, usage_date, message_count, tokens_used)
    values (auth.uid(), current_date, 1, coalesce(p_tokens, 0))
  on conflict (user_id, usage_date) do update
    set message_count = public.ai_usage.message_count + 1,
        tokens_used   = public.ai_usage.tokens_used + coalesce(p_tokens, 0),
        updated_at    = now()
  returning message_count into v_count;
  return v_count;
end $$;

-- =====================================================================
-- Row Level Security — every row is owned by its user
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.user_settings   enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.prayer_logs     enable row level security;
alter table public.saved_verses    enable row level security;
alter table public.ai_usage        enable row level security;
alter table public.ai_messages     enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.sermons         enable row level security;
alter table public.notifications   enable row level security;

-- profiles keyed by id; everything else keyed by user_id.
do $$
declare
  rec record;
  col text;
begin
  for rec in
    select unnest(array[
      'profiles','user_settings','prayer_requests','prayer_logs','saved_verses',
      'ai_usage','ai_messages','subscriptions','sermons','notifications'
    ]) as tbl
  loop
    col := case when rec.tbl = 'profiles' then 'id' else 'user_id' end;

    execute format('drop policy if exists "%1$s_select_own" on public.%1$s;', rec.tbl);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s;', rec.tbl);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$s;', rec.tbl);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s;', rec.tbl);

    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = %2$s);', rec.tbl, col);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = %2$s);', rec.tbl, col);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = %2$s) with check (auth.uid() = %2$s);', rec.tbl, col);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = %2$s);', rec.tbl, col);
  end loop;
end $$;
