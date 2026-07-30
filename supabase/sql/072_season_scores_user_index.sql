-- Cover the season_scores owner foreign key used by account and RLS queries.

create index if not exists season_scores_user_idx
  on public.season_scores (user_id);
