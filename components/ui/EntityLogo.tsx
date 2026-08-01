"use client";

import { useState } from "react";
import { readableTextColor, tintColor } from "@/lib/colorContrast";

export function EntityLogo({ color, logoUrl, monogram, size = 32, className = "", imagePresentation = "tinted", monoFontSize }: { color: string; logoUrl?: string; monogram: string; size?: number; className?: string; imagePresentation?: "tinted" | "bare"; monoFontSize?: number }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const enforcedSize = Math.max(32, size);
  const bareImage = Boolean(visibleLogo && imagePresentation === "bare");
  return <span className={`entity-logo ${visibleLogo ? "entity-logo-has-image" : ""} ${bareImage ? "entity-logo-bare-image" : ""} ${className}`} style={{ "--entity-color": color, width: enforcedSize, height: enforcedSize, background: bareImage ? "transparent" : visibleLogo ? tintColor(color) : color, color: readableTextColor(color), ...(monoFontSize && !visibleLogo ? { fontSize: monoFontSize } : {}) } as React.CSSProperties}>
    {visibleLogo ? <img src={visibleLogo} alt="" onError={() => setFailedLogo(visibleLogo)} /> : <span>{monogram}</span>}
  </span>;
}
