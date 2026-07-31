"use client";

// TEMPORARY verification harness for the week-selector + strength-scale refactor. Delete after.
import { MatchupRatingLegend, WeekMatchupRank } from "@/components/season/MatchupPresentation";

const TOTAL = 14;
const WEEKS = [
  { n: 1, date: "Sep 8", rank: 2 },
  { n: 2, date: "Sep 15", rank: 6 },
  { n: 3, date: "Sep 22", rank: 12 },
  { n: 4, date: "Sep 29", rank: 4 },
  { n: 5, date: "Oct 6", rank: 13 },
  { n: 6, date: "Oct 13", rank: 7 },
  { n: 7, date: "Oct 16", rank: 3, active: true },
  { n: 8, date: "Oct 23", rank: 1 },
  { n: 9, date: "Oct 30", rank: 9 },
  { n: 10, date: "Nov 6", rank: 11 },
  { n: 11, date: "Nov 13", rank: 8 },
  { n: 12, date: "Nov 20", rank: 5, turkey: true },
  { n: 13, date: "Nov 27", rank: 14 },
  { n: 14, date: "Dec 4", rank: 10 },
];

export default function WkPreview() {
  return (
    <main style={{ padding: 28, background: "var(--canvas)", minHeight: "100vh", display: "grid", gap: 28 }}>
      <section style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
        <h3 style={{ fontFamily: "var(--font-barlow-condensed)", margin: "0 0 12px" }}>Schedule week selector</h3>
        <div className="week-selector schedule-week-selector" aria-label="Select week">
          {WEEKS.map((w) => (
            <button
              key={w.n}
              type="button"
              className={`${w.active ? "active" : ""}${w.turkey ? " is-thanksgiving" : ""}`.trim()}
              aria-current={w.active ? "true" : undefined}
            >
              {w.turkey && <span className="week-thanksgiving-mark" aria-hidden="true">🦃</span>}
              <span>W{w.n}</span>
              <small>{w.date}</small>
              <WeekMatchupRank rank={w.rank} total={TOTAL} compact />
            </button>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", display: "grid", gap: 14 }}>
        <h3 style={{ fontFamily: "var(--font-barlow-condensed)", margin: 0 }}>Week-rank chip (non-compact) across the scale</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[1, 3, 5, 7, 9, 11, 14].map((r) => (
            <WeekMatchupRank key={r} rank={r} total={TOTAL} />
          ))}
        </div>
        <h3 style={{ fontFamily: "var(--font-barlow-condensed)", margin: "6px 0 0" }}>Match-rank legend (Competitive / Neutral / Lopsided — no red)</h3>
        <MatchupRatingLegend />
      </section>
    </main>
  );
}
