import { createDivisions, createTeams } from "../../lib/defaults";
import { createDefaultPlayoffSettings } from "../../lib/playoffs";
import { normalizeTiebreakerSettings } from "../../lib/tiebreakers";
import type {
  GeneratedSchedule,
  LeagueSetupInput,
  PlayoffPlacementMode,
  ScheduledGame,
  ScheduleWeek,
} from "../../lib/types";

/**
 * Compact league builder for engine tests. Team indices are 0-based; with `divisionCount`
 * divisions, team `i` lands in division `i % divisionCount` (matching `createTeams`).
 * A game with omitted scores is treated as unplayed (and counts as a remaining game).
 */
export type GameSpec = [home: number, away: number, homeScore?: number, awayScore?: number];

export interface BuildLeagueOptions {
  teamCount: number;
  divisionCount?: 2 | 3 | 4;
  /** weeks[w] = the games played/scheduled in week w+1. */
  weeks: GameSpec[][];
  regularSeasonWeeks?: 13 | 14;
  fieldSize?: number;
  placementMode?: PlayoffPlacementMode;
}

export function buildLeague(options: BuildLeagueOptions): GeneratedSchedule {
  const divisionCount = options.divisionCount ?? 2;
  const regularSeasonWeeks = options.regularSeasonWeeks ?? 14;
  const divisions = createDivisions(divisionCount);
  const teams = createTeams(options.teamCount, divisions);
  const playoffs = createDefaultPlayoffSettings(options.teamCount, "#117A45", regularSeasonWeeks);
  const setup: LeagueSetupInput = {
    id: "fixture-league",
    name: "Fixture League",
    abbreviation: "FL",
    description: "Engine test fixture.",
    color: "#117A45",
    seasonYear: 2026,
    weeks: regularSeasonWeeks,
    divisions,
    teams,
    display: { cityNames: true, managers: true, venues: true },
    priorSeason: { enabled: true, hasData: true, entryMode: "history", source: "playoffs" },
    weekOne: { rankingSource: "prior-season" },
    tiebreakers: normalizeTiebreakerSettings(),
    playoffs: {
      ...playoffs,
      fieldSize: (options.fieldSize ?? playoffs.fieldSize) as typeof playoffs.fieldSize,
      placementMode: options.placementMode ?? "overall",
    },
    fairness: {
      maxHomeAwayStreak: 3,
      preventImmediateRematches: true,
      finalWeekDivisional: true,
      prioritizeOpeningWeek: true,
      prioritizeThanksgiving: true,
    },
  };

  const weeks: ScheduleWeek[] = options.weeks.map((games, weekIndex) => ({
    weekNumber: weekIndex + 1,
    dateLabel: `Week ${weekIndex + 1}`,
    games: games.map((spec, gameIndex): ScheduledGame => {
      const [home, away, homeScore, awayScore] = spec;
      const homeTeam = teams[home];
      const awayTeam = teams[away];
      return {
        id: `w${weekIndex + 1}-g${gameIndex + 1}`,
        week: weekIndex + 1,
        gameNumber: gameIndex + 1,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        matchupType: homeTeam.divisionId === awayTeam.divisionId ? "division" : "cross-division",
        seriesGame: 1,
        seriesLength: 1,
        dateLabel: `Week ${weekIndex + 1}`,
        stadium: homeTeam.stadium,
        ...(homeScore != null && awayScore != null ? { homeScore, awayScore } : {}),
      };
    }),
  }));

  return {
    id: "fixture-schedule",
    seed: "fixture",
    createdAt: "2026-07-31T00:00:00.000Z",
    setup,
    weeks,
    fairness: { hardPass: true, score: 100, homeAwaySpread: 0, immediateRematches: 0, divisionalFinishShare: 1, notes: [] },
    revision: 1,
  };
}

export function teamId(index: number) {
  return `team-${index + 1}`;
}
