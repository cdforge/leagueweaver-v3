"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Medal, ShieldCheck, Trophy, X, Zap } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { readableTextColor } from "@/lib/colorContrast";
import { getWeekScenarios, type ConditionResult, type OwnResult, type Scenario, type ScenarioAchievement } from "@/lib/scenarios";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule, ScheduledGame, Team } from "@/lib/types";

const ACHIEVEMENT_HEADLINE: Record<Exclude<ScenarioAchievement, "division-title">, string> = {
  "top-seed": "Clinch #1 Seed with:",
  "playoff-berth": "Clinch Playoff Berth with:",
  "elimination": "Eliminated from playoffs with:",
};

const DOT_CLASS: Record<ScenarioAchievement, string> = {
  "top-seed": "seed",
  "division-title": "div",
  "playoff-berth": "play",
  "elimination": "elim",
};

function ownPhrase(own: OwnResult) {
  switch (own) {
    case "win": return "win";
    case "win-or-tie": return "win or tie";
    case "tie": return "tie";
    case "loss": return "lose";
    case "none": return "";
  }
}

function resultPhrase(result: ConditionResult) {
  switch (result) {
    case "win": return "win";
    case "win-or-tie": return "win or tie";
    case "loss": return "lose";
    case "loss-or-tie": return "lose or tie";
  }
}

/** Small inline team mark (EntityLogo enforces a 32px floor, too big for inline text). */
function MiniMark({ team, size = 16 }: { team: Team; size?: number }) {
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(team.logoUrl) && !failed;
  return <span className="stakes-mini" style={{ width: size, height: size, background: showLogo ? "transparent" : team.color, color: readableTextColor(team.color) }}>
    {showLogo ? <img src={team.logoUrl} alt="" onError={() => setFailed(true)} /> : <b>{teamInitials(team)}</b>}
  </span>;
}

function TeamChip({ team }: { team: Team }) {
  return <span className="stakes-inline-team"><MiniMark team={team} />{team.name}</span>;
}

function GameRef({ game, teamId, teamById }: { game: ScheduledGame; teamId: string; teamById: Map<string, Team> }) {
  const opponentId = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId;
  const opponent = teamById.get(opponentId);
  if (!opponent) return null;
  const preposition = game.homeTeamId === teamId ? "vs" : "at";
  return <span className="stakes-gameref">{preposition} <MiniMark team={opponent} size={15} />{opponent.name}</span>;
}

function ScenarioBar({ scenario, teamById, gameById, divisionName, divisionColor, divisionLogoUrl, divisionInitials, onGoToGame }: {
  scenario: Scenario;
  teamById: Map<string, Team>;
  gameById: Map<string, ScheduledGame>;
  divisionName?: string;
  divisionColor?: string;
  divisionLogoUrl?: string;
  divisionInitials?: string;
  onGoToGame: (gameId: string) => void;
}) {
  const team = teamById.get(scenario.teamId);
  if (!team) return null;
  const subjectGame = scenario.subjectGameId ? gameById.get(scenario.subjectGameId) : undefined;
  const isElimination = scenario.achievement === "elimination";
  const barColor = isElimination ? "#c0392e" : team.color;
  const barStyle = { "--stakes-team-color": barColor, color: readableTextColor(barColor) } as CSSProperties;

  const cleanPaths = scenario.paths.filter((path) => path.kind === "clean");
  const helpPaths = scenario.paths.filter((path) => path.kind === "needs-help");

  const renderPath = (path: (typeof scenario.paths)[number], number: number) => {
    const own = ownPhrase(path.own);
    return <li className={`stakes-cond ${path.kind === "clean" ? "clean" : ""}`} key={number}>
      <span className="stakes-num">{number}</span>
      <span className="stakes-cond-body">
        {own && <><span className="stakes-tm">{team.name}</span> <span className="stakes-res">{own}</span></>}
        {path.conditions.map((condition, index) => {
          const rival = teamById.get(condition.teamId);
          const rivalGame = gameById.get(condition.gameId);
          if (!rival) return null;
          return <span key={condition.teamId + index}>
            {(own || index > 0) && <span className="stakes-op"> + </span>}
            <TeamChip team={rival} /> <span className="stakes-res">{resultPhrase(condition.result)}</span>
            {rivalGame && <span className="stakes-cond-game"> (<GameRef game={rivalGame} teamId={condition.teamId} teamById={teamById} />)</span>}
          </span>;
        })}
        {path.hasAlternates && <span className="stakes-alt"> — or other combinations</span>}
      </span>
    </li>;
  };

  return <div className={`stakes-team-bar ${isElimination ? "elim" : ""}`} style={barStyle}>
    <div className="stakes-bhead">
      <span className="stakes-blogo"><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={40} imagePresentation="bare" /></span>
      <span className="stakes-bbar">
        {scenario.achievement === "top-seed" && <Medal aria-hidden="true" className="stakes-out-icon" />}
        {scenario.achievement === "playoff-berth" && <ShieldCheck aria-hidden="true" className="stakes-out-icon" />}
        {isElimination && <X aria-hidden="true" className="stakes-out-icon" />}
        {scenario.achievement === "division-title" && divisionColor && (
          <span className="stakes-dmark"><DivisionMark division={{ id: scenario.divisionId ?? "", name: divisionName ?? "", color: divisionColor, logoUrl: divisionLogoUrl, initials: divisionInitials }} size={20} /></span>
        )}
        <span className="stakes-out">
          {scenario.achievement === "division-title" ? `Clinch ${divisionName ?? ""} Division with:`.replace(/\s+/g, " ") : ACHIEVEMENT_HEADLINE[scenario.achievement]}
        </span>
      </span>
    </div>
    <div className="stakes-bsub">
      <span className="stakes-name">{teamDisplayName(team, true)}</span>
      {subjectGame && <GameRef game={subjectGame} teamId={team.id} teamById={teamById} />}
      {subjectGame && <button type="button" className="stakes-goto" onClick={() => onGoToGame(subjectGame.id)}>Go to game <ArrowUpRight aria-hidden="true" /></button>}
    </div>
    {cleanPaths.length > 0 && <ol className="stakes-conds">{cleanPaths.map((path, index) => renderPath(path, index + 1))}</ol>}
    {helpPaths.length > 0 && (
      isElimination
        ? <ol className="stakes-conds">{helpPaths.map((path, index) => renderPath(path, cleanPaths.length + index + 1))}</ol>
        : <div className="stakes-hardway">
            <div className="stakes-eyebrow">{cleanPaths.length ? "Or, needing help" : "Needing help"} <i /></div>
            <ol className="stakes-conds">{helpPaths.map((path, index) => renderPath(path, cleanPaths.length + index + 1))}</ol>
          </div>
    )}
  </div>;
}

export function StakesButton({ schedule, weekNumber, onGoToGame }: {
  schedule: GeneratedSchedule;
  weekNumber: number;
  onGoToGame: (gameId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const result = useMemo(() => getWeekScenarios(schedule, weekNumber), [schedule, weekNumber]);
  const teamById = useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule]);
  const gameById = useMemo(() => {
    const week = schedule.weeks.find((entry) => entry.weekNumber === weekNumber);
    return new Map((week?.games ?? []).map((game) => [game.id, game]));
  }, [schedule, weekNumber]);
  const divisionById = useMemo(() => new Map(schedule.setup.divisions.map((division) => [division.id, division])), [schedule]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!result.scenarios.length) return null;

  const dotKinds = Array.from(new Set(result.scenarios.map((scenario) => DOT_CLASS[scenario.achievement])));

  const handleGoToGame = (gameId: string) => { setOpen(false); onGoToGame(gameId); };

  return <>
    <button type="button" className="stakes-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog">
      <span className="stakes-dot-cluster">{dotKinds.map((kind) => <i key={kind} className={`stakes-dot ${kind}`} />)}</span>
      <Zap aria-hidden="true" className="stakes-trigger-icon" />
      <span className="stakes-trigger-label">Stakes</span>
      <span className="stakes-trigger-count">{result.scenarios.length}</span>
    </button>
    {open && <div className="stakes-overlay" role="dialog" aria-modal="true" aria-label={`Week ${weekNumber} stakes`} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="stakes-panel">
        <div className="stakes-panel-head">
          <div className="stakes-title"><strong>On the Line</strong><small>Week {weekNumber} · what can be sealed this week</small></div>
          <span className="stakes-ct">SCENARIOS <b>{result.scenarios.length}</b></span>
          <button type="button" className="stakes-x" onClick={() => setOpen(false)} aria-label="Close"><X aria-hidden="true" /></button>
        </div>
        <div className="stakes-panel-body">
          {result.scenarios.map((scenario, index) => {
            const division = scenario.divisionId ? divisionById.get(scenario.divisionId) : undefined;
            return <ScenarioBar
              key={`${scenario.teamId}-${scenario.achievement}-${index}`}
              scenario={scenario}
              teamById={teamById}
              gameById={gameById}
              divisionName={division?.name}
              divisionColor={division?.color}
              divisionLogoUrl={division?.logoUrl}
              divisionInitials={division?.initials}
              onGoToGame={handleGoToGame}
            />;
          })}
        </div>
        <div className="stakes-panel-foot">
          <Trophy aria-hidden="true" />
          <span>The bold top line is the clean path — win (or tie) and you’re in. Anything under “needing help” only matters if that doesn’t happen. Every other team named shows the game that decides its part.</span>
        </div>
      </div>
    </div>}
  </>;
}
