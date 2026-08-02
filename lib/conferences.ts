import type { Conference, Division, LeagueSetupInput, Team } from "./types";

type SetupLike = Pick<LeagueSetupInput, "divisions"> & { conferences?: Conference[] };
type SetupWithTeams = SetupLike & { teams: Team[] };

/**
 * Conferences apply only to EVEN division counts (4/6/8): the divisions split evenly into
 * exactly two conferences, which become the two halves of the playoff bracket. Two divisions
 * keep their own division-halves behavior; odd counts run one unified bracket (no conferences).
 */
export function hasConferences(setup: SetupLike): boolean {
  const n = setup.divisions.length;
  return n >= 4
    && n % 2 === 0
    && (setup.conferences?.length ?? 0) === 2
    && setup.divisions.every((division) => Boolean(division.conferenceId));
}

/** True when the setup's division count is even and ≥ 4 — i.e. conferences are expected. */
export function conferencesApply(divisionCount: number): boolean {
  return divisionCount >= 4 && divisionCount % 2 === 0;
}

/**
 * The two playoff-bracket sides, as arrays of division ids. Single source of truth for both
 * seeding (`lib/playoffs.ts`) and clinching (`lib/clinch.ts`):
 * - even divisions with a conference assignment → group by `conferenceId` (two groups),
 * - exactly 2 divisions → each division is its own side,
 * - everything else (odd, or unassigned) → one unified group.
 */
export function conferenceDivisionGroups(setup: SetupLike): string[][] {
  const divisionIds = setup.divisions.map((division) => division.id);
  if (divisionIds.length === 2) return [[divisionIds[0]], [divisionIds[1]]];
  if (hasConferences(setup)) {
    const [a, b] = setup.conferences!;
    return [
      setup.divisions.filter((division) => division.conferenceId === a.id).map((division) => division.id),
      setup.divisions.filter((division) => division.conferenceId === b.id).map((division) => division.id),
    ];
  }
  return [divisionIds];
}

/** The conference a division belongs to, if any. */
export function conferenceOfDivision(setup: SetupLike, divisionId: string): Conference | undefined {
  const division = setup.divisions.find((entry) => entry.id === divisionId);
  if (!division?.conferenceId) return undefined;
  return setup.conferences?.find((conference) => conference.id === division.conferenceId);
}

/** The conference id for a division, if conferences are active for this setup. */
export function conferenceIdForDivision(divisions: Division[], divisionId: string): string | undefined {
  return divisions.find((division) => division.id === divisionId)?.conferenceId;
}

/** Keep Team.conferenceId derived from Team.divisionId; remove it for non-conference leagues. */
export function applyTeamConferenceIds<T extends Pick<Team, "divisionId"> & { conferenceId?: string }>(teams: T[], divisions: Division[]): T[] {
  return teams.map((team) => {
    const conferenceId = conferenceIdForDivision(divisions, team.divisionId);
    if (conferenceId) return { ...team, conferenceId };
    if (!("conferenceId" in team)) return team;
    const teamWithoutConference = { ...team };
    delete teamWithoutConference.conferenceId;
    return teamWithoutConference;
  });
}

/** Conference-first team groups for standings and awards surfaces. Empty when no conferences exist. */
export function conferenceTeamGroups(setup: SetupWithTeams): Array<{ conference: Conference; teams: Team[] }> {
  if (!hasConferences(setup)) return [];
  return setup.conferences!.map((conference) => ({
    conference,
    teams: setup.teams.filter((team) => (team.conferenceId ?? conferenceIdForDivision(setup.divisions, team.divisionId)) === conference.id),
  }));
}

/**
 * Default balanced assignment: the first half of the divisions go to conference A, the second
 * half to conference B (4→2+2, 6→3+3, 8→4+4). Used to seed the wizard step; the commissioner
 * can then move divisions between conferences as long as the split stays balanced.
 */
export function defaultConferenceAssignment(divisions: Division[], conferences: Conference[]): Division[] {
  if (conferences.length !== 2) return divisions.map((division) => ({ ...division, conferenceId: undefined }));
  const half = Math.ceil(divisions.length / 2);
  return divisions.map((division, index) => ({ ...division, conferenceId: conferences[index < half ? 0 : 1].id }));
}

/** Preserve a valid assignment, create a balanced one when needed, and clear it otherwise. */
export function reconcileConferenceSetup(divisions: Division[], conferences?: Conference[]): { divisions: Division[]; conferences?: Conference[] } {
  if (!conferencesApply(divisions.length)) {
    return { divisions: divisions.map((division) => ({ ...division, conferenceId: undefined })), conferences: undefined };
  }
  if (conferences?.length === 2) {
    const assigned = divisions.every((division) => division.conferenceId && conferences.some((conference) => conference.id === division.conferenceId));
    return { divisions: assigned ? divisions : defaultConferenceAssignment(divisions, conferences), conferences };
  }
  const nextConferences: Conference[] = [
    { id: "conference-1", name: "Conference A", initials: "A", color: "#1D4ED8" },
    { id: "conference-2", name: "Conference B", initials: "B", color: "#B42318" },
  ];
  return { divisions: defaultConferenceAssignment(divisions, nextConferences), conferences: nextConferences };
}

/** Whether a division→conference assignment is present and splits the divisions exactly in half. */
export function isConferenceAssignmentBalanced(setup: SetupLike): boolean {
  if (!hasConferences(setup)) return false;
  const [a, b] = setup.conferences!;
  const countA = setup.divisions.filter((division) => division.conferenceId === a.id).length;
  const countB = setup.divisions.filter((division) => division.conferenceId === b.id).length;
  return countA === countB && countA === setup.divisions.length / 2;
}
