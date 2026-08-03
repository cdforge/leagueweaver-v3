"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Eye, EyeOff, FolderHeart, History, ImagePlus, LoaderCircle, LogOut, Pencil, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { analyzeIdentityImage } from "@/lib/imageColors";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import { SignupProfileFields, type SignupProfile } from "@/components/account/SignupProfileFields";
import { SavedLeagueEditor } from "@/components/account/SavedLeagueEditor";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { LeagueMarks } from "@/components/ui/LeagueMarks";
import { apiErrorMessage, friendlyAuthMessage } from "@/lib/apiErrors";
import { normalizeSavedLeague } from "@/lib/savedLeagues";
import { getNflWeekWindow } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/client";
import type { SavedLeaguePreset } from "@/lib/types";

const ACCOUNT_PAGE_SIZE = 5;

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
  logo_url?: string | null;
  color?: string | null;
  initials?: string | null;
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
  const [signupProfile, setSignupProfile] = useState<SignupProfile>({ leagueName: "", avatarUrl: null, busy: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [dashboardTab, setDashboardTab] = useState<"account" | "profile" | "password" | "delete">("account");
  const [editingPreset, setEditingPreset] = useState<SavedLeaguePreset | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileNote, setProfileNote] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNote, setPasswordNote] = useState<string | null>(null);
  const [dangerBusy, setDangerBusy] = useState<null | "leagues" | "account">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [seasonPage, setSeasonPage] = useState(0);
  const [leaguePage, setLeaguePage] = useState(0);
  const [deletingSeasonId, setDeletingSeasonId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);
  const [revisionsBySeason, setRevisionsBySeason] = useState<Record<string, SeasonRevision[]>>({});
  const [revisionLoadingId, setRevisionLoadingId] = useState<string | null>(null);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);
  const [revisionErrors, setRevisionErrors] = useState<Record<string, string>>({});
  const supabase = createClient();

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      const user = data.user;
      setSignedInEmail(user?.email ?? null);
      if (!user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name = [meta.full_name, meta.display_name, meta.name].find((value): value is string => typeof value === "string" && value.trim().length > 0);
      setProfileName(name ?? "");
      setProfileAvatar(typeof meta.avatar_url === "string" ? meta.avatar_url : null);
      setMemberSince(user.created_at ?? null);
    });
  }, [supabase]);
  useEffect(() => {
    if (!signedInEmail) return;
    Promise.all([
      fetch("/api/seasons"),
      fetch("/api/saved-leagues"),
      fetch("/api/entitlements"),
    ]).then(async ([seasonResponse, leagueResponse, entitlementResponse]) => {
      if ([seasonResponse, leagueResponse, entitlementResponse].some((response) => response.status === 401)) {
        setSignedInEmail(null);
        setMessage("Your session expired. Sign in again to see your saved seasons.");
        return;
      }
      const seasonPayload = await readApiJson<{ seasons?: SeasonSummary[] }>(seasonResponse, "Saved seasons could not be loaded.");
      const leaguePayload = await readApiJson<{ presets?: SavedLeaguePreset[] }>(leagueResponse, "Saved leagues could not be loaded.");
      const entitlementPayload = await readApiJson<{ plan?: "free" | "pro" }>(entitlementResponse, "Account details are temporarily unavailable.");
      setSeasons(seasonPayload.seasons ?? []);
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
    const leagueName = signupProfile.leagueName.trim();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: {
          full_name: leagueName,
          display_name: leagueName,
          ...(signupProfile.avatarUrl ? { avatar_url: signupProfile.avatarUrl } : {}),
        },
      },
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

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) { setProfileNote("Choose a PNG, JPG, or WebP image under 8 MB."); return; }
    setProfileBusy(true);
    setProfileNote(null);
    try {
      const analyzed = await analyzeIdentityImage(file);
      setProfileAvatar(analyzed.logoUrl);
    } catch {
      setProfileNote("That image could not be read. Try a different one.");
    } finally {
      setProfileBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!supabase || profileBusy) return;
    setProfileBusy(true);
    setProfileNote(null);
    const trimmed = profileName.trim();
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed, display_name: trimmed, avatar_url: profileAvatar ?? null } });
    setProfileBusy(false);
    setProfileNote(error ? "Your profile could not be saved." : "Profile saved.");
  };

  const changePassword = async () => {
    if (!supabase || passwordBusy) return;
    if (newPassword.length < 8) { setPasswordNote("Use at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordNote("Those passwords don’t match."); return; }
    setPasswordBusy(true);
    setPasswordNote(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) { setPasswordNote(friendlyAuthMessage(error.message)); return; }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordNote("Password updated.");
  };

  const clearSavedLeagues = async () => {
    if (dangerBusy || !savedLeagues.length) return;
    if (!window.confirm(`Delete all ${savedLeagues.length} saved leagues? This can’t be undone.`)) return;
    setDangerBusy("leagues");
    try {
      await Promise.all(savedLeagues.map((preset) => fetch(`/api/saved-leagues?id=${encodeURIComponent(preset.id)}`, { method: "DELETE" })));
      setSavedLeagues([]);
    } finally {
      setDangerBusy(null);
    }
  };

  const deleteAccount = async () => {
    if (dangerBusy || !confirmDelete) return;
    setDangerBusy("account");
    const response = await fetch("/api/account", { method: "DELETE" });
    if (!response.ok) {
      setDangerBusy(null);
      setMessage("Your account could not be deleted. Try again in a moment.");
      return;
    }
    await supabase?.auth.signOut();
    window.location.assign("/");
  };

  const deleteSchedule = async (id: string, title: string) => {
    if (deletingSeasonId) return;
    if (!window.confirm(`Delete “${title}”? This permanently removes the schedule and its revisions.`)) return;
    setDeletingSeasonId(id);
    const response = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
    setDeletingSeasonId(null);
    if (!response.ok) { setMessage("That schedule could not be deleted."); return; }
    setSeasons((current) => current.filter((season) => season.id !== id));
  };

  const renderPagination = (page: number, total: number, setPage: (next: number) => void) => {
    const pages = Math.ceil(total / ACCOUNT_PAGE_SIZE);
    if (pages <= 1) return null;
    return <div className="account-pagination">
      <button type="button" className="account-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft />Prev</button>
      <span className="account-page-status">Page {page + 1} of {pages}</span>
      <button type="button" className="account-page-btn" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next<ChevronRight /></button>
    </div>;
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
    <header><div><p className="eyebrow">Commissioner account</p><h1>Your account settings.</h1><p>{signedInEmail}</p></div></header>
    <div className="account-tabs account-dashboard-tabs" role="tablist" aria-label="Account sections">
      <button type="button" role="tab" aria-selected={dashboardTab === "account"} className={dashboardTab === "account" ? "active" : ""} onClick={() => setDashboardTab("account")}>Account</button>
      <button type="button" role="tab" aria-selected={dashboardTab === "profile"} className={dashboardTab === "profile" ? "active" : ""} onClick={() => setDashboardTab("profile")}>Profile</button>
      <button type="button" role="tab" aria-selected={dashboardTab === "password"} className={dashboardTab === "password" ? "active" : ""} onClick={() => setDashboardTab("password")}>Password</button>
      <button type="button" role="tab" aria-selected={dashboardTab === "delete"} className={`account-tab-danger${dashboardTab === "delete" ? " active" : ""}`} onClick={() => setDashboardTab("delete")}>Delete</button>
    </div>
    {false && <section className="account-saved-leagues">
      <div className="account-section-head"><span><strong>Saved leagues</strong><small>Reuse league, division, team, color, and logo details.</small></span><Link href="/build" className="button-secondary">Start new</Link></div>
      {savedLeagues.length ? <><div className="account-saved-league-rows">{savedLeagues.slice(leaguePage * ACCOUNT_PAGE_SIZE, (leaguePage + 1) * ACCOUNT_PAGE_SIZE).map((preset) => {
        const league = preset.data.league;
        const monogram = resolveInitials(league.initials, leagueAcronym(league.name));
        return <article className="account-saved-league-row" key={preset.id}>
          <EntityLogo size={44} color={league.color} logoUrl={league.logoUrl} monogram={monogram} entityType="league" />
          <span className="account-saved-league-copy">
            <strong>{league.name || preset.name}</strong>
            <small>{preset.data.teams.length} teams · {preset.data.divisions.length} divisions</small>
            <small>Updated {formatTimestamp(preset.updatedAt)}</small>
            <LeagueMarks teams={preset.data.teams} divisions={preset.data.divisions} conferences={preset.data.conferences} size={30} className="account-saved-league-marks" />
          </span>
          <div className="account-league-actions">
            <button type="button" className="button-secondary account-edit-league" onClick={() => setEditingPreset(preset)}><Pencil />Edit</button>
          </div>
        </article>;
      })}</div>{renderPagination(leaguePage, savedLeagues.length, setLeaguePage)}</> : <div className="account-empty"><FolderHeart /><span><strong>No saved leagues yet.</strong><small>Save one from the builder after confirming its teams and divisions.</small></span></div>}
    </section>}
    {false && <section className="account-season-list">
      <div className="account-section-head"><span><strong>Schedules</strong><small>Open a schedule or restore an earlier revision.</small></span><Link href="/build" className="button-primary">New schedule</Link></div>
      {seasons.length ? <>{seasons.slice(seasonPage * ACCOUNT_PAGE_SIZE, (seasonPage + 1) * ACCOUNT_PAGE_SIZE).map((season) => {
        const isExpanded = expandedSeasonId === season.id;
        const revisions = revisionsBySeason[season.id];
        const timeframe = formatSeasonTimeframe(season.time_frame);
        const revisionPanelId = `season-revisions-${season.id}`;
        return <article className={`account-season-row${isExpanded ? " expanded" : ""}`} key={season.id}>
          <div className="account-season-summary">
            <Link className="account-season-main" href={`/season/${season.id}`} aria-label={`Open ${season.title}. ${timeframe}`}>
              <EntityLogo className="account-season-mark" size={40} color={season.color || "#117A45"} logoUrl={season.logo_url ?? undefined} monogram={resolveInitials(season.initials ?? undefined, leagueAcronym(season.title))} entityType="league" />

              <span className="account-season-copy">
                <strong>{season.title}</strong>
                <small className="account-season-timeframe">{timeframe}</small>
                <small>Updated {formatTimestamp(season.updated_at)} · {revisionCountLabel(season.revision_count)}</small>
              </span>
            </Link>
            <div className="account-season-actions">
              <Link className="account-season-recap" href={`/season/${season.id}?recap=1`} aria-label={`Play the season recap for ${season.title}`}><Sparkles aria-hidden="true" />Recap</Link>
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
              <button type="button" className="account-season-delete" aria-label={`Delete ${season.title}`} disabled={deletingSeasonId === season.id} onClick={() => deleteSchedule(season.id, season.title)}>{deletingSeasonId === season.id ? <LoaderCircle className="spin" /> : <Trash2 />}</button>
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
      })}{renderPagination(seasonPage, seasons.length, setSeasonPage)}</> : <div className="account-empty"><CalendarDays /><span><strong>No cloud seasons yet.</strong><small>Generated seasons save automatically after you sign in.</small></span></div>}
    </section>}
    <div className="account-settings">
      {dashboardTab === "account" && <section className="account-settings-block">
        <div className="account-section-head"><span><strong>Account</strong><small>Your sign-in and plan.</small></span></div>
        <dl className="account-settings-facts">
          <div><dt>Email</dt><dd>{signedInEmail}</dd></div>
          <div><dt>Plan</dt><dd>{plan === "pro" ? "Pro" : "MVP · Free"}</dd></div>
          {memberSince && <div><dt>Member since</dt><dd>{formatTimestamp(memberSince)}</dd></div>}
        </dl>
        <div className="account-settings-actions">
          {plan === "pro" ? <button type="button" className="button-secondary" onClick={openBilling} disabled={loading}><CreditCard />Manage billing</button> : <Link href="/build" className="button-secondary"><CalendarDays />Open builder</Link>}
          <button type="button" className="button-secondary account-signout" onClick={signOut}><LogOut />Sign out</button>
        </div>
      </section>}

      {dashboardTab === "profile" && <section className="account-settings-block">
        <div className="account-section-head"><span><strong>Profile</strong><small>Shown across your account.</small></span></div>
        <div className="account-settings-profile">
          <span className={`account-settings-avatar${profileAvatar ? " has-image" : ""}`} aria-hidden="true">{profileAvatar ? <img src={profileAvatar} alt="" /> : <ImagePlus />}</span>
          <div className="account-settings-avatar-controls">
            <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { pickAvatar(event.target.files?.[0]); event.target.value = ""; }} />
            <button type="button" className="button-secondary" disabled={profileBusy} onClick={() => avatarInputRef.current?.click()}>{profileBusy ? <LoaderCircle className="spin" /> : <ImagePlus />}{profileAvatar ? "Change photo" : "Upload photo"}</button>
            {profileAvatar && <button type="button" className="button-secondary" onClick={() => setProfileAvatar(null)}><Trash2 />Remove</button>}
          </div>
        </div>
        <label className="editor-field"><span>Display name</span><input value={profileName} maxLength={80} placeholder="Your name or league name" onChange={(event) => setProfileName(event.target.value)} /></label>
        <div className="account-settings-save">{profileNote && <small role="status">{profileNote}</small>}<button type="button" className="button-primary" onClick={saveProfile} disabled={profileBusy}><Check />Save profile</button></div>
      </section>}

      {dashboardTab === "password" && <section className="account-settings-block">
        <div className="account-section-head"><span><strong>Password</strong><small>Set a new sign-in password.</small></span></div>
        <label className="editor-field"><span>New password</span><input type="password" value={newPassword} autoComplete="new-password" placeholder="At least 8 characters" onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label className="editor-field"><span>Confirm password</span><input type="password" value={confirmPassword} autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        <div className="account-settings-save">{passwordNote && <small role="status">{passwordNote}</small>}<button type="button" className="button-primary" onClick={changePassword} disabled={passwordBusy || !newPassword}>{passwordBusy ? <><LoaderCircle className="spin" />Updating…</> : <><Check />Update password</>}</button></div>
      </section>}

      {dashboardTab === "delete" && <section className="account-settings-block account-settings-danger">
        <div className="account-section-head"><span><strong>Danger zone</strong><small>These actions can’t be undone.</small></span></div>
        <div className="account-danger-row">
          <span><strong>Delete all saved leagues</strong><small>Removes your {savedLeagues.length} saved league{savedLeagues.length === 1 ? "" : "s"}. Seasons are kept.</small></span>
          <button type="button" className="button-secondary account-danger-btn" onClick={clearSavedLeagues} disabled={dangerBusy !== null || !savedLeagues.length}>{dangerBusy === "leagues" ? <LoaderCircle className="spin" /> : <Trash2 />}Delete leagues</button>
        </div>
        <div className="account-danger-row">
          <span><strong>Delete account</strong><small>Permanently deletes your account and every saved league and season.</small></span>
          <div className="account-danger-delete">
            <label className="account-danger-confirm"><input type="checkbox" checked={confirmDelete} onChange={(event) => setConfirmDelete(event.target.checked)} />I understand this is permanent</label>
            <button type="button" className="button-secondary account-danger-btn" onClick={deleteAccount} disabled={dangerBusy !== null || !confirmDelete}>{dangerBusy === "account" ? <LoaderCircle className="spin" /> : <Trash2 />}Delete account</button>
          </div>
        </div>
      </section>}
    </div>
    {message && <div className="account-message" role="status">{message}</div>}
    {editingPreset && <SavedLeagueEditor preset={editingPreset} onClose={() => setEditingPreset(null)} onSaved={(updated) => { setSavedLeagues((current) => current.map((existing) => existing.id === updated.id ? updated : existing)); setEditingPreset(null); }} />}
  </div>;

  return (
    <div className="account-card">
      <Link className="account-back" href="/build"><ArrowLeft />Builder</Link>
      <p className="eyebrow">Commissioner account</p>
      <h1>{mode === "signin" ? "Welcome back." : "Save your league once."}</h1>
      <p>{mode === "signin" ? "Pick up saved leagues and seasons on any device." : "Next season, skip league, team, and division setup."}</p>
      <div className="account-tabs" role="tablist"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
      <form onSubmit={submit}>
        {mode === "signup" && <SignupProfileFields onChange={setSignupProfile} />}
        <label><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>Password</span><div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><Tooltip label={showPassword ? "Hide password" : "Show password"}><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff /> : <Eye />}</button></Tooltip></div></label>
        {message && <div className="account-message" role="status">{message}</div>}
        <button className="button-primary account-submit" disabled={loading || signupProfile.busy}>{loading && <LoaderCircle className="spin" />}{mode === "signin" ? "Sign in" : "Create free account"}</button>
      </form>
      <small className="account-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</small>
    </div>
  );
}
