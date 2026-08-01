"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MatchupCard } from "@/components/season/MatchupPresentation";
import { WeekSelector } from "@/components/season/WeekSelector";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { getMatchupRatingRange, getMatchupSignal } from "@/lib/matchups";
import type { Division, ScheduledGame, Team } from "@/lib/types";

type DivisionKey = "prodigy" | "esteemed";

const LEAGUE = { name: "Prodigies vs Esteemed FFL", color: "#117A45", logo: "/pve/league.png" };

const DIVISIONS: Record<DivisionKey, Division> = {
  prodigy: { id: "prodigy", name: "Prodigy", color: "#E9E9E9", logoUrl: "/pve/division-prodigies.png" },
  esteemed: { id: "esteemed", name: "Esteemed", color: "#FFD124", logoUrl: "/pve/division-esteemed.png" },
};

type SeedTeam = { rank: number; city: string; name: string; logo: string; color: string; venue: string; division: DivisionKey };

const SEED: Record<string, SeedTeam> = {
  Decoupes: { rank: 1, city: "Bandera", name: "Decoupes", logo: "/pve/team-decoupes.png", color: "#BC2539", venue: "Decoupes Stadium", division: "prodigy" },
  Mutts: { rank: 2, city: "Uncross Your", name: "Mutts", logo: "/pve/team-mutts.png", color: "#BDBDBD", venue: "Mutts Stadium", division: "esteemed" },
  Popeyes: { rank: 3, city: "West End", name: "Popeyes", logo: "/pve/team-popeyes.png", color: "#FF8B29", venue: "Popeyes Stadium", division: "prodigy" },
  Yardies: { rank: 4, city: "Cumgetsum", name: "Yardies", logo: "/pve/team-yardies.png", color: "#027546", venue: "Yardies Stadium", division: "esteemed" },
  MetaMookDawgs: { rank: 5, city: "Decatur", name: "MetaMookDawgs", logo: "/pve/team-metamookdawgs.png", color: "#F292FF", venue: "MetaMookDawgs Stadium", division: "esteemed" },
  Savages: { rank: 6, city: "East Atlanta", name: "Savages", logo: "/pve/team-savages.png", color: "#FF0000", venue: "Savages Stadium", division: "prodigy" },
  Green: { rank: 7, city: "Georgia", name: "Green", logo: "/pve/team-green.png", color: "#071A7D", venue: "Green Stadium", division: "prodigy" },
  Champs: { rank: 8, city: "Down South", name: "Champs", logo: "/pve/team-champs.png", color: "#F04E37", venue: "Champs Stadium", division: "esteemed" },
  Eagles: { rank: 9, city: "Rex", name: "Eagles", logo: "/pve/team-eagles.png", color: "#93FF41", venue: "Eagles Stadium", division: "esteemed" },
  Kings: { rank: 10, city: "McDonough", name: "Kings", logo: "/pve/team-kings.png", color: "#6400DB", venue: "Kings Stadium", division: "prodigy" },
};

const TEAMS: Record<string, Team> = Object.fromEntries(
  Object.entries(SEED).map(([key, team]) => [key, {
    id: key.toLowerCase(),
    city: team.city,
    name: team.name,
    shortName: team.name,
    manager: "",
    color: team.color,
    logoUrl: team.logo,
    divisionId: team.division,
    overallRank: team.rank,
    stadium: team.venue,
  } satisfies Team]),
);

const WEEK_DATES = [
  "Sep 9–15", "Sep 16–22", "Sep 23–29", "Sep 30–Oct 6", "Oct 7–13", "Oct 14–20", "Oct 21–27",
  "Oct 28–Nov 3", "Nov 4–10", "Nov 11–17", "Nov 18–24", "Nov 25–Dec 1", "Dec 2–8", "Dec 9–15",
];
const THANKSGIVING_WEEK = 12;

// Exact snapshot of the real "Prodigies vs Esteemed FFL" 2026 season (season c268eb09).
// Each game: [home, away, "d"|"x" matchup type, seriesGame, seriesLength, gameNumber, matchupRating].
type RawGame = [string, string, "d" | "x", number, number, number, number];
const RAW: RawGame[][] = [
  [["Yardies", "Decoupes", "x", 1, 2, 1, 3.7], ["MetaMookDawgs", "Mutts", "d", 1, 2, 2, 8.4], ["Eagles", "Champs", "d", 1, 2, 3, 10.7], ["Green", "Popeyes", "d", 1, 2, 4, 12.1], ["Savages", "Kings", "d", 1, 2, 5, 16.8]],
  [["Popeyes", "Mutts", "x", 1, 2, 1, 5.7], ["Savages", "Green", "d", 1, 2, 2, 8.7], ["MetaMookDawgs", "Champs", "d", 1, 2, 3, 13.1], ["Eagles", "Yardies", "d", 1, 2, 4, 22.6], ["Kings", "Decoupes", "d", 1, 2, 5, 23.6]],
  [["Mutts", "Yardies", "d", 1, 2, 1, 6.4], ["Decoupes", "Popeyes", "d", 1, 2, 2, 7.4], ["Savages", "Champs", "x", 1, 1, 3, 11.4], ["Green", "Eagles", "x", 1, 1, 4, 12.4], ["Kings", "MetaMookDawgs", "x", 1, 1, 5, 18.5]],
  [["Popeyes", "Yardies", "x", 1, 1, 1, 9.1], ["Champs", "Green", "x", 1, 2, 2, 9.7], ["MetaMookDawgs", "Decoupes", "x", 1, 1, 3, 10.1], ["Kings", "Savages", "d", 2, 2, 4, 16.8], ["Eagles", "Mutts", "d", 1, 2, 5, 19.2]],
  [["Popeyes", "Green", "d", 2, 2, 1, 12.1], ["Savages", "Decoupes", "d", 1, 2, 2, 12.8], ["Eagles", "MetaMookDawgs", "d", 1, 2, 3, 15.8], ["Yardies", "Champs", "d", 1, 2, 4, 19.9], ["Mutts", "Kings", "x", 1, 1, 5, 21.9]],
  [["Decoupes", "Yardies", "x", 2, 2, 1, 3.7], ["Popeyes", "MetaMookDawgs", "x", 1, 1, 2, 6.7], ["Savages", "Eagles", "x", 1, 1, 3, 14.1], ["Green", "Kings", "d", 1, 2, 4, 15.1], ["Champs", "Mutts", "d", 1, 2, 5, 16.5]],
  [["Mutts", "MetaMookDawgs", "d", 2, 2, 1, 8.4], ["Champs", "Eagles", "d", 2, 2, 2, 10.7], ["Decoupes", "Savages", "d", 2, 2, 3, 12.8], ["Yardies", "Green", "x", 1, 1, 4, 17.2], ["Kings", "Popeyes", "d", 1, 2, 5, 20.2]],
  [["Mutts", "Popeyes", "x", 2, 2, 1, 5.7], ["MetaMookDawgs", "Savages", "x", 1, 2, 2, 7.7], ["Green", "Champs", "x", 2, 2, 3, 9.7], ["Yardies", "Eagles", "d", 2, 2, 4, 22.6], ["Decoupes", "Kings", "d", 2, 2, 5, 23.6]],
  [["Mutts", "Savages", "x", 1, 1, 1, 11.1], ["MetaMookDawgs", "Yardies", "d", 1, 2, 2, 11.8], ["Champs", "Kings", "x", 1, 1, 3, 13.4], ["Green", "Decoupes", "d", 1, 2, 4, 15.5], ["Eagles", "Popeyes", "x", 1, 1, 5, 17.5]],
  [["Savages", "MetaMookDawgs", "x", 2, 2, 1, 7.7], ["Green", "Mutts", "x", 1, 1, 2, 13.8], ["Champs", "Yardies", "d", 2, 2, 3, 19.9], ["Popeyes", "Kings", "d", 2, 2, 4, 20.2], ["Eagles", "Decoupes", "x", 1, 1, 5, 20.9]],
  [["Savages", "Popeyes", "d", 1, 2, 1, 9.4], ["Decoupes", "Green", "d", 2, 2, 2, 15.5], ["MetaMookDawgs", "Eagles", "d", 2, 2, 3, 15.8], ["Mutts", "Champs", "d", 2, 2, 4, 16.5], ["Kings", "Yardies", "x", 1, 1, 5, 25.3]],
  [["Decoupes", "Mutts", "x", 1, 1, 1, 4.7], ["MetaMookDawgs", "Green", "x", 1, 1, 2, 10.4], ["Kings", "Eagles", "x", 1, 2, 3, 11.7], ["Yardies", "Savages", "x", 1, 1, 4, 14.5], ["Champs", "Popeyes", "x", 1, 1, 5, 14.8]],
  [["Popeyes", "Savages", "d", 2, 2, 1, 9.4], ["Yardies", "MetaMookDawgs", "d", 2, 2, 2, 11.8], ["Kings", "Green", "d", 2, 2, 3, 15.1], ["Decoupes", "Champs", "x", 1, 1, 4, 18.2], ["Mutts", "Eagles", "d", 2, 2, 5, 19.2]],
  [["Yardies", "Mutts", "d", 2, 2, 1, 6.4], ["Popeyes", "Decoupes", "d", 2, 2, 2, 7.4], ["Green", "Savages", "d", 2, 2, 3, 8.7], ["Eagles", "Kings", "x", 2, 2, 4, 11.7], ["Champs", "MetaMookDawgs", "d", 2, 2, 5, 13.1]],
];

const SCHEDULE: ScheduledGame[][] = RAW.map((week, weekIndex) =>
  week.map(([home, away, type, seriesGame, seriesLength, gameNumber, rating]) => ({
    id: `pve-w${weekIndex + 1}-g${gameNumber}`,
    week: weekIndex + 1,
    gameNumber,
    homeTeamId: TEAMS[home].id,
    awayTeamId: TEAMS[away].id,
    matchupType: type === "d" ? "division" : "cross-division",
    seriesGame,
    seriesLength,
    dateLabel: `${WEEK_DATES[weekIndex]}, 2026`,
    stadium: TEAMS[home].stadium,
    matchupRating: rating,
  } satisfies ScheduledGame)),
);

const RATING_RANGE = getMatchupRatingRange(SCHEDULE.flat());

// Preview slate rank: rank weeks by average matchup rating (lower = stronger = #1),
// matching the workspace week strip's slate-rank chip.
const WEEK_RANK = (() => {
  const averages = SCHEDULE.map((games, index) => ({ index, avg: games.reduce((sum, game) => sum + (game.matchupRating ?? 0), 0) / games.length }));
  const ranked = [...averages].sort((left, right) => left.avg - right.avg);
  const ranks = new Map<number, number>();
  ranked.forEach((entry, position) => ranks.set(entry.index, position + 1));
  return ranks;
})();

const PRESEASON_RECORD = { overall: "0-0", division: "0-0" };

export function SchedulePreview() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"week" | "team">("week");
  const [week, setWeek] = useState(1);
  const [teamId, setTeamId] = useState(TEAMS.Decoupes.id);
  const games = SCHEDULE[week - 1];
  const teamById = useMemo(() => new Map(Object.values(TEAMS).map((team) => [team.id, team])), []);
  const weeks = useMemo(() => SCHEDULE.map((_, index) => ({
    weekNumber: index + 1,
    dateLabel: `${WEEK_DATES[index]}, 2026`,
    matchupRank: WEEK_RANK.get(index),
    isThanksgiving: index + 1 === THANKSGIVING_WEEK,
  })), []);
  // Teams as select options (seed order) and one selected team's game each week.
  const teamOptions = useMemo(() => Object.values(TEAMS)
    .sort((left, right) => left.overallRank - right.overallRank)
    .map((team) => ({ value: team.id, label: `${team.city} ${team.name}`, logoUrl: team.logoUrl, swatch: team.color, monogram: `${team.city[0] ?? ""}${team.name[0] ?? ""}`.toUpperCase() })), []);
  const teamGames = useMemo(() => SCHEDULE
    .map((weekGames, index) => {
      const game = weekGames.find((entry) => entry.homeTeamId === teamId || entry.awayTeamId === teamId);
      return game ? { week: index + 1, game } : null;
    })
    .filter((entry): entry is { week: number; game: ScheduledGame } => entry !== null), [teamId]);

  const renderGame = (game: ScheduledGame, weekLabel?: string) => {
    const away = teamById.get(game.awayTeamId)!;
    const home = teamById.get(game.homeTeamId)!;
    const featured = !weekLabel && game.gameNumber === 1;
    return (
      <MatchupCard
        key={game.id}
        game={game}
        away={away}
        home={home}
        awayDivision={DIVISIONS[away.divisionId as DivisionKey]}
        homeDivision={DIVISIONS[home.divisionId as DivisionKey]}
        awayRank={away.overallRank}
        homeRank={home.overallRank}
        awayRecord={PRESEASON_RECORD}
        homeRecord={PRESEASON_RECORD}
        signal={getMatchupSignal(game, undefined, RATING_RANGE)}
        featured={featured}
        featuredLabel={week === THANKSGIVING_WEEK && featured ? "Thanksgiving" : "GOTW"}
        gameLabel={weekLabel ?? (featured ? undefined : `Game ${game.gameNumber}`)}
        showCity
        showVenue
      />
    );
  };

  const featuredGame = games.find((game) => game.gameNumber === 1) ?? games[0];

  return (
    <div className={`welcome-showcase-frame ${open ? "is-open" : "is-collapsed"}`} role="group" aria-label="Prodigies vs Esteemed FFL 2026 schedule — open to preview each week's matchups">
      <span className="welcome-showcase-bar" aria-hidden="true"><i></i><i></i><i></i></span>
      <div className="welcome-preview">
        <div className="wp-topline">
          <EntityLogo className="wp-league-mark" color={LEAGUE.color} logoUrl={LEAGUE.logo} monogram="PVE" size={32} />
          <strong>{LEAGUE.name}</strong>
          <span>2026 &middot; 14 weeks</span>
          <button type="button" className="wp-preview-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "Preview"}
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
        {open ? (
          <>
            <div className="wp-viewmode" role="tablist" aria-label="Preview mode">
              <button type="button" role="tab" aria-selected={mode === "week"} className={mode === "week" ? "on" : ""} onClick={() => setMode("week")}>By week</button>
              <button type="button" role="tab" aria-selected={mode === "team"} className={mode === "team" ? "on" : ""} onClick={() => setMode("team")}>By team</button>
            </div>
            {mode === "week" ? (
              <>
                <WeekSelector
                  weeks={weeks}
                  totalWeeks={SCHEDULE.length}
                  selectedWeek={week}
                  onSelect={setWeek}
                  ariaLabel="Schedule week"
                />
                <div className="wp-weekhead">
                  <b>{String(week).padStart(2, "0")}</b>
                  <span><strong>Week {week}{week === THANKSGIVING_WEEK ? " · Thanksgiving" : ""}</strong><small>{WEEK_DATES[week - 1]} &middot; 2026</small></span>
                  <em>{games.length} games</em>
                </div>
                <div className="matchup-list matchup-card-list">
                  {games.map((game) => renderGame(game))}
                </div>
              </>
            ) : (
              <>
                <div className="wp-teampick">
                  <CustomSelect label="Preview a team's schedule" value={teamId} onChange={setTeamId} options={teamOptions} showSelectedDescription={false} />
                  <span className="wp-teampick-hint">{teamGames.length} games &middot; every week</span>
                </div>
                <div className="matchup-list matchup-card-list">
                  {teamGames.map((entry) => renderGame(entry.game, `Week ${entry.week}`))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="wp-teaser">
            {renderGame(featuredGame)}
            <p className="wp-teaser-hint">Week {week}&rsquo;s Game of the Week &middot; {SCHEDULE.length} weeks and {SCHEDULE.flat().length} games inside.</p>
            <button type="button" className="wp-teaser-cta" onClick={() => setOpen(true)}>
              Explore every week
              <ChevronDown aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
