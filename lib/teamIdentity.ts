import type { Team } from "./types";
import { entityMonogram, resolveInitials } from "./monograms";

type TeamInitialsInput = Pick<Team, "name" | "city" | "initials"> & { id?: string; overallRank?: number };

const TEAM_INITIALS_STOP_WORDS = new Set(["a", "am", "an", "and", "at", "by", "for", "from", "i", "in", "of", "on", "or", "the", "to", "vs", "with"]);

const PLACE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
  "washington dc": "DC",
  "washington d c": "DC",
  atlanta: "ATL",
  baltimore: "BAL",
  boston: "BOS",
  brooklyn: "BKN",
  buffalo: "BUF",
  charlotte: "CHA",
  chicago: "CHI",
  cincinnati: "CIN",
  cleveland: "CLE",
  columbus: "CBJ",
  cumgetsum: "CUG",
  dallas: "DAL",
  denver: "DEN",
  detroit: "DET",
  "green bay": "GB",
  houston: "HOU",
  indianapolis: "IND",
  jacksonville: "JAX",
  "kansas city": "KC",
  "las vegas": "LV",
  "los angeles": "LA",
  memphis: "MEM",
  miami: "MIA",
  milwaukee: "MIL",
  minneapolis: "MIN",
  nashville: "NSH",
  "new england": "NE",
  "new orleans": "NO",
  orlando: "ORL",
  philadelphia: "PHI",
  phoenix: "PHX",
  pittsburgh: "PIT",
  portland: "POR",
  "salt lake city": "SLC",
  "san antonio": "SA",
  "san diego": "SD",
  "san francisco": "SF",
  "san jose": "SJ",
  seattle: "SEA",
  "st louis": "STL",
  "saint louis": "STL",
  "tampa bay": "TB",
  toronto: "TOR",
  vancouver: "VAN",
  "arizona state": "ASU",
  auburn: "AUB",
  clemson: "CLEM",
  duke: "DUKE",
  "florida state": "FSU",
  "georgia tech": "GT",
  lsu: "LSU",
  "michigan state": "MSU",
  "nc state": "NCSU",
  "north carolina state": "NCSU",
  "notre dame": "ND",
  "ohio state": "OSU",
  "oregon state": "OSU",
  "penn state": "PSU",
  stanford: "STAN",
  ucla: "UCLA",
  usc: "USC",
};

export function teamDisplayName(team: Pick<Team, "city" | "name">, includeCity = true) {
  return [includeCity ? team.city?.trim() : "", team.name?.trim()].filter(Boolean).join(" ") || "Untitled team";
}

export function teamMonogram(city: string, name: string) {
  return placeAbbreviation(city) ?? (!city.trim() ? teamNameInitials(name) : null) ?? entityMonogram(name, city);
}

function words(value: string) {
  return value.trim().split(/\s+/).map((word) => word.replace(/[^A-Za-z0-9]/g, "")).filter(Boolean);
}

function placeKey(value: string) {
  return value.trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function placeAbbreviation(value: string) {
  const key = placeKey(value);
  if (!key) return null;
  return PLACE_ABBREVIATIONS[key] ?? null;
}

function teamNameInitials(name: string) {
  const nameWords = words(name).filter((word) => !TEAM_INITIALS_STOP_WORDS.has(word.toLowerCase()));
  if (nameWords.length === 1) return nameWords[0].slice(0, 3).toUpperCase();
  if (nameWords.length < 2) return null;
  return nameWords.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

function placeholderTeamInitials(team: Pick<Team, "name" | "city"> & { overallRank?: number }) {
  if (team.city?.trim()) return null;
  const trimmed = team.name.trim();
  const numbered = /^team(?:\s+(?:holder|number))?\s*#?\s*(\d+)$/i.exec(trimmed);
  if (numbered) return `T${numbered[1]}`;
  if (/^team(?:\s+(?:holder|number))?$/i.test(trimmed) && team.overallRank) return `T${team.overallRank}`;
  return null;
}

function automaticTeamInitials(team: TeamInitialsInput) {
  const knownPlace = placeAbbreviation(team.city);
  if (knownPlace) return knownPlace;
  const nameOnlyInitials = !team.city.trim() ? teamNameInitials(team.name) : null;
  if (nameOnlyInitials) return nameOnlyInitials;
  return entityMonogram(team.name, team.city);
}

export function teamInitials(team: TeamInitialsInput) {
  const placeholderInitials = placeholderTeamInitials(team);
  if (!team.initials?.trim() && placeholderInitials) return placeholderInitials;
  return resolveInitials(team.initials, automaticTeamInitials(team));
}
