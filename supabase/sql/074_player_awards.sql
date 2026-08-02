-- Player data + awards foundation. Additive only.

create table if not exists public.player_catalog (
  id text primary key,
  canonical_name text not null,
  normalized_name text not null,
  position text not null,
  nfl_team text null,
  gsis_id text null,
  sleeper_id text null,
  espn_id text null,
  pfr_id text null,
  yahoo_id text null,
  status text not null default 'unknown' check (status in ('active', 'inactive', 'unknown')),
  updated_at timestamptz not null default now()
);

create unique index if not exists player_catalog_gsis_uidx
  on public.player_catalog (gsis_id) where gsis_id is not null;
create unique index if not exists player_catalog_sleeper_uidx
  on public.player_catalog (sleeper_id) where sleeper_id is not null;
create unique index if not exists player_catalog_espn_uidx
  on public.player_catalog (espn_id) where espn_id is not null;
create index if not exists player_catalog_normalized_name_idx
  on public.player_catalog (normalized_name);

drop trigger if exists set_updated_at_player_catalog on public.player_catalog;
create trigger set_updated_at_player_catalog before update on public.player_catalog
for each row execute function public.set_updated_at();

create table if not exists public.season_player_stats (
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  provider text not null check (provider in ('espn', 'sleeper')),
  provider_league_id text not null,
  season integer not null check (season between 2017 and 2200),
  week integer not null check (week between 1 and 18),
  league_team_id text not null,
  provider_roster_id text not null,
  provider_player_id text not null,
  canonical_player_id text not null references public.player_catalog (id) on delete restrict,
  fantasy_points numeric(8, 2) not null,
  projected_points numeric(8, 2) null,
  lineup_status text not null check (lineup_status in ('starter', 'bench', 'ir', 'taxi', 'reserve', 'unknown')),
  starter_index integer null check (starter_index is null or starter_index >= 0),
  inferred_slot text not null check (inferred_slot in (
    'QB', 'TQB', 'RB', 'RB_WR_FLEX', 'WR', 'WR_TE_FLEX', 'TE', 'SUPERFLEX',
    'DT', 'DE', 'DL', 'LB', 'CB', 'S', 'DB', 'DP', 'DST', 'K', 'P', 'HC',
    'FLEX', 'IDP', 'IDP_FLEX', 'BENCH', 'IR', 'TAXI', 'RESERVE', 'UNKNOWN'
  )),
  raw_slot text null,
  slot_confidence text not null check (slot_confidence in ('confirmed', 'inferred', 'ambiguous', 'bench')),
  is_provisional boolean not null default true,
  final_lock_at timestamptz null,
  synced_at timestamptz not null default now(),
  source_payload_hash text not null,
  primary key (schedule_id, season, week, league_team_id, provider_player_id),
  constraint season_player_stats_final_lock_check check (is_provisional = true or final_lock_at is not null),
  constraint season_player_stats_week_owner_uidx unique (schedule_id, season, week, canonical_player_id)
);

create index if not exists season_player_stats_schedule_week_idx
  on public.season_player_stats (schedule_id, season, week);
create index if not exists season_player_stats_team_week_idx
  on public.season_player_stats (schedule_id, league_team_id, season, week);
create index if not exists season_player_stats_player_idx
  on public.season_player_stats (canonical_player_id, season, week);

create table if not exists public.platform_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('espn', 'sleeper')),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  week integer null check (week is null or week between 1 and 18),
  status text not null check (status in ('running', 'ready', 'warning', 'failed')),
  rows_written integer not null default 0 check (rows_written >= 0),
  warnings jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create index if not exists platform_sync_runs_schedule_started_idx
  on public.platform_sync_runs (schedule_id, started_at desc);

create table if not exists public.league_seasons (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  provider text not null check (provider in ('espn', 'sleeper')),
  provider_league_id text not null,
  previous_provider_league_id text null,
  season integer not null check (season between 2017 and 2200),
  league_name text not null,
  scoring_type text null,
  roster_positions jsonb not null default '[]'::jsonb,
  playoff_settings jsonb not null default '{}'::jsonb,
  regular_season_week_count integer null check (regular_season_week_count is null or regular_season_week_count between 1 and 18),
  team_count integer not null check (team_count between 2 and 64),
  synced_at timestamptz not null default now(),
  unique (schedule_id, provider, provider_league_id, season)
);

create index if not exists league_seasons_schedule_season_idx
  on public.league_seasons (schedule_id, season desc);

create table if not exists public.league_team_history (
  league_season_id uuid not null references public.league_seasons (id) on delete cascade,
  league_team_id text not null,
  provider_roster_or_team_id text not null,
  team_name text not null,
  manager_name text null,
  division_id text null,
  conference_id text null,
  final_standing integer null check (final_standing is null or final_standing > 0),
  wins integer null check (wins is null or wins >= 0),
  losses integer null check (losses is null or losses >= 0),
  ties integer null check (ties is null or ties >= 0),
  points_for numeric(10, 2) null check (points_for is null or points_for >= 0),
  points_against numeric(10, 2) null check (points_against is null or points_against >= 0),
  primary key (league_season_id, league_team_id)
);

create index if not exists league_team_history_provider_idx
  on public.league_team_history (league_season_id, provider_roster_or_team_id);

create table if not exists public.league_schedule_history (
  league_season_id uuid not null references public.league_seasons (id) on delete cascade,
  week integer not null check (week between 1 and 18),
  provider_matchup_id text not null,
  home_league_team_id text not null,
  away_league_team_id text not null,
  home_score numeric(8, 2) null check (home_score is null or home_score >= 0),
  away_score numeric(8, 2) null check (away_score is null or away_score >= 0),
  status text not null check (status in ('scheduled', 'live', 'final', 'provisional', 'unknown')),
  final_lock_at timestamptz null,
  primary key (league_season_id, week, provider_matchup_id)
);

create index if not exists league_schedule_history_team_week_idx
  on public.league_schedule_history (league_season_id, week, home_league_team_id, away_league_team_id);

create table if not exists public.player_ownership_history (
  league_season_id uuid not null references public.league_seasons (id) on delete cascade,
  week integer not null check (week between 1 and 18),
  canonical_player_id text not null references public.player_catalog (id) on delete restrict,
  league_team_id text not null,
  provider_player_id text not null,
  nfl_team_at_time text null,
  position_at_time text not null,
  roster_status text not null check (roster_status in ('starter', 'bench', 'ir', 'taxi', 'reserve', 'unknown')),
  lineup_slot text not null,
  fantasy_points numeric(8, 2) not null,
  primary key (league_season_id, week, canonical_player_id)
);

create index if not exists player_ownership_history_team_week_idx
  on public.player_ownership_history (league_season_id, league_team_id, week);
create index if not exists player_ownership_history_player_idx
  on public.player_ownership_history (canonical_player_id, week);

alter table public.player_catalog enable row level security;
alter table public.season_player_stats enable row level security;
alter table public.platform_sync_runs enable row level security;
alter table public.league_seasons enable row level security;
alter table public.league_team_history enable row level security;
alter table public.league_schedule_history enable row level security;
alter table public.player_ownership_history enable row level security;

grant select on public.player_catalog to authenticated;
grant select, insert, update, delete on public.season_player_stats to authenticated;
grant select, insert, update, delete on public.platform_sync_runs to authenticated;
grant select, insert, update, delete on public.league_seasons to authenticated;
grant select, insert, update, delete on public.league_team_history to authenticated;
grant select, insert, update, delete on public.league_schedule_history to authenticated;
grant select, insert, update, delete on public.player_ownership_history to authenticated;

drop policy if exists player_catalog_authenticated_read on public.player_catalog;
create policy player_catalog_authenticated_read on public.player_catalog for select to authenticated
using (true);

drop policy if exists season_player_stats_schedule_owner_all on public.season_player_stats;
create policy season_player_stats_schedule_owner_all on public.season_player_stats for all to authenticated
using (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid())));

drop policy if exists platform_sync_runs_schedule_owner_all on public.platform_sync_runs;
create policy platform_sync_runs_schedule_owner_all on public.platform_sync_runs for all to authenticated
using (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid())));

drop policy if exists league_seasons_schedule_owner_all on public.league_seasons;
create policy league_seasons_schedule_owner_all on public.league_seasons for all to authenticated
using (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = (select auth.uid())));

drop policy if exists league_team_history_schedule_owner_all on public.league_team_history;
create policy league_team_history_schedule_owner_all on public.league_team_history for all to authenticated
using (exists (
  select 1 from public.league_seasons ls
  join public.schedules s on s.id = ls.schedule_id
  where ls.id = league_season_id and s.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.league_seasons ls
  join public.schedules s on s.id = ls.schedule_id
  where ls.id = league_season_id and s.user_id = (select auth.uid())
));

drop policy if exists league_schedule_history_schedule_owner_all on public.league_schedule_history;
create policy league_schedule_history_schedule_owner_all on public.league_schedule_history for all to authenticated
using (exists (
  select 1 from public.league_seasons ls
  join public.schedules s on s.id = ls.schedule_id
  where ls.id = league_season_id and s.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.league_seasons ls
  join public.schedules s on s.id = ls.schedule_id
  where ls.id = league_season_id and s.user_id = (select auth.uid())
));

drop policy if exists player_ownership_history_schedule_owner_all on public.player_ownership_history;
create policy player_ownership_history_schedule_owner_all on public.player_ownership_history for all to authenticated
using (exists (
  select 1 from public.league_seasons ls
  join public.schedules s on s.id = ls.schedule_id
  where ls.id = league_season_id and s.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.league_seasons ls
  join public.schedules s on s.id = ls.schedule_id
  where ls.id = league_season_id and s.user_id = (select auth.uid())
));
