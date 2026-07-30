-- Platform sync credentials and normalized snapshots. Additive only.

create table if not exists public.platform_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  external_league_link_id uuid not null references public.external_league_links (id) on delete cascade,
  provider text not null check (provider in ('espn')),
  credential_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_league_link_id)
);

create table if not exists public.platform_sync_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  external_league_link_id uuid null references public.external_league_links (id) on delete set null,
  provider text not null check (provider in ('espn', 'sleeper')),
  snapshot_type text not null check (snapshot_type in ('history', 'draft', 'rosters', 'players', 'boxscores', 'standings')),
  season_year integer not null check (season_year between 2017 and 2200),
  week integer null check (week is null or week between 1 and 18),
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists platform_provider_credentials_user_idx
  on public.platform_provider_credentials (user_id);

create index if not exists platform_sync_snapshots_schedule_type_idx
  on public.platform_sync_snapshots (schedule_id, snapshot_type, season_year, week);

drop trigger if exists set_updated_at_platform_provider_credentials on public.platform_provider_credentials;
create trigger set_updated_at_platform_provider_credentials before update on public.platform_provider_credentials
for each row execute function public.set_updated_at();

alter table public.platform_provider_credentials enable row level security;
alter table public.platform_sync_snapshots enable row level security;

grant select, insert, update, delete on public.platform_provider_credentials to authenticated;
grant select, insert, update, delete on public.platform_sync_snapshots to authenticated;

drop policy if exists platform_provider_credentials_owner_all on public.platform_provider_credentials;
create policy platform_provider_credentials_owner_all on public.platform_provider_credentials
for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists platform_sync_snapshots_owner_all on public.platform_sync_snapshots;
create policy platform_sync_snapshots_owner_all on public.platform_sync_snapshots
for all to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
