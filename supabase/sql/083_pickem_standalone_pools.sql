-- Standalone LW Pick'ems.
-- Allows pools without a saved schedule, multiple pools per source/year, and
-- manual participants that are not linked to a league team.

alter table public.pickem_pools
  drop constraint if exists pickem_pools_schedule_id_key,
  drop constraint if exists pickem_pools_schedule_id_fkey;

alter table public.pickem_pools
  alter column schedule_id drop not null,
  add column if not exists source_type text not null default 'blank',
  add column if not exists source_id text,
  add column if not exists saved_league_id uuid references public.saved_leagues(id) on delete set null,
  add column if not exists fantasy_connection_id uuid references public.external_league_links(id) on delete set null,
  add column if not exists access_mode text not null default 'private',
  add column if not exists brand_color text,
  add column if not exists logo_url text,
  add column if not exists cover_image_url text;

alter table public.pickem_pools
  add constraint pickem_pools_schedule_id_fkey
  foreign key (schedule_id) references public.schedules(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pickem_pools_source_type_check'
  ) then
    alter table public.pickem_pools
      add constraint pickem_pools_source_type_check
      check (source_type in ('blank', 'saved-league', 'fantasy-season'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pickem_pools_access_mode_check'
  ) then
    alter table public.pickem_pools
      add constraint pickem_pools_access_mode_check
      check (access_mode in ('private', 'public'));
  end if;
end $$;

update public.pickem_pools
set
  source_type = case when schedule_id is null then 'blank' else 'saved-league' end,
  source_id = coalesce(source_id, schedule_id::text)
where source_id is null;

alter table public.pickem_participants
  alter column team_id drop not null,
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_team_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pickem_participants_source_type_check'
  ) then
    alter table public.pickem_participants
      add constraint pickem_participants_source_type_check
      check (source_type in ('manual', 'saved-league-team', 'fantasy-team'));
  end if;
end $$;

update public.pickem_participants
set
  source_type = case when team_id is null then 'manual' else 'saved-league-team' end,
  source_team_id = coalesce(source_team_id, team_id)
where source_team_id is null;

create index if not exists pickem_pools_schedule_idx on public.pickem_pools(schedule_id) where schedule_id is not null;
create index if not exists pickem_pools_source_idx on public.pickem_pools(user_id, source_type, source_id, season_year);
create index if not exists pickem_pools_saved_league_idx on public.pickem_pools(saved_league_id, season_year) where saved_league_id is not null;
create index if not exists pickem_pools_fantasy_connection_idx on public.pickem_pools(fantasy_connection_id, season_year) where fantasy_connection_id is not null;
