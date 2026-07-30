import { getPlayoffRoundNames, normalizePlayoffSettings, projectPlayoffRounds, projectPlayoffSeeds } from "./playoffs";
import { calculateStandings } from "./standings";
import type { GeneratedSchedule, LeagueSetupInput, PlayoffConsolationMode } from "./types";

export type ProjectedConsolationEntrant =
  | {
      kind: "team";
      teamId: string;
      seed: number;
      divisionId: string;
      label: string;
      projectedSeed: number;
    }
  | {
      kind: "result";
      gameId: string;
      outcome: "winner" | "loser";
      label: string;
      projectedSeed: number;
    };

export interface ProjectedConsolationGame {
  id: string;
  roundIndex: number;
  weekNumber: number;
  label: string;
  placementRange: [number, number];
  divisionId?: string;
  entrants: [ProjectedConsolationEntrant, ProjectedConsolationEntrant];
}

export interface ProjectedConsolationRound {
  roundIndex: number;
  weekNumber: number;
  name: string;
  games: ProjectedConsolationGame[];
}

export interface ProjectedConsolationBracket {
  requestedMode: PlayoffConsolationMode;
  mode: Exclude<PlayoffConsolationMode, "off">;
  fallbackReason?: string;
  rounds: ProjectedConsolationRound[];
}

export interface ProjectedFinalPlacement {
  place: number;
  teamId: string;
  status: "projected" | "final";
  eventLabel?: string;
  weekNumber?: number;
}

function ordinal(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function placementLabel(start: number, end: number) {
  return start === end - 1 ? `${ordinal(start)} Place` : `${ordinal(start)}-${ordinal(end)} Placement`;
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0;
}

export function isDivisionHalvesConsolationUsable(
  setup: Pick<LeagueSetupInput, "teams" | "divisions" | "playoffs">,
  fieldSize = setup.playoffs.fieldSize,
) {
  if (setup.divisions.length !== 2 || setup.teams.length - fieldSize !== 4) return false;
  const teamsPerDivision = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
  return teamsPerDivision[0] === teamsPerDivision[1] && fieldSize % 2 === 0;
}

export function projectConsolationBracket(schedule: GeneratedSchedule): ProjectedConsolationBracket | null {
  const settings = normalizePlayoffSettings(
    schedule.setup.playoffs,
    schedule.setup.teams.length,
    schedule.setup.color,
    schedule.setup.weeks,
  );
  if (settings.consolationMode === "off") return null;

  const normalizedSchedule = { ...schedule, setup: { ...schedule.setup, playoffs: settings } };
  const mainRounds = projectPlayoffRounds(normalizedSchedule);
  const roundNames = getPlayoffRoundNames(settings, schedule.setup.divisions.length);
  const playoffSeeds = projectPlayoffSeeds(normalizedSchedule, settings.fieldSize);
  const playoffTeamIds = new Set(playoffSeeds.map((seed) => seed.teamId));
  const standings = calculateStandings(normalizedSchedule);
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const gamesByRound: ProjectedConsolationGame[][] = Array.from({ length: roundNames.length }, () => []);
  let gameSequence = 0;

  const addGame = (
    roundIndex: number,
    label: string,
    placementRange: [number, number],
    entrants: [ProjectedConsolationEntrant, ProjectedConsolationEntrant],
    divisionId?: string,
  ) => {
    if (!gamesByRound[roundIndex]) return null;
    gameSequence += 1;
    const game: ProjectedConsolationGame = {
      id: `consolation-r${roundIndex + 1}-g${gameSequence}`,
      roundIndex,
      weekNumber: schedule.setup.weeks + roundIndex + 1,
      label,
      placementRange,
      divisionId,
      entrants,
    };
    gamesByRound[roundIndex].push(game);
    return game;
  };

  const resultEntrant = (
    game: ProjectedConsolationGame,
    outcome: "winner" | "loser",
  ): ProjectedConsolationEntrant => ({
    kind: "result",
    gameId: game.id,
    outcome,
    label: `${outcome === "winner" ? "Winner" : "Loser"} of ${game.label}`,
    projectedSeed: outcome === "winner"
      ? Math.min(...game.entrants.map((entrant) => entrant.projectedSeed))
      : Math.max(...game.entrants.map((entrant) => entrant.projectedSeed)),
  });

  const classifyPowerOfTwo = (
    entrants: ProjectedConsolationEntrant[],
    startPlace: number,
    roundIndex: number,
  ) => {
    if (entrants.length < 2 || !gamesByRound[roundIndex]) return;
    const ordered = [...entrants].sort((left, right) => left.projectedSeed - right.projectedSeed);
    const endPlace = startPlace + ordered.length - 1;
    const games: ProjectedConsolationGame[] = [];
    for (let index = 0; index < ordered.length / 2; index += 1) {
      const game = addGame(
        roundIndex,
        placementLabel(startPlace, endPlace),
        [startPlace, endPlace],
        [ordered[index], ordered[ordered.length - 1 - index]],
      );
      if (game) games.push(game);
    }
    if (games.length === 1) return;
    classifyPowerOfTwo(games.map((game) => resultEntrant(game, "winner")), startPlace, roundIndex + 1);
    classifyPowerOfTwo(games.map((game) => resultEntrant(game, "loser")), startPlace + ordered.length / 2, roundIndex + 1);
  };

  const classifySix = (entrants: ProjectedConsolationEntrant[], startPlace: number, roundIndex: number) => {
    if (!gamesByRound[roundIndex + 2]) return false;
    const ordered = [...entrants].sort((left, right) => left.projectedSeed - right.projectedSeed);
    const first = addGame(roundIndex, placementLabel(startPlace, startPlace + 5), [startPlace, startPlace + 5], [ordered[2], ordered[5]]);
    const second = addGame(roundIndex, placementLabel(startPlace, startPlace + 5), [startPlace, startPlace + 5], [ordered[3], ordered[4]]);
    if (!first || !second) return false;
    const semifinalOne = addGame(roundIndex + 1, placementLabel(startPlace, startPlace + 3), [startPlace, startPlace + 3], [ordered[0], resultEntrant(second, "winner")]);
    const semifinalTwo = addGame(roundIndex + 1, placementLabel(startPlace, startPlace + 3), [startPlace, startPlace + 3], [ordered[1], resultEntrant(first, "winner")]);
    addGame(roundIndex + 1, placementLabel(startPlace + 4, startPlace + 5), [startPlace + 4, startPlace + 5], [resultEntrant(first, "loser"), resultEntrant(second, "loser")]);
    if (!semifinalOne || !semifinalTwo) return false;
    addGame(roundIndex + 2, placementLabel(startPlace, startPlace + 1), [startPlace, startPlace + 1], [resultEntrant(semifinalOne, "winner"), resultEntrant(semifinalTwo, "winner")]);
    addGame(roundIndex + 2, placementLabel(startPlace + 2, startPlace + 3), [startPlace + 2, startPlace + 3], [resultEntrant(semifinalOne, "loser"), resultEntrant(semifinalTwo, "loser")]);
    return true;
  };

  const classify = (entrants: ProjectedConsolationEntrant[], startPlace: number, roundIndex: number) => {
    if (isPowerOfTwo(entrants.length)) return classifyPowerOfTwo(entrants, startPlace, roundIndex);
    if (entrants.length === 6 && classifySix(entrants, startPlace, roundIndex)) return;
    const ordered = [...entrants].sort((left, right) => left.projectedSeed - right.projectedSeed);
    for (let index = 0; index < Math.floor(ordered.length / 2); index += 1) {
      addGame(
        roundIndex,
        `${ordinal(startPlace)}-${ordinal(startPlace + entrants.length - 1)} Placement Pool`,
        [startPlace, startPlace + entrants.length - 1],
        [ordered[index], ordered[ordered.length - 1 - index]],
      );
    }
  };

  if (settings.bracketType === "single-elimination") {
    mainRounds.slice(0, -1).forEach((round) => {
      const loserEntrants = round.matchups.map((matchup, index): ProjectedConsolationEntrant => ({
        kind: "result",
        gameId: `main-r${round.roundIndex + 1}-g${index + 1}`,
        outcome: "loser",
        label: `Loser of ${round.name} game ${index + 1}`,
        projectedSeed: Math.max(matchup.homeSeed, matchup.awaySeed),
      }));
      const startPlace = 2 ** (mainRounds.length - round.roundIndex - 1) + 1;
      classify(loserEntrants, startPlace, round.roundIndex + 1);
    });
  }

  const nonPlayoffEntrants = standings
    .map((standing, index) => ({ standing, seed: index + 1 }))
    .filter(({ standing }) => !playoffTeamIds.has(standing.teamId))
    .map(({ standing, seed }): ProjectedConsolationEntrant => {
      const team = teamById.get(standing.teamId)!;
      return {
        kind: "team",
        teamId: team.id,
        seed,
        divisionId: team.divisionId,
        label: `${ordinal(seed)} seed`,
        projectedSeed: seed,
      };
    });

  const divisionHalvesUsable = settings.consolationMode === "division-halves"
    && isDivisionHalvesConsolationUsable(schedule.setup, settings.fieldSize)
    && schedule.setup.divisions.every((division) => nonPlayoffEntrants.filter((entrant) => entrant.kind === "team" && entrant.divisionId === division.id).length === 2);
  let fallbackReason: string | undefined;
  let mode: Exclude<PlayoffConsolationMode, "off"> = settings.consolationMode;

  if (settings.consolationMode === "division-halves" && !divisionHalvesUsable) {
    mode = "standard";
    fallbackReason = "Division-halves placement needs exactly two divisions and four non-playoff teams, split two per division. This projection uses standard placement instead.";
  }

  if (nonPlayoffEntrants.length >= 2 && mode === "division-halves") {
    const divisionGames = schedule.setup.divisions.map((division) => {
      const entrants = nonPlayoffEntrants
        .filter((entrant) => entrant.kind === "team" && entrant.divisionId === division.id)
        .sort((left, right) => left.projectedSeed - right.projectedSeed) as [ProjectedConsolationEntrant, ProjectedConsolationEntrant];
      return addGame(0, `${division.name} "Not Last Place" Bowl`, [settings.fieldSize + 1, schedule.setup.teams.length], entrants, division.id)!;
    });
    addGame(1, `Draft Pick Bowl (${ordinal(settings.fieldSize + 1)} Place)`, [settings.fieldSize + 1, settings.fieldSize + 2], [resultEntrant(divisionGames[0], "winner"), resultEntrant(divisionGames[1], "winner")]);
    addGame(1, `Toilet Bowl (${ordinal(settings.fieldSize + 3)} Place)`, [settings.fieldSize + 3, settings.fieldSize + 4], [resultEntrant(divisionGames[0], "loser"), resultEntrant(divisionGames[1], "loser")]);
  } else if (nonPlayoffEntrants.length >= 2) {
    classify(nonPlayoffEntrants, settings.fieldSize + 1, 0);
  }

  return {
    requestedMode: settings.consolationMode,
    mode,
    fallbackReason,
    rounds: gamesByRound
      .map((games, roundIndex) => ({
        roundIndex,
        weekNumber: schedule.setup.weeks + roundIndex + 1,
        name: roundNames[roundIndex] ?? `Playoff Week ${roundIndex + 1}`,
        games,
      }))
      .filter((round) => round.games.length > 0),
  };
}

function completedWinner(game: NonNullable<GeneratedSchedule["playoffGames"]>[number]) {
  if (game.homeScore == null || game.awayScore == null || game.homeScore === game.awayScore) return null;
  return game.homeScore > game.awayScore
    ? { winnerId: game.homeTeamId, loserId: game.awayTeamId }
    : { winnerId: game.awayTeamId, loserId: game.homeTeamId };
}

export function projectFinalPlacements(schedule: GeneratedSchedule): ProjectedFinalPlacement[] {
  const settings = normalizePlayoffSettings(
    schedule.setup.playoffs,
    schedule.setup.teams.length,
    schedule.setup.color,
    schedule.setup.weeks,
  );
  const normalizedSchedule = { ...schedule, setup: { ...schedule.setup, playoffs: settings } };
  const playoffSeeds = projectPlayoffSeeds(normalizedSchedule, settings.fieldSize).sort((left, right) => left.seed - right.seed);
  const playoffTeamIds = new Set(playoffSeeds.map((seed) => seed.teamId));
  const nonPlayoffTeamIds = calculateStandings(normalizedSchedule)
    .map((row) => row.teamId)
    .filter((teamId) => !playoffTeamIds.has(teamId));
  const placements: ProjectedFinalPlacement[] = [...playoffSeeds.map((seed) => seed.teamId), ...nonPlayoffTeamIds]
    .map((teamId, index) => ({ place: index + 1, teamId, status: "projected" as const }));

  const assignResult = (place: number, teamId: string, eventLabel: string, weekNumber: number) => {
    const destination = placements[place - 1];
    const currentIndex = placements.findIndex((item) => item.teamId === teamId);
    if (!destination || currentIndex < 0) return;
    const displaced = destination.teamId;
    placements[place - 1] = { place, teamId, status: "final", eventLabel, weekNumber };
    if (currentIndex !== place - 1) {
      placements[currentIndex] = { ...placements[currentIndex], teamId: displaced };
    }
  };

  const mainGames = (schedule.playoffGames ?? []).filter((game) => game.bracket === "main");
  const titleGame = [...mainGames].sort((left, right) => right.roundIndex - left.roundIndex)[0];
  const titleResult = titleGame ? completedWinner(titleGame) : null;
  if (titleGame && titleResult) {
    assignResult(1, titleResult.winnerId, titleGame.round || "Championship", titleGame.week);
    assignResult(2, titleResult.loserId, titleGame.round || "Championship", titleGame.week);
  }

  const consolation = projectConsolationBracket(normalizedSchedule);
  const projectedGameById = new Map(consolation?.rounds.flatMap((round) => round.games).map((game) => [game.id, game]) ?? []);
  (schedule.playoffGames ?? []).filter((game) => game.bracket === "consolation").forEach((game) => {
    const projection = projectedGameById.get(game.id);
    const result = completedWinner(game);
    if (!projection || !result || projection.placementRange[1] !== projection.placementRange[0] + 1) return;
    assignResult(projection.placementRange[0], result.winnerId, projection.label, projection.weekNumber);
    assignResult(projection.placementRange[1], result.loserId, projection.label, projection.weekNumber);
  });

  const placementEvents = consolation?.rounds.flatMap((round) => round.games)
    .filter((game) => game.placementRange[1] === game.placementRange[0] + 1) ?? [];
  placementEvents.forEach((game) => {
    const [winnerPlace, loserPlace] = game.placementRange;
    if (!placements[winnerPlace - 1]?.eventLabel) placements[winnerPlace - 1] = { ...placements[winnerPlace - 1], eventLabel: game.label, weekNumber: game.weekNumber };
    if (!placements[loserPlace - 1]?.eventLabel) placements[loserPlace - 1] = { ...placements[loserPlace - 1], eventLabel: game.label, weekNumber: game.weekNumber };
  });

  return placements;
}
