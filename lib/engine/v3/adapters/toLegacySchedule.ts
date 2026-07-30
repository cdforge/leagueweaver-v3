import type { Game, Schedule, ScheduleInput, Team, Week } from "../../scheduleForge";
import { EngineResult, MatchKind } from "../domain/types";

function legacyMatchupType(kind: MatchKind): Game["matchupType"] {
  if (kind === "round_robin") return "Round-Robin";
  if (kind === "cross") return "Cross-Divisional";
  // div + pool both map to intra-group "Divisional" play
  return "Divisional";
}

// Converts the engine's internal schedule into the legacy `Schedule` shape the
// app + worker consume. Venue/calendar/audit enrichment is layered on by the
// caller; this adapter only fills the structural game data.
export function toLegacySchedule(
  result: EngineResult,
  input: ScheduleInput,
  teams: Team[],
  seed: number,
): Schedule {
  const weeks: Week[] = result.schedule.weeks
    .slice()
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((week, weekIndex) => {
      const weekNumber = weekIndex + 1;
      const games: Game[] = week.games.map((game, gameIndex) => {
        const homeTeamId = game.homeTeamId!;
        const awayTeamId = game.awayTeamId!;
        return {
          id: `w${weekNumber}-g${gameIndex + 1}`,
          weekNumber,
          gameNumber: gameIndex + 1,
          awayTeamId,
          homeTeamId,
          matchupType: legacyMatchupType(game.kind),
          seriesId: game.seriesId,
          seriesGameNumber: game.seriesGameIndex,
          seriesTotal: game.seriesLength,
        };
      });
      return { weekNumber, games };
    });

  return {
    settings: input.settings,
    divisions: input.divisions,
    teams,
    weeks,
    createdAt: Date.now(),
    seed,
    constraintBreakages: result.warnings.length > 0 ? result.warnings : undefined,
    audit: {
      engine: "v3",
      phaseName: result.phaseName,
      hardPass: result.hardPass,
      seedUsed: result.seedUsed,
      softReport: result.softReport,
    },
  };
}
