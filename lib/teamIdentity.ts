import type { Team } from "./types";
import { entityMonogram, resolveInitials } from "./monograms";

export function teamDisplayName(team: Pick<Team, "city" | "name">, includeCity = true) {
  return [includeCity ? team.city?.trim() : "", team.name?.trim()].filter(Boolean).join(" ") || "Untitled team";
}

export function teamMonogram(city: string, name: string) {
  return entityMonogram(name, city);
}

export function teamInitials(team: Pick<Team, "name" | "city" | "initials">) {
  return resolveInitials(team.initials, entityMonogram(team.name, team.city));
}
