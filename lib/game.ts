import type { ScheduledGame } from "./types";

/**
 * Whether a game counts as played for any *derived* content — records,
 * standings, clinches, medals, leaders, the live "Final" pill, rank history.
 *
 * A game is played only when both scores exist AND they aren't both zero. A
 * 0-0 "final" is never a real fantasy result (both teams always score), so an
 * unstarted or preseason schedule — where every game is stored 0-0 — reads as
 * unplayed everywhere instead of spawning phantom Finals, 0-0 ties, clinch
 * badges, medals, and stats before Week 1 is even entered.
 *
 * This is the single source of truth for that rule; keep score-entry UI (which
 * cares whether a value was typed at all) on plain null checks instead.
 */
export function isGamePlayed<T extends Pick<ScheduledGame, "homeScore" | "awayScore">>(
  game: T,
): game is T & { homeScore: number; awayScore: number } {
  return (
    game.homeScore != null &&
    game.awayScore != null &&
    !(game.homeScore === 0 && game.awayScore === 0)
  );
}
