import type { GeneratedSchedule, LeagueSetupInput } from "./types";
import { normalizeScheduleMatchups } from "./matchups";
import { divisionAcronym, entityMonogram, leagueAcronym, resolveInitials } from "./monograms";
import { normalizePlayoffSettings } from "./playoffs";
import { getWeekOneRankMap } from "./rankings";
import { freezeCompletedRankHistory } from "./standings";
import { normalizeTiebreakerSettings } from "./tiebreakers";

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
    tiebreakers: normalizeTiebreakerSettings(setup.tiebreakers),
    playoffs: normalizePlayoffSettings(setup.playoffs, setup.teams.length, setup.color, setup.weeks),
    platformConnection: setup.platformConnection ? {
      ...setup.platformConnection,
      syncMode: setup.platformConnection.syncMode ?? "manual",
      authType: setup.platformConnection.authType ?? "public",
      status: setup.platformConnection.status ?? "idle",
      warnings: setup.platformConnection.warnings ?? [],
    } : undefined,
    divisions: setup.divisions.map((division) => ({ ...division, initials: Object.prototype.hasOwnProperty.call(division, "initials") ? division.initials : undefined })),
    teams: setup.teams.map((team) => {
      const { draftScore: legacyDraftScore, ...teamWithoutLegacyScore } = team as typeof team & { draftScore?: number };
      const city = team.city || "";
      const teamInitials = Object.prototype.hasOwnProperty.call(team, "initials") ? team.initials : team.shortName || undefined;
      const storedDraftPlace = Number.isInteger(team.draftPlace) && team.draftPlace! >= 1 && team.draftPlace! <= setup.teams.length ? team.draftPlace : undefined;
      const migratedDraftPlace = Number.isInteger(legacyDraftScore) && legacyDraftScore! >= 1 && legacyDraftScore! <= setup.teams.length ? legacyDraftScore : undefined;
      return { ...teamWithoutLegacyScore, providerId: team.providerId, city, initials: teamInitials, draftPlace: storedDraftPlace ?? migratedDraftPlace, shortName: resolveInitials(teamInitials, entityMonogram(team.name, city)) };
    }),
  };
}

const SETUP_KEY = "leagueweaver:v3:setup";
/** Legacy single-slot season key. Read once and migrated into SEASONS_KEY. */
const SEASON_KEY = "leagueweaver:v3:season";
/** Keyed store of every schedule saved on this device, indexed by schedule id. */
const SEASONS_KEY = "leagueweaver:v3:seasons";

type StoredSeason = { schedule: GeneratedSchedule; savedAt: number };
type SeasonStore = Record<string, StoredSeason>;

export type LocalSeasonSummary = {
  id: string;
  name: string;
  seasonYear: number;
  teamCount: number;
  savedAt: number;
  color?: string;
  logoUrl?: string;
  initials?: string;
};

/**
 * A device-local id for a guest schedule. It deliberately does NOT look like a
 * cloud UUID so the workspace keeps treating it as local-only until the owner
 * signs in and it is claimed into their account.
 */
export function createLocalSeasonId(): string {
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return `local-${random}`;
}

function readSeasonStore(): SeasonStore {
  if (typeof window === "undefined") return {};
  let store: SeasonStore = {};
  try {
    const raw = window.localStorage.getItem(SEASONS_KEY);
    if (raw) store = JSON.parse(raw) as SeasonStore;
  } catch {
    store = {};
  }
  // One-time migration: fold the legacy single-slot season into the keyed store
  // so nobody loses the schedule they had open when this shipped.
  try {
    const legacy = window.localStorage.getItem(SEASON_KEY);
    if (legacy) {
      const schedule = JSON.parse(legacy) as GeneratedSchedule;
      if (schedule?.id && !store[schedule.id]) {
        store[schedule.id] = { schedule, savedAt: Date.now() };
        window.localStorage.setItem(SEASONS_KEY, JSON.stringify(store));
      }
      window.localStorage.removeItem(SEASON_KEY);
    }
  } catch {
    // Ignore migration failures; the legacy key is left in place to retry later.
  }
  return store;
}

function writeSeasonStore(store: SeasonStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEASONS_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota failures; the in-memory schedule stays usable this session.
  }
}

export function normalizeSeason(schedule: GeneratedSchedule): GeneratedSchedule {
  const hadTiebreakerSettings = Boolean(schedule.setup.tiebreakers);
  const setup = normalizeSetup(schedule.setup);
  const preseasonRanks = new Map(setup.teams.map((team) => [team.id, team.overallRank]));
  const openingWeekRanks = getWeekOneRankMap(setup);
  return {
    ...schedule,
    setup,
    rankHistory: hadTiebreakerSettings ? schedule.rankHistory : undefined,
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
  const store = readSeasonStore();
  store[normalized.id] = { schedule: normalized, savedAt: Date.now() };
  writeSeasonStore(store);
  saveSetup(normalized.setup);
}

/** Loads a single device-saved schedule by id, or null if none is stored. */
export function loadSeasonById(id: string): GeneratedSchedule | null {
  if (typeof window === "undefined" || !id) return null;
  const entry = readSeasonStore()[id];
  if (!entry) return null;
  try {
    return freezeCompletedRankHistory(normalizeSeason(entry.schedule));
  } catch {
    return null;
  }
}

/** Lightweight summaries of every schedule saved on this device, newest first. */
export function listLocalSeasons(): LocalSeasonSummary[] {
  return Object.values(readSeasonStore())
    .map(({ schedule, savedAt }) => ({
      id: schedule.id,
      name: schedule.setup?.name?.trim() || "Untitled league",
      seasonYear: schedule.setup?.seasonYear ?? 0,
      teamCount: schedule.setup?.teams?.length ?? 0,
      savedAt,
      color: schedule.setup?.color,
      logoUrl: schedule.setup?.logoUrl,
      initials: schedule.setup?.initials,
    }))
    .sort((a, b) => b.savedAt - a.savedAt);
}

/** Removes a single device-saved schedule by id. */
export function removeLocalSeason(id: string) {
  if (typeof window === "undefined" || !id) return;
  const store = readSeasonStore();
  if (store[id]) {
    delete store[id];
    writeSeasonStore(store);
  }
}
