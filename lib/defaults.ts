import type { Division, LeagueSetupInput, Team } from "./types";
import { entityMonogram, leagueAcronym } from "./monograms";
import { createDefaultPlayoffSettings } from "./playoffs";

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
];

const TEAM_CITIES = [
  "Brooklyn", "Austin", "Chicago", "Phoenix", "Seattle", "Nashville", "Baltimore", "Portland",
  "Denver", "Atlanta", "Boston", "Detroit", "Charlotte", "San Diego", "Cleveland", "Las Vegas",
];

const TEAM_COLORS = [
  "#B91C1C",
  "#1D4ED8",
  "#7C3AED",
  "#C2410C",
  "#047857",
  "#BE185D",
  "#0369A1",
  "#4D7C0F",
  "#A16207",
  "#4338CA",
  "#0F766E",
  "#9F1239",
  "#6D28D9",
  "#C2410C",
  "#166534",
  "#1E40AF",
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

export function createDivisions(count: 2 | 3 | 4 = 2): Division[] {
  const names = count === 2 ? ["North", "South"] : count === 3 ? ["North", "Central", "South"] : ["North", "South", "East", "West"];
  const colors = ["#117A45", "#B42318", "#2457A7", "#7A4A12"];
  return names.map((name, index) => ({
    id: `division-${index + 1}`,
    name,
    color: colors[index],
  }));
}

export function createTeams(teamCount: number, divisions: Division[]): Team[] {
  return Array.from({ length: teamCount }, (_, index) => ({
    id: `team-${index + 1}`,
    city: TEAM_CITIES[index],
    name: TEAM_NAMES[index],
    shortName: entityMonogram(TEAM_NAMES[index], TEAM_CITIES[index]),
    manager: `Manager ${index + 1}`,
    color: TEAM_COLORS[index],
    divisionId: divisions[index % divisions.length].id,
    overallRank: index + 1,
    stadium: STADIUMS[index % STADIUMS.length],
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
    priorSeason: { ...setup.priorSeason, enabled: false, hasData: false, entryMode: "none" },
    teams: setup.teams.map((team, index) => ({
      ...team,
      city: "",
      name: `Team ${index + 1}`,
      shortName: entityMonogram(`Team ${index + 1}`),
      manager: "",
      logoUrl: undefined,
      overallRank: index + 1,
      stadium: `Team ${index + 1} Stadium`,
    })),
  };
}
