"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Check, ClipboardCheck, LockKeyhole } from "lucide-react";
import { readableTextColor } from "@/lib/colorContrast";
import { nflTeamMeta } from "@/lib/pickem";

type PublicParticipant = {
  teamId: string;
  name: string;
  color: string;
  claimed: boolean;
};

type PublicGame = {
  id: string;
  kickoffAt: string;
  away: string;
  home: string;
  favorite: "away" | "home";
  spread: number;
  status: "open" | "locked" | "final";
};

type PublicPickemClientProps = {
  slug: string;
  accessMode: "public" | "private";
  invitedTeamId?: string;
  claimToken?: string;
  participants: PublicParticipant[];
  games: PublicGame[];
};

function isLocked(game: PublicGame) {
  return game.status !== "open" || new Date(game.kickoffAt).getTime() <= Date.now();
}

function formatKickoff(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Kickoff TBD";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date);
}

export function PublicPickemClient({ slug, accessMode, invitedTeamId, claimToken, participants, games }: PublicPickemClientProps) {
  const [teamId, setTeamId] = useState(invitedTeamId ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [choices, setChoices] = useState<Record<string, "away" | "home">>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected = useMemo(() => participants.find((participant) => participant.teamId === teamId), [participants, teamId]);
  const available = participants.filter((participant) => !participant.claimed || participant.teamId === invitedTeamId);
  const ready = Boolean(teamId && claimToken && name.trim() && games.length);
  const privateLocked = accessMode === "private";

  const submit = async () => {
    if (!ready || privateLocked) return;
    setSubmitting(true);
    setMessage(null);
    const response = await fetch("/api/pickem/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        teamId,
        claimToken,
        name,
        email: email || undefined,
        picks: Object.entries(choices).map(([gameId, choice]) => ({ gameId, choice })),
      }),
    });
    const payload = await response.json().catch(() => null) as { error?: string; submitted?: number } | null;
    setSubmitting(false);
    if (!response.ok) {
      setMessage(payload?.error ?? "Picks could not be submitted.");
      return;
    }
    setMessage(`Picks submitted. ${payload?.submitted ?? games.length} games recorded.`);
  };

  return <section className="public-pickem-live">
    {privateLocked && <div className="public-pickem-private" role="status">
      <LockKeyhole />
      <span><strong>Private Pick'em</strong><small>Sign in to LeagueWeaver to claim this invite and make picks.</small></span>
      <a href={`/account?next=${encodeURIComponent(`/pickem/join/${slug}`)}`}>Sign in</a>
    </div>}
    <div className="public-pickem-claim">
      <header><strong>Claim your team</strong><small>{available.length} available</small></header>
      <div className="public-pickem-field-grid">
        <label><span>League team</span><select value={teamId} disabled={privateLocked || Boolean(invitedTeamId)} onChange={(event) => setTeamId(event.target.value)}><option value="">Choose team</option>{available.map((participant) => <option key={participant.teamId} value={participant.teamId}>{participant.name}</option>)}</select></label>
        <label><span>Your name</span><input value={name} disabled={privateLocked} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
        <label><span>Email optional</span><input type="email" value={email} disabled={privateLocked} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" /></label>
      </div>
      <p>{selected?.claimed && selected.teamId !== invitedTeamId ? "That team has already been claimed." : "If you have this private invite link, you can submit picks for this team."}</p>
    </div>
    <div className="public-pickem-board" id="picks">
      <header><strong>This week's picks</strong><small>Locked games become missed losses.</small></header>
      <div className="public-pickem-game-grid">{games.length ? games.map((game) => {
        const locked = isLocked(game);
        const current = choices[game.id];
        return <article key={game.id} className={locked ? "is-locked" : ""}>
          <header><span>{formatKickoff(game.kickoffAt)}</span><b>{locked ? <><LockKeyhole /> Locked</> : "Open"}</b></header>
          <div>
            {(["away", "home"] as const).map((side) => {
              const isFavorite = game.favorite === side;
              const team = nflTeamMeta(side === "away" ? game.away : game.home);
              return <button key={side} type="button" disabled={privateLocked || locked || Boolean(message?.startsWith("Picks submitted"))} className={current === side ? "active" : ""} style={{ "--nfl-color": team.color, "--nfl-secondary": team.secondary, "--nfl-ink": readableTextColor(team.color) } as CSSProperties} onClick={() => setChoices((value) => ({ ...value, [game.id]: side }))}>
                <span className="pickem-nfl-abbr">{team.abbr}</span>
                <strong>{team.fullName}</strong>
                <small>{isFavorite ? `Favorite -${game.spread}` : `Underdog +${game.spread}`}</small>
              </button>;
            })}
          </div>
        </article>;
      }) : <div className="public-pickem-empty-board"><b>Board not published</b><span>The commissioner needs to refresh/publish this week's odds first.</span></div>}</div>
    </div>
    <button type="button" className="public-pickem-submit" disabled={privateLocked || !ready || submitting || Boolean(message?.startsWith("Picks submitted"))} onClick={submit}>
      {message?.startsWith("Picks submitted") ? <Check /> : <ClipboardCheck />}
      {submitting ? "Submitting..." : message?.startsWith("Picks submitted") ? "Submitted" : "Submit picks"}
    </button>
    {message && <p className="public-pickem-message" role="status">{message}</p>}
  </section>;
}
