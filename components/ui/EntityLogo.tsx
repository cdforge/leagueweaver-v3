"use client";

import { useState } from "react";
import { readableTextColor, tintColor } from "@/lib/colorContrast";

export function EntityLogo({ color, logoUrl, monogram, size = 32, className = "" }: { color: string; logoUrl?: string; monogram: string; size?: number; className?: string }) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const visibleLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : undefined;
  const enforcedSize = Math.max(32, size);
  return <span className={`entity-logo ${visibleLogo ? "entity-logo-has-image" : ""} ${className}`} style={{ "--entity-color": color, width: enforcedSize, height: enforcedSize, background: visibleLogo ? tintColor(color) : color, color: readableTextColor(color) } as React.CSSProperties}>
    {visibleLogo ? <img src={visibleLogo} alt="" onError={() => setFailedLogo(visibleLogo)} /> : <span>{monogram}</span>}
  </span>;
}
