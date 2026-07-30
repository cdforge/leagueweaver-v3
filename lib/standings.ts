import { getWeekOneRankMap } from "./rankings";
import type { GeneratedSchedule, RankHistorySnapshot, StandingsRow } from "./types";

export function calculateStandings(schedule: GeneratedSchedule, throughWeek = Number.POSITIVE_INFINITY): StandingsRow[] {
  const rows = new Map<string, StandingsRow>();
  const streaks = new Map<string, Array<"W" | "L" | "T">>();
  for (const team of schedule.setup.teams) {
    rows.set(team.id, {
      teamId: team.id,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      winPercentage: 0,
      divisionWins: 0,
      divisionLosses: 0,
      streak: "—",
    });
    streaks.set(team.id, []);
  }
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));

  for (const week of schedule.weeks) {
    if (week.weekNumber > throughWeek) continue;
    for (const game of week.games) {
      if (game.homeScore == null || game.awayScore == null) continue;
      const home = rows.get(game.homeTeamId);
      const away = rows.get(game.awayTeamId);
      if (!home || !away) continue;
      home.pointsFor += game.homeScore;
      home.pointsAgainst += game.awayScore;
      away.pointsFor += game.awayScore;
      away.pointsAgainst += game.homeScore;
      const sameDivision = teamById.get(game.homeTeamId)?.divisionId === teamById.get(game.awayTeamId)?.divisionId;
      if (game.homeScore === game.awayScore) {
        home.ties += 1;
        away.ties += 1;
        streaks.get(home.teamId)?.push("T");
        streaks.get(away.teamId)?.push("T");
      } else if (game.homeScore > game.awayScore) {
        home.wins += 1;
        away.losses += 1;
        if (sameDivision) {
          home.divisionWins += 1;
          away.divisionLosses += 1;
        }
        streaks.get(home.teamId)?.push("W");
        streaks.get(away.teamId)?.push("L");
      } else {
        away.wins += 1;
        home.losses += 1;
        if (sameDivision) {
          away.divisionWins += 1;
          home.divisionLosses += 1;
        }
        streaks.get(away.teamId)?.push("W");
        streaks.get(home.teamId)?.push("L");
      }
    }
  }

  for (const row of rows.values()) {
    const games = row.wins + row.losses + row.ties;
    row.winPercentage = games ? (row.wins + row.ties * 0.5) / games : 0;
    const history = streaks.get(row.teamId) ?? [];
    if (history.length) {
      const latest = history.at(-1)!;
      let count = 0;
      for (let index = history.length - 1; index >= 0 && history[index] === latest; index -= 1) count += 1;
      row.streak = `${latest}${count}`;
    }
  }

  const preseasonRanks = getWeekOneRankMap(schedule.setup);
  return [...rows.values()].sort((a, b) =>
    b.winPercentage - a.winPercentage ||
    b.pointsFor - a.pointsFor ||
    (preseasonRanks.get(a.teamId) ?? Number.POSITIVE_INFINITY) - (preseasonRanks.get(b.teamId) ?? Number.POSITIVE_INFINITY) ||
    teamById.get(a.teamId)!.name.localeCompare(teamById.get(b.teamId)!.name),
  );
}

export function getEnteringWeekRankMap(schedule: GeneratedSchedule, weekNumber: number) {
  const snapshot = getEnteringWeekRankSnapshot(schedule, weekNumber);
  return new Map(snapshot.rows.map((row) => [row.teamId, row.rank]));
}

export function getLiveRankHistory(schedule: GeneratedSchedule): RankHistorySnapshot[] {
  const preseasonRanks = getWeekOneRankMap(schedule.setup);
  const savedSnapshots = new Map((schedule.rankHistory ?? []).map((snapshot) => [snapshot.weekNumber, snapshot]));
  let previousRanks = preseasonRanks;
  const snapshots: RankHistorySnapshot[] = [];
  const buildSnapshot = (weekNumber: number, completed: boolean, playedGames: number) => {
    const standings = calculateStandings(schedule, weekNumber);
    const currentRanks = new Map(standings.map((row, index) => [row.teamId, index + 1]));
    snapshots.push({
      weekNumber,
      completed,
      playedGames,
      rows: standings.map((row, index) => {
        const rank = index + 1;
        const previousRank = previousRanks.get(row.teamId) ?? preseasonRanks.get(row.teamId) ?? rank;
        return {
          ...row,
          rank,
          previousRank,
          rankChange: previousRank - rank,
          preseasonRank: preseasonRanks.get(row.teamId) ?? rank,
        };
      }),
    });
    previousRanks = currentRanks;
  };

  const preseasonSnapshot = savedSnapshots.get(0);
  if (preseasonSnapshot) {
    snapshots.push(preseasonSnapshot);
    previousRanks = new Map(preseasonSnapshot.rows.map((row) => [row.teamId, row.rank]));
  } else {
    buildSnapshot(0, true, 0);
  }
  for (const week of [...schedule.weeks].sort((left, right) => left.weekNumber - right.weekNumber)) {
    const savedSnapshot = savedSnapshots.get(week.weekNumber);
    if (savedSnapshot) {
      snapshots.push(savedSnapshot);
      previousRanks = new Map(savedSnapshot.rows.map((row) => [row.teamId, row.rank]));
      continue;
    }
    const playedGames = week.games.filter((game) => game.homeScore != null && game.awayScore != null).length;
    buildSnapshot(week.weekNumber, week.games.length > 0 && playedGames === week.games.length, playedGames);
  }
  return snapshots;
}

export function getEnteringWeekRankSnapshot(schedule: GeneratedSchedule, weekNumber: number) {
  const history = getLiveRankHistory(schedule);
  const enteringWeek = Math.max(0, weekNumber - 1);
  return history.find((snapshot) => snapshot.weekNumber === enteringWeek) ?? history[0];
}

export function getWeekRankSnapshot(schedule: GeneratedSchedule, weekNumber: number) {
  const history = getLiveRankHistory(schedule);
  const week = history.find((snapshot) => snapshot.weekNumber === weekNumber);
  if (week && (week.completed || week.playedGames > 0)) return week;
  return history.find((snapshot) => snapshot.weekNumber === Math.max(0, weekNumber - 1)) ?? history[0];
}

export function freezeCompletedRankHistory(schedule: GeneratedSchedule): GeneratedSchedule {
  const existingWeeks = new Set((schedule.rankHistory ?? []).map((snapshot) => snapshot.weekNumber));
  const frozen: RankHistorySnapshot[] = [];
  let priorWeekFrozen = true;
  for (const snapshot of getLiveRankHistory(schedule)) {
    const shouldFreeze: boolean = snapshot.weekNumber === 0 || existingWeeks.has(snapshot.weekNumber) || (priorWeekFrozen && snapshot.completed);
    if (shouldFreeze) frozen.push(snapshot);
    priorWeekFrozen = shouldFreeze;
  }
  return { ...schedule, rankHistory: frozen };
}

export function formatRecord(row: StandingsRow) {
  return row.ties ? `${row.wins}-${row.losses}-${row.ties}` : `${row.wins}-${row.losses}`;
}
