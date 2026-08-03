-- Shared NFL data for site-wide Pick'em odds and score refreshes.
-- League-specific Pick'em pools should reference these rows instead of pulling
-- odds separately for every league.

create table if not exists public.nfl_games (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'the-odds-api',
  provider_game_id text not null,
  season_year integer not null,
  week integer,
  commence_time timestamptz not null,
  away_team_name text not null,
  home_team_name text not null,
  away_abbr text not null,
  home_abbr text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'final', 'postponed', 'cancelled')),
  final_away_score integer,
  final_home_score integer,
  final_winner_side text check (final_winner_side in ('away', 'home')),
  last_score_refresh_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_game_id)
);

create table if not exists public.nfl_odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  nfl_game_id uuid not null references public.nfl_games(id) on delete cascade,
  provider text not null default 'the-odds-api',
  bookmaker_key text,
  bookmaker_title text,
  market_key text not null default 'spreads',
  snapshot_type text not null default 'tuesday' check (snapshot_type in ('tuesday', 'manual', 'publish')),
  snapshot_at timestamptz not null default now(),
  away_spread numeric(5,2),
  home_spread numeric(5,2),
  favorite_side text check (favorite_side in ('away', 'home')),
  spread numeric(5,2),
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nfl_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  nfl_game_id uuid not null references public.nfl_games(id) on delete cascade,
  provider text not null default 'the-odds-api',
  snapshot_at timestamptz not null default now(),
  away_score integer,
  home_score integer,
  completed boolean not null default false,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nfl_data_refreshes (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'the-odds-api',
  refresh_type text not null check (refresh_type in ('odds', 'scores')),
  season_year integer not null,
  week integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  request_cost integer,
  requests_used integer,
  requests_remaining integer,
  status text not null default 'ok' check (status in ('ok', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.pickem_games
  add column if not exists nfl_game_id uuid references public.nfl_games(id) on delete set null,
  add column if not exists odds_snapshot_id uuid references public.nfl_odds_snapshots(id) on delete set null;

create index if not exists nfl_games_season_week_idx on public.nfl_games(season_year, week);
create index if not exists nfl_games_commence_idx on public.nfl_games(commence_time);
create index if not exists nfl_odds_snapshots_game_idx on public.nfl_odds_snapshots(nfl_game_id, snapshot_at desc);
create index if not exists nfl_score_snapshots_game_idx on public.nfl_score_snapshots(nfl_game_id, snapshot_at desc);
create index if not exists nfl_data_refreshes_type_idx on public.nfl_data_refreshes(refresh_type, season_year, week);
create index if not exists pickem_games_shared_nfl_idx on public.pickem_games(nfl_game_id);

alter table public.nfl_games enable row level security;
alter table public.nfl_odds_snapshots enable row level security;
alter table public.nfl_score_snapshots enable row level security;
alter table public.nfl_data_refreshes enable row level security;

drop policy if exists "NFL games are readable by authenticated users" on public.nfl_games;
create policy "NFL games are readable by authenticated users" on public.nfl_games
  for select to authenticated
  using (true);

drop policy if exists "NFL odds snapshots are readable by authenticated users" on public.nfl_odds_snapshots;
create policy "NFL odds snapshots are readable by authenticated users" on public.nfl_odds_snapshots
  for select to authenticated
  using (true);

drop policy if exists "NFL score snapshots are readable by authenticated users" on public.nfl_score_snapshots;
create policy "NFL score snapshots are readable by authenticated users" on public.nfl_score_snapshots
  for select to authenticated
  using (true);

drop policy if exists "NFL refresh logs are readable by authenticated users" on public.nfl_data_refreshes;
create policy "NFL refresh logs are readable by authenticated users" on public.nfl_data_refreshes
  for select to authenticated
  using (true);
