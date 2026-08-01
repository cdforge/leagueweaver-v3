"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronRight,
  CircleGauge,
  Crown,
  Dices,
  Eraser,
  FastForward,
  Flag,
  Gamepad2,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UnlockKeyhole,
} from "lucide-react";
import { MatchupCard } from "@/components/season/MatchupPresentation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { getMatchupRatingRange, getMatchupSignal } from "@/lib/matchups";
import { calculateStandings, formatRecord, getEnteringWeekRankMap, getEnteringWeekRankSnapshot } from "@/lib/standings";
import { calculateTeamSeasonStats } from "@/lib/statistics";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import { useSeasonOdds } from "@/lib/useSeasonOdds";
import type { GeneratedSchedule, ScheduledGame } from "@/lib/types";

export interface SimulatorResultView {
  gameId: string;
  source: "simulated" | "override";
  locked: boolean;
  homeScore: number;
  awayScore: number;
  homeWinProbability: number;
}

export interface SimulatorOddsView {
  teamId: string;
  playoffOdds: number;
  divisionOdds: number;
  championshipOdds: number;
  topSeedOdds: number;
  projectedWins: number;
  projectedLosses: number;
  averageFinish: number;
  finishDistribution: number[];
  confidence: number;
}

interface SimulatorWorkspaceProps {
  schedule: GeneratedSchedule;
  resultByGame: Record<string, SimulatorResultView>;
  probabilityByGame: Record<string, { away: number; home: number }>;
  trials: 500 | 1000 | 2000;
  onTrialsChange: (trials: 500 | 1000 | 2000) => void;
  onSimulateGame: (gameId: string) => void;
  onRerollGame: (gameId: string) => void;
  onOverrideGame: (gameId: string, homeScore: number, awayScore: number) => void;
  onToggleLock: (gameId: string) => void;
  onAdvanceWeek: () => void;
  onFirstHalf: () => void;
  onRestOfSeason: () => void;
  onRerollSeason: () => void;
  onRestartFromBeginning: () => void;
  onPlayToChampion: () => void;
  onClearSimulated: () => void;
  onClearAll: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onOpenSchedule: (week: number) => void;
}

function findGame(schedule: GeneratedSchedule, gameId: string | undefined) {
  if (!gameId) return undefined;
  return schedule.weeks.flatMap((week) => week.games).find((game) => game.id === gameId);
}

function playoffWinner(game: NonNullable<GeneratedSchedule["playoffGames"]>[number] | undefined) {
  if (!game || game.homeScore == null || game.awayScore == null) return undefined;
  return game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
}

export function SimulatorWorkspace({
  schedule,
  resultByGame,
  probabilityByGame,
  trials,
  onTrialsChange,
  onSimulateGame,
  onRerollGame,
  onOverrideGame,
  onToggleLock,
  onAdvanceWeek,
  onFirstHalf,
  onRestOfSeason,
  onRerollSeason,
  onRestartFromBeginning,
  onPlayToChampion,
  onClearSimulated,
  onClearAll,
  onSave,
  onDiscard,
  onOpenSchedule,
}: SimulatorWorkspaceProps) {
  const [tab, setTab] = useState<"drive" | "odds">("drive");
  const [rolling, setRolling] = useState(false);
  const { odds: rawOdds, computing: oddsComputing } = useSeasonOdds(schedule, trials, tab === "odds");
  const odds: SimulatorOddsView[] = useMemo(() => rawOdds.map((row) => ({
    teamId: row.teamId,
    playoffOdds: row.playoffOdds,
    divisionOdds: row.divisionOdds,
    championshipOdds: row.championshipOdds,
    topSeedOdds: row.topSeedOdds,
    projectedWins: row.projectedWins,
    projectedLosses: row.projectedLosses,
    averageFinish: row.averageFinish,
    finishDistribution: row.finishDistribution.map((finish) => finish.probability),
    confidence: row.confidence.score,
  })), [rawOdds]);
  const allGames = useMemo(() => schedule.weeks.flatMap((week) => week.games), [schedule]);
  const controllableGames = allGames.filter((game) =>
    Boolean(probabilityByGame[game.id]) || Boolean(resultByGame[game.id]),
  );
  const firstUnplayed = controllableGames.find((game) => game.homeScore == null || game.awayScore == null);
  const sandboxGames = controllableGames.filter((game) => resultByGame[game.id]);
  const lastSandboxGameId = sandboxGames[sandboxGames.length - 1]?.id;
  const [focusGameId, setFocusGameId] = useState(firstUnplayed?.id || sandboxGames[sandboxGames.length - 1]?.id || "");
  const focusGame = findGame(schedule, focusGameId);
  const focusResult = focusGame ? resultByGame[focusGame.id] : undefined;
  const [homeScore, setHomeScore] = useState(focusGame?.homeScore ?? 120);
  const [awayScore, setAwayScore] = useState(focusGame?.awayScore ?? 110);

  useEffect(() => {
    if (focusGameId && findGame(schedule, focusGameId)) return;
    setFocusGameId(firstUnplayed?.id || lastSandboxGameId || "");
  }, [firstUnplayed?.id, focusGameId, lastSandboxGameId, schedule]);
  useEffect(() => {
    if (!focusGame) return;
    setHomeScore(focusGame.homeScore ?? 120);
    setAwayScore(focusGame.awayScore ?? 110);
  }, [focusGame?.id, focusGame?.homeScore, focusGame?.awayScore]);

  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const divisionById = new Map(schedule.setup.divisions.map((division) => [division.id, division]));
  const showCity = schedule.setup.display?.cityNames !== false;
  const showVenue = schedule.setup.display?.venues !== false;
  const simulationCount = Object.keys(resultByGame).length;
  const lockedCount = Object.values(resultByGame).filter((result) => result.locked).length;
  const runAnimated = (action: () => void) => {
    if (rolling) return;
    setRolling(true);
    window.setTimeout(() => {
      action();
      setRolling(false);
    }, 520);
  };
  const clampScore = (value: string) => Math.max(0, Math.min(300, Math.round(Number(value) || 0)));
  const restartFromBeginning = () => {
    setFocusGameId(allGames[0]?.id ?? "");
    onRestartFromBeginning();
  };
  const nextAfterFocus = focusGame
    ? controllableGames.find((game) => (
      game.week > focusGame.week
      || (game.week === focusGame.week && allGames.indexOf(game) > allGames.indexOf(focusGame))
    ) && (game.homeScore == null || game.awayScore == null))
    : firstUnplayed;
  const moveNext = () => setFocusGameId(nextAfterFocus?.id || firstUnplayed?.id || "");

  const matchupPresentation = focusGame ? (() => {
    const away = teamById.get(focusGame.awayTeamId)!;
    const home = teamById.get(focusGame.homeTeamId)!;
    const ranks = getEnteringWeekRankMap(schedule, focusGame.week);
    const ratingRange = getMatchupRatingRange(schedule.weeks.flatMap((week) => week.games), ranks);
    const snapshot = getEnteringWeekRankSnapshot(schedule, focusGame.week);
    const standings = new Map(snapshot.rows.map((row) => [row.teamId, row]));
    const record = (teamId: string) => {
      const row = standings.get(teamId);
      return { overall: row ? formatRecord(row) : "0-0", division: row ? `${row.divisionWins}-${row.divisionLosses}` : "0-0" };
    };
    return {
      game: focusGame,
      away,
      home,
      awayDivision: divisionById.get(away.divisionId),
      homeDivision: divisionById.get(home.divisionId),
      awayRank: ranks.get(away.id) ?? away.overallRank,
      homeRank: ranks.get(home.id) ?? home.overallRank,
      awayRecord: record(away.id),
      homeRecord: record(home.id),
      signal: getMatchupSignal(focusGame, ranks, ratingRange, schedule.setup.teams.length),
      featured: false,
      showCity,
      showVenue,
    };
  })() : undefined;

  const titleGame = [...(schedule.playoffGames ?? [])].filter((game) => game.bracket === "main").sort((left, right) => right.roundIndex - left.roundIndex)[0];
  const championId = playoffWinner(titleGame);
  const runnerUpId = titleGame && championId ? titleGame.homeTeamId === championId ? titleGame.awayTeamId : titleGame.homeTeamId : undefined;
  const champion = championId ? teamById.get(championId) : undefined;
  const runnerUp = runnerUpId ? teamById.get(runnerUpId) : undefined;
  const finalStandings = calculateStandings(schedule);
  const teamStats = calculateTeamSeasonStats(schedule);
  const topScorer = [...teamStats].sort((left, right) => right.pointsFor - left.pointsFor)[0];
  const topScorerTeam = topScorer ? teamById.get(topScorer.teamId) : undefined;
  const winnerProbability = (game: ScheduledGame, result: SimulatorResultView) => {
    const homeWon = result.homeScore > result.awayScore;
    return homeWon ? result.homeWinProbability : 1 - result.homeWinProbability;
  };
  const upset = Object.values(resultByGame)
    .map((result) => ({ result, game: findGame(schedule, result.gameId) }))
    .filter((item): item is { result: SimulatorResultView; game: ScheduledGame } => Boolean(item.game))
    .filter((item) => winnerProbability(item.game, item.result) < .5)
    .sort((left, right) => winnerProbability(left.game, left.result) - winnerProbability(right.game, right.result))[0];
  const upsetWinnerId = upset ? upset.result.homeScore > upset.result.awayScore ? upset.game.homeTeamId : upset.game.awayTeamId : undefined;
  const upsetWinner = upsetWinnerId ? teamById.get(upsetWinnerId) : undefined;
  const focusOptions = controllableGames.map((game) => {
    const away = teamById.get(game.awayTeamId)!;
    const home = teamById.get(game.homeTeamId)!;
    const result = resultByGame[game.id];
    return {
      value: game.id,
      label: `W${game.week} · ${away.name} at ${home.name}`,
      description: result ? `${result.source === "override" ? "Commissioner" : "Simulated"}${result.locked ? " · Locked" : ""}` : "Upcoming",
      swatch: home.color,
      logoUrl: home.logoUrl,
      monogram: teamInitials(home),
    };
  });

  return <div className="simulator-workspace">
    <div className="simulator-tabs" role="tablist" aria-label="Simulator views">
      <button type="button" role="tab" aria-selected={tab === "drive"} className={tab === "drive" ? "active" : ""} onClick={() => setTab("drive")}><Gamepad2 />Drive season</button>
      <button type="button" role="tab" aria-selected={tab === "odds"} className={tab === "odds" ? "active" : ""} onClick={() => setTab("odds")}><BarChart3 />Odds view</button>
    </div>

    {tab === "drive" && <div className="simulator-drive">
      <section className="simulator-command-bar">
        <span><CircleGauge /><span><strong>{simulationCount} sandbox results</strong><small>{lockedCount} locked · real scores stay safe outside this sandbox</small></span></span>
        <div className="simulator-command-actions">
          <button type="button" onClick={() => runAnimated(onAdvanceWeek)}><ChevronRight />Next week</button>
          <button type="button" onClick={() => runAnimated(onFirstHalf)}><Flag />First half</button>
          <button type="button" onClick={() => runAnimated(onRestOfSeason)}><FastForward />Rest of season</button>
          <button type="button" onClick={() => runAnimated(onRerollSeason)}><Dices />Re-roll season</button>
          <button type="button" className="restart-action" onClick={() => runAnimated(restartFromBeginning)}><RotateCcw />Restart Week 1</button>
          <button type="button" className="champion-action" onClick={() => runAnimated(onPlayToChampion)}><Crown />Play to champion</button>
        </div>
      </section>

      <div className="simulator-game-layout">
        <section className={`simulator-game-day ${rolling ? "is-rolling" : ""}`}>
          <header><span><Gamepad2 /><span><strong>Game-day control</strong><small>{focusGame ? `Week ${focusGame.week} · ${focusGame.stadium}` : "Regular season complete"}</small></span></span>{focusOptions.length > 0 && <CustomSelect label="Choose a game to simulate" value={focusGameId} onChange={setFocusGameId} options={focusOptions} />}</header>
          {rolling ? <div className="simulator-rolling" role="status"><Dices /><strong>Simulating matchup</strong><span><i /><i /><i /></span></div> : matchupPresentation ? <MatchupCard
            {...matchupPresentation}
            simulationSource={focusResult?.source}
            simulationLocked={focusResult?.locked}
            winProbability={probabilityByGame[focusGame!.id]}
            variant="gotw"
            teamHrefBase={`/season/${schedule.id}/team`}
          /> : <div className="simulator-empty-game"><Trophy /><strong>The regular season is complete.</strong><small>Start a fresh hypothetical run from Week 1, or play through the bracket.</small><button type="button" className="button-primary" onClick={() => runAnimated(restartFromBeginning)}><RotateCcw />Restart from Week 1</button></div>}
          <footer className="simulator-game-actions">
            {focusGame && !focusResult && <button type="button" className="button-primary" onClick={() => runAnimated(() => onSimulateGame(focusGame.id))}><Play />Sim the game</button>}
            {focusGame && focusResult && <button type="button" onClick={() => runAnimated(() => onRerollGame(focusGame.id))} disabled={focusResult.locked}><RefreshCw />Re-roll</button>}
            {focusGame && focusResult && <button type="button" onClick={() => onToggleLock(focusGame.id)}>{focusResult.locked ? <UnlockKeyhole /> : <LockKeyhole />}{focusResult.locked ? "Unlock" : "Lock result"}</button>}
            {focusResult && nextAfterFocus && <button type="button" onClick={moveNext}>Next matchup<ChevronRight /></button>}
            {focusGame && <button type="button" onClick={() => onOpenSchedule(focusGame.week)}>Watch schedule<ChevronRight /></button>}
          </footer>
        </section>

        <aside className="simulator-commissioner">
          <header><Target /><span><strong>Commissioner control</strong><small>Overrides stay hypothetical until saved</small></span></header>
          {focusGame ? <><div className="simulator-score-override">
            <label><span>Away score</span><input type="number" inputMode="numeric" min="0" max="300" value={awayScore} onChange={(event) => setAwayScore(clampScore(event.target.value))} /></label>
            <span aria-label="at">@</span>
            <label><span>Home score</span><input type="number" inputMode="numeric" min="0" max="300" value={homeScore} onChange={(event) => setHomeScore(clampScore(event.target.value))} /></label>
          </div>
          <button type="button" className="button-secondary" onClick={() => onOverrideGame(focusGame.id, homeScore, awayScore)} disabled={rolling || homeScore === awayScore}><Check />Set score</button>
          <div className="winner-nudges">
            <button type="button" disabled={rolling} onClick={() => onOverrideGame(focusGame.id, 117, 128)}>Away wins</button>
            <button type="button" disabled={rolling} onClick={() => onOverrideGame(focusGame.id, 128, 117)}>Home wins</button>
          </div></> : <div className="commissioner-empty">No regular-season games remain to control.</div>}
        </aside>
      </div>

      <section className="simulator-sandbox-actions">
        <span><ShieldCheck /><span><strong>Hypothetical sandbox</strong><small>Your real results have not changed.</small></span></span>
        <button type="button" disabled={rolling} onClick={onClearSimulated}><Eraser />Clear simulated only</button>
        <button type="button" disabled={rolling} onClick={onClearAll}><RotateCcw />Clear all sandbox</button>
        <button type="button" disabled={rolling} onClick={onDiscard}>Discard run</button>
        <button type="button" className="button-primary" disabled={rolling} onClick={onSave}><Save />Save run back</button>
      </section>

      {champion && <section className="simulation-recap">
        <header><Sparkles /><span><small>END-OF-SEASON RECAP</small><strong>How this simulated season finished</strong></span></header>
        <div className="recap-title">
          <EntityLogo color={champion.color} logoUrl={champion.logoUrl} monogram={teamInitials(champion)} size={64} />
          <span><small>LEAGUE CHAMPION</small><strong>{teamDisplayName(champion, showCity)}</strong><em>Defeated {runnerUp ? teamDisplayName(runnerUp, showCity) : "the finalist"} in the championship</em></span>
          <Trophy />
        </div>
        <div className="recap-records">
          <span><strong>{finalStandings[0] ? teamDisplayName(teamById.get(finalStandings[0].teamId)!, showCity) : "—"}</strong><small>Best record · {finalStandings[0] ? formatRecord(finalStandings[0]) : "—"}</small></span>
          <span><strong>{topScorerTeam ? teamDisplayName(topScorerTeam, showCity) : "—"}</strong><small>Top scorer · {topScorer?.pointsFor ?? 0} PF</small></span>
          <span><strong>{upsetWinner ? teamDisplayName(upsetWinner, showCity) : "No upset recorded"}</strong><small>{upset ? `Biggest upset · ${Math.round(winnerProbability(upset.game, upset.result) * 100)}% win chance` : "Every simulated favorite held"}</small></span>
          <span><strong>Seed #{schedule.setup.teams.find((team) => team.id === champion.id)?.overallRank}</strong><small>Cinderella marker · preseason position</small></span>
        </div>
        <div className="recap-standings">{finalStandings.slice(0, 6).map((row, index) => {
          const team = teamById.get(row.teamId)!;
          return <span key={team.id}><b>#{index + 1}</b><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={32} /><strong>{teamDisplayName(team, showCity)}</strong><em>{formatRecord(row)}</em></span>;
        })}</div>
      </section>}
    </div>}

    {tab === "odds" && <div className="simulator-odds">
      <section className="odds-control-band">
        <span><BarChart3 /><span><strong>Monte Carlo companion</strong><small>{oddsComputing && odds.length > 0 ? `Updating ${trials.toLocaleString()} simulations…` : "Regular season and the configured playoff bracket are simulated together."}</small></span></span>
        <div className="segmented compact">{([500, 1000, 2000] as const).map((count) => <button type="button" className={trials === count ? "active" : ""} onClick={() => onTrialsChange(count)} key={count}>{count === 1000 ? "1K" : count === 2000 ? "2K" : "500"}</button>)}</div>
      </section>
      {oddsComputing && odds.length === 0 ? <div className="simulator-odds-loading" role="status"><LoaderCircle className="spin" /><span>Running {trials.toLocaleString()} season simulations…</span></div> : <div className={`simulator-odds-table-wrap${oddsComputing ? " is-updating" : ""}`}><table className="simulator-odds-table">
        <thead><tr><th>TEAM</th><th>MAKE PLAYOFFS</th><th>WIN DIVISION</th><th>WIN TITLE</th><th>TOP SEED</th><th>PROJECTED RECORD</th><th>AVG FINISH</th><th>DISTRIBUTION</th><th>CONFIDENCE</th></tr></thead>
        <tbody>{odds.map((row) => {
          const team = teamById.get(row.teamId)!;
          return <tr key={row.teamId}>
            <td><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={34} /><span><strong>{teamDisplayName(team, showCity)}</strong><small>Preseason #{team.overallRank}</small></span></td>
            <td><span className="odds-meter"><i style={{ width: `${row.playoffOdds * 100}%`, background: team.color }} /><strong>{Math.round(row.playoffOdds * 100)}%</strong></span></td>
            <td>{Math.round(row.divisionOdds * 100)}%</td>
            <td><strong>{Math.round(row.championshipOdds * 100)}%</strong></td>
            <td>{Math.round(row.topSeedOdds * 100)}%</td>
            <td>{row.projectedWins.toFixed(1)}–{row.projectedLosses.toFixed(1)}</td>
            <td>#{row.averageFinish.toFixed(1)}</td>
            <td><span className="finish-distribution" aria-label={`Projected finishing distribution for ${team.name}`}>{row.finishDistribution.map((value, index) => <i key={index} style={{ height: `${Math.max(2, value * 100)}%`, background: team.color }} />)}</span></td>
            <td><span className="confidence-meter"><i style={{ width: `${row.confidence * 100}%` }} /><strong>{row.confidence >= .75 ? "High" : row.confidence >= .5 ? "Medium" : "Developing"}</strong></span></td>
          </tr>;
        })}</tbody>
      </table></div>}
    </div>}
  </div>;
}
