-- Downgrade retention (Pro → Free).
--
-- A schedule created or held under Pro is kept forever but becomes VIEW + DELETE
-- only ("locked") whenever its owner has no active account Pro plan. `requires_pro`
-- is set at creation to the owner's Pro state, and set true for ALL of a user's
-- schedules whenever their Pro becomes active (so a pre-Pro free schedule also
-- locks on the next downgrade). Free-tier editable schedules have requires_pro =
-- false; a free account is limited to one of them. "Locked" is derived
-- (requires_pro AND no active Pro), never stored — so re-subscribing unlocks
-- everything automatically.

alter table public.schedules
  add column if not exists requires_pro boolean not null default false;

comment on column public.schedules.requires_pro is
  'True once this schedule has been a Pro-tier schedule. When the owner has no active account Pro plan, requires_pro schedules are locked (view + delete only, no edit/regenerate). Set server-side only.';

-- Only trusted server code (service role) may lock/unlock. Prevent clients from
-- clearing the flag to bypass the lock. INSERT still sets the initial value via the
-- create API; the app's other updates (title, status, current_revision_id) never
-- touch this column, so revoking UPDATE on it does not affect them.
revoke update (requires_pro) on public.schedules from authenticated;
revoke update (requires_pro) on public.schedules from anon;
