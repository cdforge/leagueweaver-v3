-- Per-schedule season/year label, shown on the My Schedules card (and reusable
-- elsewhere). For Fantasy Football the year is sourced from the schedule input's
-- season year; for other formats the user can also pick a season so two runs of
-- the same league (e.g. "Summer 2026" vs "Winter 2026") are distinguishable.
alter table public.schedules
  add column if not exists season text
    check (season is null or season in ('fall', 'spring', 'winter', 'summer')),
  add column if not exists season_year integer
    check (season_year is null or (season_year between 1900 and 2200));
