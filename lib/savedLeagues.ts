import { teamMonogram } from "./teamIdentity";
import { divisionAcronym, leagueAcronym, resolveInitials } from "./monograms";
import type { Division, LeagueSetupInput, SavedLeagueIdentity, SavedLeaguePreset, Team } from "./types";

interface LegacyDivision {
  id?: string;
  name?: string;
  initials?: string;
  acronym?: string;
  color?: string;
  logo?: string;
  teams?: Array<{
    id?: string; providerId?: string; city?: string; location?: string; name?: string; teamName?: string; nickname?: string;
    shortName?: string; initials?: string; acronym?: string; manager?: string; owner?: string;
    color?: string; logo?: string; logoUrl?: string; venue?: string; stadium?: string;
    overallSeed?: string | number; overallRank?: string | number; divisionId?: string;
  }>;
}

interface LegacyLeagueData {
  leagueName?: string;
  leagueInitials?: string;
  leagueDescription?: string;
  leagueColor?: string;
  leagueLogo?: string;
  divisions?: LegacyDivision[];
}

type NormalizableTeam = {
  id?: unknown;
  providerId?: unknown;
  city?: unknown;
  location?: unknown;
  name?: unknown;
  teamName?: unknown;
  nickname?: unknown;
  shortName?: unknown;
  initials?: unknown;
  acronym?: unknown;
  manager?: unknown;
  owner?: unknown;
  color?: unknown;
  logoUrl?: unknown;
  logo?: unknown;
  divisionId?: unknown;
  overallRank?: unknown;
  draftPlace?: unknown;
  draftScore?: unknown;
  venue?: unknown;
  stadium?: unknown;
  overallSeed?: unknown;
};

export function identityFromSetup(setup: LeagueSetupInput): SavedLeagueIdentity {
  return {
    version: 3,
    league: {
      name: setup.name,
      abbreviation: setup.abbreviation,
      initials: setup.initials ?? "",
      description: setup.description,
      color: setup.color,
      logoUrl: setup.logoUrl,
    },
    divisions: setup.divisions.map((division) => ({ ...division, initials: division.initials ?? "" })),
    teams: setup.teams.map((team) => ({ ...team, initials: team.initials ?? "" })),
    display: setup.display,
    priorSeason: setup.priorSeason,
    platformConnection: setup.platformConnection,
    playoffs: {
      name: setup.playoffs.name,
      color: setup.playoffs.color,
      theme: setup.playoffs.theme,
      logoUrl: setup.playoffs.logoUrl,
      roundNames: setup.playoffs.roundNames,
      roundLogoUrls: setup.playoffs.roundLogoUrls,
      gameNames: setup.playoffs.gameNames,
      gameLogoUrls: setup.playoffs.gameLogoUrls,
    },
  };
}

export function normalizeSavedLeague(row: { id: string; name: string; data: unknown; updated_at?: string; updatedAt?: string }): SavedLeaguePreset | null {
  if (!row.data || typeof row.data !== "object") return null;
  const data = row.data as SavedLeagueIdentity | LegacyLeagueData;
  if ("version" in data && data.version === 3 && Array.isArray(data.divisions) && Array.isArray(data.teams)) {
    const divisions = data.divisions.map((division, index) => normalizeDivision(division, index));
    const teams = data.teams.map((team, index) => normalizeTeam(team, index, divisions[index % divisions.length]?.id || "division-1", data.teams.length));
    const hasLeagueInitials = Object.prototype.hasOwnProperty.call(data.league, "initials");
    const leagueInitials = hasLeagueInitials ? data.league.initials || undefined : data.league.abbreviation || undefined;
    const league = { ...data.league, initials: leagueInitials?.slice(0, 4), abbreviation: data.league.abbreviation || leagueAcronym(data.league.name) };
    const priorSeason = data.priorSeason ? { ...data.priorSeason, entryMode: data.priorSeason.entryMode ?? (data.priorSeason.enabled ? data.priorSeason.hasData ? "history" : "manual" : "none") } : { enabled: false, hasData: false, entryMode: "none" as const, source: "regular-season" as const };
    return { id: row.id, name: row.name, data: { ...data, league, divisions, teams, display: data.display || { cityNames: true, managers: true, venues: true }, priorSeason, platformConnection: data.platformConnection }, updatedAt: row.updated_at || row.updatedAt || new Date().toISOString() };
  }
  const legacy = data as LegacyLeagueData;
  if (!legacy.leagueName || !Array.isArray(legacy.divisions)) return null;
  const legacyDivisions = legacy.divisions;
  const divisions = legacyDivisions.map((division, index) => normalizeDivision({ ...division, logoUrl: division.logo }, index));
  const legacyTeamCount = legacyDivisions.reduce((total, division) => total + (division.teams?.length ?? 0), 0);
  const teams: Team[] = legacyDivisions.flatMap((division, divisionIndex) => (division.teams ?? []).map((team, teamIndex) => {
    const index = teamsLengthBefore(legacyDivisions, divisionIndex) + teamIndex;
    return normalizeTeam({ ...team, logoUrl: team.logo }, index, team.divisionId || divisions[divisionIndex].id, legacyTeamCount);
  }));
  return {
    id: row.id,
    name: row.name,
    data: {
      version: 3,
      league: {
        name: legacy.leagueName,
        abbreviation: leagueAcronym(legacy.leagueName),
        initials: legacy.leagueInitials?.slice(0, 4) || undefined,
        description: legacy.leagueDescription || "",
        color: legacy.leagueColor || "#117A45",
        logoUrl: legacy.leagueLogo || undefined,
      },
      divisions,
      teams,
      display: { cityNames: true, managers: true, venues: true },
      priorSeason: { enabled: false, hasData: false, entryMode: "none", source: "regular-season" },
    },
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

function normalizeDivision(division: Partial<Division>, index: number): Division {
  const hasInitials = Object.prototype.hasOwnProperty.call(division, "initials");
  const legacyAcronym = (division as Partial<Division> & { acronym?: string }).acronym;
  return {
    id: division.id || `division-${index + 1}`,
    name: division.name || `Division ${index + 1}`,
    initials: (hasInitials ? division.initials || undefined : legacyAcronym || undefined)?.slice(0, 4),
    color: division.color || "#117A45",
    logoUrl: division.logoUrl || undefined,
  };
}

function normalizeTeam(team: NormalizableTeam, index: number, fallbackDivisionId: string, teamCount: number): Team {
  const city = String(team.city || team.location || "").trim();
  const name = String(team.teamName || team.nickname || team.name || `Team ${index + 1}`).trim();
  const hasInitials = Object.prototype.hasOwnProperty.call(team, "initials");
  const initials = (hasInitials ? String(team.initials || "") || undefined : String(team.shortName || team.acronym || "") || undefined)?.slice(0, 4);
  const automatic = teamMonogram(city, name);
  const draftPlace = Number(team.draftPlace ?? team.draftScore);
    return {
      id: String(team.id || `team-${index + 1}`),
      providerId: typeof team.providerId === "string" ? team.providerId : undefined,
      city,
    name,
    shortName: resolveInitials(initials, automatic),
    initials,
    manager: String(team.manager || team.owner || ""),
    color: String(team.color || "#117A45"),
    logoUrl: String(team.logoUrl || team.logo || "") || undefined,
    divisionId: String(team.divisionId || fallbackDivisionId),
    overallRank: Number(team.overallRank || team.overallSeed) || index + 1,
    draftPlace: Number.isInteger(draftPlace) && draftPlace >= 1 && draftPlace <= teamCount ? draftPlace : undefined,
    stadium: String(team.stadium || team.venue || `${name} Stadium`),
  };
}

function teamsLengthBefore(divisions: LegacyDivision[], divisionIndex: number) {
  return divisions.slice(0, divisionIndex).reduce((total, division) => total + (division.teams?.length ?? 0), 0);
}
