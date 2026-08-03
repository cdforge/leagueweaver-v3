"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { LoaderCircle } from "lucide-react";
import { EntityLogo } from "./EntityLogo";
import { readableTextColor } from "@/lib/colorContrast";
import { divisionAcronym, resolveInitials } from "@/lib/monograms";
import { teamInitials } from "@/lib/teamIdentity";
import type { Division, Team } from "@/lib/types";

function LeagueDivisionMark({ division, size }: { division: Division; size: number }) {
  const initials = resolveInitials(division.initials, divisionAcronym(division.name));
  const [loading, setLoading] = useState(Boolean(division.logoUrl));

  useEffect(() => {
    setLoading(Boolean(division.logoUrl));
  }, [division.logoUrl]);

  return (
    <span className={`entity-logo league-division-mark${division.logoUrl ? " entity-logo-has-image" : ""} ${loading ? "entity-logo-loading" : ""}`} style={{ width: size, height: size, background: division.color, color: readableTextColor(division.color), "--entity-color": division.color } as CSSProperties} title={division.name}>
      {division.logoUrl ? <><img src={division.logoUrl} alt="" onLoad={() => setLoading(false)} onError={() => setLoading(false)} />{loading && <LoaderCircle className="entity-logo-spinner spin" aria-hidden="true" />}</> : <span>{initials}</span>}
    </span>
  );
}

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
          <LeagueDivisionMark division={division} size={size} />
          {members.map((team) => <EntityLogo key={team.id} size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}
        </span>
      ))}
      {ungrouped.length > 0 && <span className="league-marks-group">{ungrouped.map((team) => <EntityLogo key={team.id} size={size} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}</span>}
    </span>
  );
}
