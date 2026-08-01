import { projectPlayoffSeeds, resolvePlayoffPlacementMode } from "./playoffs";
import { calculateDivisionStandings, calculateStandings } from "./standings";
import {
  buildTeamRanges,
  clinchedWithin,
  divisionGroups,
  eliminatedWithin,
  getLatestScoredWeek,
  isEliminatedFor,
  isLockedFor,
  isRegularSeasonComplete,
} from "./clinchCore";
import type { GeneratedSchedule } from "./types";

export { getLatestScoredWeek };

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

export function calculateTeamClinchStates(schedule: GeneratedSchedule, throughWeek: number): TeamClinchState[] {
  const normalizedWeek = Math.max(0, Math.min(throughWeek, Math.max(0, ...schedule.weeks.map((week) => week.weekNumber))));
  const ranges = buildTeamRanges(schedule, normalizedWeek);
  const standings = calculateStandings(schedule, normalizedWeek);
  const fieldSize = Math.max(2, Math.min(schedule.setup.teams.length, Math.round(schedule.setup.playoffs.fieldSize)));
  const placementMode = resolvePlayoffPlacementMode({
    divisions: schedule.setup.divisions,
    conferences: schedule.setup.conferences,
    playoffs: { ...schedule.setup.playoffs, fieldSize },
  });
  const hasDivisions = schedule.setup.divisions.length > 1;
  const divisionTitleIds = new Set<string>();
  const divisionTitleEliminatedIds = new Set<string>();

  for (const division of schedule.setup.divisions) {
    const divisionRanges = ranges.filter((range) => range.divisionId === division.id);
    for (const team of divisionRanges) {
      // Division title uses the exact core (clinchedWithin is its fast path); this set also
      // feeds the division-placement berth auto-qualify below, so both stay consistent.
      if (hasDivisions && isLockedFor(schedule, team.teamId, "division-title", normalizedWeek, { ranges }).locked) divisionTitleIds.add(team.teamId);
      // Elimination-from-division stays the conservative certificate (only used by division
      // placement modes; conservative elimination never falsely eliminates).
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
    ? new Set(schedule.setup.divisions.map((division) => calculateDivisionStandings(schedule, division.id, normalizedWeek)[0]?.teamId).filter(Boolean))
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
      playoffBerth = isLockedFor(schedule, team.teamId, "playoff-berth", normalizedWeek, { ranges }).locked;
      eliminated = isEliminatedFor(schedule, team.teamId, normalizedWeek, { ranges }).locked;
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
      topSeed: isLockedFor(schedule, team.teamId, "top-seed", normalizedWeek, { ranges }).locked,
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
