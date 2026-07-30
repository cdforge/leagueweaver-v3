-- Add monthly Pro as a supported billing plan key.

alter table public.billing_access_grants
  drop constraint if exists billing_access_grants_plan_key_check;

alter table public.billing_access_grants
  add constraint billing_access_grants_plan_key_check
  check (plan_key in ('monthly_pro', 'single_schedule_pro', 'annual_pro'));

alter table public.billing_checkout_sessions
  drop constraint if exists billing_checkout_sessions_plan_key_check;

alter table public.billing_checkout_sessions
  add constraint billing_checkout_sessions_plan_key_check
  check (plan_key in ('monthly_pro', 'single_schedule_pro', 'annual_pro'));
