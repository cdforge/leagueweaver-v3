import {
  getPlayoffRoundNames,
  nextPowerOfTwo,
  projectPlayoffSeeds,
  resolvePlayoffPlacementMode,
} from "./playoffs";
import { getWeekOneRankMap } from "./rankings";
import { calculateStandings } from "./standings";
import type { GeneratedSchedule, PlayoffGame, PlayoffSeed, ScheduledGame } from "./types";

export interface StrengthModelOptions {
  /** Number of games required for observed form to carry equal weight with the prior. */
  k: number;
  winPercentageWeight: number;
  pointDifferentialWeight: number;
  strengthOfScheduleWeight: number;
  homeAdvantage: number;
  probabilityScale: number;
}

export interface BlendedTeamStrength {
  teamId: string;
  gamesPlayed: number;
  preseasonRank: number;
  priorStrength: number;
  observedStrength: number;
  blendedStrength: number;
  observationWeight: number;
  winPercentage: number;
  pointDifferentialPerGame: number;
  strengthOfSchedule: number;
}

export interface GameWinProbability {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  home: number;
  away: number;
  homeStrength: number;
  awayStrength: number;
}

export type SimulationResultSource = "recorded" | "simulated" | "override";
export type SimulationPhase = "regular" | "playoff";

export interface SimulationGameResult {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  source: SimulationResultSource;
  locked: boolean;
  phase: SimulationPhase;
  week?: number;
  roundIndex?: number;
  probability?: GameWinProbability;
}

export interface SimulationGamePointer {
  game: ScheduledGame;
  weekNumber: number;
  probability: GameWinProbability;
}

export interface SimulatedPlayoffGame {
  id: string;
  roundIndex: number;
  roundName: string;
  bracketSide?: "A" | "B";
  homeTeamId: string;
  awayTeamId: string;
  homeSeed: number;
  awaySeed: number;
  winnerTeamId: string;
  loserTeamId: string;
  probability: GameWinProbability;
  result: SimulationGameResult;
}

export interface SimulatedPlayoffRound {
  roundIndex: number;
  name: string;
  games: SimulatedPlayoffGame[];
}

export interface SimulatedPlayoffBracket {
  seeds: PlayoffSeed[];
  rounds: SimulatedPlayoffRound[];
  championTeamId: string;
  runnerUpTeamId: string;
}

/** Plain JSON data: no Map, Set, class instance, or function values. */
export interface SimulationSandbox {
  version: 1;
  seed: string;
  generation: number;
  baseSchedule: GeneratedSchedule;
  results: Record<string, SimulationGameResult>;
  probabilitiesByGameId: Record<string, GameWinProbability>;
  playoff?: SimulatedPlayoffBracket;
}

export interface SimulationGameOverride {
  homeScore?: number;
  awayScore?: number;
  winnerTeamId?: string;
  margin?: number;
  locked?: boolean;
}

export interface RerollSimulationOptions {
  scope?: "remaining" | "full";
  fromWeek?: number;
  includePlayoffs?: boolean;
  seed?: string;
}

export type MonteCarloTrialCount = 500 | 1000 | 2000;

export interface MonteCarloConfidence {
  score: number;
  label: "standard" | "strong" | "very-strong";
  marginOfError: number;
}

export interface MonteCarloTeamOdds {
  teamId: string;
  playoffOdds: number;
  divisionOdds: number;
  championshipOdds: number;
  /** Legacy alias retained for existing callers. */
  titleOdds: number;
  topSeedOdds: number;
  projectedWins: number;
  projectedLosses: number;
  projectedTies: number;
  projectedRecord: string;
  averageFinish: number;
  finishDistribution: Array<{ finish: number; probability: number }>;
  confidence: MonteCarloConfidence;
}

export interface MonteCarloOdds {
  trials: MonteCarloTrialCount;
  confidence: MonteCarloConfidence;
  teams: MonteCarloTeamOdds[];
}

export const DEFAULT_STRENGTH_MODEL: StrengthModelOptions = {
  k: 6,
  winPercentageWeight: 0.5,
  pointDifferentialWeight: 0.3,
  strengthOfScheduleWeight: 0.2,
  homeAdvantage: 0.035,
  probabilityScale: 0.16,
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value: number, digits = 6) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function seededRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function cloneSchedule(schedule: GeneratedSchedule): GeneratedSchedule {
  return {
    ...schedule,
    setup: {
      ...schedule.setup,
      divisions: schedule.setup.divisions.map((division) => ({ ...division })),
      teams: schedule.setup.teams.map((team) => ({ ...team })),
      display: { ...schedule.setup.display },
      priorSeason: { ...schedule.setup.priorSeason },
      weekOne: { ...schedule.setup.weekOne },
      playoffs: {
        ...schedule.setup.playoffs,
        lockedTeamIds: [...schedule.setup.playoffs.lockedTeamIds],
        roundNames: schedule.setup.playoffs.roundNames ? [...schedule.setup.playoffs.roundNames] : undefined,
      },
      fairness: { ...schedule.setup.fairness },
    },
    weeks: schedule.weeks.map((week) => ({
      ...week,
      games: week.games.map((game) => ({ ...game, notes: game.notes ? [...game.notes] : undefined })),
    })),
    playoffGames: schedule.playoffGames?.map((game) => ({ ...game, notes: game.notes ? [...game.notes] : undefined })),
    rankHistory: schedule.rankHistory?.map((snapshot) => ({
      ...snapshot,
      rows: snapshot.rows.map((row) => ({ ...row })),
    })),
    fairness: { ...schedule.fairness, notes: [...schedule.fairness.notes] },
  };
}

function withoutScores<T extends ScheduledGame>(game: T): T {
  const copy = { ...game };
  delete copy.homeScore;
  delete copy.awayScore;
  return copy;
}

function orderedRegularGames(schedule: GeneratedSchedule) {
  return [...schedule.weeks]
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .flatMap((week) => week.games.map((game, gameIndex) => ({ game, weekNumber: week.weekNumber, gameIndex })));
}

function findRegularGame(schedule: GeneratedSchedule, gameId: string) {
  return orderedRegularGames(schedule).find((item) => item.game.id === gameId);
}

function normalizeStrengthOptions(options?: Partial<StrengthModelOptions>): StrengthModelOptions {
  const merged = { ...DEFAULT_STRENGTH_MODEL, ...options };
  const total = merged.winPercentageWeight + merged.pointDifferentialWeight + merged.strengthOfScheduleWeight;
  return {
    ...merged,
    k: Math.max(0.01, merged.k),
    probabilityScale: Math.max(0.01, merged.probabilityScale),
    winPercentageWeight: merged.winPercentageWeight / total,
    pointDifferentialWeight: merged.pointDifferentialWeight / total,
    strengthOfScheduleWeight: merged.strengthOfScheduleWeight / total,
  };
}

/**
 * R = (1 - w) * R_prior + w * R_observed, where w = gamesPlayed / (gamesPlayed + K).
 * All component strengths are normalized to 0..1 with higher values meaning stronger teams.
 */
export function calculateBlendedTeamStrengths(
  schedule: GeneratedSchedule,
  options?: Partial<StrengthModelOptions>,
): BlendedTeamStrength[] {
  const model = normalizeStrengthOptions(options);
  const standings = calculateStandings(schedule);
  const rowByTeamId = new Map(standings.map((row) => [row.teamId, row]));
  const preseasonRanks = getWeekOneRankMap(schedule.setup);
  const opponentsByTeamId = new Map(schedule.setup.teams.map((team) => [team.id, [] as string[]]));

  for (const { game } of orderedRegularGames(schedule)) {
    if (game.homeScore == null || game.awayScore == null) continue;
    opponentsByTeamId.get(game.homeTeamId)?.push(game.awayTeamId);
    opponentsByTeamId.get(game.awayTeamId)?.push(game.homeTeamId);
  }

  const teamCount = schedule.setup.teams.length;
  return schedule.setup.teams.map((team) => {
    const row = rowByTeamId.get(team.id);
    const gamesPlayed = row ? row.wins + row.losses + row.ties : 0;
    const preseasonRank = preseasonRanks.get(team.id) ?? team.overallRank ?? teamCount;
    const rankRange = Math.max(1, teamCount - 1);
    const priorStrength = clamp(1 - (preseasonRank - 1) / rankRange, 0.05, 0.95);
    const winPercentage = row?.winPercentage ?? 0;
    const pointDifferentialPerGame = gamesPlayed
      ? ((row?.pointsFor ?? 0) - (row?.pointsAgainst ?? 0)) / gamesPlayed
      : 0;
    const pointDifferentialStrength = 0.5 + 0.5 * Math.tanh(pointDifferentialPerGame / 35);
    const opponents = opponentsByTeamId.get(team.id) ?? [];
    const strengthOfSchedule = opponents.length
      ? opponents.reduce((sum, opponentId) => sum + (rowByTeamId.get(opponentId)?.winPercentage ?? 0.5), 0) / opponents.length
      : 0.5;
    const observedStrength =
      winPercentage * model.winPercentageWeight
      + pointDifferentialStrength * model.pointDifferentialWeight
      + strengthOfSchedule * model.strengthOfScheduleWeight;
    const observationWeight = gamesPlayed / (gamesPlayed + model.k);
    const blendedStrength = (1 - observationWeight) * priorStrength + observationWeight * observedStrength;
    return {
      teamId: team.id,
      gamesPlayed,
      preseasonRank,
      priorStrength: round(priorStrength),
      observedStrength: round(observedStrength),
      blendedStrength: round(blendedStrength),
      observationWeight: round(observationWeight),
      winPercentage: round(winPercentage),
      pointDifferentialPerGame: round(pointDifferentialPerGame),
      strengthOfSchedule: round(strengthOfSchedule),
    };
  });
}

function probabilityFromStrengths(
  gameId: string,
  homeTeamId: string,
  awayTeamId: string,
  strengths: Map<string, BlendedTeamStrength>,
  model: StrengthModelOptions,
  homeAdvantage = model.homeAdvantage,
): GameWinProbability {
  const homeStrength = strengths.get(homeTeamId)?.blendedStrength ?? 0.5;
  const awayStrength = strengths.get(awayTeamId)?.blendedStrength ?? 0.5;
  const home = clamp(1 / (1 + Math.exp(-((homeStrength + homeAdvantage - awayStrength) / model.probabilityScale))), 0.02, 0.98);
  return {
    gameId,
    homeTeamId,
    awayTeamId,
    home: round(home),
    away: round(1 - home),
    homeStrength,
    awayStrength,
  };
}

export function getGameWinProbability(
  schedule: GeneratedSchedule,
  gameOrId: Pick<ScheduledGame, "id" | "homeTeamId" | "awayTeamId"> | string,
  options?: Partial<StrengthModelOptions>,
): GameWinProbability {
  const game = typeof gameOrId === "string"
    ? orderedRegularGames(schedule).find((item) => item.game.id === gameOrId)?.game
      ?? schedule.playoffGames?.find((item) => item.id === gameOrId)
    : gameOrId;
  if (!game) throw new Error(`Unknown game: ${String(gameOrId)}`);
  const model = normalizeStrengthOptions(options);
  const strengths = new Map(calculateBlendedTeamStrengths(schedule, model).map((strength) => [strength.teamId, strength]));
  return probabilityFromStrengths(game.id, game.homeTeamId, game.awayTeamId, strengths, model);
}

/** Alias retained for callers that use the longer calculation name. */
export const calculateGameWinProbability = getGameWinProbability;

function recordedResults(schedule: GeneratedSchedule) {
  const results: Record<string, SimulationGameResult> = {};
  for (const { game, weekNumber } of orderedRegularGames(schedule)) {
    if (game.homeScore == null || game.awayScore == null) continue;
    results[game.id] = {
      gameId: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      source: "recorded",
      locked: true,
      phase: "regular",
      week: weekNumber,
    };
  }
  for (const game of schedule.playoffGames ?? []) {
    if (game.homeScore == null || game.awayScore == null) continue;
    results[game.id] = {
      gameId: game.id,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      source: "recorded",
      locked: true,
      phase: "playoff",
      roundIndex: game.roundIndex,
    };
  }
  return results;
}

function bracketAsPlayoffGames(sandbox: SimulationSandbox): PlayoffGame[] | undefined {
  if (!sandbox.playoff) return undefined;
  const teamById = new Map(sandbox.baseSchedule.setup.teams.map((team) => [team.id, team]));
  return sandbox.playoff.rounds.flatMap((round) => round.games.map((game) => ({
    id: game.id,
    week: sandbox.baseSchedule.setup.weeks + round.roundIndex + 1,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    matchupType: teamById.get(game.homeTeamId)?.divisionId === teamById.get(game.awayTeamId)?.divisionId ? "division" : "cross-division",
    seriesGame: 1,
    seriesLength: 1,
    dateLabel: game.roundName,
    stadium: teamById.get(game.homeTeamId)?.stadium ?? "Venue TBD",
    homeScore: game.result.homeScore,
    awayScore: game.result.awayScore,
    round: game.roundName,
    roundIndex: game.roundIndex,
    roundLogoUrl: sandbox.baseSchedule.setup.playoffs.logoUrl,
    bracket: "main",
  })));
}

export function materializeSimulationSchedule(sandbox: SimulationSandbox): GeneratedSchedule {
  const schedule = cloneSchedule(sandbox.baseSchedule);
  const weeks = schedule.weeks.map((week) => ({
    ...week,
    games: week.games.map((game) => {
      const result = sandbox.results[game.id];
      return result
        ? { ...withoutScores(game), homeScore: result.homeScore, awayScore: result.awayScore }
        : withoutScores(game);
    }),
  }));
  const simulatedPlayoffGames = bracketAsPlayoffGames(sandbox);
  const playoffGames = simulatedPlayoffGames ?? schedule.playoffGames?.map((game) => {
    const result = sandbox.results[game.id];
    return result
      ? { ...withoutScores(game), homeScore: result.homeScore, awayScore: result.awayScore }
      : withoutScores(game);
  });
  return { ...schedule, weeks, playoffGames };
}

function refreshProbabilities(sandbox: SimulationSandbox): SimulationSandbox {
  const schedule = materializeSimulationSchedule(sandbox);
  const model = normalizeStrengthOptions();
  const strengths = new Map(calculateBlendedTeamStrengths(schedule, model).map((strength) => [strength.teamId, strength]));
  const probabilitiesByGameId: Record<string, GameWinProbability> = {};
  for (const { game } of orderedRegularGames(schedule)) {
    if (sandbox.results[game.id]) continue;
    probabilitiesByGameId[game.id] = probabilityFromStrengths(
      game.id,
      game.homeTeamId,
      game.awayTeamId,
      strengths,
      model,
    );
  }
  return { ...sandbox, probabilitiesByGameId };
}

function createSimulationSandboxInternal(schedule: GeneratedSchedule, seed: string, withProbabilities: boolean): SimulationSandbox {
  const sandbox: SimulationSandbox = {
    version: 1,
    seed,
    generation: 0,
    baseSchedule: cloneSchedule(schedule),
    results: recordedResults(schedule),
    probabilitiesByGameId: {},
  };
  return withProbabilities ? refreshProbabilities(sandbox) : sandbox;
}

export function createSimulationSandbox(
  schedule: GeneratedSchedule,
  seed = `${schedule.seed}:simulation`,
): SimulationSandbox {
  return createSimulationSandboxInternal(schedule, seed, true);
}

export function restartSimulationFromBeginning(sandbox: SimulationSandbox): SimulationSandbox {
  return refreshProbabilities({
    ...sandbox,
    generation: sandbox.generation + 1,
    baseSchedule: {
      ...sandbox.baseSchedule,
      playoffGames: undefined,
      rankHistory: undefined,
    },
    results: {},
    playoff: undefined,
  });
}

export function getNextSimulationGame(sandbox: SimulationSandbox): SimulationGamePointer | undefined {
  const next = orderedRegularGames(sandbox.baseSchedule).find(({ game }) => !sandbox.results[game.id]);
  if (!next) return undefined;
  const schedule = materializeSimulationSchedule(sandbox);
  return {
    game: { ...next.game, notes: next.game.notes ? [...next.game.notes] : undefined },
    weekNumber: next.weekNumber,
    probability: sandbox.probabilitiesByGameId[next.game.id] ?? getGameWinProbability(schedule, next.game),
  };
}

function simulateScore(probability: GameWinProbability, seed: string) {
  const random = seededRandom(seed);
  const homeWins = random() < probability.home;
  let homeScore = Math.round(78 + probability.homeStrength * 52 + random() * 45);
  let awayScore = Math.round(78 + probability.awayStrength * 52 + random() * 45);
  const margin = 1 + Math.floor(random() * 13);
  if (homeWins && homeScore <= awayScore) homeScore = awayScore + margin;
  if (!homeWins && awayScore <= homeScore) awayScore = homeScore + margin;
  return { homeScore, awayScore };
}

function withoutHypotheticalPlayoffs(results: Record<string, SimulationGameResult>) {
  return Object.fromEntries(Object.entries(results).filter(([, result]) => result.phase !== "playoff" || result.source === "recorded"));
}

function simulateRegularGame(sandbox: SimulationSandbox, pointer: SimulationGamePointer, refresh: boolean) {
  if (sandbox.results[pointer.game.id]) return sandbox;
  const schedule = materializeSimulationSchedule(sandbox);
  const probability = getGameWinProbability(schedule, pointer.game);
  const scores = simulateScore(probability, `${sandbox.seed}:${sandbox.generation}:${pointer.game.id}`);
  const result: SimulationGameResult = {
    gameId: pointer.game.id,
    homeTeamId: pointer.game.homeTeamId,
    awayTeamId: pointer.game.awayTeamId,
    ...scores,
    source: "simulated",
    locked: false,
    phase: "regular",
    week: pointer.weekNumber,
    probability,
  };
  const next = {
    ...sandbox,
    generation: sandbox.generation + 1,
    results: { ...withoutHypotheticalPlayoffs(sandbox.results), [result.gameId]: result },
    playoff: undefined,
  };
  return refresh ? refreshProbabilities(next) : next;
}

export function simulateNextGame(sandbox: SimulationSandbox, gameId?: string): SimulationSandbox {
  const basePointer = gameId
    ? orderedRegularGames(sandbox.baseSchedule).find((item) => item.game.id === gameId)
    : undefined;
  if (gameId && !basePointer) throw new Error(`Unknown regular-season game: ${gameId}`);
  if (gameId && sandbox.results[gameId]) return sandbox;
  const pointer = basePointer
    ? {
        game: basePointer.game,
        weekNumber: basePointer.weekNumber,
        probability: sandbox.probabilitiesByGameId[basePointer.game.id]
          ?? getGameWinProbability(materializeSimulationSchedule(sandbox), basePointer.game),
      }
    : getNextSimulationGame(sandbox);
  return pointer ? simulateRegularGame(sandbox, pointer, true) : sandbox;
}

export function rerollSimulationGame(sandbox: SimulationSandbox, gameId: string): SimulationSandbox {
  const result = sandbox.results[gameId];
  if (!result || result.source === "recorded" || result.locked || result.phase !== "regular") return sandbox;
  const results = Object.fromEntries(Object.entries(sandbox.results).filter(([id, item]) =>
    id !== gameId && (item.phase !== "playoff" || item.source === "recorded"),
  ));
  const reset = refreshProbabilities({
    ...sandbox,
    generation: sandbox.generation + 1,
    results,
    playoff: undefined,
  });
  return simulateNextGame(reset, gameId);
}

export function simulateThroughWeek(sandbox: SimulationSandbox, throughWeek: number): SimulationSandbox {
  let next = sandbox;
  for (const item of orderedRegularGames(sandbox.baseSchedule)) {
    if (item.weekNumber > throughWeek || next.results[item.game.id]) continue;
    next = simulateRegularGame(next, {
      game: item.game,
      weekNumber: item.weekNumber,
      probability: next.probabilitiesByGameId[item.game.id]
        ?? getGameWinProbability(materializeSimulationSchedule(next), item.game),
    }, false);
  }
  return refreshProbabilities(next);
}

export function simulateNextWeek(sandbox: SimulationSandbox): SimulationSandbox {
  const next = getNextSimulationGame(sandbox);
  return next ? simulateThroughWeek(sandbox, next.weekNumber) : sandbox;
}

export function simulateFirstHalf(sandbox: SimulationSandbox): SimulationSandbox {
  return simulateThroughWeek(sandbox, Math.ceil(sandbox.baseSchedule.setup.weeks / 2));
}

export function simulateRestOfSeason(sandbox: SimulationSandbox): SimulationSandbox {
  const finalWeek = Math.max(0, ...sandbox.baseSchedule.weeks.map((week) => week.weekNumber));
  return simulateThroughWeek(sandbox, finalWeek);
}

function findSandboxGame(sandbox: SimulationSandbox, gameId: string) {
  const regular = findRegularGame(sandbox.baseSchedule, gameId);
  if (regular) return { ...regular, phase: "regular" as const };
  const playoff = sandbox.playoff?.rounds.flatMap((round) => round.games).find((game) => game.id === gameId);
  return playoff ? { game: playoff, roundIndex: playoff.roundIndex, phase: "playoff" as const } : undefined;
}

export function overrideSimulationGame(
  sandbox: SimulationSandbox,
  gameId: string,
  override: SimulationGameOverride,
): SimulationSandbox {
  const known = findSandboxGame(sandbox, gameId);
  if (!known) throw new Error(`Unknown simulation game: ${gameId}`);
  if (sandbox.results[gameId]?.source === "recorded") throw new Error("Recorded results are anchored and cannot be overridden.");

  const game = known.game;
  const homeTeamId = game.homeTeamId;
  const awayTeamId = game.awayTeamId;
  const probability = known.phase === "regular"
    ? getGameWinProbability(materializeSimulationSchedule(sandbox), game)
    : sandbox.playoff?.rounds.flatMap((round) => round.games).find((item) => item.id === gameId)?.probability;
  let homeScore = Number(override.homeScore);
  let awayScore = Number(override.awayScore);
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    if (override.winnerTeamId !== homeTeamId && override.winnerTeamId !== awayTeamId) {
      throw new Error("An override needs both scores or a valid winnerTeamId.");
    }
    const baseline = simulateScore(
      probability ?? {
        gameId,
        homeTeamId,
        awayTeamId,
        home: 0.5,
        away: 0.5,
        homeStrength: 0.5,
        awayStrength: 0.5,
      },
      `${sandbox.seed}:override:${sandbox.generation}:${gameId}`,
    );
    const margin = Math.max(1, Math.round(override.margin ?? 7));
    homeScore = baseline.homeScore;
    awayScore = baseline.awayScore;
    if (override.winnerTeamId === homeTeamId && homeScore <= awayScore) homeScore = awayScore + margin;
    if (override.winnerTeamId === awayTeamId && awayScore <= homeScore) awayScore = homeScore + margin;
  }
  homeScore = Math.max(0, Math.round(homeScore));
  awayScore = Math.max(0, Math.round(awayScore));
  const result: SimulationGameResult = {
    gameId,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    source: "override",
    locked: override.locked ?? sandbox.results[gameId]?.locked ?? false,
    phase: known.phase,
    week: known.phase === "regular" ? known.weekNumber : undefined,
    roundIndex: known.phase === "playoff" ? known.roundIndex : undefined,
    probability,
  };
  const results = known.phase === "regular"
    ? { ...withoutHypotheticalPlayoffs(sandbox.results), [gameId]: result }
    : Object.fromEntries(Object.entries({ ...sandbox.results, [gameId]: result }).filter(([, item]) =>
        item.phase !== "playoff"
        || item.source === "recorded"
        || item.gameId === gameId
        || (item.roundIndex ?? -1) < (known.roundIndex ?? 0),
      ));
  return refreshProbabilities({
    ...sandbox,
    generation: sandbox.generation + 1,
    results,
    playoff: undefined,
  });
}

export function toggleSimulationGameLock(sandbox: SimulationSandbox, gameId: string): SimulationSandbox {
  const result = sandbox.results[gameId];
  if (!result || result.source === "recorded") return sandbox;
  return {
    ...sandbox,
    results: { ...sandbox.results, [gameId]: { ...result, locked: !result.locked } },
  };
}

export function clearSimulationResults(
  sandbox: SimulationSandbox,
  mode: "simulated" | "hypothetical" = "simulated",
): SimulationSandbox {
  const results = Object.fromEntries(Object.entries(sandbox.results).filter(([, result]) =>
    result.source === "recorded" || (mode === "simulated" && result.source === "override"),
  ));
  return refreshProbabilities({
    ...sandbox,
    generation: sandbox.generation + 1,
    results,
    playoff: undefined,
  });
}

export function clearSimulatedResults(sandbox: SimulationSandbox) {
  return clearSimulationResults(sandbox, "simulated");
}

export function clearAllHypotheticalResults(sandbox: SimulationSandbox) {
  return clearSimulationResults(sandbox, "hypothetical");
}

interface PlayoffParticipant {
  teamId: string;
  seed: number;
  slotSeed: number;
  divisionId: string;
  divisionLeader: boolean;
  bracketSide?: "A" | "B";
}

function participantFromSeed(seed: PlayoffSeed): PlayoffParticipant {
  return {
    teamId: seed.teamId,
    seed: seed.seed,
    slotSeed: seed.seed,
    divisionId: seed.divisionId,
    divisionLeader: seed.divisionLeader,
    bracketSide: seed.bracketSide,
  };
}

function participantOrder(participant: PlayoffParticipant, reseedMode: GeneratedSchedule["setup"]["playoffs"]["reseedMode"]) {
  if (reseedMode === "fixed") return participant.slotSeed;
  if (reseedMode === "protected" && participant.divisionLeader) return participant.seed - 1000;
  return participant.seed;
}

function recordedPlayoffMatch(
  sandbox: SimulationSandbox,
  roundIndex: number,
  homeTeamId: string,
  awayTeamId: string,
) {
  return (sandbox.baseSchedule.playoffGames ?? []).find((game) =>
    game.roundIndex === roundIndex
    && ((game.homeTeamId === homeTeamId && game.awayTeamId === awayTeamId)
      || (game.homeTeamId === awayTeamId && game.awayTeamId === homeTeamId)),
  );
}

function orientResult(result: SimulationGameResult, homeTeamId: string, awayTeamId: string): SimulationGameResult {
  if (result.homeTeamId === homeTeamId && result.awayTeamId === awayTeamId) return result;
  return {
    ...result,
    homeTeamId,
    awayTeamId,
    homeScore: result.awayScore,
    awayScore: result.homeScore,
  };
}

interface PlayoffRunContext {
  sandbox: SimulationSandbox;
  schedule: GeneratedSchedule;
  roundNames: string[];
  roundGames: SimulatedPlayoffGame[][];
  gameCounts: number[];
}

function simulatePlayoffMatch(
  context: PlayoffRunContext,
  left: PlayoffParticipant,
  right: PlayoffParticipant,
  roundIndex: number,
  bracketSide?: "A" | "B",
): { winner: PlayoffParticipant; loser: PlayoffParticipant; game: SimulatedPlayoffGame } {
  const higherSeed = left.seed < right.seed ? left : right;
  const lowerSeed = higherSeed === left ? right : left;
  const neutral = roundIndex === context.roundNames.length - 1
    && context.sandbox.baseSchedule.setup.playoffs.championshipVenueMode === "neutral-site";
  const home = neutral ? left : higherSeed;
  const away = home === left ? right : left;
  const gameIndex = context.gameCounts[roundIndex] ?? 0;
  context.gameCounts[roundIndex] = gameIndex + 1;
  const id = `sim-playoff-r${roundIndex + 1}-g${gameIndex + 1}`;
  const model = normalizeStrengthOptions({ homeAdvantage: neutral ? 0 : DEFAULT_STRENGTH_MODEL.homeAdvantage });
  const strengths = new Map(calculateBlendedTeamStrengths(context.schedule, model).map((item) => [item.teamId, item]));
  const probability = probabilityFromStrengths(id, home.teamId, away.teamId, strengths, model, neutral ? 0 : model.homeAdvantage);
  const existingRecorded = recordedPlayoffMatch(context.sandbox, roundIndex, home.teamId, away.teamId);
  const recordedResult = existingRecorded ? context.sandbox.results[existingRecorded.id] : undefined;
  const existingGenerated = context.sandbox.results[id];
  const reusableGenerated = existingGenerated
    && new Set([existingGenerated.homeTeamId, existingGenerated.awayTeamId]).size === 2
    && [existingGenerated.homeTeamId, existingGenerated.awayTeamId].includes(home.teamId)
    && [existingGenerated.homeTeamId, existingGenerated.awayTeamId].includes(away.teamId)
    ? existingGenerated
    : undefined;
  const reusable = recordedResult ?? reusableGenerated;
  const result = reusable
    ? { ...orientResult(reusable, home.teamId, away.teamId), gameId: id, roundIndex, probability }
    : {
        gameId: id,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        ...simulateScore(probability, `${context.sandbox.seed}:playoff:${context.sandbox.generation}:${id}`),
        source: "simulated" as const,
        locked: false,
        phase: "playoff" as const,
        roundIndex,
        probability,
      };
  const homeWon = result.homeScore >= result.awayScore;
  const winnerSource = homeWon ? home : away;
  const loser = homeWon ? away : home;
  const winner = { ...winnerSource, slotSeed: Math.min(left.slotSeed, right.slotSeed) };
  context.sandbox = {
    ...context.sandbox,
    generation: context.sandbox.generation + (reusable ? 0 : 1),
    results: { ...context.sandbox.results, [id]: result },
  };
  const game: SimulatedPlayoffGame = {
    id,
    roundIndex,
    roundName: context.roundNames[roundIndex] ?? `Round ${roundIndex + 1}`,
    bracketSide,
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeSeed: home.seed,
    awaySeed: away.seed,
    winnerTeamId: winner.teamId,
    loserTeamId: loser.teamId,
    probability,
    result,
  };
  context.roundGames[roundIndex] ??= [];
  context.roundGames[roundIndex].push(game);
  return { winner, loser, game };
}

function simulateEliminationGroup(
  context: PlayoffRunContext,
  initial: PlayoffParticipant[],
  bracketSide?: "A" | "B",
) {
  let participants = [...initial];
  let roundIndex = 0;
  let runnerUp: PlayoffParticipant | undefined;
  while (participants.length > 1) {
    const reseedMode = context.sandbox.baseSchedule.setup.playoffs.reseedMode;
    const ordered = [...participants].sort((left, right) => participantOrder(left, reseedMode) - participantOrder(right, reseedMode));
    const byeCount = nextPowerOfTwo(ordered.length) - ordered.length;
    const advancing = ordered.slice(0, byeCount);
    const playing = ordered.slice(byeCount);
    const winners: PlayoffParticipant[] = [];
    for (let index = 0; index < Math.floor(playing.length / 2); index += 1) {
      const left = playing[index];
      const right = playing[playing.length - 1 - index];
      const result = simulatePlayoffMatch(context, left, right, roundIndex, bracketSide);
      winners.push(result.winner);
      if (ordered.length === 2) runnerUp = result.loser;
    }
    participants = [...advancing, ...winners];
    roundIndex += 1;
  }
  return { champion: participants[0], runnerUp, rounds: roundIndex };
}

function simulateLadder(context: PlayoffRunContext, seeds: PlayoffParticipant[]) {
  const descending = [...seeds].sort((left, right) => right.seed - left.seed);
  let incumbent = descending[0];
  let runnerUp = descending[1];
  for (let index = 1; index < descending.length; index += 1) {
    const result = simulatePlayoffMatch(context, incumbent, descending[index], index - 1);
    incumbent = result.winner;
    runnerUp = result.loser;
  }
  return { champion: incumbent, runnerUp };
}

export function simulatePlayoffBracket(sandbox: SimulationSandbox): SimulationSandbox {
  const regularComplete = simulateRestOfSeason(sandbox);
  const schedule = materializeSimulationSchedule(regularComplete);
  const seeds = projectPlayoffSeeds(schedule);
  if (seeds.length < 2) return regularComplete;
  const roundNames = getPlayoffRoundNames(schedule.setup.playoffs, schedule.setup.divisions.length);
  const context: PlayoffRunContext = {
    sandbox: regularComplete,
    schedule,
    roundNames,
    roundGames: [],
    gameCounts: [],
  };
  const participants = seeds.map(participantFromSeed);
  let champion: PlayoffParticipant;
  let runnerUp: PlayoffParticipant;

  if (schedule.setup.playoffs.bracketType === "ladder") {
    ({ champion, runnerUp } = simulateLadder(context, participants));
  } else if (resolvePlayoffPlacementMode(schedule.setup) === "division-halves") {
    const sideA = participants.filter((participant) => participant.bracketSide === "A");
    const sideB = participants.filter((participant) => participant.bracketSide === "B");
    const left = simulateEliminationGroup(context, sideA, "A");
    const right = simulateEliminationGroup(context, sideB, "B");
    const finalRoundIndex = Math.max(left.rounds, right.rounds);
    const final = simulatePlayoffMatch(context, left.champion, right.champion, finalRoundIndex);
    champion = final.winner;
    runnerUp = final.loser;
  } else {
    const result = simulateEliminationGroup(context, participants);
    champion = result.champion;
    runnerUp = result.runnerUp ?? participants.find((participant) => participant.teamId !== champion.teamId)!;
  }

  const rounds = context.roundGames
    .map((games, roundIndex) => ({ roundIndex, name: roundNames[roundIndex] ?? `Round ${roundIndex + 1}`, games }))
    .filter((round) => round.games.length > 0);
  const validIds = new Set(rounds.flatMap((round) => round.games.map((game) => game.id)));
  const results = Object.fromEntries(Object.entries(context.sandbox.results).filter(([, result]) =>
    result.phase !== "playoff" || result.source === "recorded" || validIds.has(result.gameId),
  ));
  const playoff = { seeds, rounds, championTeamId: champion.teamId, runnerUpTeamId: runnerUp.teamId };
  return refreshProbabilities({ ...context.sandbox, results, playoff });
}

export function simulateToChampion(sandbox: SimulationSandbox): SimulationSandbox {
  return simulatePlayoffBracket(simulateRestOfSeason(sandbox));
}

export function rerollSimulation(sandbox: SimulationSandbox, options: RerollSimulationOptions = {}): SimulationSandbox {
  const scope = options.scope ?? "remaining";
  const regularGames = orderedRegularGames(sandbox.baseSchedule);
  const nextUnresolved = regularGames.find(({ game }) => !sandbox.results[game.id]);
  const firstHypotheticalWeek = Math.min(
    ...Object.values(sandbox.results)
      .filter((result) => result.phase === "regular" && result.source !== "recorded")
      .map((result) => result.week ?? Number.POSITIVE_INFINITY),
  );
  const fromWeek = scope === "full"
    ? Number.NEGATIVE_INFINITY
    : options.fromWeek ?? nextUnresolved?.weekNumber ?? firstHypotheticalWeek;
  const results = Object.fromEntries(Object.entries(sandbox.results).filter(([, result]) => {
    if (result.source === "recorded" || result.locked) return true;
    if (result.phase === "playoff") return false;
    return (result.week ?? Number.POSITIVE_INFINITY) < fromWeek;
  }));
  let rerolled = refreshProbabilities({
    ...sandbox,
    seed: options.seed ?? sandbox.seed,
    generation: sandbox.generation + 1,
    results,
    playoff: undefined,
  });
  rerolled = simulateRestOfSeason(rerolled);
  return options.includePlayoffs || Boolean(sandbox.playoff) ? simulateToChampion(rerolled) : rerolled;
}

/** Legacy schedule-in/schedule-out helper retained for all existing callers. */
export function simulateRemainingSeason(schedule: GeneratedSchedule, seed = `${schedule.seed}:simulation`) {
  return materializeSimulationSchedule(simulateRestOfSeason(createSimulationSandboxInternal(schedule, seed, false)));
}

function normalizeTrials(trials: number): MonteCarloTrialCount {
  if (trials === 2000) return 2000;
  if (trials === 1000) return 1000;
  return 500;
}

function monteCarloConfidence(trials: MonteCarloTrialCount): MonteCarloConfidence {
  const marginOfError = 1.96 * Math.sqrt(0.25 / trials);
  return {
    score: round(1 - marginOfError),
    label: trials === 2000 ? "very-strong" : trials === 1000 ? "strong" : "standard",
    marginOfError: round(marginOfError),
  };
}

export function calculateMonteCarloOdds(
  schedule: GeneratedSchedule,
  requestedTrials: MonteCarloTrialCount = 500,
  seed = `${schedule.seed}:odds`,
): MonteCarloOdds {
  const trials = normalizeTrials(requestedTrials);
  const teamIds = schedule.setup.teams.map((team) => team.id);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const playoffCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
  const divisionCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
  const championshipCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
  const topSeedCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
  const finishTotals = new Map(teamIds.map((teamId) => [teamId, 0]));
  const winTotals = new Map(teamIds.map((teamId) => [teamId, 0]));
  const lossTotals = new Map(teamIds.map((teamId) => [teamId, 0]));
  const tieTotals = new Map(teamIds.map((teamId) => [teamId, 0]));
  const finishCounts = new Map(teamIds.map((teamId) => [teamId, Array.from({ length: teamIds.length }, () => 0)]));

  for (let trial = 0; trial < trials; trial += 1) {
    const initial = createSimulationSandboxInternal(schedule, `${seed}:trial:${trial}`, false);
    const completed = simulateToChampion(initial);
    const simulatedSchedule = materializeSimulationSchedule(completed);
    const standings = calculateStandings(simulatedSchedule);
    standings.forEach((row, index) => {
      const finish = index + 1;
      finishTotals.set(row.teamId, (finishTotals.get(row.teamId) ?? 0) + finish);
      winTotals.set(row.teamId, (winTotals.get(row.teamId) ?? 0) + row.wins);
      lossTotals.set(row.teamId, (lossTotals.get(row.teamId) ?? 0) + row.losses);
      tieTotals.set(row.teamId, (tieTotals.get(row.teamId) ?? 0) + row.ties);
      finishCounts.get(row.teamId)![index] += 1;
    });
    if (standings[0]) topSeedCounts.set(standings[0].teamId, (topSeedCounts.get(standings[0].teamId) ?? 0) + 1);
    const divisionWinners = new Set<string>();
    for (const division of schedule.setup.divisions) {
      const winner = standings.find((row) => teamById.get(row.teamId)?.divisionId === division.id);
      if (winner) divisionWinners.add(winner.teamId);
    }
    for (const teamId of divisionWinners) divisionCounts.set(teamId, (divisionCounts.get(teamId) ?? 0) + 1);
    for (const playoffSeed of completed.playoff?.seeds ?? []) {
      playoffCounts.set(playoffSeed.teamId, (playoffCounts.get(playoffSeed.teamId) ?? 0) + 1);
    }
    if (completed.playoff?.championTeamId) {
      championshipCounts.set(
        completed.playoff.championTeamId,
        (championshipCounts.get(completed.playoff.championTeamId) ?? 0) + 1,
      );
    }
  }

  const confidence = monteCarloConfidence(trials);
  const teams = teamIds.map((teamId) => {
    const championshipOdds = (championshipCounts.get(teamId) ?? 0) / trials;
    const projectedWins = (winTotals.get(teamId) ?? 0) / trials;
    const projectedLosses = (lossTotals.get(teamId) ?? 0) / trials;
    const projectedTies = (tieTotals.get(teamId) ?? 0) / trials;
    return {
      teamId,
      playoffOdds: round((playoffCounts.get(teamId) ?? 0) / trials),
      divisionOdds: round((divisionCounts.get(teamId) ?? 0) / trials),
      championshipOdds: round(championshipOdds),
      titleOdds: round(championshipOdds),
      topSeedOdds: round((topSeedCounts.get(teamId) ?? 0) / trials),
      projectedWins: round(projectedWins, 3),
      projectedLosses: round(projectedLosses, 3),
      projectedTies: round(projectedTies, 3),
      projectedRecord: projectedTies
        ? `${projectedWins.toFixed(1)}-${projectedLosses.toFixed(1)}-${projectedTies.toFixed(1)}`
        : `${projectedWins.toFixed(1)}-${projectedLosses.toFixed(1)}`,
      averageFinish: round((finishTotals.get(teamId) ?? 0) / trials, 3),
      finishDistribution: (finishCounts.get(teamId) ?? []).map((count, index) => ({
        finish: index + 1,
        probability: round(count / trials),
      })),
      confidence,
    } satisfies MonteCarloTeamOdds;
  }).sort((left, right) =>
    right.playoffOdds - left.playoffOdds
    || right.championshipOdds - left.championshipOdds
    || left.averageFinish - right.averageFinish,
  );
  return { trials, confidence, teams };
}

/** Existing array return shape is preserved and expanded with the new odds fields. */
export function calculateSeasonOdds(schedule: GeneratedSchedule, trials = 500): MonteCarloTeamOdds[] {
  return calculateMonteCarloOdds(schedule, normalizeTrials(trials)).teams;
}
