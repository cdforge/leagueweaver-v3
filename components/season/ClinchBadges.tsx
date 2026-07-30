import type { CSSProperties } from "react";
import { CircleX, Medal, ShieldCheck, Trophy } from "lucide-react";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { accessibleTeamColor, tintColor } from "@/lib/colorContrast";
import type { TeamClinchTimeline } from "@/lib/clinch";
import type { Division } from "@/lib/types";

function weekLabel(week?: number) {
  if (week == null) return "";
  return week === 0 ? "PRE" : `W${week}`;
}

export function ClinchBadges({ timeline, division, divisionColor = division?.color ?? "#117A45", compact = false }: {
  timeline?: TeamClinchTimeline;
  division?: Division;
  divisionColor?: string;
  compact?: boolean;
}) {
  if (!timeline) return null;
  if (!timeline.divisionTitle && !timeline.playoffBerth && !timeline.topSeed && !timeline.eliminated) return null;
  const divisionStyle = {
    "--clinch-division": accessibleTeamColor(divisionColor),
    "--clinch-division-soft": tintColor(divisionColor, .88),
  } as CSSProperties;

  if (timeline.eliminated) {
    return <span className={`clinch-badges ${compact ? "compact" : ""}`}>
      <span className="clinch-badge eliminated" title={`Officially eliminated after ${timeline.eliminatedWeek === 0 ? "the preseason" : `Week ${timeline.eliminatedWeek}`}`}>
        <CircleX aria-hidden="true" />ELIMINATED <b>{weekLabel(timeline.eliminatedWeek)}</b>
      </span>
    </span>;
  }

  return <span className={`clinch-badges ${compact ? "compact" : ""}`}>
    {timeline.topSeed && <span className="clinch-badge top-seed" title={`Clinched the league's number-one seed after ${timeline.topSeedWeek === 0 ? "the preseason" : `Week ${timeline.topSeedWeek}`}`}><Medal aria-hidden="true" />#1 SEED <b>{weekLabel(timeline.topSeedWeek)}</b></span>}
    {timeline.divisionTitle && <span className="clinch-badge division-title" style={divisionStyle} title={`Clinched the ${division?.name ?? "division"} championship after ${timeline.divisionTitleWeek === 0 ? "the preseason" : `Week ${timeline.divisionTitleWeek}`}`}>{division ? <DivisionMark division={division} size={16} /> : <Trophy aria-hidden="true" />}DIV CHAMP <b>{weekLabel(timeline.divisionTitleWeek)}</b></span>}
    {timeline.playoffBerth && <span className="clinch-badge playoff-berth" title={`Clinched a playoff spot after ${timeline.playoffBerthWeek === 0 ? "the preseason" : `Week ${timeline.playoffBerthWeek}`}`}><ShieldCheck aria-hidden="true" />PLAYOFF <b>{weekLabel(timeline.playoffBerthWeek)}</b></span>}
  </span>;
}

export function ClinchStatusLegend() {
  return <div className="clinch-status-legend" aria-label="Official season status legend">
    <strong>Official status</strong>
    <span className="clinch-badge top-seed"><Medal aria-hidden="true" />#1 SEED</span>
    <span className="clinch-badge division-title"><Trophy aria-hidden="true" />DIV CHAMP</span>
    <span className="clinch-badge playoff-berth"><ShieldCheck aria-hidden="true" />PLAYOFF</span>
    <span className="clinch-badge eliminated"><CircleX aria-hidden="true" />ELIMINATED</span>
    <small>W# is the first week the result became mathematically certain.</small>
  </div>;
}
