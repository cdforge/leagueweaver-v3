import type { Conference, Division, LeagueSetupInput, Team } from "./types";
import { applyTeamConferenceIds } from "./conferences";
import { entityMonogram, leagueAcronym } from "./monograms";
import { createDefaultPlayoffSettings } from "./playoffs";
import { teamMonogram } from "./teamIdentity";
import { normalizeTiebreakerSettings } from "./tiebreakers";

const TEAM_NAMES = [
  "Sunday Architects",
  "Goal Line Guild",
  "Fourth & Forever",
  "Gridiron Union",
  "Red Zone Society",
  "Huddle House",
  "Blitz Department",
  "Two Minute Club",
  "Waiver Wire Works",
  "End Zone Office",
  "Prime Time Crew",
  "The Audible",
  "Pocket Presence",
  "First Down Foundry",
  "Play Action Club",
  "Victory Formation",
  "Hail Mary Society",
  "Trench Collective",
  "Snap Count Club",
  "Field General Union",
  "Onside Assembly",
  "Hurry-Up Guild",
  "Coffin Corner Crew",
  "Neutral Zone Works",
  "Shotgun Syndicate",
  "Zone Read Society",
  "Special Teams Bureau",
  "Backfield Department",
  "Chain Gang Club",
  "Sideline Standard",
  "Overtime Union",
  "Cover Two Company",
];

const TEAM_CITIES = [
  "Brooklyn", "Austin", "Chicago", "Phoenix", "Seattle", "Nashville", "Baltimore", "Portland",
  "Denver", "Atlanta", "Boston", "Detroit", "Charlotte", "San Diego", "Cleveland", "Las Vegas",
  "Kansas City", "Minneapolis", "Tampa", "Pittsburgh", "Buffalo", "Miami", "Houston", "Philadelphia",
  "Indianapolis", "Milwaukee", "Sacramento", "Columbus", "Memphis", "Raleigh", "Salt Lake City", "New Orleans",
];

const TEAM_COLORS = [
  "#B91C1C", "#1D4ED8", "#7C3AED", "#C2410C", "#047857", "#BE185D", "#0369A1", "#4D7C0F",
  "#A16207", "#4338CA", "#0F766E", "#9F1239", "#6D28D9", "#9A3412", "#166534", "#1E40AF",
  "#0E7490", "#B45309", "#15803D", "#7E22CE", "#BE123C", "#2563EB", "#DB2777", "#0891B2",
  "#65A30D", "#CA8A04", "#4F46E5", "#E11D48", "#7C2D12", "#0D9488", "#1E3A8A", "#831843",
];

const STADIUMS = [
  "Foundry Field",
  "Union Stadium",
  "The Yard",
  "Commissioner Park",
  "Victory Grounds",
  "Sunday Stadium",
  "The Gridiron",
  "Championship Field",
];

const DIVISION_COLORS = ["#117A45", "#B42318", "#2457A7", "#7A4A12", "#6D28D9", "#0F766E", "#BE185D", "#4338CA"];

export function divisionLetterName(index: number) {
  const letter = String.fromCharCode(65 + index);
  return `Division ${letter}`;
}

export function createDivisions(count = 2): Division[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `division-${index + 1}`,
    name: divisionLetterName(index),
    color: DIVISION_COLORS[index % DIVISION_COLORS.length],
    colorSource: "auto",
  }));
}

const CONFERENCE_NAMES = ["American", "National"];
const CONFERENCE_COLORS = ["#1D4ED8", "#B42318"];

/** Two conference identities (name/initials/color), branded further in the wizard. */
export function createConferences(count = 2): Conference[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `conference-${index + 1}`,
    name: CONFERENCE_NAMES[index] ?? `Conference ${index + 1}`,
    color: CONFERENCE_COLORS[index % CONFERENCE_COLORS.length],
  }));
}

export function createTeams(teamCount: number, divisions: Division[]): Team[] {
  return applyTeamConferenceIds(Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    city: TEAM_CITIES[index],
    name: TEAM_NAMES[index],
    shortName: teamMonogram(TEAM_CITIES[index], TEAM_NAMES[index]),
    manager: `Manager ${index + 1}`,
    color: TEAM_COLORS[index],
    divisionId: divisions[index % divisions.length].id,
    overallRank: index + 1,
    stadium: STADIUMS[index % STADIUMS.length],
  })), divisions);
}

export function createPlaceholderTeams(teamCount: number, divisions: Division[]): Team[] {
  return Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    city: "",
    name: `Team ${index + 1}`,
    shortName: entityMonogram(`Team ${index + 1}`),
    manager: "",
    color: TEAM_COLORS[index],
    divisionId: "",
    overallRank: index + 1,
    stadium: `Team ${index + 1} Stadium`,
  }));
}

export function createDefaultSetup(): LeagueSetupInput {
  const divisions = createDivisions(2);
  return {
    id: "local-season",
    name: "Sunday Night League",
    abbreviation: leagueAcronym("Sunday Night League"),
    description: "A competitive home league built for a fair, memorable season.",
    color: "#117A45",
    seasonYear: 2026,
    weeks: 14,
    divisions,
    divisionPlacementMode: "manual",
    teams: createTeams(10, divisions),
    display: { cityNames: true, managers: true, venues: true },
    priorSeason: {
      enabled: true,
      hasData: true,
      entryMode: "history",
      source: "playoffs",
    },
    weekOne: {
      rankingSource: "prior-season",
    },
    tiebreakers: normalizeTiebreakerSettings(),
    playoffs: createDefaultPlayoffSettings(10, "#117A45"),
    fairness: {
      maxHomeAwayStreak: 3,
      preventImmediateRematches: true,
      finalWeekDivisional: true,
      prioritizeOpeningWeek: true,
      prioritizeThanksgiving: true,
    },
  };
}

export function createBlankSetup(): LeagueSetupInput {
  const setup = createDefaultSetup();
  return {
    ...setup,
    name: "",
    abbreviation: "",
    description: "",
    logoUrl: undefined,
    divisions: setup.divisions.map((division) => ({ ...division, logoUrl: undefined })),
    divisionPlacementMode: "manual",
    priorSeason: { ...setup.priorSeason, enabled: false, hasData: false, entryMode: "none" },
    teams: createPlaceholderTeams(setup.teams.length, setup.divisions),
  };
}
