-- League Weaver v3 launch foundation. Additive only: preserve all existing data.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create index if not exists schedules_current_revision_idx
  on public.schedules (current_revision_id);
create index if not exists published_schedules_revision_idx
  on public.published_schedules (revision_id);
create index if not exists billing_checkout_sessions_schedule_idx
  on public.billing_checkout_sessions (schedule_id);

-- Public buckets serve direct object URLs without a broad SELECT policy. Removing
-- this policy prevents anonymous bucket enumeration while preserving image URLs.
drop policy if exists league_logos_public_read on storage.objects;

create table if not exists public.external_league_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  provider text not null check (provider in ('sleeper', 'espn')),
  provider_league_id text not null,
  sync_enabled boolean not null default false,
  sync_status text not null default 'idle' check (sync_status in ('idle', 'syncing', 'ready', 'warning', 'failed')),
  last_sync_at timestamptz null,
  sanitized_error text null check (char_length(sanitized_error) <= 500),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_league_id)
);

create index if not exists external_league_links_schedule_idx
  on public.external_league_links (schedule_id);
create index if not exists external_league_links_sync_idx
  on public.external_league_links (user_id, sync_enabled, last_sync_at);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  schedule_id uuid null references public.schedules (id) on delete set null,
  provider text not null check (provider in ('sleeper', 'espn', 'csv', 'paste', 'screenshot')),
  provider_league_id text null,
  status text not null check (status in ('previewed', 'confirmed', 'failed')),
  warning_count integer not null default 0 check (warning_count >= 0),
  sanitized_error text null check (char_length(sanitized_error) <= 500),
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  committed_at timestamptz null
);

create index if not exists import_runs_user_created_idx
  on public.import_runs (user_id, created_at desc);
create index if not exists import_runs_schedule_idx
  on public.import_runs (schedule_id);

create table if not exists public.season_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  game_id text not null,
  week integer not null check (week between 1 and 18),
  home_score numeric(8, 2) null check (home_score >= 0),
  away_score numeric(8, 2) null check (away_score >= 0),
  is_final boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (schedule_id, game_id)
);

create index if not exists season_scores_schedule_week_idx
  on public.season_scores (schedule_id, week);

create table if not exists public.user_plan_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  free_editable_schedule_id uuid null references public.schedules (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists user_plan_preferences_schedule_idx
  on public.user_plan_preferences (free_editable_schedule_id);

drop trigger if exists set_updated_at_external_league_links on public.external_league_links;
create trigger set_updated_at_external_league_links before update on public.external_league_links
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_season_scores on public.season_scores;
create trigger set_updated_at_season_scores before update on public.season_scores
for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_user_plan_preferences on public.user_plan_preferences;
create trigger set_updated_at_user_plan_preferences before update on public.user_plan_preferences
for each row execute function public.set_updated_at();

alter table public.external_league_links enable row level security;
alter table public.import_runs enable row level security;
alter table public.season_scores enable row level security;
alter table public.user_plan_preferences enable row level security;

grant select, insert, update, delete on public.external_league_links to authenticated;
grant select, insert, update, delete on public.import_runs to authenticated;
grant select, insert, update, delete on public.season_scores to authenticated;
grant select, insert, update, delete on public.user_plan_preferences to authenticated;

create policy external_league_links_owner_all on public.external_league_links
for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy import_runs_owner_all on public.import_runs
for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy season_scores_owner_all on public.season_scores
for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy user_plan_preferences_owner_all on public.user_plan_preferences
for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Recreate existing policies with init-plan-safe auth calls.
drop policy if exists schedules_owner_all on public.schedules;
create policy schedules_owner_all on public.schedules for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists schedule_revisions_owner_all on public.schedule_revisions;
create policy schedule_revisions_owner_all on public.schedule_revisions for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists published_schedules_owner_select on public.published_schedules;
drop policy if exists published_schedules_public_read_active on public.published_schedules;
create policy published_schedules_authenticated_read on public.published_schedules for select to authenticated
using ((select auth.uid()) = user_id or is_active = true);
create policy published_schedules_public_read_active on public.published_schedules for select to anon
using (is_active = true);

drop policy if exists published_schedules_owner_insert on public.published_schedules;
create policy published_schedules_owner_insert on public.published_schedules for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists published_schedules_owner_update on public.published_schedules;
create policy published_schedules_owner_update on public.published_schedules for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists published_schedules_owner_delete on public.published_schedules;
create policy published_schedules_owner_delete on public.published_schedules for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists public_schedule_subscriptions_owner_select on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_owner_select on public.public_schedule_subscriptions for select to authenticated
using (exists (select 1 from public.published_schedules ps where ps.id = published_schedule_id and ps.user_id = (select auth.uid())));
drop policy if exists public_schedule_subscriptions_owner_delete on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_owner_delete on public.public_schedule_subscriptions for delete to authenticated
using (exists (select 1 from public.published_schedules ps where ps.id = published_schedule_id and ps.user_id = (select auth.uid())));

drop policy if exists billing_customers_select_own on public.billing_customers;
create policy billing_customers_select_own on public.billing_customers for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists billing_access_grants_select_own on public.billing_access_grants;
create policy billing_access_grants_select_own on public.billing_access_grants for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists billing_checkout_sessions_select_own on public.billing_checkout_sessions;
create policy billing_checkout_sessions_select_own on public.billing_checkout_sessions for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists saved_leagues_owner_all on public.saved_leagues;
create policy saved_leagues_owner_all on public.saved_leagues for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists league_logos_owner_insert on storage.objects;
create policy league_logos_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'league-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists league_logos_owner_update on storage.objects;
create policy league_logos_owner_update on storage.objects for update to authenticated
using (bucket_id = 'league-logos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'league-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists league_logos_owner_delete on storage.objects;
create policy league_logos_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'league-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.billing_access_grants drop constraint if exists billing_access_grants_feature_check;
alter table public.billing_access_grants add constraint billing_access_grants_feature_check
check (feature in ('public_sharing', 'scorekeeping', 'multiple_schedules', 'standings', 'playoffs', 'simulator', 'platform_sync', 'notifications', 'advanced_fairness', 'no_ads'));
