"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CalendarDays, CalendarPlus, Check, Copy, ExternalLink, FolderHeart, LoaderCircle, MoreHorizontal, Pencil, Plus, Search, Share2, Sparkles, Trash2, X } from "lucide-react";
import { SavedLeagueEditor } from "@/components/account/SavedLeagueEditor";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { LoadingPlaybook } from "@/components/ui/LoadingPlaybook";
import { Modal } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/apiErrors";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { normalizeSavedLeague } from "@/lib/savedLeagues";
import { createLocalSeasonId, listLocalSeasons, loadSeasonById, removeLocalSeason, saveSeason, type LocalSeasonSummary } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { teamInitials } from "@/lib/teamIdentity";
import type { Conference, Division, GeneratedSchedule, SavedLeaguePreset, Team } from "@/lib/types";

const DASHBOARD_PAGE_SIZE = 6;
const COPY_PREFIX = "Copy of ";

type SeasonSummary = {
  id: string;
  title: string;
  updated_at: string;
  logo_url?: string | null;
  color?: string | null;
  initials?: string | null;
  time_frame?: { seasonYear?: number; weeks?: number };
  teams?: Team[];
  divisions?: Division[];
  conferences?: Conference[];
  savedLeague?: { id: string; updatedAt?: string };
};

type SortMode = "updated-desc" | "name-asc" | "name-desc" | "teams-desc" | "teams-asc";
type ScheduleFilter = "all" | "cloud" | "local";
type LeagueFilter = "all" | "small" | "standard" | "large";
type ScheduleDashboardItem =
  | { id: string; source: "cloud"; season: SeasonSummary; name: string; updatedAt: string; teamCount: number }
  | { id: string; source: "local"; season: LocalSeasonSummary; name: string; updatedAt: string; teamCount: number };
type PublicDisplaySettings = { cityNames: boolean; managers: boolean; venues: boolean };
type PublishStatus = { published: boolean; url: string | null; slug: string | null; publicDisplay?: Partial<PublicDisplaySettings> };
type DashboardCache = {
  seasons: SeasonSummary[];
  savedLeagues: SavedLeaguePreset[];
  signedOut: boolean;
};

const dashboardCache: DashboardCache = {
  seasons: [],
  savedLeagues: [],
  signedOut: false,
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function seasonLabel(season: SeasonSummary) {
  const year = season.time_frame?.seasonYear;
  const weeks = season.time_frame?.weeks;
  if (!year) return "Fantasy football season";
  return weeks ? `${year} season · NFL Weeks 1-${weeks}` : `${year} season`;
}

function localSeasonLabel(season: LocalSeasonSummary) {
  return season.seasonYear ? `${season.seasonYear} season · ${season.teamCount} teams · saved on this device` : `${season.teamCount} teams · saved on this device`;
}

function copyName(name: string) {
  return name.trim().toLowerCase().startsWith(COPY_PREFIX.toLowerCase()) ? `${COPY_PREFIX}${name}` : `${COPY_PREFIX}${name || "Untitled"}`;
}

function teamCountLabel(count: number) {
  return `${count} team${count === 1 ? "" : "s"}`;
}

function dashboardNameKeys(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  const variants = new Set<string>();
  const push = (next: string) => {
    const normalized = next
      .toLowerCase()
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/^copy\s+of\s+/i, " ")
      .replace(/[—-].*$/g, " ")
      .replace(/\breal\b/g, " ")
      .replace(/[^a-z0-9]+/g, "");
    if (normalized) variants.add(normalized);
  };
  push(raw);
  push(raw.replace(/^copy\s+of\s+/i, ""));
  push(raw.split("—")[0] ?? raw);
  push(raw.split("-")[0] ?? raw);
  return Array.from(variants);
}

function dashboardTeamKeys(team: Team) {
  return [
    `${team.city ?? ""} ${team.name ?? ""}`,
    team.name,
    team.manager,
    team.initials,
    team.id,
  ].flatMap(dashboardNameKeys);
}

function TeamStrip({ teams }: { teams: Team[] }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(teams.length);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      const markWithGap = 35;
      const badgeWithGap = 39;
      const fullFit = Math.floor((width + 5) / markWithGap);
      if (fullFit >= teams.length) {
        setVisibleCount(teams.length);
        return;
      }
      const withBadgeFit = Math.floor(Math.max(0, width - badgeWithGap + 5) / markWithGap);
      setVisibleCount(Math.max(1, Math.min(teams.length, withBadgeFit)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [teams.length]);

  if (!teams.length) return null;
  const hiddenCount = Math.max(0, teams.length - visibleCount);
  return <span ref={ref} className="product-team-strip" aria-label={`${teams.length} team logos`}>
    {teams.slice(0, visibleCount).map((team, index) => <EntityLogo key={team.id || `${team.name}-${index}`} size={30} color={team.color || "#117A45"} logoUrl={team.logoUrl} monogram={teamInitials(team)} />)}
    {hiddenCount > 0 && <em>+{hiddenCount}</em>}
  </span>;
}

type DashboardRowAction = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
};

function RowActionsMenu({ actions, label }: { actions: DashboardRowAction[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    if (!open) return;
    const positionMenu = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 176;
      const menuHeight = Math.min(236, 12 + (actions.length * 46));
      const gutter = 8;
      const left = Math.max(gutter, Math.min(window.innerWidth - menuWidth - gutter, rect.right - menuWidth));
      const opensUp = window.innerHeight - rect.bottom < menuHeight + gutter && rect.top > menuHeight + gutter;
      const top = opensUp ? rect.top - menuHeight - gutter : rect.bottom + gutter;
      setMenuStyle({ left, top, minWidth: menuWidth });
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    positionMenu();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [actions.length, open]);

  return <div ref={ref} className="product-row-menu">
    <button ref={buttonRef} type="button" className="button-secondary product-row-menu-button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <MoreHorizontal />
    </button>
    {open && menuStyle && createPortal(<div ref={menuRef} className="product-row-menu-list" role="menu" style={menuStyle}>
      {actions.map((action) => action.href ? <Link key={action.label} href={action.href} role="menuitem" onClick={() => setOpen(false)}>
        {action.loading ? <LoaderCircle className="spin" /> : action.icon}
        {action.label}
      </Link> : <button key={action.label} type="button" role="menuitem" className={action.danger ? "product-danger-action" : undefined} disabled={action.disabled} onClick={() => {
        setOpen(false);
        action.onSelect?.();
      }}>
        {action.loading ? <LoaderCircle className="spin" /> : action.icon}
        {action.label}
      </button>)}
    </div>, document.body)}
  </div>;
}

function ScheduleShareModal({
  item,
  status,
  loading,
  busy,
  copied,
  message,
  publicDisplay,
  onPublicDisplayChange,
  onClose,
  onPublish,
  onCopy,
  onUnpublish,
}: {
  item: ScheduleDashboardItem;
  status: PublishStatus | null;
  loading: boolean;
  busy: "publish" | "unpublish" | null;
  copied: boolean;
  message: string | null;
  publicDisplay: PublicDisplaySettings;
  onPublicDisplayChange: (display: PublicDisplaySettings) => void;
  onClose: () => void;
  onPublish: () => void;
  onCopy: () => void;
  onUnpublish: () => void;
}) {
  const isCloud = item.source === "cloud";
  const isLive = Boolean(status?.published && status.url);
  const workspaceShareHref = `/season/${item.season.id}?view=share`;
  return <Modal className="schedule-share-modal" labelledBy="schedule-share-title" describedBy="schedule-share-desc" onClose={onClose}>
    <header>
      <span className={`schedule-share-mark${isLive ? " is-live" : ""}`}><Share2 /></span>
      <span>
        <small>{isCloud ? isLive ? "PUBLIC PAGE LIVE" : "SHARE SCHEDULE" : "GUEST SCHEDULE"}</small>
        <h2 id="schedule-share-title">Share {item.name}</h2>
        <p id="schedule-share-desc">{isCloud ? "Publish, copy, or turn off the public schedule page." : "Save this schedule to your account before creating a stable public link."}</p>
      </span>
      <button type="button" aria-label="Close share modal" onClick={onClose}><X /></button>
    </header>
    <div className="schedule-share-body">
      {loading ? <div className="schedule-share-state" role="status"><LoaderCircle className="spin" /><span>Checking share status...</span></div> : <>
        <section className={`schedule-share-status ${isLive ? "is-live" : "is-idle"}`}>
          <span><strong>{isLive ? "Public link ready" : isCloud ? "Not published yet" : "Save first"}</strong><small>{isLive ? "Anyone with this link can open the public schedule page." : isCloud ? "Publishing creates a public page anyone with the link can open." : "The full Share page will handle saving and publishing."}</small></span>
          {isLive && <input type="text" readOnly value={status?.url ?? ""} onFocus={(event) => event.currentTarget.select()} aria-label="Public schedule link" />}
        </section>
        <section className="schedule-share-info">
          <strong>What goes public</strong>
          <span><Check />Full schedule, scores, standings, and playoffs when available.</span>
          <span><Check />League name, team names, logos, and colors. Private fields follow the settings below.</span>
        </section>
        <section className="schedule-share-info schedule-share-privacy">
          <strong>Public privacy</strong>
          <label><input type="checkbox" checked={publicDisplay.managers} onChange={(event) => onPublicDisplayChange({ ...publicDisplay, managers: event.target.checked })} /><span><b>Show manager names</b><small>Off removes manager names and emails from the published copy.</small></span></label>
          <label><input type="checkbox" checked={publicDisplay.cityNames} onChange={(event) => onPublicDisplayChange({ ...publicDisplay, cityNames: event.target.checked })} /><span><b>Show team cities</b><small>Off hides city or location names from the public page.</small></span></label>
          <label><input type="checkbox" checked={publicDisplay.venues} onChange={(event) => onPublicDisplayChange({ ...publicDisplay, venues: event.target.checked })} /><span><b>Show venues</b><small>Off hides stadium or home-field details from the public page.</small></span></label>
        </section>
      </>}
      {message && <p className="schedule-share-message" role="status">{message}</p>}
    </div>
    <footer>
      <Link className="button-secondary" href={workspaceShareHref} onClick={onClose}><ExternalLink />Open Share page</Link>
      {isCloud && isLive && <>
        <button type="button" className="button-secondary" onClick={onCopy}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy link"}</button>
        <button type="button" className="button-danger" disabled={busy !== null} onClick={onUnpublish}>{busy === "unpublish" ? <LoaderCircle className="spin" /> : <X />}Unpublish</button>
      </>}
      {isCloud && !isLive && <button type="button" className="button-primary" disabled={busy !== null || loading} onClick={onPublish}>{busy === "publish" ? <LoaderCircle className="spin" /> : <Share2 />}Publish & copy link</button>}
    </footer>
  </Modal>;
}

function DashboardLoadingNotice({ view }: { view: "schedules" | "leagues" }) {
  return <LoadingPlaybook
    compact
    expectedSeconds={8}
    label={view === "schedules" ? "Still checking your account schedules..." : "Still checking your saved leagues..."}
  />;
}

async function fetchSavedLeaguePresets() {
  const leagueResponse = await fetch("/api/saved-leagues");
  const leaguePayload = await leagueResponse.json().catch(() => ({})) as { presets?: SavedLeaguePreset[]; error?: string };
  if (leagueResponse.status === 401) return { signedOut: true, presets: [] as SavedLeaguePreset[] };
  if (!leagueResponse.ok) throw new Error(leaguePayload.error ?? "Saved leagues could not be loaded.");
  return {
    signedOut: false,
    presets: (leaguePayload.presets ?? []).map(normalizeSavedLeague).filter((preset): preset is SavedLeaguePreset => Boolean(preset)),
  };
}

export function FantasyDashboard({ view = "schedules" }: { view?: "schedules" | "leagues" }) {
  const [seasons, setSeasons] = useState<SeasonSummary[]>(() => dashboardCache.seasons);
  const [localSeasons, setLocalSeasons] = useState<LocalSeasonSummary[]>(() => listLocalSeasons());
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>(() => dashboardCache.savedLeagues);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>("all");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<SavedLeaguePreset | null>(null);
  const [shareSchedule, setShareSchedule] = useState<ScheduleDashboardItem | null>(null);
  const [shareStatus, setShareStatus] = useState<PublishStatus | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareBusy, setShareBusy] = useState<"publish" | "unpublish" | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [sharePublicDisplay, setSharePublicDisplay] = useState<PublicDisplaySettings>({ cityNames: true, managers: false, venues: true });
  const [cloudTeamDetails, setCloudTeamDetails] = useState<Record<string, Team[]>>({});
  const [managerControlsOpen, setManagerControlsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(() => dashboardCache.signedOut);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);
    setSignedOut(dashboardCache.signedOut);
    setPage(0);
    setQuery("");
    setSelectedIds(new Set());
    setManagerControlsOpen(false);
    if (dashboardCache.seasons.length) setSeasons(dashboardCache.seasons);
    if (dashboardCache.savedLeagues.length) setSavedLeagues(dashboardCache.savedLeagues);
    const localNow = listLocalSeasons();
    setLocalSeasons(localNow);
    createClient()?.auth.getUser().then(({ data }) => {
      if (active) {
        dashboardCache.signedOut = !data.user;
        setSignedOut(!data.user);
      }
    }).catch(() => undefined);

    if (view === "schedules") {
      Promise.allSettled([
        fetch("/api/seasons").then(async (seasonResponse) => {
          const seasonPayload = await seasonResponse.json().catch(() => ({})) as { seasons?: SeasonSummary[]; error?: string };
          if (seasonResponse.status === 401) return { signedOut: true, seasons: [] as SeasonSummary[] };
          if (!seasonResponse.ok) throw new Error(seasonPayload.error ?? "Saved seasons could not be loaded.");
          return { signedOut: false, seasons: seasonPayload.seasons ?? [] };
        }),
        fetchSavedLeaguePresets(),
      ]).then(([seasonResult, leagueResult]) => {
        if (!active) return;
        if (seasonResult.status === "fulfilled") {
          dashboardCache.seasons = seasonResult.value.seasons;
          dashboardCache.signedOut = seasonResult.value.signedOut;
          setSeasons(seasonResult.value.seasons);
          setSignedOut(seasonResult.value.signedOut);
        } else {
          setMessage(seasonResult.reason instanceof Error ? seasonResult.reason.message : "Saved schedules could not be loaded.");
        }
        if (leagueResult.status === "fulfilled") {
          dashboardCache.savedLeagues = leagueResult.value.presets;
          setSavedLeagues(leagueResult.value.presets);
        }
      }).finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }

    fetchSavedLeaguePresets()
      .then((leagueResult) => {
        if (!active) return;
        if (leagueResult.signedOut) {
          setSignedOut(true);
          dashboardCache.signedOut = true;
          setSavedLeagues([]);
          return;
        }
        dashboardCache.savedLeagues = leagueResult.presets;
        setSavedLeagues(leagueResult.presets);
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Saved leagues could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view]);

  useEffect(() => {
    setShareCopied(false);
    setShareMessage(null);
    setSharePublicDisplay({ cityNames: true, managers: false, venues: true });
    if (!shareSchedule || shareSchedule.source !== "cloud") {
      setShareStatus(null);
      setShareLoading(false);
      return;
    }
    let active = true;
    setShareLoading(true);
    fetch(`/api/publish?scheduleId=${encodeURIComponent(shareSchedule.season.id)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { published?: boolean; url?: string; slug?: string; error?: string; publicDisplay?: Partial<PublicDisplaySettings> };
        if (!response.ok) throw new Error(apiErrorMessage(response.status, payload.error, "Share status could not be loaded."));
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setShareStatus({ published: Boolean(payload.published), url: payload.url ?? null, slug: payload.slug ?? null, publicDisplay: payload.publicDisplay });
        if (payload.publicDisplay) setSharePublicDisplay((current) => ({ ...current, ...payload.publicDisplay }));
      })
      .catch((error) => {
        if (active) setShareMessage(error instanceof Error ? error.message : "Share status could not be loaded.");
      })
      .finally(() => { if (active) setShareLoading(false); });
    return () => { active = false; };
  }, [shareSchedule]);

  const isSchedules = view === "schedules";
  const savedLeagueTeamsById = new Map(savedLeagues.map((preset) => [preset.id, preset.data.teams]));
  const savedLeagueTeamsByName = new Map<string, Team[]>();
  const savedLeagueTeamsByTeam = new Map<string, Team[]>();
  savedLeagues.forEach((preset) => {
    [...dashboardNameKeys(preset.name), ...dashboardNameKeys(preset.data.league.name)].forEach((key) => {
      if (!savedLeagueTeamsByName.has(key)) savedLeagueTeamsByName.set(key, preset.data.teams);
    });
    preset.data.teams.forEach((team) => {
      dashboardTeamKeys(team).forEach((key) => {
        if (!savedLeagueTeamsByTeam.has(key)) savedLeagueTeamsByTeam.set(key, preset.data.teams);
      });
    });
  });
  const savedLeagueTeamsForSeason = (season: SeasonSummary, seedTeams: Team[]) => {
    if (season.savedLeague?.id && savedLeagueTeamsById.has(season.savedLeague.id)) return savedLeagueTeamsById.get(season.savedLeague.id);
    for (const key of dashboardNameKeys(season.title)) {
      const match = savedLeagueTeamsByName.get(key);
      if (match?.length) return match;
    }
    for (const team of seedTeams) {
      for (const key of dashboardTeamKeys(team)) {
        const match = savedLeagueTeamsByTeam.get(key);
        if (match?.length) return match;
      }
    }
    return undefined;
  };
  const teamPreviewForSeason = (season: SeasonSummary) => {
    const revisionTeams = cloudTeamDetails[season.id] ?? season.teams ?? [];
    const savedLeagueTeams = savedLeagueTeamsForSeason(season, revisionTeams);
    return revisionTeams.length > 1 ? revisionTeams : savedLeagueTeams?.length ? savedLeagueTeams : revisionTeams;
  };
  const allSchedules: ScheduleDashboardItem[] = [...seasons.map((season) => ({ id: `cloud:${season.id}`, source: "cloud" as const, season, name: season.title, updatedAt: season.updated_at, teamCount: teamPreviewForSeason(season).length })), ...localSeasons.map((season) => ({ id: `local:${season.id}`, source: "local" as const, season, name: season.name, updatedAt: String(season.savedAt), teamCount: season.teamCount }))];
  const queryText = query.trim().toLowerCase();
  const scheduleItems = allSchedules
    .filter((item) => scheduleFilter === "all" || item.source === scheduleFilter)
    .filter((item) => !queryText || item.name.toLowerCase().includes(queryText))
    .sort((a, b) => sortMode === "name-asc" ? a.name.localeCompare(b.name)
      : sortMode === "name-desc" ? b.name.localeCompare(a.name)
        : sortMode === "teams-desc" ? b.teamCount - a.teamCount
          : sortMode === "teams-asc" ? a.teamCount - b.teamCount
            : Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)));
  const leagueItems = savedLeagues
    .filter((preset) => {
      const count = preset.data.teams.length;
      if (leagueFilter === "small") return count <= 10;
      if (leagueFilter === "standard") return count >= 11 && count <= 14;
      if (leagueFilter === "large") return count >= 15;
      return true;
    })
    .filter((preset) => {
      const league = preset.data.league;
      const haystack = `${preset.name} ${league.name} ${preset.data.teams.map((team) => `${team.city} ${team.name} ${team.manager}`).join(" ")}`.toLowerCase();
      return !queryText || haystack.includes(queryText);
    })
    .sort((a, b) => sortMode === "name-asc" ? (a.data.league.name || a.name).localeCompare(b.data.league.name || b.name)
      : sortMode === "name-desc" ? (b.data.league.name || b.name).localeCompare(a.data.league.name || a.name)
        : sortMode === "teams-desc" ? b.data.teams.length - a.data.teams.length
          : sortMode === "teams-asc" ? a.data.teams.length - b.data.teams.length
            : Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)));
  const activeItems = isSchedules ? scheduleItems : leagueItems;
  const hasSchedules = allSchedules.length > 0;
  const hasVisibleContent = isSchedules ? hasSchedules : savedLeagues.length > 0;
  const showFullLoading = loading && !hasVisibleContent;
  const showBackgroundLoading = loading && hasVisibleContent;
  const pageCount = Math.ceil(activeItems.length / DASHBOARD_PAGE_SIZE);
  const pageStart = page * DASHBOARD_PAGE_SIZE;
  const pagedSchedules = scheduleItems.slice(pageStart, pageStart + DASHBOARD_PAGE_SIZE);
  const pagedLeagues = leagueItems.slice(pageStart, pageStart + DASHBOARD_PAGE_SIZE);
  const visibleHydrationKey = pagedSchedules.map((item) => item.source === "cloud" ? `${item.season.id}:${item.teamCount}` : "").filter(Boolean).join("|");
  const selectedVisibleCount = activeItems.filter((item) => selectedIds.has(isSchedules ? item.id : `league:${item.id}`)).length;
  const allVisibleSelected = activeItems.length > 0 && selectedVisibleCount === activeItems.length;
  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const ids = activeItems.map((item) => isSchedules ? item.id : `league:${item.id}`);
      if (allVisibleSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };
  const refreshLocalSeasons = () => setLocalSeasons(listLocalSeasons());
  useEffect(() => {
    if (!isSchedules || !visibleHydrationKey) return;
    let active = true;
    const targets = pagedSchedules.filter((item) => item.source === "cloud" && item.teamCount <= 1 && !cloudTeamDetails[item.season.id]);
    if (!targets.length) return;
    Promise.all(targets.map(async (item) => {
      try {
        const detailResponse = await fetch(`/api/seasons/${item.season.id}`);
        if (!detailResponse.ok) return null;
        const detailPayload = await detailResponse.json().catch(() => ({})) as { schedule?: GeneratedSchedule };
        const teams = detailPayload.schedule?.setup?.teams;
        return Array.isArray(teams) && teams.length > item.teamCount ? [item.season.id, teams] as const : null;
      } catch {
        return null;
      }
    })).then((hydrated) => {
      if (!active) return;
      const fullTeamEntries = hydrated.filter((entry): entry is readonly [string, Team[]] => Boolean(entry));
      if (!fullTeamEntries.length) return;
      setCloudTeamDetails((current) => {
        const next = { ...current };
        for (const [id, teams] of fullTeamEntries) next[id] = teams;
        return next;
      });
      setSeasons((current) => {
        const byId = new Map(fullTeamEntries);
        const next = current.map((season) => byId.has(season.id) ? { ...season, teams: byId.get(season.id) } : season);
        dashboardCache.seasons = next;
        return next;
      });
    });
    return () => { active = false; };
  }, [cloudTeamDetails, isSchedules, pagedSchedules, visibleHydrationKey]);
  useEffect(() => {
    if (pageCount > 0 && page >= pageCount) setPage(pageCount - 1);
  }, [page, pageCount]);
  const copySchedule = async (item: typeof allSchedules[number]) => {
    setBusyAction(`copy:${item.id}`);
    try {
      if (item.source === "local") {
        const schedule = loadSeasonById(item.season.id);
        if (schedule) {
          saveSeason({ ...schedule, id: createLocalSeasonId(), createdAt: new Date().toISOString(), setup: { ...schedule.setup, name: copyName(schedule.setup.name) } });
          refreshLocalSeasons();
        }
      } else {
        const detail = await fetch(`/api/seasons/${item.season.id}`).then((response) => response.json()) as { schedule?: GeneratedSchedule };
        if (detail.schedule) {
          await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: detail.schedule, saveMode: "copy" }) });
          const response = await fetch("/api/seasons");
          const payload = await response.json().catch(() => ({})) as { seasons?: SeasonSummary[] };
          dashboardCache.seasons = payload.seasons ?? [];
          setSeasons(dashboardCache.seasons);
        }
      }
    } finally {
      setBusyAction(null);
    }
  };
  const deleteSchedule = async (item: typeof allSchedules[number]) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    setBusyAction(`delete:${item.id}`);
    try {
      if (item.source === "local") {
        removeLocalSeason(item.season.id);
        refreshLocalSeasons();
      } else {
        const response = await fetch(`/api/seasons/${item.season.id}`, { method: "DELETE" });
        if (response.ok) setSeasons((current) => {
          const next = current.filter((season) => season.id !== item.season.id);
          dashboardCache.seasons = next;
          return next;
        });
      }
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    } finally {
      setBusyAction(null);
    }
  };
  const publishSharedSchedule = async () => {
    if (!shareSchedule || shareSchedule.source !== "cloud" || shareBusy) return;
    setShareBusy("publish");
    setShareMessage(null);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: shareSchedule.season.id, publicDisplay: sharePublicDisplay }),
      });
      const payload = await response.json().catch(() => ({})) as { url?: string; slug?: string; error?: string };
      if (!response.ok || !payload.url) {
        setShareMessage(apiErrorMessage(response.status, payload.error, "This schedule could not be published."));
        return;
      }
      setShareStatus({ published: true, url: payload.url, slug: payload.slug ?? null, publicDisplay: sharePublicDisplay });
      try {
        await navigator.clipboard.writeText(payload.url);
        setShareCopied(true);
        setShareMessage("Public schedule link copied.");
      } catch {
        setShareMessage("Public schedule link is ready.");
      }
    } finally {
      setShareBusy(null);
    }
  };
  const copySharedScheduleLink = async () => {
    if (!shareStatus?.url) return;
    try {
      await navigator.clipboard.writeText(shareStatus.url);
      setShareCopied(true);
      setShareMessage("Link copied.");
      window.setTimeout(() => setShareCopied(false), 2400);
    } catch {
      setShareMessage(shareStatus.url);
    }
  };
  const unpublishSharedSchedule = async () => {
    if (!shareSchedule || shareSchedule.source !== "cloud" || shareBusy) return;
    setShareBusy("unpublish");
    setShareMessage(null);
    try {
      const response = await fetch(`/api/publish?scheduleId=${encodeURIComponent(shareSchedule.season.id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({})) as { unpublished?: boolean; error?: string };
      if (!response.ok || !payload.unpublished) {
        setShareMessage(apiErrorMessage(response.status, payload.error, "Sharing could not be disabled."));
        return;
      }
      setShareStatus({ published: false, url: null, slug: null });
      setShareMessage("Public page unpublished.");
    } finally {
      setShareBusy(null);
    }
  };
  const copyLeague = async (preset: SavedLeaguePreset) => {
    setBusyAction(`copy:league:${preset.id}`);
    try {
      const name = copyName(preset.data.league.name || preset.name);
      const response = await fetch("/api/saved-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data: { ...preset.data, league: { ...preset.data.league, name } } }),
      });
      const payload = await response.json().catch(() => ({})) as { preset?: SavedLeaguePreset };
      if (response.ok && payload.preset) {
        const normalized = normalizeSavedLeague(payload.preset);
        if (normalized) setSavedLeagues((current) => {
          const next = [normalized, ...current];
          dashboardCache.savedLeagues = next;
          return next;
        });
      }
    } finally {
      setBusyAction(null);
    }
  };
  const deleteLeague = async (preset: SavedLeaguePreset) => {
    if (!window.confirm(`Delete ${preset.data.league.name || preset.name}? This cannot be undone.`)) return;
    setBusyAction(`delete:league:${preset.id}`);
    try {
      const response = await fetch(`/api/saved-leagues?id=${encodeURIComponent(preset.id)}`, { method: "DELETE" });
      if (response.ok) {
        setSavedLeagues((current) => {
          const next = current.filter((item) => item.id !== preset.id);
          dashboardCache.savedLeagues = next;
          return next;
        });
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(`league:${preset.id}`);
          return next;
        });
      }
    } finally {
      setBusyAction(null);
    }
  };
  const bulkDelete = async () => {
    if (!selectedIds.size || !window.confirm(`Delete ${selectedIds.size} selected item${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusyAction("bulk-delete");
    try {
      if (isSchedules) {
        const selected = allSchedules.filter((item) => selectedIds.has(item.id));
        await Promise.all(selected.map((item) => item.source === "local" ? Promise.resolve(removeLocalSeason(item.season.id)) : fetch(`/api/seasons/${item.season.id}`, { method: "DELETE" })));
        refreshLocalSeasons();
        setSeasons((current) => {
          const next = current.filter((season) => !selected.some((item) => item.source === "cloud" && item.season.id === season.id));
          dashboardCache.seasons = next;
          return next;
        });
      } else {
        const selected = savedLeagues.filter((preset) => selectedIds.has(`league:${preset.id}`));
        await Promise.all(selected.map((preset) => fetch(`/api/saved-leagues?id=${encodeURIComponent(preset.id)}`, { method: "DELETE" })));
        setSavedLeagues((current) => {
          const next = current.filter((preset) => !selectedIds.has(`league:${preset.id}`));
          dashboardCache.savedLeagues = next;
          return next;
        });
      }
      setSelectedIds(new Set());
    } finally {
      setBusyAction(null);
    }
  };
  const renderPagination = () => pageCount > 1 ? <div className="product-pagination">
    <button type="button" className="button-secondary" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button>
    <span>Page {page + 1} of {pageCount}</span>
    <button type="button" className="button-secondary" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button>
  </div> : null;
  const activeControlCount = (queryText ? 1 : 0)
    + (isSchedules ? scheduleFilter !== "all" ? 1 : 0 : leagueFilter !== "all" ? 1 : 0)
    + (sortMode !== "updated-desc" ? 1 : 0)
    + (selectedIds.size ? 1 : 0);

  return <section className="product-dashboard page-width" aria-labelledby="fantasy-dashboard-title">
    <header className="product-dashboard-hero">
      <div>
        <p className="eyebrow">Fantasy Football</p>
        <h1 id="fantasy-dashboard-title">{isSchedules ? "Choose a schedule to work on." : "Choose a saved league to reuse."}</h1>
        <p>{isSchedules ? "Open a saved fantasy football season, or build a new schedule when you are ready." : "Saved leagues keep your league, teams, divisions, colors, and logos ready for the next schedule."}</p>
      </div>
      <div className="product-dashboard-actions">
        {isSchedules ? <Link className="button-secondary" href="/fantasy/leagues"><FolderHeart />Saved leagues</Link> : <Link className="button-secondary" href="/fantasy/schedules"><CalendarDays />My schedules</Link>}
        <Link className="button-primary" href="/build"><Plus />New schedule</Link>
      </div>
    </header>
    <div className={`product-manager-controls${managerControlsOpen ? " is-open" : ""}`}>
      <button type="button" className="product-manager-toggle" aria-expanded={managerControlsOpen} aria-controls="fantasy-manager-controls" onClick={() => setManagerControlsOpen((current) => !current)}>
        <Search />
        <span>{isSchedules ? "Search schedules" : "Search leagues"}</span>
        {activeControlCount > 0 && <em>{activeControlCount}</em>}
      </button>
      <section id="fantasy-manager-controls" className="product-manager-toolbar" aria-label={`${isSchedules ? "Schedule" : "Saved league"} controls`}>
        <label className="product-search"><Search /><input value={query} placeholder={isSchedules ? "Search schedules" : "Search saved leagues, teams, or managers"} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></label>
        <label><span>Filter</span><select value={isSchedules ? scheduleFilter : leagueFilter} onChange={(event) => {
          if (isSchedules) setScheduleFilter(event.target.value as ScheduleFilter);
          else setLeagueFilter(event.target.value as LeagueFilter);
          setPage(0);
        }}>
          {isSchedules ? <>
            <option value="all">All schedules</option>
            <option value="cloud">Cloud schedules</option>
            <option value="local">Guest schedules</option>
          </> : <>
            <option value="all">All leagues</option>
            <option value="small">10 teams or fewer</option>
            <option value="standard">11-14 teams</option>
            <option value="large">15+ teams</option>
          </>}
        </select></label>
        <label><span>Sort</span><select value={sortMode} onChange={(event) => { setSortMode(event.target.value as SortMode); setPage(0); }}>
          <option value="updated-desc">Recently updated</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="teams-desc">Most teams</option>
          <option value="teams-asc">Fewest teams</option>
        </select></label>
        <button type="button" className="button-secondary" disabled={!activeItems.length} onClick={toggleAll}>{allVisibleSelected ? "Clear selection" : "Select all"}</button>
        <button type="button" className="button-secondary product-danger-action" disabled={!selectedIds.size || busyAction === "bulk-delete"} onClick={() => void bulkDelete()}>{busyAction === "bulk-delete" ? <LoaderCircle className="spin" /> : <Trash2 />}Delete selected</button>
      </section>
    </div>

    {showFullLoading && <LoadingPlaybook label={isSchedules ? "Downloading your schedules..." : "Loading saved leagues..."} />}
    {showBackgroundLoading && <DashboardLoadingNotice view={isSchedules ? "schedules" : "leagues"} />}
    {message && <div className="product-message" role="alert">{message}</div>}

    {!showFullLoading && isSchedules && <div className="product-dashboard-grid product-dashboard-grid-single">
      <section className="product-panel">
        <header><span><strong>My schedules</strong><small>Open a fantasy schedule workspace.</small></span></header>
        <div className="product-list">
          {pagedSchedules.map((entry) => {
            const isCloud = entry.source === "cloud";
            const seasonTeams = isCloud ? teamPreviewForSeason(entry.season) : loadSeasonById(entry.season.id)?.setup.teams ?? [];
            const title = isCloud ? entry.season.title : entry.season.name;
            const color = isCloud ? entry.season.color || "#117A45" : entry.season.color || "#117A45";
            const logoUrl = isCloud ? entry.season.logo_url ?? undefined : entry.season.logoUrl;
            const initials = isCloud ? entry.season.initials ?? undefined : entry.season.initials;
            const rowActions: DashboardRowAction[] = [
              { label: "Share", icon: <Share2 />, disabled: Boolean(busyAction), onSelect: () => setShareSchedule(entry) },
              { label: "Copy", icon: <Copy />, loading: busyAction === `copy:${entry.id}`, disabled: Boolean(busyAction), onSelect: () => void copySchedule(entry) },
              { label: "Delete", icon: <Trash2 />, loading: busyAction === `delete:${entry.id}`, disabled: Boolean(busyAction), danger: true, onSelect: () => void deleteSchedule(entry) },
            ];
            return <article className="product-row product-manager-row schedule-manager-row" key={entry.id}>
              <input type="checkbox" aria-label={`Select ${title}`} checked={selectedIds.has(entry.id)} onChange={() => toggleSelected(entry.id)} />
              <Link className="product-row-main" href={`/season/${entry.season.id}`}>
                <EntityLogo size={44} color={color} logoUrl={logoUrl} monogram={resolveInitials(initials, leagueAcronym(title))} entityType="league" />
                <span><strong>{title}</strong><small>{isCloud ? seasonLabel(entry.season) : localSeasonLabel(entry.season)}</small><small>{isCloud ? `Updated ${formatTimestamp(entry.season.updated_at)}` : "Guest schedule"}</small></span>
              </Link>
              <TeamStrip teams={seasonTeams} />
              <div className="product-row-actions">
                <Link className="button-secondary" href={`/season/${entry.season.id}?recap=1`}><Sparkles />Recap</Link>
              </div>
              <RowActionsMenu actions={rowActions} label={`${title} actions`} />
            </article>;
          })}
          {!hasSchedules && <div className="product-empty product-empty-action"><CalendarDays /><span><strong>{signedOut ? "Sign in to see cloud schedules." : "No saved schedules yet."}</strong><small>{signedOut ? "Your schedules may be saved to your League Weaver account. Sign in to bring them back." : "Build a schedule to start your fantasy football workspace."}</small></span><Link className="button-secondary" href="/account?next=/fantasy/schedules">Sign in</Link><Link className="button-primary" href="/build">Start building</Link></div>}
          {hasSchedules && !pagedSchedules.length && <div className="product-empty"><Search /><span><strong>No schedules match.</strong><small>Try a different search or filter.</small></span></div>}
        </div>
        {renderPagination()}
      </section>
    </div>}

    {!showFullLoading && !isSchedules && <div className="product-dashboard-grid product-dashboard-grid-single">
      <section className="product-panel">
        <header><span><strong>Saved leagues</strong><small>Reuse league details for fantasy schedules.</small></span></header>
        <div className="product-list">
          {savedLeagues.length ? pagedLeagues.map((preset) => {
            const league = preset.data.league;
            const id = `league:${preset.id}`;
            const rowActions: DashboardRowAction[] = [
              { label: "Use for a schedule", icon: <CalendarPlus />, href: `/build?savedLeagueId=${preset.id}` },
              { label: "Edit league", icon: <Pencil />, disabled: Boolean(busyAction), onSelect: () => setEditingPreset(preset) },
              { label: "Copy league", icon: <Copy />, loading: busyAction === `copy:${id}`, disabled: Boolean(busyAction), onSelect: () => void copyLeague(preset) },
              { label: "Delete league", icon: <Trash2 />, loading: busyAction === `delete:${id}`, disabled: Boolean(busyAction), danger: true, onSelect: () => void deleteLeague(preset) },
            ];
            return <article className="product-row product-manager-row saved-league-manager-row" key={preset.id}>
              <input type="checkbox" aria-label={`Select ${league.name || preset.name}`} checked={selectedIds.has(id)} onChange={() => toggleSelected(id)} />
              <Link className="product-row-main" href={`/build?savedLeagueId=${preset.id}`}>
                <EntityLogo size={44} color={league.color} logoUrl={league.logoUrl} monogram={resolveInitials(league.initials, leagueAcronym(league.name))} entityType="league" />
                <span><strong>{league.name || preset.name}</strong><small>{teamCountLabel(preset.data.teams.length)} · {preset.data.divisions.length} divisions</small><small>Updated {formatTimestamp(preset.updatedAt)}</small></span>
              </Link>
              <TeamStrip teams={preset.data.teams} />
              <RowActionsMenu actions={rowActions} label={`${league.name || preset.name} actions`} />
            </article>;
          }) : <div className="product-empty product-empty-action"><FolderHeart /><span><strong>{signedOut ? "Sign in to see saved leagues." : "No saved leagues yet."}</strong><small>{signedOut ? "Saved leagues live in your League Weaver account." : "Save one from the builder after confirming teams and divisions."}</small></span>{signedOut && <Link className="button-secondary" href="/account?next=/fantasy/leagues">Sign in</Link>}<Link className="button-primary" href="/build">Start building</Link></div>}
          {savedLeagues.length > 0 && !pagedLeagues.length && <div className="product-empty"><Search /><span><strong>No saved leagues match.</strong><small>Try a different search or filter.</small></span></div>}
        </div>
        {renderPagination()}
      </section>
    </div>}
    {editingPreset && <SavedLeagueEditor preset={editingPreset} onClose={() => setEditingPreset(null)} onSaved={(updated) => { setSavedLeagues((current) => {
      const next = current.map((preset) => preset.id === updated.id ? updated : preset);
      dashboardCache.savedLeagues = next;
      return next;
    }); setEditingPreset(null); }} />}
    {shareSchedule && <ScheduleShareModal
      item={shareSchedule}
      status={shareStatus}
      loading={shareLoading}
      busy={shareBusy}
      copied={shareCopied}
      message={shareMessage}
      publicDisplay={sharePublicDisplay}
      onPublicDisplayChange={setSharePublicDisplay}
      onClose={() => setShareSchedule(null)}
      onPublish={() => void publishSharedSchedule()}
      onCopy={() => void copySharedScheduleLink()}
      onUnpublish={() => void unpublishSharedSchedule()}
    />}
  </section>;
}
