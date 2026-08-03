-- Preserve imported team logos/avatars on Pick'em participants.

alter table public.pickem_participants
  add column if not exists logo_url text;
