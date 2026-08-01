"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Check, Medal, Pencil, RefreshCw, Trophy } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { TeamIdentityBlock } from "@/components/season/MatchupPresentation";
import { projectConsolationBracket, projectFinalPlacements, type ProjectedConsolationEntrant } from "@/lib/consolation";
import { getWeekDateLabel } from "@/lib/schedule";
import { calculateStandings, formatRecord } from "@/lib/standings";
import { teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, PlayoffGame, StandingsRow } from "@/lib/types";

function ConsolationEntrant({ entrant, schedule, standingsByTeam }: { entrant: ProjectedConsolationEntrant; schedule: GeneratedSchedule; standingsByTeam: Map<string, StandingsRow> }) {
  if (entrant.kind === "result") {
    return <div className="bracket-slot placeholder"><b>{entrant.outcome === "winner" ? "W" : "L"}</b><span><strong>{entrant.label}</strong><small>Updates after the prior result</small></span></div>;
  }
  const team = schedule.setup.teams.find((item) => item.id === entrant.teamId);
  if (!team) return null;
  const division = schedule.setup.divisions.find((item) => item.id === team.divisionId);
  const standing = standingsByTeam.get(team.id);
  return <div className="bracket-slot" style={{ "--slot-spine": team.color } as CSSProperties}>
    <TeamIdentityBlock variant="stacked" compact team={team} division={division} leagueRank={entrant.seed} record={{ overall: standing ? formatRecord(standing) : "0-0", division: standing ? `${standing.divisionWins}-${standing.divisionLosses}` : undefined }} showCity={schedule.setup.display.cityNames !== false} href={`/season/${schedule.id}/team/${team.id}`} />
  </div>;
}

function resolvedEntrantTeamId(entrant: ProjectedConsolationEntrant, schedule: GeneratedSchedule) {
  if (entrant.kind === "team") return entrant.teamId;
  const source = schedule.playoffGames?.find((game) => game.id === entrant.gameId);
  if (!source || source.homeScore == null || source.awayScore == null || source.homeScore === source.awayScore) return undefined;
  const winnerId = source.homeScore > source.awayScore ? source.homeTeamId : source.awayTeamId;
  const loserId = winnerId === source.homeTeamId ? source.awayTeamId : source.homeTeamId;
  return entrant.outcome === "winner" ? winnerId : loserId;
}

function ConsolationScoreEditor({
  game,
  awayName,
  homeName,
  onSave,
}: {
  game?: PlayoffGame;
  awayName: string;
  homeName: string;
  onSave: (awayScore?: number, homeScore?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [awayDraft, setAwayDraft] = useState(game?.awayScore?.toString() ?? "");
  const [homeDraft, setHomeDraft] = useState(game?.homeScore?.toString() ?? "");
  const away = Number(awayDraft);
  const home = Number(homeDraft);
  const valid = awayDraft !== "" && homeDraft !== "" && Number.isFinite(away) && Number.isFinite(home) && away >= 0 && home >= 0 && away !== home;
  useEffect(() => {
    setAwayDraft(game?.awayScore?.toString() ?? "");
    setHomeDraft(game?.homeScore?.toString() ?? "");
  }, [game?.awayScore, game?.homeScore]);
  return <div className={`inline-playoff-score consolation-score${open ? " is-open" : ""}`}>
    <button type="button" className="inline-playoff-score-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}><Pencil />{game?.awayScore != null && game.homeScore != null ? "Edit score" : "Enter score"}</button>
    {open && <div className="inline-playoff-score-form">
      <label><span>{awayName}</span><input aria-label={`${awayName} score`} type="number" min="0" step="0.01" inputMode="decimal" value={awayDraft} onChange={(event) => setAwayDraft(event.target.value)} /></label>
      <b aria-hidden="true">@</b>
      <label><span>{homeName}</span><input aria-label={`${homeName} score`} type="number" min="0" step="0.01" inputMode="decimal" value={homeDraft} onChange={(event) => setHomeDraft(event.target.value)} /></label>
      <span className="inline-playoff-score-actions">
        {game?.awayScore != null && <button type="button" onClick={() => { onSave(); setOpen(false); }}>Clear</button>}
        <button type="button" className="button-primary" disabled={!valid} onClick={() => { onSave(Math.round(away * 100) / 100, Math.round(home * 100) / 100); setOpen(false); }}><Check />Save</button>
      </span>
      {awayDraft !== "" && homeDraft !== "" && away === home && <small>Playoff games need a winner.</small>}
    </div>}
  </div>;
}

function ordinal(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

export function FinalPlacementTable({ schedule }: { schedule: GeneratedSchedule }) {
  const placements = projectFinalPlacements(schedule);
  const latestFinalWeek = Math.max(0, ...placements.filter((item) => item.status === "final").map((item) => item.weekNumber ?? 0));
  return <section className="final-placement-surface" aria-labelledby="final-placement-title">
    <header><span className="final-placement-mark"><Trophy /></span><span><small>SEASON FINISH</small><strong id="final-placement-title">Final placement</strong><em>{latestFinalWeek ? `Updated through NFL Week ${latestFinalWeek}. Finished positions stay locked as results arrive.` : "Live projection from the current standings and configured playoff paths."}</em></span><span className="final-placement-progress">{placements.filter((item) => item.status === "final").length} FINAL</span></header>
    <div className="final-placement-table-wrap"><table className="final-placement-table"><thead><tr><th>PLACE</th><th>TEAM</th><th>PLACEMENT GAME</th><th>STATUS</th></tr></thead><tbody>{placements.map((placement) => {
      const team = schedule.setup.teams.find((item) => item.id === placement.teamId);
      if (!team) return null;
      return <tr className={placement.status === "final" ? "is-final" : ""} key={placement.place}>
        <td><b>{placement.place <= 3 && <Medal />}{ordinal(placement.place)}</b></td>
        <td><span className="final-placement-team"><EntityLogo size={38} color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} /><span>{schedule.setup.display.cityNames !== false && team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong></span></span></td>
        <td><span className="final-placement-event"><strong>{placement.eventLabel ?? (placement.place === 1 ? "Championship" : placement.place === 2 ? "Championship runner-up" : "Placement pending")}</strong>{placement.weekNumber && <small>NFL Week {placement.weekNumber}</small>}</span></td>
        <td><span className={`placement-status ${placement.status}`}>{placement.status === "final" ? "FINAL" : "PROJECTED"}</span></td>
      </tr>;
    })}</tbody></table></div>
  </section>;
}

export function ConsolationBracket({ schedule, onUpdateGame }: { schedule: GeneratedSchedule; onUpdateGame?: (game: PlayoffGame) => void }) {
  const bracket = projectConsolationBracket(schedule);
  if (!bracket || !bracket.rounds.length) return null;

  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const standingsByTeam = new Map(calculateStandings(schedule).map((row) => [row.teamId, row] as const));
  return <section className="consolation-surface" aria-labelledby="consolation-title">
    <header>
      <span className="consolation-heading-mark"><Medal /></span>
      <span><small>CONSOLATION BRACKET</small><strong id="consolation-title">Every final place has a path</strong><em>{bracket.mode === "division-halves" ? "Teams open inside their division, then cross divisions for final placement." : "Overall seeds follow a separate ESPN-style placement bracket and never re-enter title contention."}</em></span>
      <span className="consolation-mode-chip">{bracket.mode === "division-halves" ? "DIVISION HALVES" : "STANDARD PLACEMENT"}</span>
    </header>
    {bracket.fallbackReason && <div className="consolation-fallback"><RefreshCw /><span><strong>Standard placement applied</strong><small>{bracket.fallbackReason}</small></span></div>}
    <div className="consolation-board">
      {bracket.rounds.map((round) => {
        const roundLogo = schedule.setup.playoffs.roundLogoUrls?.[round.roundIndex];
        return <section key={round.roundIndex} data-bracket-round={round.roundIndex}>
          <h3>{roundLogo && <img src={roundLogo} alt="" />}<span><small>NFL Week {round.weekNumber} · {getWeekDateLabel(schedule.setup.seasonYear, round.weekNumber).replace(`, ${schedule.setup.seasonYear}`, "")}</small></span></h3>
          <div className="consolation-round-games">{round.games.map((game, gameIndex) => {
            const division = game.divisionId ? divisionById.get(game.divisionId) : undefined;
            const recorded = schedule.playoffGames?.find((item) => item.id === game.id);
            const awayTeamId = recorded?.awayTeamId ?? resolvedEntrantTeamId(game.entrants[0], schedule);
            const homeTeamId = recorded?.homeTeamId ?? resolvedEntrantTeamId(game.entrants[1], schedule);
            const awayTeam = schedule.setup.teams.find((team) => team.id === awayTeamId);
            const homeTeam = schedule.setup.teams.find((team) => team.id === homeTeamId);
            const gameName = schedule.setup.playoffs.gameNames?.[game.id]?.trim() || game.label;
            const gameLogo = schedule.setup.playoffs.gameLogoUrls?.[game.id]
              || roundLogo
              || schedule.setup.playoffs.logoUrl;
            return <article className="consolation-game" key={game.id} data-bracket-game-id={game.id} style={division ? { "--consolation-accent": division.color } as CSSProperties : undefined}>
              <header>{gameLogo && <img src={gameLogo} alt="" />}<span><strong>{gameName}</strong>{division && <small>{division.name} division</small>}</span>{recorded?.awayScore != null && recorded.homeScore != null && <em>{recorded.awayScore} @ {recorded.homeScore}</em>}</header>
              <ConsolationEntrant entrant={game.entrants[0]} schedule={schedule} standingsByTeam={standingsByTeam} />
              <ConsolationEntrant entrant={game.entrants[1]} schedule={schedule} standingsByTeam={standingsByTeam} />
              {onUpdateGame && awayTeam && homeTeam && <ConsolationScoreEditor game={recorded} awayName={`${awayTeam.city} ${awayTeam.name}`.trim()} homeName={`${homeTeam.city} ${homeTeam.name}`.trim()} onSave={(awayScore, homeScore) => onUpdateGame({
                ...(recorded ?? {}),
                id: game.id,
                week: round.weekNumber,
                gameNumber: gameIndex + 1,
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                matchupType: homeTeam.divisionId === awayTeam.divisionId ? "division" : "cross-division",
                seriesGame: 1,
                seriesLength: 1,
                dateLabel: getWeekDateLabel(schedule.setup.seasonYear, round.weekNumber),
                stadium: homeTeam.stadium || "Venue to be determined",
                homeScore,
                awayScore,
                round: round.name,
                roundIndex: round.roundIndex,
                name: schedule.setup.playoffs.gameNames?.[game.id],
                logoUrl: schedule.setup.playoffs.gameLogoUrls?.[game.id],
                roundLogoUrl: roundLogo,
                bracket: "consolation",
              })} />}
            </article>;
          })}</div>
        </section>;
      })}
    </div>
  </section>;
}
