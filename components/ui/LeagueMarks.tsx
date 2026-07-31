"use client";

import { EntityLogo } from "./EntityLogo";
import { readableTextColor } from "@/lib/colorContrast";
import { divisionAcronym, resolveInitials } from "@/lib/monograms";
import { teamInitials } from "@/lib/teamIdentity";
import type { Division, Team } from "@/lib/types";

// Renders a league's teams as identity marks, grouped by division with the division's own logo
// leading each group as a separator. Shared by the account saved-league rows and the builder's
// saved-league cards so the treatment stays identical.
export function LeagueMarks({ teams, divisions, size = 32, className = "" }: { teams: Team[]; divisions: Division[]; size?: number; className?: string }) {
  if (!teams.length) return null;
  const grouped = divisions
    .map((division) => ({ division, members: teams.filter((team) => team.divisionId === division.id) }))
    .filter((group) => group.members.length > 0);
  const ungrouped = teams.filter((team) => !divisions.some((division) => division.id === team.divisionId));

  return (
    <span className={`league-marks ${className}`.trim()}>
      {grouped.map(({ division, members }) => (
        <span className="league-marks-group" key={division.id}>
          {/* The division's own logo leads its group, filled with the solid division colour so it
              reads as the divider — same rounded-square shape as the team marks, just solid. */}
          <span className={`entity-logo league-division-mark${division.logoUrl ? " entity-logo-has-image" : ""}`} style={{ width: size, height: size, background: division.color, color: readableTextColor(division.color) }} title={division.name}>
            {division.logoUrl ? <img src={division.logoUrl} alt="" /> : <span>{resolveInitials(division.initials, divisionAcronym(division.name))}</span>}
          </span>
          {members.map((team) => <EntityLogo key={team.id} size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}
        </span>
      ))}
      {ungrouped.length > 0 && <span className="league-marks-group">{ungrouped.map((team) => <EntityLogo key={team.id} size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}</span>}
    </span>
  );
}
