-- Replace the flat season/season_year columns (061) with a single flexible
-- time_frame JSONB, so a schedule can carry a year, a season, or a month — and
-- optionally an end point for a range (e.g. Summer 2026 → Winter 2026). Shape:
--   { "kind": "year" | "season" | "month",
--     "start": { "year": 2026, "season": "summer"|null, "month": 7|null },
--     "end":   null | { "year": 2026, "season": "winter"|null, "month": 9|null } }
-- Fantasy Football ignores this and shows its NFL season year from the input.
alter table public.schedules drop column if exists season;
alter table public.schedules drop column if exists season_year;
alter table public.schedules add column if not exists time_frame jsonb;
