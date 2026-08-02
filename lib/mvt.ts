import { buildAllStars, type AllStarResult } from "@/lib/allStars";
import { conferenceIdForDivision, hasConferences } from "@/lib/conferences";
import { isGamePlayed } from "@/lib/game";
import { getMatchupSignal } from "@/lib/matchups";
import type { LineupSlotTemplate, LineupTemplate, PlayerWeekStat } from "@/lib/playerData";
import { getWeekOneRankMap } from "@/lib/rankings";
import { calculateTeamSeasonStats, getScheduleGameSignals, recordPercentage, type SplitRecord } from "@/lib/statistics";
import { getEnteringWeekRankMap } from "@/lib/standings";
import type { TransactionCountSummary } from "@/lib/transactions";
import type { GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

export const MVT_BLOWOUT_THRESHOLD = 40;

export type MvtBucket = "positional" | "achievement" | "divisionLeague" | "bonus";
export type MvtMovement = "up" | "down" | "same";

export interface MvtAwardWinner {
  teamId: string;
  place: 1 | 2 | 3;
  points: number;
  value: number;
}

export interface MvtAwardResult {
  id: string;
  label: string;
  bucket: MvtBucket;
  winners: MvtAwardWinner[];
}

export interface MvtTeamResult {
  teamId: string;
  rank: number;
  total: number;
  positional: number;
  achievement: number;
  divisionLeague: number;
  bonus: number;
  movement: MvtMovement;
}

export interface BuildMvtInput {
  schedule: GeneratedSchedule;
  lineupTemplate: LineupTemplate;
  playerStats: PlayerWeekStat[];
  allStars?: AllStarResult;
  transactionCounts?: TransactionCountSummary[];
  previousTotals?: Map<string, number>;
  blowoutThreshold?: number;
}

const POSITIONAL_AVERAGE_POINTS = [4, 2, 1] as const;
const POSITIONAL_HIGH_POINTS = [2, 1, 0.5] as const;
const ACHIEVEMENT_POINTS = {
  mvp: [4, 2, 1],
  totalAverage: [8, 4, 2],
  totalHigh: [6, 3, 1.5],
  allStars: [6, 3, 1.5],
  bestRecord: [6, 3, 1.5],
  blowouts: [4, 2, 1],
  upsets: [4, 2, 1],
  trades: [1, 0.5, 0.25],
  waivers: [1, 0.5, 0.25],
} as const;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function add(map: Map<string, number>, teamId: string, points: number) {
  map.set(teamId, round2((map.get(teamId) ?? 0) + points));
}

function slotLabel(slot: LineupSlotTemplate) {
  return slot.label ?? (slot.rank && slot.rank > 1 ? `${slot.slot}${slot.rank}` : slot.slot);
}

function starterForSlot(row: PlayerWeekStat, slot: LineupSlotTemplate) {
  if (row.lineupStatus !== "starter") return false;
  if (row.starterIndex === slot.index) return true;
  return row.starterIndex == null && row.inferredSlot === slot.slot;
}

function topThreeAward(args: {
  id: string;
  label: string;
  bucket: MvtBucket;
  values: Map<string, number>;
  points: readonly number[];
  direction?: "asc" | "desc";
}): MvtAwardResult {
  const direction = args.direction ?? "desc";
  const rows = [...args.values.entries()]
    .filter(([, value]) => Number.isFinite(value))
    .sort(([leftTeam, left], [rightTeam, right]) => (direction === "desc" ? right - left : left - right) || leftTeam.localeCompare(rightTeam));
  const winners: MvtAwardWinner[] = [];
  let previous: number | undefined;
  let place = 0;
  rows.forEach(([teamId, value], index) => {
    if (previous === undefined || value !== previous) place = index + 1;
    previous = value;
    if (place > 3) return;
    winners.push({ teamId, place: place as 1 | 2 | 3, points: args.points[place - 1] ?? 0, value });
  });
  return { id: args.id, label: args.label, bucket: args.bucket, winners };
}

function playedRegularSeasonGames(schedule: GeneratedSchedule) {
  return schedule.weeks
    .filter((week) => week.weekNumber <= schedule.setup.weeks)
    .flatMap((week) => week.games)
    .filter(isGamePlayed);
}

function teamScoresByWeek(schedule: GeneratedSchedule) {
  const byTeam = new Map(schedule.setup.teams.map((team) => [team.id, [] as number[]]));
  for (const game of playedRegularSeasonGames(schedule)) {
    byTeam.get(game.homeTeamId)?.push(game.homeScore!);
    byTeam.get(game.awayTeamId)?.push(game.awayScore!);
  }
  return byTeam;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function splitRecordValue(record: SplitRecord) {
  return recordPercentage(record);
}

function addAwardsToBucket(bucket: Map<string, number>, awards: MvtAwardResult[]) {
  for (const award of awards) {
    for (const winner of award.winners) add(bucket, winner.teamId, winner.points);
  }
}

function winnerLoser(game: ScheduledGame) {
  if (!isGamePlayed(game) || game.homeScore === game.awayScore) return undefined;
  const homeWon = game.homeScore! > game.awayScore!;
  return {
    winnerId: homeWon ? game.homeTeamId : game.awayTeamId,
    loserId: homeWon ? game.awayTeamId : game.homeTeamId,
    margin: Math.abs(game.homeScore! - game.awayScore!),
    total: game.homeScore! + game.awayScore!,
  };
}

function divisionLeagueAwards(schedule: GeneratedSchedule): MvtAwardResult[] {
  const stats = calculateTeamSeasonStats(schedule);
  const statsByTeam = new Map(stats.map((row) => [row.teamId, row]));
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const conferenceLive = hasConferences(schedule.setup);
  const groups: Array<{ id: string; label: string; points: number; teamIds: string[] }> = [
    { id: "league", label: "League", points: 2, teamIds: schedule.setup.teams.map((team) => team.id) },
  ];
  if (schedule.setup.divisions.length > 1) {
    groups.push(...schedule.setup.divisions.map((division) => ({
      id: `division:${division.id}`,
      label: division.name,
      points: 1,
      teamIds: schedule.setup.teams.filter((team) => team.divisionId === division.id).map((team) => team.id),
    })));
  }
  if (conferenceLive) {
    groups.push(...(schedule.setup.conferences ?? []).map((conference) => ({
      id: `conference:${conference.id}`,
      label: conference.name,
      points: 1.5,
      teamIds: schedule.setup.teams.filter((team) => (team.conferenceId ?? conferenceIdForDivision(schedule.setup.divisions, team.divisionId)) === conference.id).map((team) => team.id),
    })));
  }

  const valueRows: Array<{ id: string; label: string; value: (team: Team) => number }> = [
    { id: "overall-record", label: "Best Overall Record", value: (team) => statsByTeam.get(team.id)?.winPercentage ?? 0 },
    { id: "divisional-record", label: "Best Divisional Record", value: (team) => {
      const row = statsByTeam.get(team.id);
      return row ? (row.divisionWins + row.divisionTies * 0.5) / Math.max(1, row.divisionWins + row.divisionLosses + row.divisionTies) : 0;
    } },
    { id: "cross-divisional-record", label: "Best Cross-Divisional Record", value: (team) => {
      const row = statsByTeam.get(team.id);
      if (!row) return 0;
      const crossWins = row.wins - row.divisionWins;
      const crossLosses = row.losses - row.divisionLosses;
      const crossTies = row.ties - row.divisionTies;
      return (crossWins + crossTies * 0.5) / Math.max(1, crossWins + crossLosses + crossTies);
    } },
    { id: "sweeps", label: "Most Div/Cross-Div Sweeps", value: (team) => (statsByTeam.get(team.id)?.wins ?? 0) - (statsByTeam.get(team.id)?.losses ?? 0) },
    { id: "streak", label: "Longest Win Streak", value: (team) => Number((statsByTeam.get(team.id)?.bestStreak ?? "").replace("W", "")) || 0 },
    { id: "home-record", label: "Best Home Record", value: (team) => splitRecordValue(statsByTeam.get(team.id)?.home ?? { wins: 0, losses: 0, ties: 0 }) },
    { id: "away-record", label: "Best Away Record", value: (team) => splitRecordValue(statsByTeam.get(team.id)?.away ?? { wins: 0, losses: 0, ties: 0 }) },
  ];

  return valueRows.flatMap((row) => groups.map((group): MvtAwardResult => {
    const values = new Map(group.teamIds.map((teamId) => [teamId, row.value(teamById.get(teamId)!)]));
    const top = topThreeAward({ id: `${row.id}:${group.id}`, label: `${row.label} - ${group.label}`, bucket: "divisionLeague", values, points: [group.points], direction: "desc" });
    return { ...top, winners: top.winners.filter((winner) => winner.place === 1).map((winner) => ({ ...winner, points: group.points })) };
  }));
}

export function buildMvt(input: BuildMvtInput): { teams: MvtTeamResult[]; awards: MvtAwardResult[] } {
  const positional = new Map(input.schedule.setup.teams.map((team) => [team.id, 0]));
  const achievement = new Map(input.schedule.setup.teams.map((team) => [team.id, 0]));
  const divisionLeague = new Map(input.schedule.setup.teams.map((team) => [team.id, 0]));
  const bonus = new Map(input.schedule.setup.teams.map((team) => [team.id, 0]));
  const awards: MvtAwardResult[] = [];

  for (const slot of input.lineupTemplate.slots) {
    const byTeam = new Map<string, PlayerWeekStat[]>();
    for (const row of input.playerStats.filter((stat) => starterForSlot(stat, slot))) {
      if (!byTeam.has(row.teamId)) byTeam.set(row.teamId, []);
      byTeam.get(row.teamId)?.push(row);
    }
    const averages = new Map(input.schedule.setup.teams.map((team) => [team.id, average(byTeam.get(team.id)?.map((row) => row.points) ?? [])]));
    const highs = new Map(input.schedule.setup.teams.map((team) => [team.id, Math.max(0, ...(byTeam.get(team.id)?.map((row) => row.points) ?? []))]));
    awards.push(
      topThreeAward({ id: `positional:${slot.index}:avg`, label: `${slotLabel(slot)} Average`, bucket: "positional", values: averages, points: POSITIONAL_AVERAGE_POINTS }),
      topThreeAward({ id: `positional:${slot.index}:high`, label: `${slotLabel(slot)} High Score`, bucket: "positional", values: highs, points: POSITIONAL_HIGH_POINTS }),
    );
  }
  addAwardsToBucket(positional, awards.filter((award) => award.bucket === "positional"));

  const scoresByTeam = teamScoresByWeek(input.schedule);
  const allStars = input.allStars ?? buildAllStars({ lineupTemplate: input.lineupTemplate, stats: input.playerStats });
  const gotwIds = getScheduleGameSignals(input.schedule).gotwIds;
  const gotwRecord = new Map(input.schedule.setup.teams.map((team) => [team.id, { wins: 0, losses: 0, ties: 0 } satisfies SplitRecord]));
  const blowouts = new Map(input.schedule.setup.teams.map((team) => [team.id, 0]));
  const upsets = new Map(input.schedule.setup.teams.map((team) => [team.id, 0]));
  const threshold = input.blowoutThreshold ?? MVT_BLOWOUT_THRESHOLD;
  for (const week of input.schedule.weeks) {
    const ranks = getEnteringWeekRankMap(input.schedule, week.weekNumber);
    for (const game of week.games.filter(isGamePlayed)) {
      const result = winnerLoser(game);
      if (!result) continue;
      if (gotwIds.has(game.id)) {
        gotwRecord.get(result.winnerId)!.wins += 1;
        gotwRecord.get(result.loserId)!.losses += 1;
      }
      if (result.margin >= threshold) blowouts.set(result.winnerId, (blowouts.get(result.winnerId) ?? 0) + 1);
      if ((ranks.get(result.winnerId) ?? 0) > (ranks.get(result.loserId) ?? 0)) upsets.set(result.winnerId, (upsets.get(result.winnerId) ?? 0) + 1);
    }
  }
  const transactionByTeam = new Map((input.transactionCounts ?? []).map((row) => [row.teamId, row]));
  const achievementAwards = [
    topThreeAward({ id: "achievement:mvp", label: "MVP", bucket: "achievement", values: new Map(input.schedule.setup.teams.map((team) => [team.id, Math.max(0, ...input.playerStats.filter((row) => row.teamId === team.id).map((row) => row.points))])), points: ACHIEVEMENT_POINTS.mvp }),
    topThreeAward({ id: "achievement:total-avg", label: "Total Score - Average", bucket: "achievement", values: new Map(input.schedule.setup.teams.map((team) => [team.id, average(scoresByTeam.get(team.id) ?? [])])), points: ACHIEVEMENT_POINTS.totalAverage }),
    topThreeAward({ id: "achievement:total-high", label: "Total Score - High Score", bucket: "achievement", values: new Map(input.schedule.setup.teams.map((team) => [team.id, Math.max(0, ...(scoresByTeam.get(team.id) ?? []))])), points: ACHIEVEMENT_POINTS.totalHigh }),
    topThreeAward({ id: "achievement:all-stars", label: "All-Star Players", bucket: "achievement", values: allStars.seasonCountByTeam, points: ACHIEVEMENT_POINTS.allStars }),
    topThreeAward({ id: "achievement:gotw-record", label: "Best Record", bucket: "achievement", values: new Map(input.schedule.setup.teams.map((team) => [team.id, recordPercentage(gotwRecord.get(team.id)!)])), points: ACHIEVEMENT_POINTS.bestRecord }),
    topThreeAward({ id: "achievement:blowouts", label: "Most Blowouts", bucket: "achievement", values: blowouts, points: ACHIEVEMENT_POINTS.blowouts }),
    topThreeAward({ id: "achievement:upsets", label: "Most Upsets", bucket: "achievement", values: upsets, points: ACHIEVEMENT_POINTS.upsets }),
    topThreeAward({ id: "achievement:trades", label: "Most Trades", bucket: "achievement", values: new Map(input.schedule.setup.teams.map((team) => [team.id, transactionByTeam.get(team.id)?.trades ?? 0])), points: ACHIEVEMENT_POINTS.trades }),
    topThreeAward({ id: "achievement:waivers", label: "Waiver Wire Warrior", bucket: "achievement", values: new Map(input.schedule.setup.teams.map((team) => [team.id, transactionByTeam.get(team.id)?.transactions ?? 0])), points: ACHIEVEMENT_POINTS.waivers }),
  ];
  awards.push(...achievementAwards);
  addAwardsToBucket(achievement, achievementAwards);

  const divLeagueAwards = divisionLeagueAwards(input.schedule);
  awards.push(...divLeagueAwards);
  addAwardsToBucket(divisionLeague, divLeagueAwards);

  const playedGames = playedRegularSeasonGames(input.schedule);
  const scoredBonus = (id: string, label: string, value: (game: ScheduledGame) => number, runnerUp = true, direction: "asc" | "desc" = "desc") => {
    const sorted = [...playedGames].sort((left, right) => (direction === "desc" ? value(right) - value(left) : value(left) - value(right)) || left.id.localeCompare(right.id));
    const game = sorted[0];
    const result = game ? winnerLoser(game) : undefined;
    if (!game || !result) return;
    const winners: MvtAwardWinner[] = [{ teamId: result.winnerId, place: 1, points: 2, value: value(game) }];
    if (runnerUp) winners.push({ teamId: result.loserId, place: 2, points: 0.5, value: value(game) });
    const award = { id, label, bucket: "bonus" as const, winners };
    awards.push(award);
    addAwardsToBucket(bonus, [award]);
  };
  scoredBonus("bonus:largest-blowout", "Largest Blowout Win Margin", (game) => Math.abs(game.homeScore! - game.awayScore!), false);
  scoredBonus("bonus:smallest-margin", "Smallest Win Margin", (game) => Math.abs(game.homeScore! - game.awayScore!), false, "asc");
  scoredBonus("bonus:combined-total", "Largest Combined Total Score", (game) => game.homeScore! + game.awayScore!);
  const ranksByGame = new Map(playedGames.map((game) => [game.id, getEnteringWeekRankMap(input.schedule, game.week)]));
  scoredBonus("bonus:top-ranked-matchup", "Top Ranked Matchup", (game) => getMatchupSignal(game, ranksByGame.get(game.id), undefined, input.schedule.setup.teams.length).score10);
  const currentRank = new Map(calculateTeamSeasonStats(input.schedule).map((row, index) => [row.teamId, index + 1]));
  const rankJump = new Map(input.schedule.setup.teams.map((team) => [team.id, (getWeekOneRankMap(input.schedule.setup).get(team.id) ?? team.overallRank) - (currentRank.get(team.id) ?? team.overallRank)]));
  const jumpAward = topThreeAward({ id: "bonus:rank-jump", label: "Biggest Rank Jump Since Draft", bucket: "bonus", values: rankJump, points: [2] });
  jumpAward.winners = jumpAward.winners.filter((winner) => winner.place === 1).map((winner) => ({ ...winner, points: 2 }));
  awards.push(jumpAward);
  addAwardsToBucket(bonus, [jumpAward]);

  const rows = input.schedule.setup.teams.map((team) => ({
    teamId: team.id,
    positional: positional.get(team.id) ?? 0,
    achievement: achievement.get(team.id) ?? 0,
    divisionLeague: divisionLeague.get(team.id) ?? 0,
    bonus: bonus.get(team.id) ?? 0,
  })).map((row) => ({ ...row, total: round2(row.positional + row.achievement + row.divisionLeague + row.bonus) }));
  const sorted = [...rows].sort((left, right) => right.total - left.total || left.teamId.localeCompare(right.teamId));
  let previousTotal: number | undefined;
  let rank = 0;
  return {
    awards,
    teams: sorted.map((row, index): MvtTeamResult => {
      if (previousTotal === undefined || row.total !== previousTotal) rank = index + 1;
      previousTotal = row.total;
      const previous = input.previousTotals?.get(row.teamId);
      return {
        ...row,
        rank,
        movement: previous == null || previous === row.total ? "same" : row.total > previous ? "up" : "down",
      };
    }),
  };
}
