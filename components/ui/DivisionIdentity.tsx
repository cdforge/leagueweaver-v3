import { type CSSProperties } from "react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { accessibleTeamColor, readableTextColor } from "@/lib/colorContrast";
import { conferenceAcronym, divisionAcronym, resolveInitials } from "@/lib/monograms";
import type { Conference, Division } from "@/lib/types";

export function DivisionMark({ division, size = 18, className = "" }: { division: Division; size?: number; className?: string }) {
  const initials = resolveInitials(division.initials, divisionAcronym(division.name));
  const hasImage = Boolean(division.logoUrl);
  // Non-image marks expose their division color as CSS vars; the filled-badge treatment is
  // painted only on the playoff surfaces (.pp-board / .pp-panel) so shared table/clinch marks
  // keep their plain colored-text look.
  return <span
    className={`division-mark ${hasImage ? "" : "division-mark-filled"} ${className}`}
    style={{
      width: size,
      height: size,
      color: accessibleTeamColor(division.color),
      ...(hasImage ? {} : { "--dm-bg": division.color, "--dm-ink": readableTextColor(division.color) }),
    } as CSSProperties}
    aria-hidden="true"
  >
    {/* Size the acronym to the box so a 2–3 char monogram keeps a visible margin
        (a box-filling acronym reads as cramped/off-center) and centers cleanly. */}
    {hasImage ? <img src={division.logoUrl} alt="" /> : <b style={{ fontSize: `${Math.max(7, Math.round(size * 0.5))}px`, lineHeight: 1 }}>{initials}</b>}
  </span>;
}

/** Same small identity badge as DivisionMark, one tier up: a conference's logo or
 *  color+initials chip — used to prefix a division's own mark once conferences exist. */
export function ConferenceMark({ conference, size = 18, className = "" }: { conference: Conference; size?: number; className?: string }) {
  const initials = resolveInitials(conference.initials, conferenceAcronym(conference.name));
  const hasImage = Boolean(conference.logoUrl);
  return <span
    className={`division-mark conference-mark ${hasImage ? "" : "division-mark-filled"} ${className}`}
    style={{
      width: size,
      height: size,
      color: accessibleTeamColor(conference.color),
      ...(hasImage ? {} : { "--dm-bg": conference.color, "--dm-ink": readableTextColor(conference.color) }),
    } as CSSProperties}
    aria-hidden="true"
  >
    {hasImage ? <img src={conference.logoUrl} alt="" /> : <b style={{ fontSize: `${Math.max(7, Math.round(size * 0.5))}px`, lineHeight: 1 }}>{initials}</b>}
  </span>;
}

export function DivisionIdentity({ division, detail, iconOnly = false, className = "" }: {
  division: Division;
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
        ? <DivisionMark division={division} />
        : <EntityLogo
            color={division.color}
            logoUrl={division.logoUrl}
            monogram={resolveInitials(division.initials, divisionAcronym(division.name))}
            size={32}
          />}
      {!iconOnly && <span>
        <strong>{division.name}</strong>
        {detail && <small>{detail}</small>}
      </span>}
    </span>
  );
}

export function ConferenceIdentity({ conference, detail, iconOnly = false, className = "" }: {
  conference: Conference;
  detail?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`division-identity conference-identity ${iconOnly ? "division-identity-icon" : ""} ${className}`}
      aria-label={iconOnly ? `${conference.name} conference` : undefined}
      title={iconOnly ? `${conference.name} conference` : undefined}
    >
      {iconOnly
        ? <ConferenceMark conference={conference} />
        : <EntityLogo
            color={conference.color}
            logoUrl={conference.logoUrl}
            monogram={resolveInitials(conference.initials, conferenceAcronym(conference.name))}
            size={32}
          />}
      {!iconOnly && <span>
        <strong>{conference.name}</strong>
        {detail && <small>{detail}</small>}
      </span>}
    </span>
  );
}
