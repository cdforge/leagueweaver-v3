"use client";

import { useState } from "react";
import { accessibleTeamColor, readableTextColor, tintColor } from "@/lib/colorContrast";

export type EntityLogoType = "league" | "team" | "division" | "conference";

export function EntityLogo({ color, logoUrl, monogram, size = 32, className = "", imagePresentation = "tinted", monoFontSize, entityType = "team" }: { color: string; logoUrl?: string; monogram: string; size?: number; className?: string; imagePresentation?: "tinted" | "bare"; monoFontSize?: number; entityType?: EntityLogoType }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const enforcedSize = Math.max(32, size);
  const compactText = monogram.length >= 5;
  const bareImage = Boolean(visibleLogo && imagePresentation === "bare");
  const fallbackFill = entityType === "league" || entityType === "division" ? color : tintColor(color);
  const fallbackInk = entityType === "league" || entityType === "division" ? readableTextColor(color) : accessibleTeamColor(color);
  const fittedMonoFontSize = monoFontSize ?? (compactText ? Math.max(8, Math.round(enforcedSize * 0.29)) : undefined);
  return <span className={`entity-logo entity-logo-${entityType} ${visibleLogo ? "entity-logo-has-image" : "entity-logo-no-image"} ${compactText && !visibleLogo ? "entity-logo-compact-text" : ""} ${bareImage ? "entity-logo-bare-image" : ""} ${className}`} style={{ "--entity-color": color, width: enforcedSize, height: enforcedSize, background: bareImage ? "transparent" : visibleLogo ? tintColor(color) : fallbackFill, color: visibleLogo ? readableTextColor(color) : fallbackInk, ...(fittedMonoFontSize && !visibleLogo ? { fontSize: fittedMonoFontSize } : {}) } as React.CSSProperties}>
    {visibleLogo ? <img src={visibleLogo} alt="" onError={() => setFailedLogo(visibleLogo)} /> : <span>{monogram}</span>}
  </span>;
}
