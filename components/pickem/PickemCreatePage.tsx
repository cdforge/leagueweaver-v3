"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, ChevronLeft, ChevronRight, FolderHeart, LoaderCircle, LockKeyhole, Plus, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { normalizeSavedLeague } from "@/lib/savedLeagues";
import { defaultPickemSettings } from "@/lib/pickem";
import type { PickemAccessMode, PickemParticipant } from "@/lib/pickem";
import type { SavedLeaguePreset, Team } from "@/lib/types";

type SourceChoice = "blank" | "saved-league" | "fantasy-season";

function token(id: string) {
  return `${id.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "player"}-${Math.random().toString(36).slice(2, 10)}`;
}

function participantFromTeam(team: Team): PickemParticipant {
  return {
    id: team.id,
    teamId: team.id,
    source: "saved-league-team",
    sourceTeamId: team.id,
    name: team.name,
    manager: team.manager || team.name,
    color: team.color,
    logoUrl: team.logoUrl,
    active: true,
    claimToken: token(team.id),
    email: team.managerEmail,
    emailOptIn: Boolean(team.managerEmail),
    smsOptIn: false,
  };
}

function blankParticipants(): PickemParticipant[] {
  return ["Player 1", "Player 2"].map((name, index) => ({
    id: `manual-${index + 1}`,
    teamId: `manual-${index + 1}`,
    source: "manual",
    name,
    manager: name,
    color: "#117a45",
    active: true,
    claimToken: token(name),
    emailOptIn: false,
    smsOptIn: false,
  }));
}

export function PickemCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSource = searchParams.get("source") as SourceChoice | null;
  const requestedSavedLeagueId = searchParams.get("savedLeagueId");
  const requestedScheduleId = searchParams.get("scheduleId");
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceChoice>(requestedScheduleId ? "fantasy-season" : requestedSavedLeagueId ? "saved-league" : requestedSource ?? "blank");
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [savedLeagueId, setSavedLeagueId] = useState(requestedSavedLeagueId ?? "");
  const [name, setName] = useState("LW Pick'ems");
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [brandColor, setBrandColor] = useState("#117a45");
  const [logoUrl, setLogoUrl] = useState("");
  const [accessMode, setAccessMode] = useState<PickemAccessMode>("public");
  const [participants, setParticipants] = useState<PickemParticipant[]>(blankParticipants);
  const [participantNameMode, setParticipantNameMode] = useState<"team" | "manager">("team");
  const [playoffsEnabled, setPlayoffsEnabled] = useState(true);
  const [playoffFormat, setPlayoffFormat] = useState<"standard" | "duel" | "full" | "custom">("standard");
  const [qualifierCount, setQualifierCount] = useState(7);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/saved-leagues")
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { presets?: SavedLeaguePreset[] };
        if (response.ok) setSavedLeagues((payload.presets ?? []).map(normalizeSavedLeague).filter((preset): preset is SavedLeaguePreset => Boolean(preset)));
      })
      .catch(() => undefined);
  }, []);

  const selectedLeague = useMemo(() => savedLeagues.find((preset) => preset.id === savedLeagueId), [savedLeagues, savedLeagueId]);
  const activeCount = participants.filter((participant) => participant.active).length;
  const maxQualifiers = Math.min(14, Math.max(2, activeCount || 2));
  const totalSteps = playoffsEnabled ? 6 : 5;
  const progressLabels = playoffsEnabled ? ["Source", "Details", "Players", "Rules", "Playoffs", "Launch"] : ["Source", "Details", "Players", "Rules", "Launch"];
  const displayParticipants = useMemo(() => participants.map((participant) => {
    if (participantNameMode === "manager" && participant.manager.trim()) return { ...participant, name: participant.manager.trim() };
    return participant;
  }), [participantNameMode, participants]);

  useEffect(() => {
    if (!selectedLeague || source !== "saved-league") return;
    const league = selectedLeague.data.league;
    setName(`${league.name || selectedLeague.name} Pick'ems`);
    setBrandColor(league.color || "#117a45");
    setLogoUrl(league.logoUrl || "");
    setParticipants(selectedLeague.data.teams.map(participantFromTeam));
  }, [selectedLeague, source]);

  useEffect(() => {
    setQualifierCount((current) => Math.min(maxQualifiers, Math.max(2, current)));
  }, [maxQualifiers]);

  useEffect(() => {
    if (playoffFormat === "standard") setQualifierCount(Math.min(7, maxQualifiers));
    if (playoffFormat === "duel") setQualifierCount(2);
    if (playoffFormat === "full") setQualifierCount(Math.min(14, maxQualifiers));
  }, [maxQualifiers, playoffFormat]);

  const chooseSource = (next: SourceChoice) => {
    setSource(next);
    if (next === "blank") {
      setSavedLeagueId("");
      setName("LW Pick'ems");
      setBrandColor("#117a45");
      setLogoUrl("");
      setParticipants(blankParticipants());
    }
    setStep(2);
  };

  const updateParticipant = (id: string, patch: Partial<PickemParticipant>) => {
    setParticipants((current) => current.map((participant) => participant.id === id ? { ...participant, ...patch } : participant));
  };

  const addParticipant = () => {
    const id = `manual-${Date.now()}`;
    setParticipants((current) => [...current, {
      id,
      teamId: id,
      source: "manual",
      name: `Player ${current.length + 1}`,
      manager: "",
      color: brandColor,
      active: true,
      claimToken: token(id),
      emailOptIn: false,
      smsOptIn: false,
    }]);
  };

  const launch = async () => {
    if (activeCount < 2) return setMessage("Choose at least two active players.");
    setBusy(true);
    setMessage(null);
    const settings = defaultPickemSettings(activeCount);
    settings.playoffsEnabled = playoffsEnabled;
    settings.playoffQualifierCount = Math.min(maxQualifiers, qualifierCount);
    const response = await fetch("/api/pickem/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        scheduleId: requestedScheduleId ?? undefined,
        savedLeagueId: source === "saved-league" ? savedLeagueId : undefined,
        name,
        seasonYear,
        brandColor,
        logoUrl: logoUrl || undefined,
        accessMode,
        settings,
        participants: displayParticipants,
      }),
    });
    const payload = await response.json().catch(() => null) as { pool?: { id: string }; error?: string } | null;
    setBusy(false);
    if (!response.ok || !payload?.pool?.id) {
      setMessage(payload?.error ?? "LW Pick'ems could not be launched.");
      return;
    }
    router.push(`/pickem/pool/${payload.pool.id}`);
  };

  return <section className="product-dashboard page-width" aria-labelledby="pickem-create-title">
    <header className="product-dashboard-hero">
      <div>
        <p className="eyebrow">Create LW Pick'ems</p>
        <h1 id="pickem-create-title">Start the pool your way.</h1>
        <p>Use the normal LeagueWeaver setup rhythm: choose a source, confirm players, choose access, then launch the pool.</p>
      </div>
      <Link className="button-secondary" href="/pickem">All Pick'ems</Link>
    </header>

    <div className="pickem-create-progress" aria-label="Create Pick'ems progress">
      {progressLabels.map((label, index) => <span key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""}>{step > index + 1 ? <Check /> : index + 1}{label}</span>)}
    </div>

    {step === 1 && <div className="product-choice-grid">
      <button type="button" className="product-choice-card" onClick={() => chooseSource("blank")}><Plus /><span><strong>Blank Pick'em</strong><small>Add any group of players manually.</small></span></button>
      <button type="button" className="product-choice-card" onClick={() => chooseSource("saved-league")}><FolderHeart /><span><strong>Use saved league</strong><small>Copy team names, emails, avatars, logos, and colors.</small></span></button>
      <button type="button" className="product-choice-card" onClick={() => chooseSource("fantasy-season")}><CalendarDays /><span><strong>Connect fantasy season</strong><small>Keep Pick'ems separate, but relate it to a schedule.</small></span></button>
    </div>}

    {step === 2 && <section className="product-panel pickem-create-form">
      <header><span><strong>Pool details</strong><small>Name, season, access, and league source.</small></span></header>
      <div className="pickem-create-grid">
        {source === "saved-league" && <label><span>Saved league</span><select value={savedLeagueId} onChange={(event) => setSavedLeagueId(event.target.value)}><option value="">Choose saved league</option>{savedLeagues.map((preset) => <option key={preset.id} value={preset.id}>{preset.data.league.name || preset.name}</option>)}</select></label>}
        <label><span>Pick'em name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label><span>NFL season</span><input type="number" value={seasonYear} min={2020} max={2100} onChange={(event) => setSeasonYear(Number(event.target.value) || new Date().getFullYear())} /></label>
        <label><span>Color</span><input type="color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} /></label>
        <label><span>Logo URL optional</span><input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://..." /></label>
      </div>
      <div className="product-access-grid">
        <button type="button" className={accessMode === "public" ? "active" : ""} onClick={() => setAccessMode("public")}><UsersRound /><strong>Public</strong><p>Invite link lets players claim a slot and submit without an account.</p></button>
        <button type="button" className={accessMode === "private" ? "active" : ""} onClick={() => setAccessMode("private")}><LockKeyhole /><strong>Private</strong><p>Invite link works, but players must sign in before playing.</p></button>
      </div>
    </section>}

    {step === 3 && <section className="product-panel pickem-create-form">
      <header><span><strong>Players</strong><small>{activeCount} active players. Imported names can be edited for this pool.</small></span><button type="button" className="button-secondary" onClick={addParticipant}><Plus />Add player</button></header>
      <div className="pickem-name-mode">
        <span><strong>Display players as</strong><small>This controls the names shown on Pick'em standings, invite links, and exports.</small></span>
        <div>
          <button type="button" className={participantNameMode === "team" ? "active" : ""} onClick={() => setParticipantNameMode("team")}>Team names</button>
          <button type="button" className={participantNameMode === "manager" ? "active" : ""} onClick={() => setParticipantNameMode("manager")}>Manager names</button>
        </div>
      </div>
      <div className="pickem-participant-table">
        {participants.map((participant) => <article key={participant.id}>
          <button type="button" className={participant.active ? "pickem-check active" : "pickem-check"} aria-label={`${participant.active ? "Remove" : "Add"} ${participant.name}`} onClick={() => updateParticipant(participant.id, { active: !participant.active })}>{participant.active && <Check />}</button>
          <EntityLogo size={36} color={participant.color} logoUrl={participant.logoUrl} monogram={resolveInitials(undefined, leagueAcronym(participant.name))} entityType="team" />
          <input value={participant.name} onChange={(event) => updateParticipant(participant.id, { name: event.target.value })} aria-label="Player or team name" />
          <input value={participant.manager} onChange={(event) => updateParticipant(participant.id, { manager: event.target.value })} aria-label="Manager name" placeholder="manager name" />
          <input value={participant.email ?? ""} onChange={(event) => updateParticipant(participant.id, { email: event.target.value, emailOptIn: Boolean(event.target.value) })} aria-label="Email" placeholder="email optional" />
        </article>)}
      </div>
    </section>}

    {step === 4 && <section className="product-panel pickem-create-form">
      <header><span><strong>Rules</strong><small>Weekly scoring stays simple: pick the winner, get rewarded more for correct underdogs.</small></span></header>
      <div className="pickem-rule-grid">
        <article><strong>Favorite win</strong><span>1 point</span></article>
        <article><strong>Underdog win</strong><span>1.5 points</span></article>
        <article><strong>Wrong or missed</strong><span>0 points</span></article>
      </div>
      <div className="pickem-info-callout"><ShieldCheck /><span><strong>Late picks are allowed only for games that have not kicked off.</strong><small>If a player submits after a game starts, that game is recorded as missed. Kicked-off games can never be changed.</small></span></div>
    </section>}

    {step === 5 && <section className="product-panel pickem-create-form">
      <header><span><strong>Pick'em playoffs</strong><small>This is optional. It adds a second finish after the regular-season Pick'em standings.</small></span></header>
      <div className="pickem-playoff-explainer">
        <Trophy />
        <span>
          <strong>How Pick'em playoffs work</strong>
          <small>After NFL Week 18, the top Pick'em players qualify for a draft. They draft real NFL playoff teams in regular draft order, not snake order. Whoever drafted the Super Bowl winner wins the Pick'em playoff title.</small>
        </span>
      </div>
      <div className="product-access-grid">
        <button type="button" className={!playoffsEnabled ? "active" : ""} onClick={() => setPlayoffsEnabled(false)}><ShieldCheck /><strong>Playoffs off</strong><p>Regular-season standings decide the winner after Week 18.</p></button>
        <button type="button" className={playoffsEnabled ? "active" : ""} onClick={() => setPlayoffsEnabled(true)}><UsersRound /><strong>Playoffs on</strong><p>Top players draft NFL playoff teams after Week 18.</p></button>
      </div>
    </section>}

    {step === 6 && playoffsEnabled && <section className="product-panel pickem-create-form">
      <header><span><strong>Playoff format</strong><small>Choose how many Pick'em players qualify and how many NFL playoff teams each gets.</small></span></header>
      <div className="pickem-format-grid">
        {[
          { key: "standard" as const, title: "Standard", chip: "Recommended", count: Math.min(7, maxQualifiers), copy: "Top 7 qualify. Each drafts 2 NFL playoff teams when 7 is available." },
          { key: "duel" as const, title: "Duel", count: 2, copy: "Top 2 qualify. Each drafts 7 NFL playoff teams." },
          ...(maxQualifiers >= 14 ? [{ key: "full" as const, title: "Full field", count: 14, copy: "Top 14 qualify. Each drafts 1 NFL playoff team." }] : []),
          { key: "custom" as const, title: "Custom", count: qualifierCount, copy: "Choose the qualifier count. Higher seeds get extra picks if the split is uneven." },
        ].map((format) => <button type="button" key={format.key} className={playoffFormat === format.key ? "active" : ""} onClick={() => setPlayoffFormat(format.key)}>
          <span><strong>{format.title}</strong>{format.chip && <em>{format.chip}</em>}</span>
          <b>{format.count}</b>
          <small>{format.copy}</small>
        </button>)}
      </div>
      {playoffFormat === "custom" && <label className="pickem-counter"><span>Playoff qualifiers</span><button type="button" onClick={() => setQualifierCount((value) => Math.max(2, value - 1))}>-</button><strong>{Math.min(maxQualifiers, qualifierCount)}</strong><button type="button" onClick={() => setQualifierCount((value) => Math.min(maxQualifiers, value + 1))}>+</button><small>Max {maxQualifiers} based on active players. Draft keeps looping seed 1 to final seed until all 14 NFL playoff teams are picked.</small></label>}
    </section>}

    {step === totalSteps && <section className="product-panel pickem-create-form">
      <header><span><strong>Launch</strong><small>Review the setup, then open the Pick'em workspace.</small></span></header>
      <div className="pickem-launch-summary">
        <EntityLogo size={52} color={brandColor} logoUrl={logoUrl || undefined} monogram={resolveInitials(undefined, leagueAcronym(name))} entityType="league" />
        <span><strong>{name}</strong><small>{seasonYear} season · {activeCount} players · {participantNameMode === "manager" ? "Manager names" : "Team names"} · {accessMode === "public" ? "Public invite links" : "Private account-required links"}</small><small>{playoffsEnabled ? `Playoffs on · ${Math.min(maxQualifiers, qualifierCount)} qualifiers` : "Playoffs off"}</small></span>
      </div>
      {message && <div className="product-message" role="alert">{message}</div>}
    </section>}

    <footer className="pickem-create-actions">
      <button type="button" className="button-secondary" disabled={step === 1 || busy} onClick={() => setStep((value) => Math.max(1, value - 1))}><ChevronLeft />Back</button>
      {step < totalSteps ? <button type="button" className="button-primary" disabled={(step === 2 && source === "saved-league" && !savedLeagueId) || busy} onClick={() => setStep((value) => Math.min(totalSteps, value + 1))}>Next<ChevronRight /></button>
        : <button type="button" className="button-primary" disabled={busy || activeCount < 2} onClick={() => void launch()}>{busy ? <LoaderCircle className="spin" /> : <ShieldCheck />}Launch Pick'ems</button>}
    </footer>
  </section>;
}
