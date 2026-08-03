"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { accessibleTeamColor, readableTextColor, tintColor } from "@/lib/colorContrast";

export function EntityLogo({ color, logoUrl, monogram, size = 32, className = "", imagePresentation = "tinted", monoFontSize }: { color: string; logoUrl?: string; monogram: string; size?: number; className?: string; imagePresentation?: "tinted" | "bare"; monoFontSize?: number }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const [loadingLogo, setLoadingLogo] = useState<string | null>(visibleLogo ?? null);
  const enforcedSize = Math.max(32, size);
  const bareImage = Boolean(visibleLogo && imagePresentation === "bare");
  const loading = Boolean(visibleLogo && loadingLogo === visibleLogo);
  useEffect(() => {
    setLoadingLogo(visibleLogo ?? null);
  }, [visibleLogo]);
  // No-logo monogram tiles use a LIGHT tint of the team color (matching the tint behind
  // real logos) with the accessible team color as the initials — a softer avatar than a
  // solid slab, and legible on any surface.
  return <span className={`entity-logo ${visibleLogo ? "entity-logo-has-image" : ""} ${loading ? "entity-logo-loading" : ""} ${bareImage ? "entity-logo-bare-image" : ""} ${className}`} style={{ "--entity-color": color, width: enforcedSize, height: enforcedSize, background: bareImage ? "transparent" : tintColor(color), color: visibleLogo ? readableTextColor(color) : accessibleTeamColor(color), ...(monoFontSize && !visibleLogo ? { fontSize: monoFontSize } : {}) } as React.CSSProperties}>
    {visibleLogo ? <img src={visibleLogo} alt="" onLoad={() => setLoadingLogo((current) => current === visibleLogo ? null : current)} onError={() => { setFailedLogo(visibleLogo); setLoadingLogo(null); }} /> : <span>{monogram}</span>}
    {loading && <LoaderCircle className="entity-logo-spinner spin" aria-hidden="true" />}
  </span>;
}
