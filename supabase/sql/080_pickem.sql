-- LeagueWeaver Pick'em foundation.
-- Apply in Supabase SQL editor before enabling cloud Pick'em pools.

create extension if not exists pgcrypto;

create table if not exists public.pickem_pools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  source_type text not null default 'blank' check (source_type in ('blank', 'saved-league', 'fantasy-season')),
  source_id text,
  saved_league_id uuid references public.saved_leagues(id) on delete set null,
  fantasy_connection_id uuid references public.external_league_links(id) on delete set null,
  access_mode text not null default 'private' check (access_mode in ('private', 'public')),
  brand_color text,
  logo_url text,
  cover_image_url text,
  name text not null,
  season_year integer not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  public_slug text not null unique,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pickem_participants (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pickem_pools(id) on delete cascade,
  team_id text,
  source_type text not null default 'manual' check (source_type in ('manual', 'saved-league-team', 'fantasy-team')),
  source_team_id text,
  display_name text not null,
  manager_name text,
  color text,
  logo_url text,
  claim_token text not null default encode(gen_random_bytes(16), 'hex'),
  claimed_at timestamptz,
  claimed_by_name text,
  claimed_by_email text,
  email text,
  phone text,
  email_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(pool_id, team_id),
  unique(pool_id, claim_token)
);

create table if not exists public.pickem_weeks (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pickem_pools(id) on delete cascade,
  week integer not null check (week between 1 and 22),
  status text not null default 'draft' check (status in ('draft', 'open', 'locked', 'final')),
  opens_at timestamptz,
  first_kickoff_at timestamptz,
  snapshot_at timestamptz,
  source text,
  created_at timestamptz not null default now(),
  unique(pool_id, week)
);

create table if not exists public.pickem_games (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  provider_game_id text,
  kickoff_at timestamptz not null,
  away_abbr text not null,
  home_abbr text not null,
  favorite_side text check (favorite_side in ('away', 'home')),
  spread numeric(5,2),
  final_winner_side text check (final_winner_side in ('away', 'home')),
  final_away_score integer,
  final_home_score integer,
  status text not null default 'open' check (status in ('open', 'locked', 'final')),
  override_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(week_id, provider_game_id)
);

create table if not exists public.pickem_picks (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pickem_pools(id) on delete cascade,
  participant_id uuid not null references public.pickem_participants(id) on delete cascade,
  game_id uuid not null references public.pickem_games(id) on delete cascade,
  choice_side text not null check (choice_side in ('away', 'home', 'missed')),
  score numeric(5,2) not null default 0,
  submitted_at timestamptz not null default now(),
  locked_at timestamptz,
  unique(participant_id, game_id)
);

create table if not exists public.pickem_reminders (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pickem_pools(id) on delete cascade,
  week integer not null check (week between 1 and 22),
  reminder_type text not null,
  channel text not null check (channel in ('email', 'sms')),
  sent_count integer not null default 0,
  status text not null default 'queued',
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique(pool_id, week, reminder_type, channel, idempotency_key)
);

create table if not exists public.pickem_playoff_draft (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pickem_pools(id) on delete cascade,
  participant_id uuid references public.pickem_participants(id) on delete set null,
  seed integer not null,
  pick_number integer not null check (pick_number between 1 and 14),
  round_number integer not null,
  nfl_team_abbr text,
  is_super_bowl_winner boolean not null default false,
  created_at timestamptz not null default now(),
  unique(pool_id, pick_number)
);

create index if not exists pickem_participants_pool_idx on public.pickem_participants(pool_id);
create index if not exists pickem_pools_schedule_idx on public.pickem_pools(schedule_id) where schedule_id is not null;
create index if not exists pickem_pools_source_idx on public.pickem_pools(user_id, source_type, source_id, season_year);
create index if not exists pickem_pools_saved_league_idx on public.pickem_pools(saved_league_id, season_year) where saved_league_id is not null;
create index if not exists pickem_pools_fantasy_connection_idx on public.pickem_pools(fantasy_connection_id, season_year) where fantasy_connection_id is not null;
create index if not exists pickem_weeks_pool_idx on public.pickem_weeks(pool_id);
create index if not exists pickem_games_week_idx on public.pickem_games(week_id);
create index if not exists pickem_picks_pool_idx on public.pickem_picks(pool_id);

alter table public.pickem_pools enable row level security;
alter table public.pickem_participants enable row level security;
alter table public.pickem_weeks enable row level security;
alter table public.pickem_games enable row level security;
alter table public.pickem_picks enable row level security;
alter table public.pickem_reminders enable row level security;
alter table public.pickem_playoff_draft enable row level security;

drop policy if exists "Pickem pool owners manage pools" on public.pickem_pools;
create policy "Pickem pool owners manage pools" on public.pickem_pools
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Pickem participants follow owned pools" on public.pickem_participants;
create policy "Pickem participants follow owned pools" on public.pickem_participants
  for all to authenticated
  using (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())))
  with check (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())));

drop policy if exists "Pickem weeks follow owned pools" on public.pickem_weeks;
create policy "Pickem weeks follow owned pools" on public.pickem_weeks
  for all to authenticated
  using (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())))
  with check (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())));

drop policy if exists "Pickem reminders follow owned pools" on public.pickem_reminders;
create policy "Pickem reminders follow owned pools" on public.pickem_reminders
  for all to authenticated
  using (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())))
  with check (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())));

drop policy if exists "Pickem games follow owned weeks" on public.pickem_games;
create policy "Pickem games follow owned weeks" on public.pickem_games
  for all to authenticated
  using (week_id in (select w.id from public.pickem_weeks w join public.pickem_pools p on p.id = w.pool_id where p.user_id = (select auth.uid())))
  with check (week_id in (select w.id from public.pickem_weeks w join public.pickem_pools p on p.id = w.pool_id where p.user_id = (select auth.uid())));

drop policy if exists "Pickem picks follow owned pools" on public.pickem_picks;
create policy "Pickem picks follow owned pools" on public.pickem_picks
  for all to authenticated
  using (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())))
  with check (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())));

drop policy if exists "Pickem playoff draft follows owned pools" on public.pickem_playoff_draft;
create policy "Pickem playoff draft follows owned pools" on public.pickem_playoff_draft
  for all to authenticated
  using (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())))
  with check (pool_id in (select id from public.pickem_pools where user_id = (select auth.uid())));
