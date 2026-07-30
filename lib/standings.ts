import { getWeekOneRankMap } from "./rankings";
import { normalizeTiebreakerSettings, TIEBREAKER_RULE_LABELS } from "./tiebreakers";
import type {
  GeneratedSchedule,
  RankHistorySnapshot,
  ScheduledGame,
  StandingsRankExplanation,
  StandingsResolution,
  StandingsRow,
  StandingsTieGroup,
  TiebreakerRule,
  TiebreakerScope,
} from "./types";

interface StandingsOptions {
  throughWeek?: number;
  scope?: TiebreakerScope;
  divisionId?: string;
  teamIds?: string[];
}

interface CompletedGame {
  game: ScheduledGame;
  homeScore: number;
  awayScore: number;
}

function recordPercentage(wins: number, losses: number, ties: number) {
  const games = wins + losses + ties;
  return games ? (wins + ties * .5) / games : null;
}

function buildRawStandings(schedule: GeneratedSchedule, throughWeek: number) {
  const rows = new Map<string, StandingsRow>();
  const streaks = new Map<string, Array<"W" | "L" | "T">>();
  const completedGames: CompletedGame[] = [];
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
      divisionTies: 0,
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
      completedGames.push({ game, homeScore: game.homeScore, awayScore: game.awayScore });
      home.pointsFor += game.homeScore;
      home.pointsAgainst += game.awayScore;
      away.pointsFor += game.awayScore;
      away.pointsAgainst += game.homeScore;
      const sameDivision = teamById.get(game.homeTeamId)?.divisionId === teamById.get(game.awayTeamId)?.divisionId;
      if (game.homeScore === game.awayScore) {
        home.ties += 1;
        away.ties += 1;
        if (sameDivision) {
          home.divisionTies += 1;
          away.divisionTies += 1;
        }
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
    row.winPercentage = recordPercentage(row.wins, row.losses, row.ties) ?? 0;
    const history = streaks.get(row.teamId) ?? [];
    if (history.length) {
      const latest = history.at(-1)!;
      let count = 0;
      for (let index = history.length - 1; index >= 0 && history[index] === latest; index -= 1) count += 1;
      row.streak = `${latest}${count}`;
    }
  }
  return { rows, completedGames, teamById };
}

function opponentFor(game: CompletedGame, teamId: string) {
  if (game.game.homeTeamId === teamId) return game.game.awayTeamId;
  if (game.game.awayTeamId === teamId) return game.game.homeTeamId;
  return undefined;
}

function recordAgainst(teamId: string, games: CompletedGame[], allowedOpponents: Set<string>) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const completed of games) {
    const opponentId = opponentFor(completed, teamId);
    if (!opponentId || !allowedOpponents.has(opponentId)) continue;
    const teamScore = completed.game.homeTeamId === teamId ? completed.homeScore : completed.awayScore;
    const opponentScore = completed.game.homeTeamId === teamId ? completed.awayScore : completed.homeScore;
    if (teamScore > opponentScore) wins += 1;
    else if (teamScore < opponentScore) losses += 1;
    else ties += 1;
  }
  return recordPercentage(wins, losses, ties);
}

function divisionSeedMap(schedule: GeneratedSchedule, preseasonRanks: Map<string, number>) {
  const result = new Map<string, number>();
  for (const division of schedule.setup.divisions) {
    schedule.setup.teams
      .filter((team) => team.divisionId === division.id)
      .sort((left, right) => (preseasonRanks.get(left.id) ?? Infinity) - (preseasonRanks.get(right.id) ?? Infinity) || left.name.localeCompare(right.name))
      .forEach((team, index) => result.set(team.id, index + 1));
  }
  return result;
}

export function tiebreakerContextSignature(scope: TiebreakerScope, teamIds: string[], divisionId?: string) {
  return `v1:${scope}:${divisionId || "all"}:${[...teamIds].sort().join(",")}`;
}

export function resolveStandings(schedule: GeneratedSchedule, options: StandingsOptions = {}): StandingsResolution {
  const throughWeek = options.throughWeek ?? Number.POSITIVE_INFINITY;
  const scope = options.scope ?? "league";
  const { rows: rowsById, completedGames, teamById } = buildRawStandings(schedule, throughWeek);
  const settings = normalizeTiebreakerSettings(schedule.setup.tiebreakers);
  const rules = settings[scope];
  const eligibleIds = options.teamIds
    ?? (scope === "division" && options.divisionId
      ? schedule.setup.teams.filter((team) => team.divisionId === options.divisionId).map((team) => team.id)
      : schedule.setup.teams.map((team) => team.id));
  const eligibleRows = eligibleIds.map((teamId) => rowsById.get(teamId)).filter((row): row is StandingsRow => Boolean(row));
  const preseasonRanks = getWeekOneRankMap(schedule.setup);
  const divisionSeeds = divisionSeedMap(schedule, preseasonRanks);
  const opponentWinPercentage = new Map([...rowsById.values()].map((row) => [row.teamId, row.winPercentage]));
  const opponentsByTeam = new Map(schedule.setup.teams.map((team) => [team.id, new Set<string>()]));
  const defeatedOpponentsByTeam = new Map(schedule.setup.teams.map((team) => [team.id, [] as string[]]));
  for (const completed of completedGames) {
    opponentsByTeam.get(completed.game.homeTeamId)?.add(completed.game.awayTeamId);
    opponentsByTeam.get(completed.game.awayTeamId)?.add(completed.game.homeTeamId);
    if (completed.homeScore > completed.awayScore) defeatedOpponentsByTeam.get(completed.game.homeTeamId)?.push(completed.game.awayTeamId);
    else if (completed.awayScore > completed.homeScore) defeatedOpponentsByTeam.get(completed.game.awayTeamId)?.push(completed.game.homeTeamId);
  }
  const averageOpponentPercentage = (opponentIds: string[]) => opponentIds.length
    ? opponentIds.reduce((total, opponentId) => total + (opponentWinPercentage.get(opponentId) ?? 0), 0) / opponentIds.length
    : null;
  const strengthOfVictory = new Map(schedule.setup.teams.map((team) => [team.id, averageOpponentPercentage(defeatedOpponentsByTeam.get(team.id) ?? [])]));
  const strengthOfSchedule = new Map(schedule.setup.teams.map((team) => {
    const opponentIds = completedGames.map((game) => opponentFor(game, team.id)).filter((opponentId): opponentId is string => Boolean(opponentId));
    return [team.id, averageOpponentPercentage(opponentIds)];
  }));
  const explanations = new Map<string, StandingsRankExplanation>();
  const tieGroups: StandingsTieGroup[] = [];

  const contextualValues = (bucket: StandingsRow[], rule: TiebreakerRule) => {
    const tiedIds = new Set(bucket.map((row) => row.teamId));
    let commonOpponents: Set<string> | undefined;
    if (rule === "common-opponents") {
      const opponentSets = bucket.map((row) => opponentsByTeam.get(row.teamId) ?? new Set<string>());
      commonOpponents = new Set(opponentSets[0] ?? []);
      for (const opponents of opponentSets.slice(1)) {
        for (const opponentId of commonOpponents) if (!opponents.has(opponentId)) commonOpponents.delete(opponentId);
      }
    }
    return new Map(bucket.map((row): [string, number | null] => {
      if (rule === "win-percentage") return [row.teamId, row.winPercentage];
      if (rule === "head-to-head") return [row.teamId, recordAgainst(row.teamId, completedGames, tiedIds)];
      if (rule === "division-percentage") return [row.teamId, recordPercentage(row.divisionWins, row.divisionLosses, row.divisionTies)];
      if (rule === "common-opponents") return [row.teamId, commonOpponents?.size ? recordAgainst(row.teamId, completedGames, commonOpponents) : null];
      if (rule === "strength-of-victory") return [row.teamId, strengthOfVictory.get(row.teamId) ?? null];
      if (rule === "strength-of-schedule") return [row.teamId, strengthOfSchedule.get(row.teamId) ?? null];
      if (rule === "point-differential") return [row.teamId, row.pointsFor - row.pointsAgainst];
      return [row.teamId, row.pointsFor];
    }));
  };

  const fallback = (bucket: StandingsRow[], appliedRules: TiebreakerRule[]) => {
    const signature = tiebreakerContextSignature(scope, bucket.map((row) => row.teamId), options.divisionId);
    const manualOrder = settings.manualOverrides[signature];
    const exactManualOrder = manualOrder?.length === bucket.length
      && [...manualOrder].sort().every((teamId, index) => teamId === bucket.map((row) => row.teamId).sort()[index]);
    const ordered = exactManualOrder
      ? manualOrder.map((teamId) => rowsById.get(teamId)!).filter(Boolean)
      : [...bucket].sort((left, right) =>
        (preseasonRanks.get(left.teamId) ?? Infinity) - (preseasonRanks.get(right.teamId) ?? Infinity)
        || (divisionSeeds.get(left.teamId) ?? Infinity) - (divisionSeeds.get(right.teamId) ?? Infinity)
        || teamById.get(left.teamId)!.name.localeCompare(teamById.get(right.teamId)!.name));
    const resolution = exactManualOrder ? "manual" : "fallback";
    const explanation = exactManualOrder
      ? "The commissioner’s saved order resolved this exact tie."
      : "All configured rules remained tied, so preseason seed, division seed, then team name set the order.";
    tieGroups.push({ signature, scope, divisionId: options.divisionId, teamIds: bucket.map((row) => row.teamId), orderedTeamIds: ordered.map((row) => row.teamId), appliedRules, resolution, explanation });
    for (const row of ordered) explanations.set(row.teamId, { label: explanation, resolution });
    return ordered;
  };

  const rankBucket = (bucket: StandingsRow[], ruleIndex: number, appliedRules: TiebreakerRule[]): StandingsRow[] => {
    if (bucket.length <= 1) return bucket;
    if (ruleIndex >= rules.length) return fallback(bucket, appliedRules);
    const rule = rules[ruleIndex];
    const values = contextualValues(bucket, rule);
    const groups = new Map<number | null, StandingsRow[]>();
    for (const row of bucket) {
      const value = values.get(row.teamId) ?? null;
      groups.set(value, [...(groups.get(value) ?? []), row]);
    }
    const nextAppliedRules = [...appliedRules, rule];
    if (groups.size === 1) return rankBucket(bucket, ruleIndex + 1, nextAppliedRules);
    const orderedGroups = [...groups.entries()].sort(([left], [right]) => {
      if (left == null) return 1;
      if (right == null) return -1;
      return right - left;
    });
    for (const [value, rows] of orderedGroups) {
      for (const row of rows) explanations.set(row.teamId, {
        rule,
        label: `${TIEBREAKER_RULE_LABELS[rule]} separated this tie.`,
        value: value ?? undefined,
        resolution: "rule",
      });
    }
    return orderedGroups.flatMap(([, rows]) => rankBucket(rows, ruleIndex + 1, nextAppliedRules));
  };

  const rows = rankBucket(eligibleRows, 0, []);
  return { rows, tieGroups, explanationsByTeam: Object.fromEntries(explanations) };
}

export function calculateStandings(schedule: GeneratedSchedule, throughWeek = Number.POSITIVE_INFINITY): StandingsRow[] {
  return resolveStandings(schedule, { throughWeek, scope: "league" }).rows;
}

export function calculateDivisionStandings(schedule: GeneratedSchedule, divisionId: string, throughWeek = Number.POSITIVE_INFINITY) {
  return resolveStandings(schedule, { throughWeek, scope: "division", divisionId }).rows;
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
    const resolution = resolveStandings(schedule, { throughWeek: weekNumber, scope: "league" });
    const standings = resolution.rows;
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
          tiebreaker: resolution.explanationsByTeam[row.teamId],
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
