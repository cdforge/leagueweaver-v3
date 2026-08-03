"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Bell,
  Check,
  ClipboardCheck,
  Copy,
  Eye,
  FileImage,
  Gauge,
  LockKeyhole,
  Mail,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { teamInitials } from "@/lib/teamIdentity";
import { accessibleAccentColor, readableTextColor } from "@/lib/colorContrast";
import {
  buildMockPickemGames,
  calculatePickemStandings,
  buildPickemPlayoffDraft,
  createPickemPool,
  defaultPickemParticipants,
  NFL_PLAYOFF_TEAM_OPTIONS,
  isPickemGameLocked,
  nflTeamMeta,
  nflTeamName,
  pickemChoiceLabel,
  pickemDraftSlots,
  pickemStorageKey,
  type PickemGame,
  type PickemParticipant,
  type PickemPick,
  type PickemPool,
  type PickemTab,
  type PickemVisibility,
} from "@/lib/pickem";
import type { GeneratedSchedule } from "@/lib/types";

type PickemWorkspaceProps = {
  schedule: GeneratedSchedule;
  signedIn: boolean;
  onNotice?: (message: string) => void;
};

type PickemBrandContext = {
  name: string;
  color: string;
  logoUrl?: string;
  initials?: string;
  abbreviation?: string;
};

type PickemPoolWorkspaceProps = {
  pool: PickemPool;
  brand?: PickemBrandContext;
  onChange?: (pool: PickemPool) => void;
  onNotice?: (message: string) => void;
  onReload?: () => Promise<void>;
};

type PickemPreviewProps = PickemWorkspaceProps & {
  onOpen: () => void;
};

const TABS: Array<{ key: PickemTab; label: string }> = [
  { key: "this-week", label: "This Week" },
  { key: "picks", label: "Make/Review Picks" },
  { key: "everyone", label: "Everyone's Picks" },
  { key: "standings", label: "Standings" },
  { key: "results", label: "Results" },
  { key: "stats", label: "Stats" },
  { key: "playoffs", label: "Playoffs" },
  { key: "exports", label: "Exports" },
  { key: "settings", label: "Settings" },
];

const VISIBILITY_LABELS: Record<PickemVisibility, string> = {
  "after-submit": "After participant submits",
  "after-first-lock": "After first game locks",
  "always-visible": "Always visible",
  "after-week-close": "Hidden until week closes",
};

const VISIBILITY_OPTIONS: Array<{ key: PickemVisibility; title: string; badge?: string; copy: string }> = [
  { key: "after-submit", title: "After submit", badge: "Recommended", copy: "Players see everyone else's picks only after their own picks are submitted." },
  { key: "always-visible", title: "Always visible", copy: "Everyone can see live picks as they come in." },
];

const PLAYOFF_FORMATS = [
  { key: "recommended", label: "Standard", value: 7, icon: Trophy },
  { key: "duel", label: "Duel", value: 2, icon: Swords },
  { key: "full", label: "Full field", value: 14, icon: UsersRound },
  { key: "custom", label: "Custom", value: null, icon: Gauge, copy: "Choose the qualifier count yourself." },
] as const;

function PickemMark() {
  return <span className="pickem-mark" aria-hidden="true"><i /><b /></span>;
}

function brandFromSchedule(schedule: GeneratedSchedule): PickemBrandContext {
  return {
    name: schedule.setup.name,
    color: schedule.setup.color,
    logoUrl: schedule.setup.logoUrl,
    initials: schedule.setup.initials,
    abbreviation: schedule.setup.abbreviation,
  };
}

function brandFromPool(pool: PickemPool): PickemBrandContext {
  return {
    name: pool.name.replace(/\s+Pick'?em$/i, ""),
    color: pool.brandColor || "#117a45",
    logoUrl: pool.logoUrl,
    initials: "LW",
    abbreviation: "LW",
  };
}

function pickemThemeStyle(brand: PickemBrandContext): CSSProperties {
  return {
    "--pickem-green": accessibleAccentColor(brand.color, "#101614"),
    "--pickem-brand": brand.color,
  } as CSSProperties;
}

function NflTeamColorMark({ abbr, mode = "full" }: { abbr: string; mode?: "full" | "abbr" }) {
  const team = nflTeamMeta(abbr);
  return <span className={`pickem-nfl-mark is-${mode}`} style={{ "--nfl-color": team.color, "--nfl-secondary": team.secondary, "--nfl-ink": readableTextColor(team.color) } as CSSProperties}><b>{team.abbr}</b></span>;
}

function loadLocalPool(scheduleId: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(pickemStorageKey(scheduleId));
    return raw ? JSON.parse(raw) as PickemPool : null;
  } catch {
    return null;
  }
}

function saveLocalPool(pool: PickemPool) {
  try {
    window.localStorage.setItem(pickemStorageKey(pool.scheduleId), JSON.stringify(pool));
  } catch {
    // Local fallback is best-effort; cloud-backed pools continue to work.
  }
}

function pickemPoolUrl(baseUrl: string, publicSlug: string) {
  return new URL(`/pickem/join/${publicSlug}`, baseUrl).toString();
}

function pickemPoolParticipantUrl(baseUrl: string, publicSlug: string, participant: PickemParticipant) {
  const url = new URL(`/pickem/join/${publicSlug}`, baseUrl);
  url.searchParams.set("team", participant.teamId ?? participant.id);
  url.searchParams.set("claim", participant.claimToken);
  return url.toString();
}

function formatKickoff(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Kickoff TBD";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date);
}

function setupPlayoffCopy(count: number) {
  if (count === 7) return "Top 7 qualify, each drafts 2 NFL playoff teams.";
  if (count === 2) return "Top 2 qualify, each drafts 7 NFL playoff teams.";
  if (count === 14) return "Top 14 qualify, each drafts 1 NFL playoff team.";
  const slots = pickemDraftSlots(count);
  const extra = slots.filter((slot) => slot.round > 1).map((slot) => slot.seed);
  return `Top ${count} qualify. Higher seeds ${extra.length ? `#${[...new Set(extra)].join(", #")}` : ""} receive the extra picks.`;
}

function picksForQualifier(qualifierCount: number, seed: number) {
  return pickemDraftSlots(qualifierCount).filter((slot) => slot.seed === seed).length;
}

function playoffFormatFacts(count: number) {
  const picks = Array.from({ length: count }, (_, index) => picksForQualifier(count, index + 1));
  const unique = [...new Set(picks)];
  return {
    qualifiers: count,
    picksLabel: unique.length === 1 ? `${unique[0]} each` : `${Math.max(...picks)} for top seeds, ${Math.min(...picks)} for the rest`,
  };
}

function CustomPickDistribution({ qualifierCount }: { qualifierCount: number }) {
  return <div className="pickem-pick-distribution" aria-label="Custom playoff pick distribution">
    {Array.from({ length: qualifierCount }, (_, index) => {
      const seed = index + 1;
      const picks = picksForQualifier(qualifierCount, seed);
      return <span key={seed} className={picks > 1 ? "has-extra" : ""}><b>#{seed}</b><em>{picks} pick{picks === 1 ? "" : "s"}</em></span>;
    })}
  </div>;
}

function seedSlotsForParticipant(pool: PickemPool, seed: number) {
  return pickemDraftSlots(pool.settings.playoffQualifierCount).filter((slot) => slot.seed === seed);
}

function PickemSetup({ schedule, onCreate }: { schedule: GeneratedSchedule; onCreate: (pool: PickemPool) => void }) {
  const [step, setStep] = useState(1);
  const [exampleOpen, setExampleOpen] = useState(false);
  const [participants, setParticipants] = useState<PickemParticipant[]>(() => defaultPickemParticipants(schedule.setup.teams));
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(false);
  const [visibility, setVisibility] = useState<PickemVisibility>("after-submit");
  const [playoffsEnabled, setPlayoffsEnabled] = useState(true);
  const [playoffFormat, setPlayoffFormat] = useState<(typeof PLAYOFF_FORMATS)[number]["key"]>("recommended");
  const [qualifierCount, setQualifierCount] = useState(Math.min(7, Math.max(2, schedule.setup.teams.length)));
  const activeCount = participants.filter((participant) => participant.active).length;
  const maxQualifiers = Math.min(14, Math.max(2, activeCount || 2));
  const steps = ["Intro", "Players", "Scoring", "Visibility", "Playoffs", "Format", "Launch"];
  const canLaunch = activeCount >= 2;
  const safeQualifierCount = Math.min(maxQualifiers, Math.max(2, qualifierCount));

  useEffect(() => {
    const selectedFormat = PLAYOFF_FORMATS.find((format) => format.key === playoffFormat);
    if (selectedFormat?.value != null && selectedFormat.value > maxQualifiers) setPlayoffFormat("custom");
    setQualifierCount((current) => Math.min(maxQualifiers, Math.max(2, current)));
  }, [maxQualifiers, playoffFormat]);

  const selectPlayoffFormat = (format: (typeof PLAYOFF_FORMATS)[number]) => {
    setPlayoffFormat(format.key);
    if (format.value) setQualifierCount(Math.min(format.value, maxQualifiers));
  };

  const updateCustomQualifierCount = (change: number) => {
    setPlayoffFormat("custom");
    setQualifierCount((current) => Math.min(maxQualifiers, Math.max(2, current + change)));
  };

  const launch = () => {
    const launchParticipants = participants.map((participant) => ({
      ...participant,
      emailOptIn: emailRemindersEnabled && Boolean(participant.email),
    }));
    const pool = createPickemPool(schedule, launchParticipants.filter((participant) => participant.active).map((participant) => participant.id), qualifierCount);
    pool.participants = launchParticipants;
    pool.settings.visibility = visibility;
    pool.settings.playoffsEnabled = playoffsEnabled;
    pool.settings.playoffQualifierCount = safeQualifierCount;
    onCreate(pool);
  };

  const brand = brandFromSchedule(schedule);

  return <div className="pickem-shell pickem-setup" style={pickemThemeStyle(brand)}>
    <section className="pickem-hero">
      <EntityLogo className="pickem-league-mark" color={schedule.setup.color} logoUrl={schedule.setup.logoUrl} monogram={schedule.setup.initials || schedule.setup.abbreviation || "LW"} entityType="league" imagePresentation="bare" />
      <div>
        <span className="pickem-kicker"><Radio /> Optional side game</span>
        <h2>Launch Pick'em for {schedule.setup.name}</h2>
        <p>Recruit the managers who want in, lock the weekly favorite/underdog board, and give the league a second race that feels made for sharing.</p>
      </div>
      <div className="pickem-preview-card" aria-label="Pick'em visual preview">
        <span>WEEK 1 BOARD</span>
        <strong>Dallas at Philadelphia</strong>
        <div className="pickem-preview-matchup">
          <span><NflTeamColorMark abbr="DAL" /><b>Dallas</b></span>
          <i>at</i>
          <span><NflTeamColorMark abbr="PHI" /><b>Philadelphia</b></span>
        </div>
        <div><b>PHI favorite</b><em>Underdog +1.5</em></div>
        <small>Tuesday snapshot · Picks lock at kickoff</small>
      </div>
    </section>
    <nav className="pickem-stepper" aria-label="Pick'em setup steps">
      {steps.map((label, index) => {
        const targetStep = index + 1;
        const disabled = targetStep === 6 && !playoffsEnabled;
        return <button key={label} type="button" disabled={disabled} className={step === targetStep ? "active" : step > targetStep ? "complete" : ""} onClick={() => setStep(targetStep)}>
          <b>{targetStep}</b><span>{label}</span>
        </button>;
      })}
    </nav>
    <section className="pickem-setup-panel">
      {step === 1 && <div className="pickem-copy-panel"><h3>Pick'em is separate from fantasy standings.</h3><p>It is best launched before Week 1, but the commissioner can start later. Earlier NFL weeks will not be backfilled.</p><div className="pickem-action-row"><button type="button" className="pickem-primary" onClick={() => setStep(2)}>Choose participants</button><button type="button" className="pickem-secondary" onClick={() => setExampleOpen(true)}><Eye />View example</button></div></div>}
      {step === 2 && <div className="pickem-grid-panel">
        <header><h3>Select who is playing</h3><p>V1 uses current league managers only. Add emails if you want LeagueWeaver to send reminders.</p></header>
        <div className="pickem-participant-table" role="table" aria-label="Pick'em participants">
          <div className="pickem-participant-head" role="row"><span>Playing</span><span>Team</span><span>Manager</span><span>Email</span></div>
          {participants.map((participant) => <div key={participant.id} className={participant.active ? "active" : ""} role="row">
            <label className="pickem-participant-selector" aria-label={`${participant.active ? "Remove" : "Add"} ${participant.name} from Pick'em`}>
              <input type="checkbox" checked={participant.active} onChange={(event) => setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, active: event.target.checked } : item))} />
              <span><Check /></span>
            </label>
            <span className="pickem-participant-team"><EntityLogo color={participant.color} logoUrl={participant.logoUrl} monogram={teamInitials({ name: participant.name, city: "" })} /><strong>{participant.name}</strong></span>
            <span className="pickem-participant-manager">{participant.manager}</span>
            <label className="pickem-participant-email"><span>Email</span><input type="email" value={participant.email ?? ""} placeholder="manager@email.com" onChange={(event) => setParticipants((current) => current.map((item) => item.id === participant.id ? { ...item, email: event.target.value } : item))} /></label>
          </div>)}
        </div>
        <label className="pickem-reminder-setting"><input type="checkbox" checked={emailRemindersEnabled} onChange={(event) => setEmailRemindersEnabled(event.target.checked)} /><span><strong>Email reminders for this pool</strong><small>When this is on, reminders go to selected participants who have an email listed.</small></span></label>
        <footer><span>{activeCount} selected</span><button type="button" className="pickem-primary" disabled={activeCount < 2} onClick={() => setStep(3)}>Confirm scoring</button></footer>
      </div>}
      {step === 3 && <div className="pickem-option-grid"><header><h3>Scoring defaults</h3><p>Keep the familiar risk-versus-reward setup.</p></header><article><strong>Correct favorite</strong><b>1 pt</b></article><article><strong>Correct underdog</strong><b>1.5 pts</b></article><article><strong>Wrong or missed</strong><b>0 pts</b></article><article><strong>Late picks</strong><b>Open games only</b></article><button type="button" className="pickem-primary" onClick={() => setStep(4)}>Set visibility</button></div>}
      {step === 4 && <div className="pickem-copy-panel"><h3>Pick visibility</h3><p>Recommended is hidden until the participant submits. It protects the board from copying while still giving everyone the fun reveal moment.</p><div className="pickem-choice-grid pickem-visibility-grid">{VISIBILITY_OPTIONS.map((item) => <button key={item.key} type="button" className={visibility === item.key ? "active" : ""} onClick={() => setVisibility(item.key)}><span><strong>{item.title}{item.badge && <em>{item.badge}</em>}</strong><small>{item.copy}</small></span></button>)}</div><button type="button" className="pickem-primary" onClick={() => setStep(5)}>Choose playoffs</button></div>}
      {step === 5 && <div className="pickem-copy-panel"><h3>Pick'em playoffs</h3><p>Turn on a postseason draft where qualifiers draft the 14 NFL playoff teams in straight order.</p><div className="pickem-binary-grid"><button type="button" className={!playoffsEnabled ? "active" : ""} onClick={() => setPlayoffsEnabled(false)}><span className="pickem-choice-icon"><ShieldCheck /></span><span><strong>Off</strong><small>Regular-season Pick'em standings decide the winner after Week 18.</small></span></button><button type="button" className={playoffsEnabled ? "active" : ""} onClick={() => setPlayoffsEnabled(true)}><span className="pickem-choice-icon"><Trophy /></span><span><strong>On</strong><small>Add the NFL playoff team draft after the regular season.</small></span></button></div><button type="button" className="pickem-primary" onClick={() => setStep(playoffsEnabled ? 6 : 7)}>{playoffsEnabled ? "Choose playoff format" : "Review launch"}</button></div>}
      {step === 6 && <div className="pickem-copy-panel"><h3>Playoff format</h3><p>Select a preset, or choose custom and set exactly how many Pick'em players qualify.</p><div className="pickem-choice-grid pickem-playoff-format-grid">{PLAYOFF_FORMATS.filter((item) => item.value == null || item.value <= maxQualifiers).map((item) => {
        const Icon = item.icon;
        const count = item.value ?? safeQualifierCount;
        const facts = playoffFormatFacts(count);
        const isCustom = item.key === "custom";
        return <article key={item.key} className={`${playoffFormat === item.key ? "active" : ""} ${item.key === "recommended" ? "is-standard" : ""} ${isCustom && playoffFormat === "custom" ? "is-expanded" : ""}`}>
          <button type="button" className="pickem-format-select" onClick={() => selectPlayoffFormat(item)}>
            <span className="pickem-choice-icon"><Icon /></span>
            <span><strong>{item.label}{item.key === "recommended" && <em>Recommended</em>}</strong>{isCustom ? <small>{item.copy}</small> : <span className="pickem-format-outline"><i><b>{facts.qualifiers}</b> teams qualify</i><i><b>{facts.picksLabel}</b> playoff picks</i></span>}</span>
          </button>
          {isCustom && playoffFormat === "custom" && <><div className="pickem-counter"><span><strong>Custom qualifiers</strong><small>Choose 2 to {maxQualifiers}. It cannot be more than active Pick'em players.</small></span><div><button type="button" aria-label="Decrease playoff qualifiers" onClick={() => updateCustomQualifierCount(-1)} disabled={safeQualifierCount <= 2}>-</button><b>{safeQualifierCount}</b><button type="button" aria-label="Increase playoff qualifiers" onClick={() => updateCustomQualifierCount(1)} disabled={safeQualifierCount >= maxQualifiers}>+</button></div></div><CustomPickDistribution qualifierCount={safeQualifierCount} /></>}
        </article>;
      })}</div><p className="pickem-muted">{setupPlayoffCopy(safeQualifierCount)}</p><button type="button" className="pickem-primary" onClick={() => setStep(7)}>Review launch</button></div>}
      {step === 7 && <div className="pickem-launch-panel"><h3>Ready to launch</h3><p>{activeCount} participants · {VISIBILITY_LABELS[visibility]} · {emailRemindersEnabled ? "Email reminders on" : "Email reminders off"} · {playoffsEnabled ? setupPlayoffCopy(safeQualifierCount) : "Regular season decides the winner."}</p><button type="button" className="pickem-primary" disabled={!canLaunch} onClick={launch}><Sparkles />Launch Pick'em</button></div>}
    </section>
    {exampleOpen && <PickemExampleModal onClose={() => setExampleOpen(false)} />}
  </div>;
}

function PickemExampleModal({ onClose }: { onClose: () => void }) {
  return <div className="pickem-example-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="pickem-example-modal" role="dialog" aria-modal="true" aria-labelledby="pickem-example-title">
      <button type="button" className="pickem-example-close" aria-label="Close Pick'em example" onClick={onClose}><X /></button>
      <header>
        <span className="pickem-kicker"><PickemMark /> Example week</span>
        <h3 id="pickem-example-title">What players will see</h3>
        <p>A share link opens a clean pick board. Players claim their team, make picks for games that have not kicked off, then see the reveal rules your commissioner chose.</p>
      </header>
      <div className="pickem-example-layout">
        <article className="pickem-example-phone">
          <div className="pickem-example-phone-head">
            <span>WEEK 1</span>
            <b>3 of 10 submitted</b>
          </div>
          <div className="pickem-example-claim">
            <small>Claiming team</small>
            <strong>Kings</strong>
            <span>Riley M.</span>
          </div>
          {[
            { away: "DAL", home: "PHI", favorite: "PHI -2.5", pick: "PHI", reward: "Favorite" },
            { away: "BAL", home: "BUF", favorite: "BUF -1.5", pick: "BAL", reward: "Underdog 1.5x" },
          ].map((game) => <div key={`${game.away}-${game.home}`} className="pickem-example-game">
            <div><b>{game.away}</b><b>{game.home}</b></div>
            <small>{game.favorite}</small>
            <strong>{game.pick}</strong>
            <em>{game.reward}</em>
          </div>)}
          <button type="button">Submit picks</button>
        </article>
        <aside className="pickem-example-notes">
          <div><strong>Invite-only</strong><span>Only people with their team link can claim and submit.</span></div>
          <div><strong>No double claims</strong><span>Once a team is claimed, it will not be suggested to another person.</span></div>
          <div><strong>Late games</strong><span>Games already kicked off are marked missed and count as losses.</span></div>
          <div><strong>Share-ready</strong><span>Exports use the darker Pick'em board style for social posts.</span></div>
        </aside>
      </div>
    </section>
  </div>;
}

function PickemBoard({ pool, onSubmit, readonly = false }: { pool: PickemPool; onSubmit?: (participantId: string, picks: PickemPick[]) => void; readonly?: boolean }) {
  const active = pool.participants.filter((participant) => participant.active);
  const [participantId, setParticipantId] = useState(active[0]?.id ?? "");
  const [choices, setChoices] = useState<Record<string, "away" | "home">>({});
  const participantPicks = pool.picks.filter((pick) => pick.participantId === participantId);
  const alreadySubmitted = participantPicks.length > 0;
  const canSubmit = !readonly && participantId && !alreadySubmitted;

  const submit = () => {
    if (!participantId || !onSubmit) return;
    const now = new Date().toISOString();
    const picks = pool.games.map((game) => ({
      participantId,
      gameId: game.id,
      choice: isPickemGameLocked(game) ? "missed" as const : choices[game.id] ?? "missed" as const,
      submittedAt: now,
    }));
    onSubmit(participantId, picks);
  };

  return <div className="pickem-board">
    <div className="pickem-board-head">
      <span><strong>Weekly pick board</strong><small>Submit once. Locked games count as missed losses.</small></span>
      <select value={participantId} onChange={(event) => setParticipantId(event.target.value)} disabled={readonly || alreadySubmitted}>
        {active.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}
      </select>
    </div>
    {alreadySubmitted && <div className="pickem-lock-note"><LockKeyhole /><span>Picks are locked for this participant. Commissioner reset is available only before any selected game locks.</span></div>}
    <div className="pickem-game-grid">
      {pool.games.map((game) => {
        const locked = isPickemGameLocked(game);
        const existing = participantPicks.find((pick) => pick.gameId === game.id);
        const current = existing?.choice ?? choices[game.id];
        return <article key={game.id} className={`pickem-game-card ${locked ? "is-locked" : ""}`}>
          <header><span>{formatKickoff(game.kickoffAt)}</span><b>{locked ? game.status === "final" ? "Final" : "Locked" : "Open"}</b></header>
          <div className="pickem-team-picks">
            {(["away", "home"] as const).map((side) => {
              const isFavorite = game.favorite === side;
              const team = nflTeamMeta(side === "away" ? game.away : game.home);
              return <button key={side} type="button" disabled={!canSubmit || locked} className={current === side ? "active" : ""} style={{ "--nfl-color": team.color, "--nfl-secondary": team.secondary, "--nfl-ink": readableTextColor(team.color) } as CSSProperties} onClick={() => setChoices((value) => ({ ...value, [game.id]: side }))}>
                <span className="pickem-nfl-abbr">{team.abbr}</span>
                <strong>{team.fullName}</strong>
                <small>{isFavorite ? `Favorite -${game.spread}` : `Underdog +${game.spread}`}</small>
                {!isFavorite && <em>1.5x</em>}
              </button>;
            })}
          </div>
          {existing && <footer><Check />{pickemChoiceLabel(game, existing.choice)}</footer>}
        </article>;
      })}
    </div>
    {!readonly && <button type="button" className="pickem-submit-bar" disabled={!canSubmit} onClick={submit}><ClipboardCheck />{alreadySubmitted ? "Picks submitted" : "Submit weekly picks"}</button>}
  </div>;
}

function StandingsTable({ pool }: { pool: PickemPool }) {
  const standings = calculatePickemStandings(pool);
  return <div className="pickem-standings-table">
    {standings.map((row, index) => <article key={row.participant.id}>
      <b>{index + 1}</b>
      <EntityLogo className="pickem-player-logo" color={row.participant.color} logoUrl={row.participant.logoUrl} monogram={teamInitials({ name: row.participant.name, city: "" })} />
      <span><strong>{row.participant.name}</strong><small>{row.wins}-{row.losses} · {row.underdogWins} UD · {row.missed} missed</small></span>
      <em>{row.score.toFixed(1)}</em>
    </article>)}
  </div>;
}

function PickemGameOverride({ game, onSave }: { game: PickemGame; onSave: (game: PickemGame, update: { favorite?: "away" | "home"; spread?: number; winner?: "away" | "home"; status?: "open" | "locked" | "final" }) => void }) {
  const [spread, setSpread] = useState(String(game.spread));
  return <div className="pickem-result-actions">
    <button type="button" onClick={() => onSave(game, { favorite: "away", spread: Number(spread) || 0 })}>Fav {nflTeamName(game.away, "abbr")}</button>
    <button type="button" onClick={() => onSave(game, { favorite: "home", spread: Number(spread) || 0 })}>Fav {nflTeamName(game.home, "abbr")}</button>
    <label><span>Spread</span><input value={spread} inputMode="decimal" onChange={(event) => setSpread(event.target.value)} onBlur={() => onSave(game, { spread: Number(spread) || 0 })} /></label>
    <button type="button" onClick={() => onSave(game, { winner: "away", status: "final" })}>{nflTeamName(game.away, "abbr")} won</button>
    <button type="button" onClick={() => onSave(game, { winner: "home", status: "final" })}>{nflTeamName(game.home, "abbr")} won</button>
  </div>;
}

function PickemPlayoffDraft({ pool, onChange, onNotice, onReload }: { pool: PickemPool; onChange: (pool: PickemPool) => void; onNotice?: (message: string) => void; onReload?: () => Promise<void> }) {
  const standings = calculatePickemStandings(pool);
  const draft = buildPickemPlayoffDraft(pool);
  const draftedTeams = new Set(draft.map((pick) => pick.nflTeamAbbr).filter(Boolean));
  const updateDraft = async (pickNumber: number, nflTeamAbbr?: string, isSuperBowlWinner?: boolean) => {
    const nextDraft = draft.map((pick) => pick.pick === pickNumber ? { ...pick, nflTeamAbbr: nflTeamAbbr || undefined, isSuperBowlWinner: isSuperBowlWinner ?? pick.isSuperBowlWinner } : pick);
    onChange({ ...pool, playoffDraft: nextDraft });
    const response = await fetch("/api/pickem/playoff-draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id, picks: nextDraft }),
    });
    const payload = await response.json().catch(() => null) as { error?: string; saved?: number } | null;
    if (!response.ok) {
      onNotice?.(payload?.error ?? "Playoff draft could not be saved.");
      return;
    }
    onNotice?.("Playoff draft saved.");
    await onReload?.();
  };

  if (!pool.settings.playoffsEnabled) return <section className="pickem-panel"><h3>Pick'em playoffs are off</h3><p>Regular-season standings decide the winner after NFL Week 18.</p></section>;
  return <section className="pickem-panel">
    <h3>Playoff draft</h3>
    <p>{setupPlayoffCopy(pool.settings.playoffQualifierCount)} Straight draft order repeats until all 14 NFL playoff teams are picked.</p>
    <div className="pickem-playoff-qualifiers">{standings.slice(0, pool.settings.playoffQualifierCount).map((row, index) => <span key={row.participant.id}><b>{index + 1}</b><strong>{row.participant.name}</strong><small>{row.score.toFixed(1)} pts</small></span>)}</div>
    <div className="pickem-draft-board is-editable">{draft.map((slot) => {
      const participant = standings[slot.seed - 1]?.participant;
      const usedByOther = new Set([...draftedTeams].filter((team) => team !== slot.nflTeamAbbr));
      return <article key={slot.pick}>
        <header><b>{slot.pick}</b><span>Round {slot.round} · Seed {slot.seed}</span></header>
        <strong>{participant?.name ?? `Seed ${slot.seed}`}</strong>
        <select value={slot.nflTeamAbbr ?? ""} onChange={(event) => void updateDraft(slot.pick, event.target.value || undefined)}>
          <option value="">Pick NFL team</option>
          {NFL_PLAYOFF_TEAM_OPTIONS.map((team) => <option key={team} value={team} disabled={usedByOther.has(team)}>{team}</option>)}
        </select>
        <button type="button" className={slot.isSuperBowlWinner ? "active" : ""} disabled={!slot.nflTeamAbbr} onClick={() => void updateDraft(slot.pick, slot.nflTeamAbbr, !slot.isSuperBowlWinner)}>{slot.isSuperBowlWinner ? "Super Bowl winner" : "Mark winner"}</button>
      </article>;
    })}</div>
  </section>;
}

function downloadPickemExport(pool: PickemPool, label: string) {
  const standings = calculatePickemStandings(pool);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = label.includes("Story") ? 1920 : 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#07100d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#16bf6f";
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillStyle = "#f4f8f6";
  ctx.font = "900 76px Arial";
  ctx.fillText(pool.name.toUpperCase(), 60, 120);
  ctx.fillStyle = "#f0c84b";
  ctx.font = "700 42px Arial";
  ctx.fillText(label.toUpperCase(), 60, 178);
  ctx.fillStyle = "#17211d";
  ctx.fillRect(60, 230, 960, canvas.height - 310);
  standings.slice(0, 10).forEach((row, index) => {
    const y = 310 + index * 72;
    ctx.fillStyle = index < 3 ? "#203229" : "#1b2722";
    ctx.fillRect(90, y - 44, 900, 58);
    ctx.fillStyle = "#f0c84b";
    ctx.font = "900 38px Arial";
    ctx.fillText(`#${index + 1}`, 120, y);
    ctx.fillStyle = "#f4f8f6";
    ctx.fillText(row.participant.name.slice(0, 22), 220, y);
    ctx.fillStyle = "#16bf6f";
    ctx.fillText(row.score.toFixed(1), 840, y);
  });
  const link = document.createElement("a");
  link.download = `${pool.publicSlug}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function PickemActive({ brand, pool, onChange, onNotice, onReload }: { brand: PickemBrandContext; pool: PickemPool; onChange: (pool: PickemPool) => void; onNotice?: (message: string) => void; onReload?: () => Promise<void> }) {
  const [tab, setTab] = useState<PickemTab>("this-week");
  const standings = calculatePickemStandings(pool);
  const submitted = new Set(pool.picks.map((pick) => pick.participantId));
  const activeParticipants = pool.participants.filter((participant) => participant.active);
  const incomplete = activeParticipants.filter((participant) => !submitted.has(participant.id));
  const publicUrl = typeof window === "undefined" ? `/pickem/join/${pool.publicSlug}` : pickemPoolUrl(window.location.origin, pool.publicSlug);
  const baseUrl = typeof window === "undefined" ? "https://leagueweaver.com" : window.location.origin;

  const submitPicks = (_participantId: string, picks: PickemPick[]) => onChange({ ...pool, picks: [...pool.picks, ...picks] });
  const copyText = (text: string, message: string) => {
    navigator.clipboard?.writeText(text);
    onNotice?.(message);
  };
  const sendReminder = () => {
    void fetch("/api/pickem/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id, week: pool.currentWeek, type: "manual-incomplete", channel: "email" }),
    }).then(async (response) => {
      const payload = await response.json().catch(() => null) as { sent?: number; message?: string; error?: string } | null;
      onNotice?.(response.ok ? payload?.message ?? `Email reminder sent to ${payload?.sent ?? 0} participant${payload?.sent === 1 ? "" : "s"}.` : payload?.error ?? "Reminder could not be sent.");
    });
    const log = { id: `${Date.now()}`, week: pool.currentWeek, sentAt: new Date().toISOString(), channel: "email" as const, count: incomplete.length };
    onChange({ ...pool, reminderLog: [log, ...pool.reminderLog] });
  };
  const sendInvites = () => {
    const unclaimed = activeParticipants.filter((participant) => !participant.claimedAt);
    onNotice?.(unclaimed.length ? `Invite links queued for ${unclaimed.length} unclaimed team${unclaimed.length === 1 ? "" : "s"}.` : "Every active Pick'em team has already been claimed.");
  };
  const refreshGames = async () => {
    const response = await fetch("/api/pickem/odds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id, seasonYear: pool.seasonYear, week: pool.currentWeek, snapshotType: "manual" }),
    });
    const payload = await response.json().catch(() => null) as { gamesSaved?: number; snapshotsSaved?: number; pickemGamesSaved?: number; error?: string } | null;
    if (!response.ok) {
      onNotice?.(payload?.error ?? "Odds could not be refreshed.");
      return;
    }
    onNotice?.(`Odds refreshed: ${payload?.pickemGamesSaved ?? 0} Pick'em games updated.`);
    await onReload?.();
  };
  const overrideGame = async (game: PickemGame, update: { favorite?: "away" | "home"; spread?: number; winner?: "away" | "home"; status?: "open" | "locked" | "final" }) => {
    const response = await fetch("/api/pickem/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolId: pool.id, gameId: game.id, ...update }),
    });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      onNotice?.(payload?.error ?? "Game override could not be saved.");
      return;
    }
    onNotice?.("Game result override saved.");
    await onReload?.();
  };

  return <div className="pickem-shell" style={pickemThemeStyle(brand)}>
    <section className="pickem-status-strip">
      <EntityLogo className="pickem-league-mark" color={brand.color} logoUrl={brand.logoUrl} monogram={brand.initials || brand.abbreviation || "LW"} entityType="league" imagePresentation="bare" />
      <div><span className="pickem-kicker"><Radio /> Pick'em Week {pool.currentWeek}</span><h2>{pool.name}</h2><p>Tuesday snapshot board · {submitted.size}/{activeParticipants.length} submitted · {incomplete.length} incomplete</p></div>
      <div className="pickem-status-actions"><button type="button" onClick={sendInvites}><Mail />Send invite links</button><button type="button" onClick={sendReminder}><Bell />Send reminder</button><button type="button" onClick={() => void refreshGames()}><RefreshCw />Refresh odds</button></div>
    </section>
    <nav className="pickem-tabs" aria-label="Pick'em views">{TABS.map((item) => <button key={item.key} type="button" className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
    {tab === "this-week" && <div className="pickem-dashboard-grid"><PickemBoard pool={pool} onSubmit={submitPicks} /><aside><section className="pickem-side-panel"><h3>Top standings</h3><StandingsTable pool={pool} /></section><section className="pickem-side-panel"><h3>Completion</h3>{activeParticipants.map((participant) => <span className="pickem-completion-row" key={participant.id}><EntityLogo className="pickem-player-logo" color={participant.color} logoUrl={participant.logoUrl} monogram={teamInitials({ name: participant.name, city: "" })} />{participant.name}<em>{submitted.has(participant.id) ? "Submitted" : "Missing"}</em></span>)}</section></aside></div>}
    {tab === "picks" && <PickemBoard pool={pool} onSubmit={submitPicks} />}
    {tab === "everyone" && <div className="pickem-everyone"><h3>Everyone's picks</h3><p>{VISIBILITY_LABELS[pool.settings.visibility]} is active. Submitted picks are shown here after the viewer is allowed to see them.</p>{activeParticipants.map((participant) => <article key={participant.id}><strong>{participant.name}</strong><span>{pool.games.map((game) => <em key={game.id}>{pickemChoiceLabel(game, pool.picks.find((pick) => pick.participantId === participant.id && pick.gameId === game.id)?.choice ?? "missed")}</em>)}</span></article>)}</div>}
    {tab === "standings" && <section className="pickem-panel"><h3>Pick'em standings</h3><StandingsTable pool={pool} /></section>}
    {tab === "results" && <section className="pickem-results-grid">{pool.games.map((game) => <article key={game.id}><strong>{nflTeamName(game.away)} at {nflTeamName(game.home)}</strong><span>{game.status}{game.finalWinner ? ` · ${nflTeamName(game.finalWinner === "away" ? game.away : game.home)} won` : ""}</span><small>Favorite: {nflTeamName(game.favorite === "away" ? game.away : game.home)} -{game.spread}</small><PickemGameOverride game={game} onSave={(target, update) => void overrideGame(target, update)} /></article>)}</section>}
    {tab === "stats" && <section className="pickem-stat-grid">{standings.map((row) => <article key={row.participant.id}><strong>{row.participant.name}</strong><b>{row.score.toFixed(1)}</b><small>{row.favoriteWins} favorite wins · {row.underdogWins} underdog wins · {(row.winPct * 100).toFixed(0)}%</small></article>)}</section>}
    {tab === "playoffs" && <PickemPlayoffDraft pool={pool} onChange={onChange} onNotice={onNotice} onReload={onReload} />}
    {tab === "exports" && <section className="pickem-export-grid">{["Weekly picks square", "Weekly results square", "Standings square", "Playoff draft story"].map((label) => <article key={label}><FileImage /><strong>{label}</strong><small>Instagram-friendly LeagueWeaver PNG using safe team abbreviations.</small><button type="button" onClick={() => downloadPickemExport(pool, label)}>Download PNG</button></article>)}</section>}
    {tab === "settings" && <section className="pickem-panel"><h3>Settings</h3><label className="pickem-setting-row"><span>Pick visibility</span><select value={VISIBILITY_OPTIONS.some((item) => item.key === pool.settings.visibility) ? pool.settings.visibility : "after-submit"} onChange={(event) => onChange({ ...pool, settings: { ...pool.settings, visibility: event.target.value as PickemVisibility } })}>{VISIBILITY_OPTIONS.map((item) => <option key={item.key} value={item.key}>{VISIBILITY_LABELS[item.key]}</option>)}</select></label><label className="pickem-setting-row"><span>Playoff qualifiers</span><input type="number" min={2} max={Math.min(14, activeParticipants.length)} value={pool.settings.playoffQualifierCount} onChange={(event) => onChange({ ...pool, settings: { ...pool.settings, playoffQualifierCount: Math.min(14, Math.max(2, Number(event.target.value) || 2)) } })} /></label><div className="pickem-share-box"><Copy /><input readOnly value={publicUrl} onFocus={(event) => event.currentTarget.select()} /><button type="button" onClick={() => copyText(publicUrl, "Pick'em link copied.")}>Copy pool link</button></div><div className="pickem-invite-panel"><header><strong>Team claim links</strong><small>Each invited manager chooses their league team first, then makes picks from that team. Claimed teams are removed from the available choices so nobody can double-pick the same league team.</small></header>{activeParticipants.map((participant) => {
      const inviteUrl = pickemPoolParticipantUrl(baseUrl, pool.publicSlug, participant);
      return <article key={participant.id}><EntityLogo className="pickem-player-logo" color={participant.color} logoUrl={participant.logoUrl} monogram={teamInitials({ name: participant.name, city: "" })} /><div><strong>{participant.name}</strong><small>{participant.claimedAt ? `Claimed by ${participant.claimedByName || participant.manager}` : "Available to claim"}</small></div><button type="button" onClick={() => copyText(inviteUrl, `${participant.name} invite copied.`)}><Copy />Copy invite</button></article>;
    })}</div></section>}
  </div>;
}

export function PickemPoolWorkspace({ pool, brand, onChange, onNotice, onReload }: PickemPoolWorkspaceProps) {
  const resolvedBrand = brand ?? brandFromPool(pool);
  const save = (next: PickemPool) => {
    saveLocalPool(next);
    onChange?.(next);
  };
  return <PickemActive brand={resolvedBrand} pool={pool} onChange={save} onNotice={onNotice} onReload={onReload} />;
}

export function PickemWorkspace({ schedule, signedIn, onNotice }: PickemWorkspaceProps) {
  const [pool, setPool] = useState<PickemPool | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadPool = async () => {
    if (signedIn) {
      const response = await fetch(`/api/pickem/pools?scheduleId=${encodeURIComponent(schedule.id)}`);
      const payload = await response.json().catch(() => null) as { pool?: PickemPool | null; error?: string } | null;
      if (response.ok && payload?.pool) {
        setPool(payload.pool);
        saveLocalPool(payload.pool);
        setLoaded(true);
        return;
      }
      if (!response.ok) onNotice?.(payload?.error ?? "Pick'em could not be loaded.");
    }
    setPool(loadLocalPool(schedule.id));
    setLoaded(true);
  };

  useEffect(() => {
    setLoaded(false);
    void loadPool();
  }, [schedule.id, signedIn]);

  const save = (next: PickemPool) => {
    setPool(next);
    saveLocalPool(next);
  };

  const create = async (next: PickemPool) => {
    if (!signedIn) {
      save(next);
      onNotice?.("Pick'em launched on this device. Sign in and save the season before sharing publicly.");
      return;
    }
    const response = await fetch("/api/pickem/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleId: schedule.id,
        name: next.name,
        settings: next.settings,
        participants: next.participants,
      }),
    });
    const payload = await response.json().catch(() => null) as { pool?: PickemPool; error?: string } | null;
    if (!response.ok || !payload?.pool) {
      onNotice?.(payload?.error ?? "Pick'em could not be launched.");
      return;
    }
    save(payload.pool);
    onNotice?.("Pick'em launched and saved to the cloud.");
  };

  if (!loaded) return <div className="pickem-shell"><section className="pickem-panel">Loading Pick'em...</section></div>;
  if (!pool) return <PickemSetup schedule={schedule} onCreate={(next) => { void create(next); }} />;
  return <PickemActive brand={brandFromSchedule(schedule)} pool={pool} onChange={save} onNotice={onNotice} onReload={loadPool} />;
}

export function PickemPreview({ schedule, signedIn, onOpen }: PickemPreviewProps) {
  const [pool, setPool] = useState<PickemPool | null>(null);
  useEffect(() => {
    if (!signedIn) return setPool(loadLocalPool(schedule.id));
    fetch(`/api/pickem/pools?scheduleId=${encodeURIComponent(schedule.id)}`)
      .then((response) => response.json())
      .then((payload: { pool?: PickemPool | null }) => setPool(payload.pool ?? loadLocalPool(schedule.id)))
      .catch(() => setPool(loadLocalPool(schedule.id)));
  }, [schedule.id, signedIn]);
  if (!pool) return <section className="pickem-this-week-card is-empty"><div><span><PickemMark /> Optional side game</span><strong>Pick'em is ready to launch</strong><small>Set up participants, weekly picks, reminders, and the playoff draft.</small></div><button type="button" onClick={onOpen}><Settings />Set up Pick'em</button></section>;
  const standings = calculatePickemStandings(pool);
  const submitted = new Set(pool.picks.map((pick) => pick.participantId)).size;
  return <section className="pickem-this-week-card"><div><span><PickemMark /> Pick'em Week {pool.currentWeek}</span><strong>{submitted}/{pool.participants.filter((participant) => participant.active).length} submitted</strong><small>{signedIn ? "Reminder tools available in Pick'em." : "Sign in before sharing publicly."}</small></div><div className="pickem-mini-podium">{standings.slice(0, 3).map((row, index) => <span key={row.participant.id}><b>{index + 1}</b>{row.participant.name}<em>{row.score.toFixed(1)}</em></span>)}</div><button type="button" onClick={onOpen}>Open Pick'em</button></section>;
}
