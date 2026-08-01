import type { Conference, Division, LeagueSetupInput } from "./types";

type SetupLike = Pick<LeagueSetupInput, "divisions"> & { conferences?: Conference[] };

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

/** Whether a division→conference assignment is present and splits the divisions exactly in half. */
export function isConferenceAssignmentBalanced(setup: SetupLike): boolean {
  if (!hasConferences(setup)) return false;
  const [a, b] = setup.conferences!;
  const countA = setup.divisions.filter((division) => division.conferenceId === a.id).length;
  const countB = setup.divisions.filter((division) => division.conferenceId === b.id).length;
  return countA === countB && countA === setup.divisions.length / 2;
}
