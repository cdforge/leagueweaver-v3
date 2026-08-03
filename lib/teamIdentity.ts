import type { Team } from "./types";
import { entityMonogram, resolveInitials } from "./monograms";

type TeamInitialsInput = Pick<Team, "name" | "city" | "initials"> & { id?: string; overallRank?: number };

export function teamDisplayName(team: Pick<Team, "city" | "name">, includeCity = true) {
  return [includeCity ? team.city?.trim() : "", team.name?.trim()].filter(Boolean).join(" ") || "Untitled team";
}

export function teamMonogram(city: string, name: string) {
  return entityMonogram(name, city);
}

function words(value: string) {
  return value.trim().split(/\s+/).map((word) => word.replace(/[^A-Za-z0-9]/g, "")).filter(Boolean);
}

function placeholderTeamInitials(team: Pick<Team, "name" | "city"> & { overallRank?: number }) {
  if (team.city?.trim()) return null;
  const trimmed = team.name.trim();
  const numbered = /^team(?:\s+(?:holder|number))?\s*#?\s*(\d+)$/i.exec(trimmed);
  if (numbered) return `T${numbered[1]}`;
  if (/^team(?:\s+(?:holder|number))?$/i.test(trimmed) && team.overallRank) return `T${team.overallRank}`;
  return null;
}

function twoWordCityInitials(team: Pick<Team, "name" | "city">) {
  const cityWords = words(team.city);
  if (cityWords.length < 2) return null;
  const base = `${cityWords[0][0]}${cityWords[1][0]}`.toUpperCase();
  return base.length === 2 ? base : null;
}

function automaticTeamInitials(team: TeamInitialsInput, teams?: TeamInitialsInput[]) {
  const twoLetterCity = twoWordCityInitials(team);
  if (!twoLetterCity) return entityMonogram(team.name, team.city);
  const shared = teams?.some((other) => {
    const sameTeam = team.id && other.id ? team.id === other.id : other === team;
    return !sameTeam && !other.initials?.trim() && twoWordCityInitials(other) === twoLetterCity;
  });
  if (!shared) return twoLetterCity;
  return `${twoLetterCity}${words(team.name)[0]?.[0] ?? ""}`.toUpperCase().slice(0, 3);
}

export function teamInitials(
  team: TeamInitialsInput,
  teams?: TeamInitialsInput[],
) {
  const placeholderInitials = placeholderTeamInitials(team);
  if (!team.initials?.trim() && placeholderInitials) return placeholderInitials;
  return resolveInitials(team.initials, automaticTeamInitials(team, teams));
}
