-- Saved leagues: a reusable league identity (name/description/logo, divisions,
-- teams) a signed-in user can store and later prepopulate the setup wizard from.
-- Only league identity is stored here; rules/format stay per-schedule.

create table if not exists public.saved_leagues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_leagues_user_updated_idx
  on public.saved_leagues (user_id, updated_at desc);

drop trigger if exists set_updated_at_saved_leagues on public.saved_leagues;
create trigger set_updated_at_saved_leagues
before update on public.saved_leagues
for each row
execute function public.set_updated_at();

alter table public.saved_leagues enable row level security;

drop policy if exists saved_leagues_owner_all on public.saved_leagues;
create policy saved_leagues_owner_all
on public.saved_leagues
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
