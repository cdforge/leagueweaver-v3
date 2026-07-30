-- Stripe billing support tables.

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at_billing_customers on public.billing_customers;
create trigger set_updated_at_billing_customers
before update on public.billing_customers
for each row
execute function public.set_updated_at();

create table if not exists public.billing_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature in ('public_sharing', 'scorekeeping', 'multiple_schedules')),
  plan_key text not null check (plan_key in ('single_schedule_pro', 'annual_pro')),
  scope_type text not null check (scope_type in ('account', 'schedule')),
  schedule_id uuid null references public.schedules (id) on delete cascade,
  source_type text not null check (source_type in ('checkout_session', 'subscription')),
  source_id text not null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (
    (scope_type = 'account' and schedule_id is null)
    or
    (scope_type = 'schedule' and schedule_id is not null)
  )
);

create index if not exists billing_access_grants_user_idx
  on public.billing_access_grants (user_id, granted_at desc);

create index if not exists billing_access_grants_source_idx
  on public.billing_access_grants (source_type, source_id);

create index if not exists billing_access_grants_schedule_idx
  on public.billing_access_grants (schedule_id);

create table if not exists public.billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  stripe_payment_intent_id text null,
  plan_key text not null check (plan_key in ('single_schedule_pro', 'annual_pro')),
  scope_type text not null check (scope_type in ('account', 'schedule')),
  schedule_id uuid null references public.schedules (id) on delete set null,
  checkout_mode text not null check (checkout_mode in ('payment', 'subscription')),
  status text not null check (status in ('open', 'complete', 'expired', 'async_failed')),
  payment_status text null,
  amount_total integer null,
  currency text null,
  metadata_json jsonb not null default '{}'::jsonb,
  purchased_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope_type = 'account' and schedule_id is null)
    or
    (scope_type = 'schedule' and schedule_id is not null)
  )
);

create index if not exists billing_checkout_sessions_user_status_idx
  on public.billing_checkout_sessions (user_id, status, created_at desc);

create index if not exists billing_checkout_sessions_customer_idx
  on public.billing_checkout_sessions (stripe_customer_id);

drop trigger if exists set_updated_at_billing_checkout_sessions on public.billing_checkout_sessions;
create trigger set_updated_at_billing_checkout_sessions
before update on public.billing_checkout_sessions
for each row
execute function public.set_updated_at();

alter table public.billing_customers enable row level security;
alter table public.billing_access_grants enable row level security;
alter table public.billing_checkout_sessions enable row level security;

drop policy if exists billing_customers_select_own on public.billing_customers;
create policy billing_customers_select_own
on public.billing_customers
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists billing_access_grants_select_own on public.billing_access_grants;
create policy billing_access_grants_select_own
on public.billing_access_grants
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists billing_checkout_sessions_select_own on public.billing_checkout_sessions;
create policy billing_checkout_sessions_select_own
on public.billing_checkout_sessions
for select
to authenticated
using (auth.uid() = user_id);
