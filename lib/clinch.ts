import { projectPlayoffSeeds, resolvePlayoffPlacementMode } from "./playoffs";
import { calculateStandings } from "./standings";
import type { GeneratedSchedule, StandingsRow } from "./types";

export interface TeamClinchState {
  teamId: string;
  throughWeek: number;
  divisionTitle: boolean;
  playoffBerth: boolean;
  topSeed: boolean;
  eliminated: boolean;
}

export interface TeamClinchTimeline extends TeamClinchState {
  divisionTitleWeek?: number;
  playoffBerthWeek?: number;
  topSeedWeek?: number;
  eliminatedWeek?: number;
}

interface TeamRange {
  teamId: string;
  divisionId: string;
  minimumPoints: number;
  maximumPoints: number;
}

function standingsPoints(row: StandingsRow) {
  return row.wins * 2 + row.ties;
}

export function getLatestScoredWeek(schedule: GeneratedSchedule) {
  return schedule.weeks.reduce((latest, week) => (
    week.games.some((game) => game.homeScore != null && game.awayScore != null)
      ? Math.max(latest, week.weekNumber)
      : latest
  ), 0);
}

function isRegularSeasonComplete(schedule: GeneratedSchedule, throughWeek: number) {
  return schedule.weeks.every((week) => (
    week.weekNumber > throughWeek
      ? week.games.length === 0
      : week.games.every((game) => game.homeScore != null && game.awayScore != null)
  ));
}

function buildTeamRanges(schedule: GeneratedSchedule, throughWeek: number) {
  const standings = calculateStandings(schedule, throughWeek);
  const standingsByTeam = new Map(standings.map((row) => [row.teamId, row]));
  const totalGames = new Map(schedule.setup.teams.map((team) => [team.id, 0]));
  const playedGames = new Map(schedule.setup.teams.map((team) => [team.id, 0]));

  for (const week of schedule.weeks) {
    for (const game of week.games) {
      totalGames.set(game.homeTeamId, (totalGames.get(game.homeTeamId) ?? 0) + 1);
      totalGames.set(game.awayTeamId, (totalGames.get(game.awayTeamId) ?? 0) + 1);
      if (week.weekNumber <= throughWeek && game.homeScore != null && game.awayScore != null) {
        playedGames.set(game.homeTeamId, (playedGames.get(game.homeTeamId) ?? 0) + 1);
        playedGames.set(game.awayTeamId, (playedGames.get(game.awayTeamId) ?? 0) + 1);
      }
    }
  }

  return schedule.setup.teams.map((team): TeamRange => {
    const row = standingsByTeam.get(team.id)!;
    const remainingGames = Math.max(0, (totalGames.get(team.id) ?? 0) - (playedGames.get(team.id) ?? 0));
    const minimumPoints = standingsPoints(row);
    return {
      teamId: team.id,
      divisionId: team.divisionId,
      minimumPoints,
      maximumPoints: minimumPoints + remainingGames * 2,
    };
  });
}

function clinchedWithin(ranges: TeamRange[], team: TeamRange, slots: number) {
  if (slots >= ranges.length) return true;
  return ranges.filter((rival) => rival.teamId !== team.teamId && rival.maximumPoints >= team.minimumPoints).length < slots;
}

function eliminatedWithin(ranges: TeamRange[], team: TeamRange, slots: number) {
  if (slots >= ranges.length) return false;
  return ranges.filter((rival) => rival.teamId !== team.teamId && rival.minimumPoints > team.maximumPoints).length >= slots;
}

function divisionGroups(schedule: GeneratedSchedule) {
  const divisionIds = schedule.setup.divisions.map((division) => division.id);
  if (divisionIds.length === 2) return [[divisionIds[0]], [divisionIds[1]]];
  if (divisionIds.length === 4) return [[divisionIds[0], divisionIds[1]], [divisionIds[2], divisionIds[3]]];
  return [divisionIds];
}

export function calculateTeamClinchStates(schedule: GeneratedSchedule, throughWeek: number): TeamClinchState[] {
  const normalizedWeek = Math.max(0, Math.min(throughWeek, Math.max(0, ...schedule.weeks.map((week) => week.weekNumber))));
  const ranges = buildTeamRanges(schedule, normalizedWeek);
  const standings = calculateStandings(schedule, normalizedWeek);
  const fieldSize = Math.max(2, Math.min(schedule.setup.teams.length, Math.round(schedule.setup.playoffs.fieldSize)));
  const placementMode = resolvePlayoffPlacementMode({
    divisions: schedule.setup.divisions,
    playoffs: { ...schedule.setup.playoffs, fieldSize },
  });
  const hasDivisions = schedule.setup.divisions.length > 1;
  const divisionTitleIds = new Set<string>();
  const divisionTitleEliminatedIds = new Set<string>();

  for (const division of schedule.setup.divisions) {
    const divisionRanges = ranges.filter((range) => range.divisionId === division.id);
    for (const team of divisionRanges) {
      if (hasDivisions && clinchedWithin(divisionRanges, team, 1)) divisionTitleIds.add(team.teamId);
      if (hasDivisions && eliminatedWithin(divisionRanges, team, 1)) divisionTitleEliminatedIds.add(team.teamId);
    }
  }

  const latestScoredWeek = getLatestScoredWeek(schedule);
  const lockedFieldApplies = schedule.setup.playoffs.fieldStatus === "locked"
    && schedule.setup.playoffs.lockedTeamIds.length >= fieldSize
    && normalizedWeek >= latestScoredWeek;
  const lockedPlayoffIds = new Set(schedule.setup.playoffs.lockedTeamIds.slice(0, fieldSize));
  const final = isRegularSeasonComplete(schedule, normalizedWeek);
  const finalPlayoffIds = final ? new Set(projectPlayoffSeeds(schedule, fieldSize).map((seed) => seed.teamId)) : undefined;
  const finalDivisionLeaderIds = final
    ? new Set(schedule.setup.divisions.map((division) => standings.find((row) => schedule.setup.teams.find((team) => team.id === row.teamId)?.divisionId === division.id)?.teamId).filter(Boolean))
    : undefined;

  return ranges.map((team) => {
    if (final) {
      const playoffBerth = finalPlayoffIds!.has(team.teamId);
      return {
        teamId: team.teamId,
        throughWeek: normalizedWeek,
        divisionTitle: hasDivisions && finalDivisionLeaderIds!.has(team.teamId),
        playoffBerth,
        topSeed: standings[0]?.teamId === team.teamId,
        eliminated: !playoffBerth,
      };
    }

    if (lockedFieldApplies) {
      const playoffBerth = lockedPlayoffIds.has(team.teamId);
      return {
        teamId: team.teamId,
        throughWeek: normalizedWeek,
        divisionTitle: divisionTitleIds.has(team.teamId),
        playoffBerth,
        topSeed: standings[0]?.teamId === team.teamId && clinchedWithin(ranges, team, 1),
        eliminated: !playoffBerth,
      };
    }

    let playoffBerth = false;
    let eliminated = false;
    if (placementMode === "overall") {
      playoffBerth = clinchedWithin(ranges, team, fieldSize);
      eliminated = eliminatedWithin(ranges, team, fieldSize);
    } else if (placementMode === "division-leaders") {
      const atLargeGuaranteeSlots = Math.max(1, fieldSize - (schedule.setup.divisions.length - 1));
      playoffBerth = divisionTitleIds.has(team.teamId) || clinchedWithin(ranges, team, atLargeGuaranteeSlots);
      eliminated = divisionTitleEliminatedIds.has(team.teamId) && eliminatedWithin(ranges, team, fieldSize);
    } else {
      const group = divisionGroups(schedule).find((divisionIds) => divisionIds.includes(team.divisionId)) ?? [];
      const groupRanges = ranges.filter((range) => group.includes(range.divisionId));
      const groupSlots = fieldSize / 2;
      const atLargeGuaranteeSlots = Math.max(1, groupSlots - (group.length - 1));
      playoffBerth = divisionTitleIds.has(team.teamId) || clinchedWithin(groupRanges, team, atLargeGuaranteeSlots);
      eliminated = divisionTitleEliminatedIds.has(team.teamId) && eliminatedWithin(groupRanges, team, groupSlots);
    }

    return {
      teamId: team.teamId,
      throughWeek: normalizedWeek,
      divisionTitle: divisionTitleIds.has(team.teamId),
      playoffBerth,
      topSeed: clinchedWithin(ranges, team, 1),
      eliminated,
    };
  });
}

export function getTeamClinchTimelines(schedule: GeneratedSchedule, throughWeek = getLatestScoredWeek(schedule)): TeamClinchTimeline[] {
  const normalizedWeek = Math.max(0, throughWeek);
  const timelines = new Map<string, TeamClinchTimeline>(schedule.setup.teams.map((team) => [team.id, {
    teamId: team.id,
    throughWeek: normalizedWeek,
    divisionTitle: false,
    playoffBerth: false,
    topSeed: false,
    eliminated: false,
  }]));

  for (let week = 0; week <= normalizedWeek; week += 1) {
    for (const state of calculateTeamClinchStates(schedule, week)) {
      const timeline = timelines.get(state.teamId)!;
      if (state.divisionTitle && timeline.divisionTitleWeek == null) timeline.divisionTitleWeek = week;
      if (state.playoffBerth && timeline.playoffBerthWeek == null) timeline.playoffBerthWeek = week;
      if (state.topSeed && timeline.topSeedWeek == null) timeline.topSeedWeek = week;
      if (state.eliminated && timeline.eliminatedWeek == null) timeline.eliminatedWeek = week;
      if (week === normalizedWeek) Object.assign(timeline, state);
    }
  }

  return [...timelines.values()];
}
