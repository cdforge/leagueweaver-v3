"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { accessibleTeamColor, readableTextColor, tintColor } from "@/lib/colorContrast";

export type EntityLogoType = "league" | "team" | "division" | "conference";

export function EntityLogo({ color, logoUrl, monogram, size = 32, className = "", imagePresentation = "tinted", monoFontSize, entityType = "team" }: { color: string; logoUrl?: string; monogram: string; size?: number; className?: string; imagePresentation?: "tinted" | "bare"; monoFontSize?: number; entityType?: EntityLogoType }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loadedLogo, setLoadedLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState<string | null>(visibleLogo ?? null);
  const enforcedSize = Math.max(32, size);
  const bareImage = Boolean(visibleLogo && imagePresentation === "bare");
  const solidFallback = entityType === "league" || entityType === "division";
  const stackedDivision = !visibleLogo && entityType === "division" && monogram.includes("-");
  const [stackTop, stackBottom] = stackedDivision ? monogram.split("-", 2) : ["", ""];
  const fittedMonoFontSize = monoFontSize ?? (!stackedDivision && monogram.length >= 5 ? Math.max(8, Math.round(enforcedSize * 0.29)) : undefined);
  const loading = Boolean(visibleLogo && loadingLogo === visibleLogo && loadedLogo !== visibleLogo);
  const markLogoLoaded = () => {
    if (!visibleLogo) return;
    setLoadedLogo(visibleLogo);
    setLoadingLogo((current) => current === visibleLogo ? null : current);
  };
  useEffect(() => {
    if (!visibleLogo) {
      setLoadedLogo(null);
      setLoadingLogo(null);
      return;
    }
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoadedLogo(visibleLogo);
      setLoadingLogo(null);
      return;
    }
    setLoadingLogo(visibleLogo);
  }, [visibleLogo]);
  // No-logo monogram tiles use a LIGHT tint of the team color (matching the tint behind
  // real logos) with the accessible team color as the initials — a softer avatar than a
  // solid slab, and legible on any surface.
  return <span className={`entity-logo entity-logo-${entityType} ${visibleLogo ? "entity-logo-has-image" : "entity-logo-no-image"} ${loading ? "entity-logo-loading" : ""} ${bareImage ? "entity-logo-bare-image" : ""} ${stackedDivision ? "entity-logo-stacked-division" : monogram.length >= 5 ? "entity-logo-compact-text" : ""} ${className}`} style={{ "--entity-color": color, width: enforcedSize, height: enforcedSize, background: bareImage ? "transparent" : solidFallback ? color : tintColor(color), color: visibleLogo ? readableTextColor(color) : solidFallback ? readableTextColor(color) : accessibleTeamColor(color), ...(fittedMonoFontSize && !visibleLogo ? { fontSize: fittedMonoFontSize } : {}) } as React.CSSProperties}>
    {visibleLogo ? <img ref={imageRef} src={visibleLogo} alt="" onLoad={markLogoLoaded} onError={() => { setFailedLogo(visibleLogo); setLoadedLogo(null); setLoadingLogo(null); }} /> : stackedDivision ? <span><i>{stackTop}</i><b>{stackBottom}</b></span> : <span>{monogram}</span>}
    {loading && <LoaderCircle className="entity-logo-spinner spin" aria-hidden="true" />}
  </span>;
}
