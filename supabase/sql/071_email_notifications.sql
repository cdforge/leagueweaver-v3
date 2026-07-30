-- Email-only public schedule notification controls for v3.

alter table public.public_schedule_subscriptions
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid(),
  add column if not exists unsubscribed_at timestamptz null;

create unique index if not exists public_schedule_subscriptions_unsubscribe_idx
  on public.public_schedule_subscriptions (unsubscribe_token);

-- SMS is outside the v3 MVP. Remove legacy anonymous read/delete access.
drop policy if exists public_schedule_subscriptions_sms_public_select on public.public_schedule_subscriptions;
drop policy if exists public_schedule_subscriptions_sms_public_delete on public.public_schedule_subscriptions;
