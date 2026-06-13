-- =====================================================================
-- Payments — Paystack transactions + auto-activate Pro on success
-- Run after 0001_initial_schema.sql.
-- =====================================================================

-- ---------- profiles.email (needed to map a Paystack customer -> user) ----------
alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Recreate the signup bootstrap so it also stores the email.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    )
    on conflict (id) do update set email = excluded.email;

  insert into public.user_settings (user_id) values (new.id)
    on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active')
    on conflict (user_id) do nothing;

  return new;
end $$;

-- Backfill emails for any users created before this migration.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ---------- payment_status enum ----------
do $$ begin
  create type payment_status as enum ('pending', 'success', 'failed', 'abandoned', 'reversed');
exception when duplicate_object then null; end $$;

-- ---------- payments ----------
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  email      text,
  provider   text not null default 'paystack',
  reference  text not null unique,        -- Paystack transaction reference
  plan_code  text,
  amount     integer not null,            -- minor units (cents / kobo)
  currency   text not null default 'ZAR',
  status     payment_status not null default 'pending',
  paid_at    timestamptz,
  raw        jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- RLS: a user can read their own payments. Inserts/updates happen server-side
-- with the service role key (which bypasses RLS), so no write policy is needed.
alter table public.payments enable row level security;
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

-- =====================================================================
-- apply_successful_payment: record the payment and upgrade the matching
-- user to Pro. Called from the trusted webhook (service role) only.
-- =====================================================================
create or replace function public.apply_successful_payment(
  p_email     text,
  p_reference text,
  p_amount    integer,
  p_currency  text,
  p_plan_code text,
  p_paid_at   timestamptz,
  p_raw       jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  select id into v_user from public.profiles where lower(email) = lower(p_email) limit 1;

  insert into public.payments (user_id, email, provider, reference, plan_code, amount, currency, status, paid_at, raw)
    values (v_user, p_email, 'paystack', p_reference, p_plan_code, coalesce(p_amount, 0),
            coalesce(p_currency, 'ZAR'), 'success', coalesce(p_paid_at, now()), p_raw)
  on conflict (reference) do update
    set status     = 'success',
        paid_at    = excluded.paid_at,
        raw        = excluded.raw,
        user_id    = coalesce(public.payments.user_id, excluded.user_id),
        updated_at = now();

  if v_user is not null then
    insert into public.subscriptions (user_id, plan, status, provider, provider_subscription_id, current_period_end)
      values (v_user, 'pro', 'active', 'paystack', p_plan_code, now() + interval '31 days')
    on conflict (user_id) do update
      set plan                     = 'pro',
          status                   = 'active',
          provider                 = 'paystack',
          provider_subscription_id = coalesce(excluded.provider_subscription_id, public.subscriptions.provider_subscription_id),
          current_period_end       = now() + interval '31 days',
          updated_at               = now();
  end if;
end $$;

-- Lock the function down: only the service role may execute it (the webhook).
revoke execute on function public.apply_successful_payment(text, text, integer, text, text, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.apply_successful_payment(text, text, integer, text, text, timestamptz, jsonb) to service_role;
