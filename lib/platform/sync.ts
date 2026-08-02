import "server-only";
import { fetchEspnLeague, mapEspnPlayers, mapEspnScores } from "./espn";
import { mapSleeperPlayers, mapSleeperScores } from "./sleeper";
import type { PlayerWeekStat } from "@/lib/playerData";
import type { GeneratedSchedule, PlatformSyncResult } from "@/lib/types";

// Public-only score pull for a connected schedule — the shared core behind both
// the on-demand refresh (Level 0) and the scheduled cron (Level 2). No ESPN
// cookies: private leagues are out of scope, so this never touches credentials.
//
// ESPN returns every matchup period in one fetch, so mapEspnScores covers the
// whole season at once. Sleeper is per-week, so we sync each requested week and
// merge; callers can narrow `weeks` to just the live week to cut fetches.
export async function computeScheduleScores(
  schedule: GeneratedSchedule,
  opts?: { weeks?: number[] },
): Promise<PlatformSyncResult> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.provider || !connection.providerLeagueId) {
    throw new Error("This schedule is not connected to ESPN or Sleeper.");
  }

  if (connection.provider === "espn") {
    const league = await fetchEspnLeague(connection.providerLeagueId, connection.seasonYear, ["mMatchup", "mScoreboard"]);
    return mapEspnScores(schedule, league);
  }

  const weeks = opts?.weeks ?? schedule.weeks.map((week) => week.weekNumber);
  const rows: PlatformSyncResult["rows"] = [];
  const unmatched: PlatformSyncResult["unmatched"] = [];
  const warnings = new Set<string>();
  for (const week of weeks) {
    const result = await mapSleeperScores(schedule, week);
    rows.push(...result.rows);
    unmatched.push(...result.unmatched);
    result.warnings.forEach((warning) => warnings.add(warning));
  }
  return { rows, unmatched, warnings: [...warnings], syncedAt: new Date().toISOString() };
}

export async function computeSchedulePlayers(
  schedule: GeneratedSchedule,
  opts?: { weeks?: number[] },
): Promise<PlayerWeekStat[]> {
  const connection = schedule.setup.platformConnection;
  if (!connection?.provider || !connection.providerLeagueId) {
    throw new Error("This schedule is not connected to ESPN or Sleeper.");
  }

  if (connection.provider === "espn") {
    const weeks = opts?.weeks ?? schedule.weeks.map((week) => week.weekNumber);
    const rows: PlayerWeekStat[] = [];
    for (const week of weeks) {
      const league = await fetchEspnLeague(connection.providerLeagueId, connection.seasonYear, ["mRoster", "mBoxscore"], undefined, { scoringPeriodId: week });
      rows.push(...mapEspnPlayers(schedule, league, { weeks: [week] }));
    }
    return rows;
  }

  const weeks = opts?.weeks ?? schedule.weeks.map((week) => week.weekNumber);
  const rows: PlayerWeekStat[] = [];
  for (const week of weeks) {
    rows.push(...await mapSleeperPlayers(schedule, week));
  }
  return rows;
}
