import { calculateDivisionStandings, calculateStandings, formatRecord } from "./standings";
import type {
  GeneratedSchedule,
  LeagueSetupInput,
  PlayoffFieldSize,
  PlayoffSeed,
  PlayoffPlacementMode,
  ResolvedPlayoffPlacementMode,
} from "./types";

type PlayoffSettings = LeagueSetupInput["playoffs"];
type LegacyPlayoffSettings = Omit<Partial<PlayoffSettings>, "bracketType"> & {
  bracketType?: string;
  reseed?: boolean;
  hostVenueMode?: "higher-seed" | "neutral-site";
  initials?: string;
};

export const PLAYOFF_THEME_COLORS = {
  gold: "#E3B940",
  silver: "#68747B",
  bronze: "#9A5B2E",
} as const;

export function getMaximumPlayoffWeeks(regularSeasonWeeks: 13 | 14) {
  return 17 - regularSeasonWeeks;
}

export function getRequiredPlayoffWeeks(fieldSize: number, bracketType: PlayoffSettings["bracketType"] = "single-elimination") {
  const singleEliminationRounds = Math.max(1, Math.ceil(Math.log2(Math.max(2, fieldSize))));
  if (bracketType === "ladder") return Math.max(1, fieldSize - 1);
  return singleEliminationRounds;
}

export function getMaximumPlayoffFieldSize(teamCount: number, regularSeasonWeeks: 13 | 14, bracketType: PlayoffSettings["bracketType"] = "single-elimination") {
  let maximum = 2;
  for (let fieldSize = 2; fieldSize <= teamCount; fieldSize += 1) {
    if (getRequiredPlayoffWeeks(fieldSize, bracketType) <= getMaximumPlayoffWeeks(regularSeasonWeeks)) maximum = fieldSize;
  }
  return Math.min(teamCount, maximum);
}

export function recommendedPlayoffFieldSize(teamCount: number, regularSeasonWeeks: 13 | 14 = 14): PlayoffFieldSize {
  return Math.min(6, getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks));
}

export function createDefaultPlayoffSettings(teamCount: number, _leagueColor = "#117A45", regularSeasonWeeks: 13 | 14 = 14): PlayoffSettings {
  return {
    fieldSize: recommendedPlayoffFieldSize(teamCount, regularSeasonWeeks),
    bracketType: "single-elimination",
    placementMode: "auto",
    reseedMode: "fixed",
    seedDisplayMode: "reranked",
    championshipVenueMode: "higher-seed",
    theme: "gold",
    fieldStatus: "live",
    lockedTeamIds: [],
    consolationMode: "standard",
    thirdPlaceGame: true,
    name: "Championship Playoffs",
    color: PLAYOFF_THEME_COLORS.gold,
  };
}

export function normalizePlayoffSettings(value: LegacyPlayoffSettings | undefined, teamCount: number, leagueColor: string, regularSeasonWeeks: 13 | 14 = 14): PlayoffSettings {
  const defaults = createDefaultPlayoffSettings(teamCount, leagueColor, regularSeasonWeeks);
  if (!value) return defaults;
  let bracketType: PlayoffSettings["bracketType"] = value.bracketType === "ladder" ? "ladder" : "single-elimination";
  let maximumFieldSize = getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks, bracketType);
  if (maximumFieldSize < 2) {
    bracketType = "single-elimination";
    maximumFieldSize = getMaximumPlayoffFieldSize(teamCount, regularSeasonWeeks, bracketType);
  }
  const requestedFieldSize = Math.round(Number(value.fieldSize) || defaults.fieldSize);
  const fieldSize = Math.max(2, Math.min(maximumFieldSize, requestedFieldSize));
  const legacyReseedMode = value.reseed === true ? "each-round" : "fixed";
  const reseedMode = ["fixed", "each-round", "protected"].includes(value.reseedMode || "") ? value.reseedMode! : legacyReseedMode;
  const lockedTeamIds = Array.isArray(value.lockedTeamIds)
    ? value.lockedTeamIds.filter((teamId): teamId is string => typeof teamId === "string").slice(0, fieldSize)
    : [];
  const theme = ["gold", "silver", "bronze", "custom"].includes(value.theme || "") ? value.theme! : defaults.theme;
  const themedColor = theme === "custom" ? value.color || defaults.color : PLAYOFF_THEME_COLORS[theme];
  const consolationMode = ["off", "standard", "division-halves"].includes(value.consolationMode || "")
    ? value.consolationMode!
    : defaults.consolationMode;
  return {
    fieldSize,
    bracketType,
    placementMode: ["auto", "division-halves", "division-leaders", "overall"].includes(value.placementMode || "") ? value.placementMode! : defaults.placementMode,
    reseedMode,
    seedDisplayMode: value.seedDisplayMode === "standings-finish" ? "standings-finish" : "reranked",
    championshipVenueMode: value.championshipVenueMode === "neutral-site" || value.hostVenueMode === "neutral-site" ? "neutral-site" : "higher-seed",
    theme,
    fieldStatus: value.fieldStatus === "locked" && lockedTeamIds.length === fieldSize ? "locked" : "live",
    lockedTeamIds,
    consolationMode,
    thirdPlaceGame: consolationMode !== "off" && fieldSize >= 4,
    name: value.name?.trim() || defaults.name,
    color: themedColor,
    logoUrl: value.logoUrl || undefined,
    roundNames: Array.isArray(value.roundNames) ? value.roundNames.map((name) => String(name).slice(0, 40)) : undefined,
    roundLogoUrls: Array.isArray(value.roundLogoUrls) ? value.roundLogoUrls.map((logoUrl) => typeof logoUrl === "string" ? logoUrl : "") : undefined,
    gameNames: value.gameNames && typeof value.gameNames === "object"
      ? Object.fromEntries(Object.entries(value.gameNames)
        .filter(([gameId, name]) => /^(main|consolation)-r\d+-g\d+$/.test(gameId) && typeof name === "string" && name.trim())
        .map(([gameId, name]) => [gameId, name.trim().slice(0, 60)])
        .slice(0, 64))
      : undefined,
    gameLogoUrls: value.gameLogoUrls && typeof value.gameLogoUrls === "object"
      ? Object.fromEntries(Object.entries(value.gameLogoUrls)
        .filter(([gameId, logoUrl]) => /^(main|consolation)-r\d+-g\d+$/.test(gameId) && typeof logoUrl === "string" && logoUrl)
        .slice(0, 64))
      : undefined,
  };
}

export function nextPowerOfTwo(value: number) {
  let result = 1;
  while (result < Math.max(1, value)) result *= 2;
  return result;
}

export function getPlayoffByeCount(fieldSize: PlayoffFieldSize) {
  return nextPowerOfTwo(fieldSize) - fieldSize;
}

export function isPlayoffPlacementUsable(mode: Exclude<PlayoffPlacementMode, "auto">, divisionCount: number, fieldSize: PlayoffFieldSize) {
  if (mode === "overall") return true;
  if (mode === "division-halves") return (divisionCount === 2 || divisionCount === 4) && fieldSize % 2 === 0 && fieldSize >= divisionCount;
  return divisionCount > 1 && fieldSize >= divisionCount;
}

export function resolvePlayoffPlacementMode(setup: Pick<LeagueSetupInput, "divisions" | "playoffs">): ResolvedPlayoffPlacementMode {
  const divisionCount = setup.divisions.length;
  const requested = setup.playoffs.placementMode;
  if (setup.playoffs.bracketType === "ladder") return "overall";
  if (requested !== "auto") {
    return isPlayoffPlacementUsable(requested, divisionCount, setup.playoffs.fieldSize) ? requested : "overall";
  }
  if (divisionCount === 2 && isPlayoffPlacementUsable("division-halves", divisionCount, setup.playoffs.fieldSize)) return "division-halves";
  if (divisionCount >= 3 && divisionCount <= 4 && isPlayoffPlacementUsable("division-leaders", divisionCount, setup.playoffs.fieldSize)) return "division-leaders";
  return "overall";
}

export function playoffPlacementLabel(mode: ResolvedPlayoffPlacementMode) {
  if (mode === "division-halves") return "Division Halves";
  if (mode === "division-leaders") return "Division Leaders Priority";
  return "Overall Standings";
}

function singleEliminationRoundNames(settings: Pick<PlayoffSettings, "bracketType" | "fieldSize" | "placementMode">, divisionCount: number) {
  const count = getRequiredPlayoffWeeks(settings.fieldSize, "single-elimination");
  const hasFirstRoundByes = getPlayoffByeCount(settings.fieldSize) > 0;
  const usesTwoDivisionHalves = divisionCount === 2
    && settings.bracketType === "single-elimination"
    && (settings.placementMode === "auto" || settings.placementMode === "division-halves")
    && isPlayoffPlacementUsable("division-halves", divisionCount, settings.fieldSize);

  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return "Championship";
    if (index === 0 && hasFirstRoundByes) return "Wild Card";
    if (index === count - 2) return usesTwoDivisionHalves ? "Divisional Championship" : "Semifinals";
    return `Round ${index + 1}`;
  });
}

function defaultPlayoffRoundNames(settings: Pick<PlayoffSettings, "bracketType" | "fieldSize" | "placementMode">, divisionCount: number) {
  if (settings.bracketType === "ladder") {
    const count = getRequiredPlayoffWeeks(settings.fieldSize, settings.bracketType);
    return Array.from({ length: count }, (_, index) => index === count - 1 ? "Championship" : `Ladder Round ${index + 1}`);
  }
  return singleEliminationRoundNames(settings, divisionCount);
}

export function getPlayoffRoundNames(settings: PlayoffSettings, divisionCount = 0) {
  return defaultPlayoffRoundNames(settings, divisionCount).map((fallback, index) => settings.roundNames?.[index]?.trim() || fallback);
}

export interface PlayoffGameBrandingSlot {
  id: string;
  roundIndex: number;
  gameIndex: number;
  roundName: string;
}

export function getPlayoffGameBrandingSlots(settings: PlayoffSettings, divisionCount = 0): PlayoffGameBrandingSlot[] {
  const roundNames = getPlayoffRoundNames(settings, divisionCount);
  const gamesPerRound = settings.bracketType === "ladder"
    ? roundNames.map(() => 1)
    : (() => {
      const bracketSize = nextPowerOfTwo(settings.fieldSize);
      const counts = [Math.max(1, settings.fieldSize - bracketSize / 2)];
      for (let games = bracketSize / 4; counts.length < roundNames.length; games /= 2) {
        counts.push(Math.max(1, Math.round(games)));
      }
      return counts;
    })();
  return roundNames.flatMap((roundName, roundIndex) =>
    Array.from({ length: gamesPerRound[roundIndex] ?? 1 }, (_, gameIndex) => ({
      id: `main-r${roundIndex + 1}-g${gameIndex + 1}`,
      roundIndex,
      gameIndex,
      roundName,
    })));
}

export function getFirstRoundSeedPairs(fieldSize: PlayoffFieldSize): Array<[number, number]> {
  const byeCount = getPlayoffByeCount(fieldSize);
  const pairs: Array<[number, number]> = [];
  let high = byeCount + 1;
  let low = fieldSize;
  while (high < low) {
    pairs.push([high, low]);
    high += 1;
    low -= 1;
  }
  if (!pairs.length && fieldSize === 2) return [[1, 2]];
  return pairs;
}

function divisionHalfSeedSlots(fieldSize: PlayoffFieldSize): [number[], number[]] {
  if (fieldSize === 2) return [[1], [2]];
  const sides: [number[], number[]] = [[], []];
  const byeCount = getPlayoffByeCount(fieldSize);
  for (let seed = 1; seed <= byeCount; seed += 1) sides[(seed - 1) % 2].push(seed);
  const pairs = getFirstRoundSeedPairs(fieldSize);
  pairs.forEach((pair, index) => {
    const side = byeCount > 0
      ? index % 2 === 0 ? 1 : 0
      : pairs.length === 2 ? index : index < pairs.length / 2 ? index % 2 : (pairs.length - 1 - index) % 2;
    sides[side].push(...pair);
  });
  return sides.map((side) => side.sort((left, right) => left - right)) as [number[], number[]];
}

export function projectPlayoffSeeds(schedule: GeneratedSchedule, fieldSize = schedule.setup.playoffs.fieldSize): PlayoffSeed[] {
  const normalizedFieldSize = Math.max(2, Math.min(schedule.setup.teams.length, Math.round(fieldSize)));
  const standings = calculateStandings(schedule);
  const standingsPosition = new Map(standings.map((row, index) => [row.teamId, index + 1]));
  const standingsById = new Map(standings.map((row) => [row.teamId, row]));
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const leaders = schedule.setup.divisions
    .map((division) => calculateDivisionStandings(schedule, division.id)[0])
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((left, right) => (standingsPosition.get(left.teamId) ?? Infinity) - (standingsPosition.get(right.teamId) ?? Infinity));
  const leaderIds = new Set(leaders.map((row) => row.teamId));
  const byeCount = getPlayoffByeCount(normalizedFieldSize);
  const placementMode = resolvePlayoffPlacementMode({ divisions: schedule.setup.divisions, playoffs: { ...schedule.setup.playoffs, fieldSize: normalizedFieldSize } });

  const toSeed = (teamId: string, seed: number, bracketSide?: "A" | "B"): PlayoffSeed => {
    const row = standingsById.get(teamId)!;
    const team = teamById.get(teamId)!;
    return {
      seed,
      teamId,
      record: formatRecord(row),
      divisionLeader: leaderIds.has(teamId),
      divisionId: team.divisionId,
      standingsPosition: standingsPosition.get(teamId) ?? seed,
      bracketSide,
      bye: seed <= byeCount,
    };
  };

  if (schedule.setup.playoffs.fieldStatus === "locked" && schedule.setup.playoffs.lockedTeamIds.length >= normalizedFieldSize) {
    const sideBySeed = new Map<number, "A" | "B">();
    if (placementMode === "division-halves") {
      divisionHalfSeedSlots(normalizedFieldSize).forEach((side, sideIndex) => side.forEach((seed) => sideBySeed.set(seed, sideIndex === 0 ? "A" : "B")));
    }
    return schedule.setup.playoffs.lockedTeamIds
      .slice(0, normalizedFieldSize)
      .filter((teamId) => standingsById.has(teamId))
      .map((teamId, index) => toSeed(teamId, index + 1, sideBySeed.get(index + 1)));
  }

  if (placementMode === "overall") {
    return standings.slice(0, normalizedFieldSize).map((row, index) => toSeed(row.teamId, index + 1));
  }

  if (placementMode === "division-leaders") {
    const ordered = [...leaders, ...standings.filter((row) => !leaderIds.has(row.teamId))].slice(0, normalizedFieldSize);
    return ordered.map((row, index) => toSeed(row.teamId, index + 1));
  }

  const divisionIds = schedule.setup.divisions.map((division) => division.id);
  const divisionGroups = divisionIds.length === 2
    ? [[divisionIds[0]], [divisionIds[1]]]
    : [[divisionIds[0], divisionIds[1]], [divisionIds[2], divisionIds[3]]];
  const selectedSides = divisionGroups.map((group) => {
    const groupSet = new Set(group);
    const groupRows = standings.filter((row) => groupSet.has(teamById.get(row.teamId)?.divisionId || ""));
    const groupLeaders = leaders.filter((row) => groupSet.has(teamById.get(row.teamId)?.divisionId || ""));
    const groupLeaderIds = new Set(groupLeaders.map((row) => row.teamId));
    return [...groupLeaders, ...groupRows.filter((row) => !groupLeaderIds.has(row.teamId))].slice(0, normalizedFieldSize / 2);
  }).sort((left, right) => (standingsPosition.get(left[0]?.teamId) ?? 999) - (standingsPosition.get(right[0]?.teamId) ?? 999));
  const slots = divisionHalfSeedSlots(normalizedFieldSize);
  return selectedSides
    .flatMap((side, sideIndex) => side.map((row, index) => toSeed(row.teamId, slots[sideIndex][index], sideIndex === 0 ? "A" : "B")))
    .sort((left, right) => left.seed - right.seed);
}

export interface ProjectedPlayoffMatchup {
  homeSeed: number;
  awaySeed: number;
  bracketSide?: "A" | "B";
}

export interface ProjectedPlayoffRound {
  roundIndex: number;
  name: string;
  weekNumber: number;
  matchups: ProjectedPlayoffMatchup[];
  byeSeeds: number[];
}

function pairProjectedSeeds(seedNumbers: number[], sideBySeed: Map<number, "A" | "B" | undefined>, keepDivisionHalves: boolean) {
  const groups = keepDivisionHalves
    ? (["A", "B"] as const).map((side) => seedNumbers.filter((seed) => sideBySeed.get(seed) === side))
    : [seedNumbers];

  return groups.flatMap((group) => {
    const ordered = [...group].sort((left, right) => left - right);
    const matchups: ProjectedPlayoffMatchup[] = [];
    while (ordered.length > 1) {
      const homeSeed = ordered.shift()!;
      const awaySeed = ordered.pop()!;
      matchups.push({ homeSeed, awaySeed, bracketSide: sideBySeed.get(homeSeed) });
    }
    return matchups;
  });
}

/**
 * Builds an honest, deterministic preview of each playoff week by advancing the
 * better projected seed until recorded or simulated playoff games replace it.
 */
export function projectPlayoffRounds(schedule: GeneratedSchedule): ProjectedPlayoffRound[] {
  const settings = normalizePlayoffSettings(
    schedule.setup.playoffs,
    schedule.setup.teams.length,
    schedule.setup.color,
    schedule.setup.weeks,
  );
  const normalizedSchedule = settings === schedule.setup.playoffs
    ? schedule
    : { ...schedule, setup: { ...schedule.setup, playoffs: settings } };
  const seeds = projectPlayoffSeeds(normalizedSchedule, settings.fieldSize);
  const seedByTeamId = new Map(seeds.map((item) => [item.teamId, item.seed]));
  const recordedGames = new Map(
    (schedule.playoffGames ?? [])
      .filter((game) => game.bracket === "main")
      .map((game) => [game.id, game]),
  );
  const roundNames = getPlayoffRoundNames(settings, schedule.setup.divisions.length);
  const sideBySeed = new Map(seeds.map((item) => [item.seed, item.bracketSide]));

  if (settings.bracketType === "ladder") {
    return roundNames.map((name, roundIndex) => {
      const homeSeed = settings.fieldSize - roundIndex - 1;
      return {
        roundIndex,
        name,
        weekNumber: schedule.setup.weeks + roundIndex + 1,
        matchups: [{ homeSeed, awaySeed: homeSeed + 1 }],
        byeSeeds: seeds.map((item) => item.seed).filter((seed) => seed < homeSeed),
      };
    });
  }

  const placement = resolvePlayoffPlacementMode({ divisions: schedule.setup.divisions, playoffs: settings });
  const openingPairs = getFirstRoundSeedPairs(settings.fieldSize);
  const openingMatchups = openingPairs.map(([homeSeed, awaySeed]) => ({
    homeSeed,
    awaySeed,
    bracketSide: sideBySeed.get(homeSeed),
  }));
  let advancingSeeds = seeds.filter((item) => item.bye).map((item) => item.seed);

  return roundNames.map((name, roundIndex) => {
    const matchups = roundIndex === 0
      ? openingMatchups
      : pairProjectedSeeds(advancingSeeds, sideBySeed, placement === "division-halves" && roundIndex < roundNames.length - 1);
    const byeSeeds = roundIndex === 0 ? seeds.filter((item) => item.bye).map((item) => item.seed) : [];
    const winners = matchups.map((matchup, gameIndex) => {
      const recorded = recordedGames.get(`main-r${roundIndex + 1}-g${gameIndex + 1}`);
      if (recorded?.homeScore == null || recorded.awayScore == null || recorded.homeScore === recorded.awayScore) {
        return matchup.homeSeed;
      }
      const winnerTeamId = recorded.homeScore > recorded.awayScore ? recorded.homeTeamId : recorded.awayTeamId;
      return seedByTeamId.get(winnerTeamId) ?? matchup.homeSeed;
    });
    advancingSeeds = [...byeSeeds, ...winners].sort((left, right) => left - right);
    return {
      roundIndex,
      name,
      weekNumber: schedule.setup.weeks + roundIndex + 1,
      matchups,
      byeSeeds,
    };
  });
}
