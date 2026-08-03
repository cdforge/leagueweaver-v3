import { type CSSProperties } from "react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { conferenceAcronym, conferenceDivisionAcronym, divisionAcronym, resolveInitials } from "@/lib/monograms";
import type { Conference, Division } from "@/lib/types";

export function divisionMarkText(division: Division, conference?: Conference, compact = false) {
  return conference
    ? conferenceDivisionAcronym(division.name, division.initials, conference.name, conference.initials, compact)
    : resolveInitials(division.initials, divisionAcronym(division.name));
}

export function DivisionMark({ division, conference, size = 18, className = "" }: { division: Division; conference?: Conference; size?: number; className?: string }) {
  const initials = divisionMarkText(division, conference, size < 20);
  const hasImage = Boolean(division.logoUrl);
  const fontScale = initials.length >= 5 ? 0.29 : initials.length > 3 ? 0.34 : 0.5;
  return <span
    className={`division-mark ${conference && !hasImage ? "division-mark-qualified" : ""} ${hasImage ? "division-mark-has-image" : "division-mark-filled"} ${className}`}
    style={{
      width: size,
      height: size,
      color: accessibleTeamColor(division.color),
      ...(hasImage ? {} : { "--dm-bg": division.color, "--dm-fg": accessibleTeamColor(division.color), "--dm-ink": readableTextColor(division.color) }),
    } as CSSProperties}
    aria-hidden="true"
  >
    {hasImage ? <img src={division.logoUrl} alt="" /> : <b style={{ fontSize: `${Math.max(6, Math.round(size * fontScale))}px`, lineHeight: 1 }}>{initials}</b>}
  </span>;
}

/** Same small identity badge as DivisionMark, one tier up: a conference's logo or
 *  color+initials chip — used to prefix a division's own mark once conferences exist. */
export function ConferenceMark({ conference, size = 18, className = "" }: { conference: Conference; size?: number; className?: string }) {
  const initials = resolveInitials(conference.initials, conferenceAcronym(conference.name));
  const hasImage = Boolean(conference.logoUrl);
  return <span
    className={`division-mark conference-mark ${hasImage ? "division-mark-has-image" : "division-mark-filled"} ${className}`}
    style={{
      width: size,
      height: size,
      color: accessibleTeamColor(conference.color),
      ...(hasImage ? {} : { "--dm-bg": conference.color, "--dm-fg": accessibleTeamColor(conference.color), "--dm-ink": readableTextColor(conference.color) }),
    } as CSSProperties}
    aria-hidden="true"
  >
    {hasImage ? <img src={conference.logoUrl} alt="" /> : <b style={{ fontSize: `${Math.max(7, Math.round(size * 0.5))}px`, lineHeight: 1 }}>{initials}</b>}
  </span>;
}

export function DivisionIdentity({ division, conference, detail, iconOnly = false, className = "" }: {
  division: Division;
  conference?: Conference;
  detail?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`division-identity ${iconOnly ? "division-identity-icon" : ""} ${className}`}
      aria-label={iconOnly ? `${division.name} division` : undefined}
      title={iconOnly ? `${division.name} division` : undefined}
    >
      {iconOnly
        ? <DivisionMark division={division} conference={conference} />
        : <EntityLogo
            color={division.color}
            logoUrl={division.logoUrl}
            monogram={divisionMarkText(division, conference)}
            size={32}
            entityType="division"
          />}
      {!iconOnly && <span>
        <strong>{division.name}</strong>
        {detail && <small>{detail}</small>}
      </span>}
    </span>
  );
}
