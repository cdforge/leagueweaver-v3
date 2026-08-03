"use client";

import { Star } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatPoints } from "@/lib/statistics";

export function AllStarBadge({ slot, rank, week, points }: { slot: string; rank?: number; week: number; points: number }) {
  const label = `Week ${week} All-Star — ${slot} · ${formatPoints(points)} pts`;
  return <Tooltip label={label}>
    <span className="allstar-badge" tabIndex={0} aria-label={label}>
      <Star fill="currentColor" />
      {rank != null && <b>{rank}</b>}
    </span>
  </Tooltip>;
}
