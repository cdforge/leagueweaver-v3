import assert from "node:assert/strict";
import { calculateTeamClinchStates, getTeamClinchTimelines } from "../lib/clinch";
import { createDefaultSetup } from "../lib/defaults";
import { calculateMatchupRating, getGameOfWeekId, getGameOfWeekSelection, getMatchupRatingRange, getMatchupSignal, getWeeklyMatchupSignal, normalizeScheduleMatchups, orderWeekGamesByMatchupRating } from "../lib/matchups";
import { updateGameScore } from "../lib/schedule";
import { calculateStandings, getEnteringWeekRankSnapshot, getLiveRankHistory } from "../lib/standings";
import { calculateGameAnalytics, calculateTeamSeasonStats, formatSplitRecord, getGameOfWeekTimeline, recordPercentage } from "../lib/statistics";
import type { GeneratedSchedule, ScheduledGame } from "../lib/types";

const setup = createDefaultSetup();
const games: ScheduledGame[] = [
  { id: "g1", week: 1, homeTeamId: "team-1", awayTeamId: "team-2", matchupType: "cross-division", seriesGame: 1, seriesLength: 1, dateLabel: "Week 1", stadium: "Foundry Field", homeScore: 120, awayScore: 119 },
  { id: "g2", week: 1, homeTeamId: "team-3", awayTeamId: "team-4", matchupType: "cross-division", seriesGame: 1, seriesLength: 1, dateLabel: "Week 1", stadium: "The Yard", homeScore: 140, awayScore: 120 },
  { id: "g3", week: 1, homeTeamId: "team-5", awayTeamId: "team-7", matchupType: "division", seriesGame: 1, seriesLength: 2, dateLabel: "Week 1", stadium: "Victory Grounds", homeScore: 130, awayScore: 129 },
  { id: "g4", week: 1, homeTeamId: "team-6", awayTeamId: "team-8", matchupType: "division", seriesGame: 1, seriesLength: 2, dateLabel: "Week 1", stadium: "Sunday Stadium", homeScore: 100, awayScore: 100 },
];
const schedule: GeneratedSchedule = {
  id: "stats-test",
  seed: "stats-test",
  createdAt: "2026-07-30T00:00:00.000Z",
  setup,
  weeks: [{ weekNumber: 1, dateLabel: "Week 1", games }],
  fairness: { hardPass: true, score: 100, homeAwaySpread: 0, immediateRematches: 0, divisionalFinishShare: .5, notes: [] },
  revision: 1,
};

const ranksByGameId = new Map([
  ["g1", new Map([["team-1", 5], ["team-2", 1]])],
]);
const analytics = calculateGameAnalytics(games, new Set(["g1"]), ranksByGameId);
const byId = new Map(analytics.map((item) => [item.game.id, item]));
assert.equal(byId.get("g3")?.qualityRank, 1);
assert.equal(byId.get("g1")?.qualityRank, 2);
assert.equal(byId.get("g2")?.qualityRank, 2);
assert.equal(byId.get("g4")?.qualityRank, 2);
assert.deepEqual(byId.get("g1")?.badges, ["GOTW", "Upset", "Shootout"]);
assert.equal(byId.get("g3")?.badges.length, 1);
assert.equal(byId.get("g4")?.marginRank, 1);
assert.equal(byId.get("g2")?.totalRank, 1);

const stats = new Map(calculateTeamSeasonStats(schedule).map((row) => [row.teamId, row]));
assert.equal(formatSplitRecord(stats.get("team-1")!.home), "1-0");
assert.equal(formatSplitRecord(stats.get("team-2")!.away), "0-1");
assert.equal(recordPercentage(stats.get("team-6")!.home), .5);
assert.equal(stats.get("team-5")!.divisionPointsFor, 130);
assert.equal(stats.get("team-5")!.divisionPointsAgainst, 129);
assert.equal(stats.get("team-5")!.strengthOfSchedule, stats.get("team-7")!.winPercentage);
assert.equal(stats.get("team-1")!.strengthOfVictory, stats.get("team-2")!.winPercentage);
assert.equal(stats.get("team-1")!.featuredWins, 1);
assert.equal(stats.get("team-2")!.featuredWins, 0);

const rankingGames: ScheduledGame[] = [
  ["team-10", "team-1", 150, 90],
  ["team-2", "team-9", 140, 100],
  ["team-3", "team-8", 130, 110],
  ["team-4", "team-7", 125, 115],
  ["team-5", "team-6", 121, 120],
].map(([homeTeamId, awayTeamId, homeScore, awayScore], index) => ({
  id: `rank-${index + 1}`,
  week: 1,
  homeTeamId: String(homeTeamId),
  awayTeamId: String(awayTeamId),
  matchupType: "cross-division",
  seriesGame: 1,
  seriesLength: 1,
  dateLabel: "Week 1",
  stadium: "Rank Field",
  homeScore: Number(homeScore),
  awayScore: Number(awayScore),
}));
const rankingSchedule: GeneratedSchedule = { ...schedule, weeks: [{ weekNumber: 1, dateLabel: "Week 1", games: rankingGames }] };
const rankHistory = getLiveRankHistory(rankingSchedule);
const weekOneEntering = getEnteringWeekRankSnapshot(rankingSchedule, 1);
assert.ok(weekOneEntering.rows.every((row) => row.wins === 0 && row.losses === 0 && row.ties === 0));
assert.equal(weekOneEntering.rows.find((row) => row.teamId === "team-1")?.rank, 1);
assert.equal(rankHistory[0].rows[0].teamId, "team-1");
assert.equal(rankHistory[1].rows[0].teamId, "team-10");
assert.equal(rankHistory[1].rows[0].rankChange, 9);
assert.equal(rankHistory[1].completed, true);
assert.deepEqual(rankHistory[1].rows.map((row) => row.teamId), calculateStandings(rankingSchedule, 1).map((row) => row.teamId));
const correctedRankingSchedule = updateGameScore(rankingSchedule, "rank-1", 80, 190);
const correctedHistory = getLiveRankHistory(correctedRankingSchedule);
const frozenWeekTwoEntering = getEnteringWeekRankSnapshot(correctedRankingSchedule, 2);
assert.equal(calculateStandings(correctedRankingSchedule, 1)[0].teamId, "team-1");
assert.equal(correctedHistory[1].rows[0].teamId, "team-10");
assert.equal(frozenWeekTwoEntering.rows.find((row) => row.teamId === "team-10")?.wins, 1);
assert.equal(frozenWeekTwoEntering.rows.find((row) => row.teamId === "team-10")?.rank, 1);
assert.ok(correctedRankingSchedule.rankHistory?.some((snapshot) => snapshot.weekNumber === 1));

const finalClinchStates = calculateTeamClinchStates(rankingSchedule, 1);
assert.equal(finalClinchStates.filter((state) => state.topSeed).length, 1);
assert.equal(finalClinchStates.filter((state) => state.divisionTitle).length, setup.divisions.length);
assert.equal(finalClinchStates.filter((state) => state.playoffBerth).length, setup.playoffs.fieldSize);
assert.equal(finalClinchStates.filter((state) => state.eliminated).length, setup.teams.length - setup.playoffs.fieldSize);
const finalClinchTimelines = getTeamClinchTimelines(rankingSchedule, 1);
assert.ok(finalClinchTimelines.filter((timeline) => timeline.playoffBerth).every((timeline) => timeline.playoffBerthWeek === 1));
assert.ok(finalClinchTimelines.filter((timeline) => timeline.eliminated).every((timeline) => timeline.eliminatedWeek === 1));

const gotwRanks = new Map(setup.teams.map((team) => [team.id, team.overallRank]));
const gotwCandidates: ScheduledGame[] = [
  { ...rankingGames[0], id: "top-game", homeTeamId: "team-1", awayTeamId: "team-2", matchupRating: 1 },
  { ...rankingGames[0], id: "cutline-game", homeTeamId: "team-6", awayTeamId: "team-7", matchupRating: 1 },
];
assert.equal(calculateMatchupRating(gotwCandidates[0], gotwRanks), 3.7);
assert.equal(calculateMatchupRating(gotwCandidates[1], gotwRanks), 8.7);
assert.equal(getGameOfWeekId(gotwCandidates, gotwRanks), "top-game");
assert.equal(getGameOfWeekId(gotwCandidates, gotwRanks, { weekNumber: 11, regularSeasonWeeks: 14, playoffFieldSize: 6 }), "top-game");
assert.equal(getGameOfWeekId(gotwCandidates, gotwRanks, { weekNumber: 12, regularSeasonWeeks: 14, playoffFieldSize: 6 }), "cutline-game");
assert.equal(getGameOfWeekSelection(gotwCandidates, gotwRanks, { weekNumber: 12, regularSeasonWeeks: 14, playoffFieldSize: 6 })?.playoffImplication, true);
const tiedCandidates = [
  { ...gotwCandidates[0], id: "first-in-order" },
  { ...gotwCandidates[0], id: "alphabetically-first" },
];
assert.equal(getGameOfWeekId(tiedCandidates, gotwRanks), "alphabetically-first");

const ratingCandidates: ScheduledGame[] = [
  { ...rankingGames[0], id: "rating-top", homeTeamId: "team-1", awayTeamId: "team-2", matchupType: "cross-division" },
  { ...rankingGames[0], id: "rating-middle", homeTeamId: "team-3", awayTeamId: "team-6", matchupType: "cross-division" },
  { ...rankingGames[0], id: "rating-bottom", homeTeamId: "team-1", awayTeamId: "team-8", matchupType: "cross-division" },
];
const ratingRange = getMatchupRatingRange(ratingCandidates, gotwRanks);
assert.deepEqual(ratingRange, { min: 3.7, max: 19.9 });
assert.equal(getMatchupSignal(ratingCandidates[0], gotwRanks, ratingRange).label, "Competitive");
assert.equal(getMatchupSignal(ratingCandidates[1], gotwRanks, ratingRange).label, "Neutral");
assert.equal(getMatchupSignal(ratingCandidates[2], gotwRanks, ratingRange).label, "Lopsided");
assert.equal(getMatchupSignal(ratingCandidates[0], gotwRanks, ratingRange).bars, 3);
assert.equal(getMatchupSignal(ratingCandidates[2], gotwRanks, ratingRange).bars, 1);
const orderedRatingGames = orderWeekGamesByMatchupRating([...ratingCandidates].reverse(), gotwRanks);
assert.deepEqual(orderedRatingGames.map((game) => game.id), ["rating-top", "rating-middle", "rating-bottom"]);
assert.deepEqual(orderedRatingGames.map((game) => game.gameNumber), [1, 2, 3]);
const rankedRatingWeeks = normalizeScheduleMatchups([
  { weekNumber: 1, dateLabel: "Week 1", games: [ratingCandidates[2], ratingCandidates[0]] },
  { weekNumber: 2, dateLabel: "Week 2", games: [{ ...ratingCandidates[1], week: 2 }] },
], () => gotwRanks);
assert.equal(rankedRatingWeeks[0].matchupRank, 1);
assert.equal(rankedRatingWeeks[1].matchupRank, 2);
assert.equal(rankedRatingWeeks[0].bestMatchupRating, 3.7);
assert.deepEqual([1, 5, 6, 9, 10, 14].map((rank) => getWeeklyMatchupSignal(rank, 14).bars), [3, 3, 2, 2, 1, 1]);

const timelineSchedule: GeneratedSchedule = {
  ...schedule,
  weeks: [
    schedule.weeks[0],
    { weekNumber: 2, dateLabel: "Week 2", games: gotwCandidates.map((game, index) => ({ ...game, id: `week-2-${index}`, week: 2, homeScore: undefined, awayScore: undefined })) },
    { weekNumber: 3, dateLabel: "Week 3", games: gotwCandidates.map((game, index) => ({ ...game, id: `week-3-${index}`, week: 3, homeScore: undefined, awayScore: undefined })) },
  ],
};
const timeline = getGameOfWeekTimeline(timelineSchedule);
assert.deepEqual(timeline.map((entry) => entry.status), ["previous", "current", "projected"]);
assert.equal(timeline[0].locked, true);
assert.equal(timeline[1].lens, "live");

console.log("Statistics matrix passed: analytics, replayable ranks, clinch timelines, GOTW timeline, and playoff-impact checks.");
