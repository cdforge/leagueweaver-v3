"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LoaderCircle } from "lucide-react";
import { EntityLogo } from "./EntityLogo";
import { readableTextColor } from "@/lib/colorContrast";
import { divisionAcronym, resolveInitials } from "@/lib/monograms";
import { teamInitials } from "@/lib/teamIdentity";
import type { Division, Team } from "@/lib/types";

function LeagueDivisionMark({ division, size }: { division: Division; size: number }) {
  const initials = resolveInitials(division.initials, divisionAcronym(division.name));
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loadedLogo, setLoadedLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState<string | null>(division.logoUrl ?? null);
  const loading = Boolean(division.logoUrl && loadingLogo === division.logoUrl && loadedLogo !== division.logoUrl);
  const markLoaded = () => {
    if (!division.logoUrl) return;
    setLoadedLogo(division.logoUrl);
    setLoadingLogo((current) => current === division.logoUrl ? null : current);
  };

  useEffect(() => {
    if (!division.logoUrl) {
      setLoadedLogo(null);
      setLoadingLogo(null);
      return;
    }
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoadedLogo(division.logoUrl);
      setLoadingLogo(null);
      return;
    }
    setLoadingLogo(division.logoUrl);
  }, [division.logoUrl]);

  return (
    <span className={`entity-logo league-division-mark${division.logoUrl ? " entity-logo-has-image" : ""} ${loading ? "entity-logo-loading" : ""}`} style={{ width: size, height: size, background: division.color, color: readableTextColor(division.color), "--entity-color": division.color } as CSSProperties} title={division.name}>
      {division.logoUrl ? <><img ref={imageRef} src={division.logoUrl} alt="" onLoad={markLoaded} onError={() => { setLoadedLogo(null); setLoadingLogo(null); }} />{loading && <LoaderCircle className="entity-logo-spinner spin" aria-hidden="true" />}</> : <span>{initials}</span>}
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
