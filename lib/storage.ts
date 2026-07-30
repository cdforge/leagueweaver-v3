import type { GeneratedSchedule, LeagueSetupInput } from "./types";
import { normalizeScheduleMatchups } from "./matchups";
import { divisionAcronym, entityMonogram, leagueAcronym, resolveInitials } from "./monograms";
import { normalizePlayoffSettings } from "./playoffs";
import { getWeekOneRankMap } from "./rankings";
import { freezeCompletedRankHistory } from "./standings";

export function normalizeSetup(setup: LeagueSetupInput): LeagueSetupInput {
  const hasLeagueInitials = Object.prototype.hasOwnProperty.call(setup, "initials");
  const initials = hasLeagueInitials ? setup.initials : setup.abbreviation || undefined;
  return {
    ...setup,
    abbreviation: leagueAcronym(setup.name),
    initials,
    display: setup.display || { cityNames: true, managers: true, venues: true },
    priorSeason: { ...setup.priorSeason, hasData: setup.priorSeason.hasData ?? setup.priorSeason.enabled, entryMode: setup.priorSeason.entryMode ?? (setup.priorSeason.enabled ? setup.priorSeason.hasData ? "history" : "manual" : "none") },
    weekOne: setup.weekOne || { rankingSource: "prior-season" },
    playoffs: normalizePlayoffSettings(setup.playoffs, setup.teams.length, setup.color, setup.weeks),
    divisions: setup.divisions.map((division) => ({ ...division, initials: Object.prototype.hasOwnProperty.call(division, "initials") ? division.initials : undefined })),
    teams: setup.teams.map((team) => {
      const { draftScore: legacyDraftScore, ...teamWithoutLegacyScore } = team as typeof team & { draftScore?: number };
      const city = team.city || "";
      const teamInitials = Object.prototype.hasOwnProperty.call(team, "initials") ? team.initials : team.shortName || undefined;
      const storedDraftPlace = Number.isInteger(team.draftPlace) && team.draftPlace! >= 1 && team.draftPlace! <= setup.teams.length ? team.draftPlace : undefined;
      const migratedDraftPlace = Number.isInteger(legacyDraftScore) && legacyDraftScore! >= 1 && legacyDraftScore! <= setup.teams.length ? legacyDraftScore : undefined;
      return { ...teamWithoutLegacyScore, city, initials: teamInitials, draftPlace: storedDraftPlace ?? migratedDraftPlace, shortName: resolveInitials(teamInitials, entityMonogram(team.name, city)) };
    }),
  };
}

const SETUP_KEY = "leagueweaver:v3:setup";
const SEASON_KEY = "leagueweaver:v3:season";

export function normalizeSeason(schedule: GeneratedSchedule): GeneratedSchedule {
  const setup = normalizeSetup(schedule.setup);
  const preseasonRanks = new Map(setup.teams.map((team) => [team.id, team.overallRank]));
  const openingWeekRanks = getWeekOneRankMap(setup);
  return {
    ...schedule,
    setup,
    weeks: normalizeScheduleMatchups(schedule.weeks, (weekNumber) => weekNumber === 1 ? openingWeekRanks : preseasonRanks),
  };
}

export function saveSetup(setup: LeagueSetupInput) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

export function loadSetup(): LeagueSetupInput | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(SETUP_KEY);
    return stored ? normalizeSetup(JSON.parse(stored) as LeagueSetupInput) : null;
  } catch {
    return null;
  }
}

export function saveSeason(schedule: GeneratedSchedule) {
  if (typeof window === "undefined") return;
  const normalized = normalizeSeason(schedule);
  window.localStorage.setItem(SEASON_KEY, JSON.stringify(normalized));
  saveSetup(normalized.setup);
}

export function loadSeason(): GeneratedSchedule | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(SEASON_KEY);
    if (!stored) return null;
    const schedule = JSON.parse(stored) as GeneratedSchedule;
    return freezeCompletedRankHistory(normalizeSeason(schedule));
  } catch {
    return null;
  }
}
