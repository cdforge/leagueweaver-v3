"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronDown, CreditCard, Eye, EyeOff, FolderHeart, History, LoaderCircle, LogOut, RotateCcw, ShieldCheck } from "lucide-react";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { apiErrorMessage, friendlyAuthMessage } from "@/lib/apiErrors";
import { normalizeSavedLeague } from "@/lib/savedLeagues";
import { getNflWeekWindow } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/client";
import type { SavedLeaguePreset } from "@/lib/types";

type SeasonSummary = {
  id: string;
  title: string;
  status: string;
  editable: boolean;
  updated_at: string;
  time_frame?: {
    seasonYear?: number;
    weeks?: number;
  };
  revision_count?: number;
};

type SeasonRevision = {
  id: string;
  schedule_id: string;
  revision_number: number;
  created_at: string;
  source: string;
  current: boolean;
  restorable?: boolean;
};

function formatSeasonTimeframe(timeFrame?: SeasonSummary["time_frame"]) {
  const year = timeFrame?.seasonYear;
  const weeks = timeFrame?.weeks;
  if (!year) return "Season timeframe unavailable";
  if (!weeks || weeks < 1) return `${year} season`;

  const firstWeek = getNflWeekWindow(year, 1);
  const finalWeek = getNflWeekWindow(year, weeks);
  const startsAt = new Date(firstWeek.startsAt);
  const endsAt = new Date(finalWeek.endsAt);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const dateRange = startsAt.getFullYear() === endsAt.getFullYear()
    ? `${monthDay.format(startsAt)}–${monthDay.format(endsAt)}, ${endsAt.getFullYear()}`
    : `${monthDay.format(startsAt)}, ${startsAt.getFullYear()}–${monthDay.format(endsAt)}, ${endsAt.getFullYear()}`;

  return `${year} season · NFL Weeks 1–${weeks} · ${dateRange}`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRevisionSource(source: string) {
  return source
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function revisionCountLabel(count?: number) {
  if (count === undefined) return "Revision history";
  return `${count} revision${count === 1 ? "" : "s"}`;
}

async function readApiJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, fallback));
  return payload;
}

export function AccountPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
  const [revisionsBySeason, setRevisionsBySeason] = useState<Record<string, SeasonRevision[]>>({});
  const [revisionLoadingId, setRevisionLoadingId] = useState<string | null>(null);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);
  const [revisionErrors, setRevisionErrors] = useState<Record<string, string>>({});
  const supabase = createClient();

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null));
  }, [supabase]);
  useEffect(() => {
    if (!signedInEmail) return;
    Promise.all([
      fetch("/api/seasons").then((response) => readApiJson<{ seasons?: SeasonSummary[] }>(response, "Saved seasons could not be loaded.")),
      fetch("/api/saved-leagues").then((response) => readApiJson<{ presets?: SavedLeaguePreset[] }>(response, "Saved leagues could not be loaded.")),
      fetch("/api/entitlements").then((response) => readApiJson<{ plan?: "free" | "pro" }>(response, "Account details are temporarily unavailable.")),
    ]).then(([seasonPayload, leaguePayload, entitlementPayload]) => {
      const nextSeasons = seasonPayload.seasons ?? [];
      setSeasons(nextSeasons);
      setSavedLeagues((leaguePayload.presets ?? []).map(normalizeSavedLeague).filter((preset: SavedLeaguePreset | null): preset is SavedLeaguePreset => Boolean(preset)));
      setPlan(entitlementPayload.plan || "free");
    }).catch(() => setMessage("Account details are temporarily unavailable."));
  }, [signedInEmail]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return setMessage("Supabase is not configured for this environment yet.");
    setLoading(true);
    setMessage(null);
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage(friendlyAuthMessage(error.message));
      setSignedInEmail(data.user.email ?? email);
      window.location.assign(next.startsWith("/") ? next : "/");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    setMessage(error ? friendlyAuthMessage(error.message) : "Check your email to finish setting up your account.");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setSignedInEmail(null);
  };

  const openBilling = async () => {
    setLoading(true);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
    setLoading(false);
    if (payload.url) window.location.assign(payload.url);
    else setMessage(apiErrorMessage(response.status, payload.error, "Billing could not be opened."));
  };

  const loadRevisions = async (seasonId: string, force = false) => {
    if (!force && Object.hasOwn(revisionsBySeason, seasonId)) return;
    setRevisionLoadingId(seasonId);
    setRevisionErrors((current) => ({ ...current, [seasonId]: "" }));
    try {
      const response = await fetch(`/api/seasons/${seasonId}/revisions`);
      const payload = await response.json().catch(() => ({})) as { revisions?: SeasonRevision[]; error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, "Revision history could not be loaded."));
      setRevisionsBySeason((current) => ({ ...current, [seasonId]: payload.revisions ?? [] }));
    } catch (error) {
      setRevisionErrors((current) => ({
        ...current,
        [seasonId]: error instanceof Error ? error.message : "Revision history could not be loaded.",
      }));
    } finally {
      setRevisionLoadingId((current) => current === seasonId ? null : current);
    }
  };

  const toggleRevisions = (seasonId: string) => {
    const willOpen = expandedSeasonId !== seasonId;
    setExpandedSeasonId(willOpen ? seasonId : null);
    if (willOpen) void loadRevisions(seasonId);
  };

  const restoreRevision = async (season: SeasonSummary, revision: SeasonRevision) => {
    setRestoringRevisionId(revision.id);
    setRevisionErrors((current) => ({ ...current, [season.id]: "" }));
    try {
      const response = await fetch(`/api/seasons/${season.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: revision.id }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, "This revision could not be restored."));
      await loadRevisions(season.id, true);
      setMessage(`Revision ${revision.revision_number} is now current for ${season.title}.`);
    } catch (error) {
      setRevisionErrors((current) => ({
        ...current,
        [season.id]: error instanceof Error ? error.message : "This revision could not be restored.",
      }));
    } finally {
      setRestoringRevisionId(null);
    }
  };

  if (signedInEmail) return <div className="account-dashboard">
    <header><div><p className="eyebrow">Commissioner account</p><h1>Your league office.</h1><p>{signedInEmail}</p></div><span className="account-plan free"><ShieldCheck />MVP ACCESS</span></header>
    <div className="account-stat-row"><div><CalendarDays /><span><strong>{seasons.length}</strong><small>Saved seasons</small></span></div><div><FolderHeart /><span><strong>{savedLeagues.length}</strong><small>Saved leagues</small></span></div><div><ShieldCheck /><span><strong>Unlimited</strong><small>Editable seasons</small></span></div></div>
    <section className="account-saved-leagues">
      <div className="account-section-head"><span><strong>Saved leagues</strong><small>Reuse league, division, team, color, and logo details.</small></span><Link href="/" className="button-secondary">Start new</Link></div>
      {savedLeagues.length ? <div className="account-saved-league-rows">{savedLeagues.map((preset) => {
        const league = preset.data.league;
        const monogram = resolveInitials(league.initials, leagueAcronym(league.name));
        return <article className="account-saved-league-row" key={preset.id}>
          <EntityLogo size={44} color={league.color} logoUrl={league.logoUrl} monogram={monogram} />
          <span className="account-saved-league-copy">
            <strong>{league.name || preset.name}</strong>
            <small>{preset.data.teams.length} teams · {preset.data.divisions.length} divisions</small>
            <small>Updated {formatTimestamp(preset.updatedAt)}</small>
          </span>
          <Link href={`/?savedLeague=${encodeURIComponent(preset.id)}`} className="button-secondary account-use-league">Use in builder</Link>
        </article>;
      })}</div> : <div className="account-empty"><FolderHeart /><span><strong>No saved leagues yet.</strong><small>Save one from the builder after confirming its teams and divisions.</small></span></div>}
    </section>
    <section className="account-season-list">
      <div className="account-section-head"><span><strong>Seasons</strong><small>Open a season or restore an earlier revision.</small></span><Link href="/" className="button-primary">New schedule</Link></div>
      {seasons.length ? seasons.map((season) => {
        const isExpanded = expandedSeasonId === season.id;
        const revisions = revisionsBySeason[season.id];
        const timeframe = formatSeasonTimeframe(season.time_frame);
        const revisionPanelId = `season-revisions-${season.id}`;
        return <article className={`account-season-row${isExpanded ? " expanded" : ""}`} key={season.id}>
          <div className="account-season-summary">
            <Link className="account-season-main" href={`/season/${season.id}`} aria-label={`Open ${season.title}. ${timeframe}`}>
              <span className="account-season-copy">
                <strong>{season.title}</strong>
                <small className="account-season-timeframe">{timeframe}</small>
                <small>Updated {formatTimestamp(season.updated_at)} · {revisionCountLabel(season.revision_count)}</small>
              </span>
            </Link>
            <div className="account-season-actions">
              <em className={season.editable ? "editable" : "view-only"}>{season.editable ? "EDITABLE" : "VIEW ONLY"}</em>
              <button
                type="button"
                className="account-revision-toggle"
                aria-expanded={isExpanded}
                aria-controls={revisionPanelId}
                aria-label={`${isExpanded ? "Hide" : "Show"} revision history for ${season.title}`}
                onClick={() => toggleRevisions(season.id)}
              >
                <History aria-hidden="true" />
                <span>Revisions</span>
                <ChevronDown className={isExpanded ? "rotated" : ""} aria-hidden="true" />
              </button>
            </div>
          </div>
          {isExpanded && <div className="account-revision-panel" id={revisionPanelId} role="region" aria-label={`Revision history for ${season.title}`}>
            <div className="account-revision-head"><span><strong>Revision history</strong><small>Restoring keeps newer revisions available.</small></span></div>
            {revisionLoadingId === season.id && !revisions ? <div className="account-revision-state" role="status"><LoaderCircle className="spin" />Loading revisions…</div>
              : revisionErrors[season.id] ? <div className="account-revision-state error" role="alert"><span>{revisionErrors[season.id]}</span><button type="button" onClick={() => void loadRevisions(season.id, true)}>Try again</button></div>
                : revisions?.length ? <ol className="account-revision-list">{revisions.map((revision) => <li key={revision.id}>
                  <div className="account-revision-copy">
                    <span><strong>Revision {revision.revision_number}</strong>{revision.current && <em>CURRENT</em>}</span>
                    <small>{formatTimestamp(revision.created_at)} · {formatRevisionSource(revision.source)}</small>
                  </div>
                  {!revision.current && revision.restorable === false && <span className="account-legacy-revision">LEGACY</span>}
                  {!revision.current && revision.restorable !== false && <button type="button" className="account-restore-button" disabled={restoringRevisionId !== null} onClick={() => void restoreRevision(season, revision)} aria-label={`Restore revision ${revision.revision_number} for ${season.title}`}>
                    {restoringRevisionId === revision.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                    <span>Restore</span>
                  </button>}
                </li>)}</ol>
                  : <div className="account-revision-state">No earlier revisions are available yet.</div>}
          </div>}
        </article>;
      }) : <div className="account-empty"><CalendarDays /><span><strong>No cloud seasons yet.</strong><small>Generated seasons save automatically after you sign in.</small></span></div>}
    </section>
    {message && <div className="account-message" role="status">{message}</div>}
    <footer>{plan === "pro" ? <button type="button" className="button-secondary" onClick={openBilling} disabled={loading}><CreditCard />Manage billing</button> : <Link href="/" className="button-primary"><CalendarDays />Open builder</Link>}<button type="button" className="account-signout" onClick={signOut}><LogOut />Sign out</button></footer>
  </div>;

  return (
    <div className="account-card">
      <Link className="account-back" href="/"><ArrowLeft />Builder</Link>
      <p className="eyebrow">Commissioner account</p>
      <h1>{mode === "signin" ? "Welcome back." : "Save your league once."}</h1>
      <p>{mode === "signin" ? "Pick up saved leagues and seasons on any device." : "Next season, skip league, team, and division setup."}</p>
      <div className="account-tabs" role="tablist"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
      <form onSubmit={submit}>
        <label><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>Password</span><div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><Tooltip label={showPassword ? "Hide password" : "Show password"}><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff /> : <Eye />}</button></Tooltip></div></label>
        {message && <div className="account-message" role="status">{message}</div>}
        <button className="button-primary account-submit" disabled={loading}>{loading && <LoaderCircle className="spin" />}{mode === "signin" ? "Sign in" : "Create free account"}</button>
      </form>
      <small className="account-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</small>
    </div>
  );
}
