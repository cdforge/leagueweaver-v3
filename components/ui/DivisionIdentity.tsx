import { EntityLogo } from "@/components/ui/EntityLogo";
import { accessibleTeamColor } from "@/lib/colorContrast";
import { divisionAcronym, resolveInitials } from "@/lib/monograms";
import type { Division } from "@/lib/types";

export function DivisionMark({ division, size = 18, className = "" }: { division: Division; size?: number; className?: string }) {
  const initials = resolveInitials(division.initials, divisionAcronym(division.name));
  return <span
    className={`division-mark ${className}`}
    style={{ width: size, height: size, color: accessibleTeamColor(division.color) }}
    aria-hidden="true"
  >
    {division.logoUrl ? <img src={division.logoUrl} alt="" /> : <b>{initials}</b>}
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
