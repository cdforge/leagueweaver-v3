"use client";

// TEMPORARY preview harness for WeekScoreBar. Delete after visual verification.
import { useMemo, useState } from "react";
import { WeekScoreBar } from "@/components/season/WeekScoreBar";
import { getNflWeekWindow } from "@/lib/schedule";
import type { Division, ScheduledGame, ScheduleWeek, Team } from "@/lib/types";

const SEASON = 2026;

function team(id: string, city: string, name: string, initials: string, color: string, rank: number, divisionId: string): Team {
  return { id, city, name, shortName: name, initials, manager: "", color, divisionId, overallRank: rank, stadium: "" };
}

const TEAMS: Team[] = [
  team("mm", "Motor City", "Maulers", "MM", "#7a1c2b", 1, "d1"),
  team("gg", "Gridiron", "Gators", "GG", "#0e5c3a", 8, "d1"),
  team("bc", "Bay", "Comets", "BC", "#1f3a93", 12, "d2"),
  team("ha", "Harbor", "Anchors", "HA", "#101418", 3, "d2"),
  team("tw", "Timber", "Wolves", "TW", "#5a2d82", 2, "d1"),
  team("rk", "River", "Kings", "RK", "#b8892b", 4, "d1"),
  team("ff", "Flatiron", "Foxes", "FF", "#c1441e", 9, "d2"),
  team("ss", "Summit", "Sentinels", "SS", "#2b4a5c", 10, "d2"),
  team("dr", "Delta", "Rovers", "DR", "#0e5c3a", 6, "d1"),
  team("pp", "Prairie", "Pilots", "PP", "#8a1030", 7, "d1"),
  team("ct", "Coastal", "Titans", "CT", "#13405a", 5, "d2"),
  team("bb", "Boulder", "Bears", "BB", "#6b3410", 11, "d2"),
];

const DIVISIONS: Record<string, Division> = {
  d1: { id: "d1", name: "Cascade", initials: "CAS", color: "#117a45" },
  d2: { id: "d2", name: "Harbor", initials: "HBR", color: "#1f3a93" },
};

function game(id: string, home: string, away: string, gameNumber: number, extra: Partial<ScheduledGame> = {}): ScheduledGame {
  return {
    id,
    week: 7,
    gameNumber,
    homeTeamId: home,
    awayTeamId: away,
    matchupType: "cross-division",
    seriesGame: 1,
    seriesLength: 1,
    dateLabel: "Oct 16 – 20",
    stadium: "",
    ...extra,
  };
}

// Ordered GOTW-first, then by rank, the way real slates arrive.
const WEEK7: ScheduleWeek = {
  weekNumber: 7,
  dateLabel: "Oct 16 – 20",
  matchupRank: 3,
  games: [
    game("g3", "rk", "tw", 1, { matchupType: "division", seriesGame: 2, seriesLength: 2, homeScore: 71, awayScore: 74 }), // GOTW, division series
    game("g1", "gg", "mm", 2, { matchupType: "division", homeScore: 104, awayScore: 118 }),
    game("g2", "ha", "bc", 3, { homeScore: 131, awayScore: 96 }),
    game("g4", "ss", "ff", 4, {}),
    game("g5", "pp", "dr", 5, { matchupType: "division", seriesGame: 1, seriesLength: 2 }),
    game("g6", "bb", "ct", 6, {}),
    game("g7", "mm", "ha", 7, {}),
    game("g8", "ff", "pp", 8, {}),
  ],
};

const WEEK6: ScheduleWeek = {
  weekNumber: 6,
  dateLabel: "Oct 9 – 13",
  matchupRank: 9,
  games: [
    game("w6a", "mm", "bc", 1, { week: 6, homeScore: 88, awayScore: 120 }),
    game("w6b", "tw", "gg", 2, { week: 6, homeScore: 141, awayScore: 133 }),
    game("w6c", "ff", "rk", 3, { week: 6, matchupType: "division", homeScore: 99, awayScore: 101 }),
  ],
};

const WEEK8: ScheduleWeek = {
  weekNumber: 8,
  dateLabel: "Oct 23 – 27",
  matchupRank: 1,
  games: [
    game("w8a", "mm", "tw", 1, { week: 8 }),
    game("w8b", "ha", "rk", 2, { week: 8, matchupType: "division" }),
    game("w8c", "bc", "ff", 3, { week: 8 }),
    game("w8d", "gg", "ss", 4, { week: 8 }),
  ],
};

const WEEKS: Record<number, ScheduleWeek> = { 6: WEEK6, 7: WEEK7, 8: WEEK8 };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export default function ScorebarPreview() {
  const [selectedWeek, setSelectedWeek] = useState(7);
  const [phase, setPhase] = useState<"real" | "pre" | "afternoon" | "night" | "final">("afternoon");
  const [thanksgiving, setThanksgiving] = useState(false);
  const teamById = useMemo(() => new Map(TEAMS.map((t) => [t.id, t])), []);
  const week = WEEKS[selectedWeek] ?? WEEK7;

  const now = useMemo(() => {
    if (phase === "real") return undefined;
    const { startsAt, endsAt } = getNflWeekWindow(SEASON, week.weekNumber);
    const start = Date.parse(startsAt);
    if (phase === "pre") return new Date(start + DAY);
    if (phase === "final") return new Date(Date.parse(endsAt) + HOUR);
    if (phase === "afternoon") return new Date(start + 5 * DAY + 9 * HOUR); // ~Sun 1:00 PM ET
    return new Date(start + 5 * DAY + 16.5 * HOUR); // ~Sun 8:30 PM ET
  }, [phase, week.weekNumber]);

  const btn = (active: boolean) => ({
    fontFamily: "var(--font-barlow-condensed), sans-serif",
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: ".04em",
    padding: "6px 11px",
    borderRadius: 6,
    border: "1px solid var(--line-strong)",
    cursor: "pointer",
    background: active ? "var(--field)" : "var(--surface)",
    color: active ? "#fff" : "var(--muted)",
  });

  return (
    <main style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <header
        style={{
          height: 66,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 22px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          fontFamily: "var(--font-barlow-condensed), sans-serif",
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: ".01em",
          color: "var(--ink)",
        }}
      >
        LEAGUE WEAVER — score bar preview
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6, alignItems: "center" }}>
          {([6, 7, 8] as const).map((w) => (
            <button key={w} type="button" onClick={() => setSelectedWeek(w)} style={btn(selectedWeek === w)}>W{w}</button>
          ))}
          <span style={{ width: 1, height: 22, background: "var(--line)" }} />
          {(["pre", "afternoon", "night", "final", "real"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPhase(p)} style={btn(phase === p)}>{p}</button>
          ))}
          <span style={{ width: 1, height: 22, background: "var(--line)" }} />
          <button type="button" onClick={() => setThanksgiving((t) => !t)} style={btn(thanksgiving)}>🦃 tgiving</button>
        </span>
      </header>

      <WeekScoreBar
        weeks={[week]}
        seasonYear={SEASON}
        now={now}
        thanksgiving={thanksgiving}
        getTeam={(id) => teamById.get(id)}
        getDivision={(id) => DIVISIONS[id]}
        getRank={(id) => teamById.get(id)?.overallRank}
        gameOfWeekId="g3"
        displayCityNames
        onSelectGame={(id) => console.log("open game", id)}
      />

      <div style={{ padding: 24, color: "var(--muted)", fontSize: 13 }}>
        ↓ your schedule workspace continues below · switch weeks in the bar to see fill (3–4 games) vs scroll (8 games)
      </div>
    </main>
  );
}
