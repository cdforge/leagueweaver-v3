"use client";

import { EntityLogo } from "./EntityLogo";
import { DivisionMark } from "./DivisionIdentity";
import { conferenceOfDivision, hasConferences } from "@/lib/conferences";
import { teamInitials } from "@/lib/teamIdentity";
import type { Conference, Division, Team } from "@/lib/types";

// Renders a league's teams as identity marks, grouped by division with the division's own logo
// leading each group as a separator. Shared by the account saved-league rows and the builder's
// saved-league cards so the treatment stays identical.
export function LeagueMarks({ teams, divisions, conferences, size = 32, className = "" }: { teams: Team[]; divisions: Division[]; conferences?: Conference[]; size?: number; className?: string }) {
  if (!teams.length) return null;
  const setup = { divisions, conferences };
  const leagueHasConferences = hasConferences(setup);
  const grouped = divisions
    .map((division) => ({ division, members: teams.filter((team) => team.divisionId === division.id) }))
    .filter((group) => group.members.length > 0);
  const ungrouped = teams.filter((team) => !divisions.some((division) => division.id === team.divisionId));

  return (
    <span className={`league-marks ${className}`.trim()}>
      {grouped.map(({ division, members }) => (
        <span className="league-marks-group" key={division.id}>
          <DivisionMark division={division} conference={leagueHasConferences ? conferenceOfDivision(setup, division.id) : undefined} size={size} className="league-division-mark" />
          {members.map((team) => <EntityLogo key={team.id} size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}
        </span>
      ))}
      {ungrouped.length > 0 && <span className="league-marks-group">{ungrouped.map((team) => <EntityLogo key={team.id} size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}</span>}
    </span>
  );
}
