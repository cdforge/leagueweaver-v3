import type { LeagueSetupInput, Team } from "./types";

function draftPlace(team: Team) {
  return Number.isInteger(team.draftPlace) ? team.draftPlace! : Number.POSITIVE_INFINITY;
}

export function getWeekOneTeamOrder(setup: Pick<LeagueSetupInput, "teams" | "weekOne">) {
  if (setup.weekOne.rankingSource !== "draft-day") {
    return [...setup.teams].sort((left, right) => left.overallRank - right.overallRank || left.id.localeCompare(right.id));
  }
  return [...setup.teams].sort((left, right) =>
    draftPlace(left) - draftPlace(right) ||
    left.overallRank - right.overallRank ||
    left.id.localeCompare(right.id),
  );
}

export function getWeekOneRankMap(setup: Pick<LeagueSetupInput, "teams" | "weekOne">) {
  return new Map(getWeekOneTeamOrder(setup).map((team, index) => [team.id, index + 1]));
}

export function getTeamsMissingDraftPlaces(setup: Pick<LeagueSetupInput, "teams">) {
  return setup.teams.filter((team) => !Number.isInteger(team.draftPlace));
}

export function hasCompleteDraftRanking(setup: Pick<LeagueSetupInput, "teams">) {
  const places = setup.teams.map((team) => team.draftPlace);
  return getTeamsMissingDraftPlaces(setup).length === 0 && new Set(places).size === setup.teams.length;
}

export function formatDraftPlace(place: number, teamCount: number) {
  const remainder100 = place % 100;
  const suffix = remainder100 >= 11 && remainder100 <= 13 ? "th" : place % 10 === 1 ? "st" : place % 10 === 2 ? "nd" : place % 10 === 3 ? "rd" : "th";
  return `${place}${suffix} of ${teamCount}`;
}
