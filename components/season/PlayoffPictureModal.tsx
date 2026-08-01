"use client";

import { useMemo, type CSSProperties } from "react";
import { CircleX, Medal, ShieldCheck, Trophy, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { DivisionMark } from "@/components/ui/DivisionIdentity";
import { buildPlayoffPicture, type PlayoffPictureEntry } from "@/lib/playoffPicture";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import { tintColor } from "@/lib/colorContrast";
import type { Division, GeneratedSchedule, Team } from "@/lib/types";

function weekLabel(week?: number) {
  if (week == null) return "";
  return week === 0 ? "the preseason" : `Week ${week}`;
}

function gamesBackLabel(gb?: number) {
  if (gb == null) return "";
  if (gb <= 0) return "Tied at cut";
  const whole = Math.floor(gb);
  const half = gb - whole >= 0.5;
  const num = `${whole > 0 ? whole : ""}${half ? "½" : ""}` || "0";
  return `${num} back`;
}

export function PlayoffPictureModal({ schedule, onClose }: { schedule: GeneratedSchedule; onClose: () => void }) {
  const picture = useMemo(() => buildPlayoffPicture(schedule), [schedule]);
  const teamById = useMemo(() => new Map(schedule.setup.teams.map((team) => [team.id, team])), [schedule.setup.teams]);
  const divisionById = useMemo(() => new Map(schedule.setup.divisions.map((d) => [d.id, d])), [schedule.setup.divisions]);
  const showCity = schedule.setup.display?.cityNames !== false;
  const leagueLogo = schedule.setup.logoUrl;
  const leagueColor = schedule.setup.color;

  const LeagueBadge = ({ corner = false }: { corner?: boolean }) => (
    <span
      className={`pp-league${corner ? " pp-league-corner" : ""}`}
      style={{
        width: corner ? 18 : 15,
        height: corner ? 18 : 15,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        borderRadius: "50%",
        background: leagueLogo ? tintColor(leagueColor) : "var(--gold)",
      }}
      aria-hidden="true"
    >
      {leagueLogo
        ? <img src={leagueLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <Trophy style={{ width: corner ? 11 : 9, height: corner ? 11 : 9, color: "#3a2c06" }} />}
    </span>
  );

  const StatusTag = ({ entry, division }: { entry: PlayoffPictureEntry; division?: Division }) => {
    if (entry.status === "top-seed") return <span className="pp-tag is-top"><Medal aria-hidden="true" />#1 Seed</span>;
    if (entry.status === "division") return <span className="pp-tag">{division && <DivisionMark division={division} size={13} className="pp-dmark" />}Div Champ</span>;
    if (entry.status === "clinched") return <span className="pp-tag is-clinched"><ShieldCheck aria-hidden="true" />Clinched</span>;
    return <span className="pp-tag">In</span>;
  };

  const clinchLine = (entry: PlayoffPictureEntry, division?: Division) => {
    if (entry.clinchWeek == null) return null;
    const what = entry.status === "top-seed" ? "the #1 seed"
      : entry.status === "division" ? `the ${division?.name ?? "division"}`
      : "a playoff berth";
    return <div className="pp-when">Clinched {what} in {weekLabel(entry.clinchWeek)}</div>;
  };

  const FieldRow = ({ entry }: { entry: PlayoffPictureEntry }) => {
    const team = teamById.get(entry.teamId);
    if (!team) return null;
    const division = divisionById.get(entry.divisionId);
    return (
      <>
        <div className={`pp-srow${entry.isTopSeed ? " is-top" : ""}`} style={{ "--tc": team.color, "--dc": division?.color ?? "#5b6b64" } as CSSProperties}>
          <span className="pp-seed">{entry.seed}{entry.isTopSeed && <LeagueBadge corner />}</span>
          <EntityLogo className="pp-crest" color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={38} />
          <div className="pp-bar">
            <div className="pp-tm">
              <span className="pp-name">{teamDisplayName(team, showCity)}</span>
              {division && <span className="pp-div"><DivisionMark division={division} size={13} className="pp-dmark" />{division.name}</span>}
            </div>
            <span className="pp-sp" />
            <StatusTag entry={entry} division={division} />
            <span className="pp-recs"><b className="pp-rec">{entry.overallRecord}</b><small className="pp-drec">{entry.divisionRecord} Div</small></span>
          </div>
        </div>
        {clinchLine(entry, division)}
      </>
    );
  };

  const MutedRow = ({ entry }: { entry: PlayoffPictureEntry }) => {
    const team = teamById.get(entry.teamId);
    if (!team) return null;
    const division = divisionById.get(entry.divisionId);
    const out = entry.status === "eliminated";
    return (
      <div className={`pp-mrow${out ? " is-out" : ""}`} style={{ "--tc": team.color, "--dc": division?.color ?? "#5b6b64" } as CSSProperties}>
        <span className="pp-msd">{entry.standingsRank}</span>
        <EntityLogo className="pp-mlogo" color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} size={32} />
        <div className="pp-tm2">
          <span className="pp-mnm">{teamDisplayName(team, showCity)}</span>
          {division && <span className="pp-mdv"><DivisionMark division={division} size={12} className="pp-dmark" />{division.name}</span>}
        </div>
        <span className="pp-sp" />
        <span className="pp-mrecs"><b>{entry.overallRecord}</b><small>{entry.divisionRecord} Div</small></span>
        {out
          ? <span className="pp-out"><CircleX aria-hidden="true" />{entry.eliminatedWeek === 0 ? "Out" : `Out ${entry.eliminatedWeek ? `W${entry.eliminatedWeek}` : ""}`.trim()}</span>
          : <span className="pp-gb">{gamesBackLabel(entry.gamesBack)}</span>}
      </div>
    );
  };

  const empty = picture.field.length === 0;

  return (
    <Modal onClose={onClose} className="pp-panel" labelledBy="pp-title">
      <header className="pp-head">
        <div>
          <p className="pp-eyebrow">Playoff Picture</p>
          <h2 id="pp-title">{schedule.setup.name}</h2>
        </div>
        <span className="pp-thru">
          {picture.regularSeasonComplete ? "Final" : "Through"}
          <b>{picture.throughWeek === 0 ? "Preseason" : `Week ${picture.throughWeek}`}</b>
          {!picture.regularSeasonComplete && picture.weeksToPlay > 0 ? `${picture.weeksToPlay} to play` : "Regular season complete"}
        </span>
        <button type="button" className="pp-close" onClick={onClose} aria-label="Close playoff picture"><X aria-hidden="true" /></button>
      </header>

      {empty ? (
        <div className="pp-empty">The playoff picture opens once games have been played.</div>
      ) : (
        <>
          <div className="pp-sec"><span>In the field</span><i /><em>Seeds 1–{picture.fieldSize}</em></div>
          {picture.field.map((entry) => <FieldRow key={entry.teamId} entry={entry} />)}

          <div className="pp-cut"><i /><span>Playoff cut line</span><i /></div>

          {picture.hunt.length > 0 && <>
            <div className="pp-sec"><span>In the hunt</span><i /><em>First out</em></div>
            {picture.hunt.map((entry) => <MutedRow key={entry.teamId} entry={entry} />)}
          </>}

          {picture.eliminated.length > 0 && <>
            <div className="pp-sec"><span>Eliminated</span><i /><em>{picture.eliminated.length} {picture.eliminated.length === 1 ? "team" : "teams"}</em></div>
            {picture.eliminated.map((entry) => <MutedRow key={entry.teamId} entry={entry} />)}
          </>}

          <div className="pp-foot">
            <span className="pp-lg"><LeagueBadge />#1 seed · league logo</span>
            <span className="pp-lg"><span className="pp-sw" style={{ background: "#7fe3ac" }} />Clinched berth</span>
            <span className="pp-lg"><span className="pp-sw" style={{ background: "var(--gold)" }} />On the bubble</span>
            <span className="pp-lg"><span className="pp-sw" style={{ background: "var(--live)" }} />Eliminated</span>
          </div>
        </>
      )}
    </Modal>
  );
}
