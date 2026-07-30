-- Harden public schedule subscription policies to avoid exposing SMS subscriber records.

drop policy if exists public_schedule_subscriptions_sms_public_select on public.public_schedule_subscriptions;
drop policy if exists public_schedule_subscriptions_sms_public_delete on public.public_schedule_subscriptions;
