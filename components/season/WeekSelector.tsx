import type { ReactNode, RefObject } from "react";
import { WeekMatchupRank } from "./MatchupPresentation";

export interface WeekSelectorItem {
  weekNumber: number;
  dateLabel: string;
  matchupRank?: number;
  /** 0.1–10.0 slate score (same scale as matchups); shown beside the rank. */
  slateScore?: number;
  isThanksgiving?: boolean;
}

/**
 * The regular-season week strip shared by the season workspace and the home-page
 * schedule preview. Playoff round buttons (workspace only) are passed via
 * `trailing` so the shared piece stays free of playoff concerns.
 */
export function WeekSelector({
  weeks,
  totalWeeks,
  selectedWeek,
  onSelect,
  stripRef,
  trailing,
  showRank = true,
  ariaLabel = "Select week",
}: {
  weeks: WeekSelectorItem[];
  totalWeeks: number;
  selectedWeek: number;
  onSelect: (weekNumber: number) => void;
  stripRef?: RefObject<HTMLDivElement | null>;
  trailing?: ReactNode;
  showRank?: boolean;
  ariaLabel?: string;
}) {
  return <div ref={stripRef} className="week-selector schedule-week-selector" aria-label={ariaLabel}>
    {weeks.map((item) => (
      <button
        type="button"
        aria-current={item.weekNumber === selectedWeek ? "true" : undefined}
        aria-label={`Week ${item.weekNumber}, ${item.dateLabel}${item.weekNumber === selectedWeek ? ", selected" : ""}${item.isThanksgiving ? ", Thanksgiving week" : ""}`}
        className={`${item.weekNumber === selectedWeek ? "active" : ""}${item.isThanksgiving ? " is-thanksgiving" : ""}`.trim()}
        key={item.weekNumber}
        onClick={() => onSelect(item.weekNumber)}
      >
        {item.isThanksgiving && <span className="week-thanksgiving-mark" title="Thanksgiving week" aria-hidden="true">🦃</span>}
        <span>W{item.weekNumber}</span>
        <small>{item.dateLabel.split(",")[0]}</small>
        {showRank && <WeekMatchupRank rank={item.matchupRank} total={totalWeeks} score={item.slateScore} compact />}
      </button>
    ))}
    {trailing}
  </div>;
}
