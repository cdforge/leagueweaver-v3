"use client";

import { useState } from "react";
import { BarChart3, MapPin } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";

type DivisionKey = "prodigy" | "esteemed";
type Team = { rank: number; city: string; name: string; logo: string; color: string; venue: string; division: DivisionKey };

const LEAGUE = { name: "Prodigies vs Esteemed FFL", color: "#117A45", logo: "/pve/league.png" };

const DIVISIONS: Record<DivisionKey, { name: string; color: string; logo: string }> = {
  prodigy: { name: "Prodigy", color: "#E9E9E9", logo: "/pve/division-prodigies.png" },
  esteemed: { name: "Esteemed", color: "#FFD124", logo: "/pve/division-esteemed.png" },
};

const TEAMS: Record<string, Team> = {
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

type Game = { home: Team; away: Team; divisional: boolean; seriesIndex: number; seriesTotal: number; rating: number; gotw: boolean };

const SCHEDULE: Game[][] = RAW.map((week) =>
  week.map(([home, away, type, seriesGame, seriesLength, gameNumber, rating]) => ({
    home: TEAMS[home],
    away: TEAMS[away],
    divisional: type === "d",
    seriesIndex: seriesGame,
    seriesTotal: seriesLength,
    rating,
    gotw: gameNumber === 1,
  })),
);

function monogram(team: Team) {
  return `${team.city[0] ?? ""}${team.name[0] ?? ""}`.toUpperCase();
}

function TeamCell({ team, align }: { team: Team; align: "left" | "right" }) {
  const mark = <EntityLogo className="wp-mark" color={team.color} logoUrl={team.logo} monogram={monogram(team)} size={32} />;
  const name = (
    <span className="wp-name">
      <small>{team.city}</small>
      <strong>{team.name}</strong>
      <span className="wp-record">0-0</span>
    </span>
  );
  const rank = <b className="wp-seed">{team.rank}</b>;
  return align === "left"
    ? <span className="wp-team">{rank}{mark}{name}</span>
    : <span className="wp-team wp-right">{name}{mark}{rank}</span>;
}

export function SchedulePreview() {
  const [week, setWeek] = useState(1);
  const games = SCHEDULE[week - 1];
  return (
    <div className="welcome-showcase-frame" role="group" aria-label="Prodigies vs Esteemed FFL 2026 schedule — select a week to preview its matchups">
      <span className="welcome-showcase-bar" aria-hidden="true"><i></i><i></i><i></i></span>
      <div className="welcome-preview">
        <div className="wp-topline">
          <EntityLogo className="wp-league-mark" color={LEAGUE.color} logoUrl={LEAGUE.logo} monogram="PVE" size={32} />
          <strong>{LEAGUE.name}</strong>
          <span>2026 &middot; 14 weeks</span>
        </div>
        <div className="wp-weeks" role="tablist" aria-label="Schedule week">
          {SCHEDULE.map((_, index) => {
            const number = index + 1;
            const isThanks = number === THANKSGIVING_WEEK;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={week === number}
                title={isThanks ? "Thanksgiving week" : `Week ${number}`}
                className={`${week === number ? "on" : ""}${isThanks ? " thanks" : ""}`}
                key={index}
                onClick={() => setWeek(number)}
              >
                W{number}
              </button>
            );
          })}
        </div>
        <div className="wp-weekhead">
          <b>{String(week).padStart(2, "0")}</b>
          <span><strong>Week {week}{week === THANKSGIVING_WEEK ? " · Thanksgiving" : ""}</strong><small>{WEEK_DATES[week - 1]} &middot; 2026</small></span>
          <em>{games.length} games</em>
        </div>
        <div className="wp-rows">
          {games.map((game, index) => {
            const thanks = week === THANKSGIVING_WEEK && game.gotw;
            const division = game.divisional ? DIVISIONS[game.home.division] : null;
            return (
              <div className={`wp-row${game.gotw ? " is-gotw" : ""}${thanks ? " is-thanks" : ""}`} key={game.home.name + game.away.name}>
                <div className="wp-rowhead">
                  <b className="wp-gameno">Game {index + 1}</b>
                  {game.gotw ? (
                    <span className="wp-tag gotw">{thanks ? "Thanksgiving Game" : "Game of the Week"}</span>
                  ) : (
                    <span className={`wp-tag${game.divisional ? " div" : ""}`}>
                      {division && <img className="wp-divmark" src={division.logo} alt="" style={{ background: division.color }} />}
                      {game.divisional ? `${division?.name} · ${game.seriesIndex} of ${game.seriesTotal}` : `Cross-division · ${game.seriesIndex} of ${game.seriesTotal}`}
                    </span>
                  )}
                  <span className="wp-rating" title={`Matchup rating ${game.rating.toFixed(1)}`}>
                    <BarChart3 aria-hidden="true" />
                    <b>{game.rating.toFixed(1)}</b>
                    <small>#{game.home.rank} vs #{game.away.rank}</small>
                  </span>
                </div>
                <div className="wp-match">
                  <TeamCell team={game.home} align="left" />
                  <span className="wp-center">
                    <small>SCHEDULED</small>
                    <span className="wp-venue">
                      <MapPin aria-hidden="true" />
                      <span>{game.home.venue}</span>
                      <img className="wp-venue-mark" src={game.home.logo} alt="" />
                    </span>
                  </span>
                  <TeamCell team={game.away} align="right" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
