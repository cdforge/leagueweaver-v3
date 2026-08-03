"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Copy, FolderHeart, LoaderCircle, MoreHorizontal, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { SavedLeagueEditor } from "@/components/account/SavedLeagueEditor";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { LoadingPlaybook } from "@/components/ui/LoadingPlaybook";
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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return <div ref={ref} className="product-row-menu">
    <button type="button" className="button-secondary product-row-menu-button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <MoreHorizontal />
    </button>
    {open && <div className="product-row-menu-list" role="menu">
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
    </div>}
  </div>;
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
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [localSeasons, setLocalSeasons] = useState<LocalSeasonSummary[]>([]);
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>("all");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<SavedLeaguePreset | null>(null);
  const [cloudTeamDetails, setCloudTeamDetails] = useState<Record<string, Team[]>>({});
  const [managerControlsOpen, setManagerControlsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);
    setSignedOut(false);
    setPage(0);
    setQuery("");
    setSelectedIds(new Set());
    setManagerControlsOpen(false);
    setCloudTeamDetails({});
    setLocalSeasons(listLocalSeasons());
    createClient()?.auth.getUser().then(({ data }) => {
      if (active) setSignedOut(!data.user);
    }).catch(() => undefined);

    if (view === "schedules") {
      fetch("/api/seasons")
      .then(async (seasonResponse) => {
        const seasonPayload = await seasonResponse.json().catch(() => ({})) as { seasons?: SeasonSummary[]; error?: string };
        if (!active) return;
        if (seasonResponse.status === 401) {
          setSignedOut(true);
          setSeasons([]);
          return;
        }
        if (!seasonResponse.ok) throw new Error(seasonPayload.error ?? "Saved seasons could not be loaded.");
        const nextSeasons = seasonPayload.seasons ?? [];
        setSeasons(nextSeasons);
        setLoading(false);
        void fetchSavedLeaguePresets()
          .then((leagueResult) => { if (active) setSavedLeagues(leagueResult.presets); })
          .catch(() => undefined);
        const needsFullTeams = nextSeasons.filter((season) => (season.teams?.length ?? 0) <= 1);
        if (needsFullTeams.length) {
          void Promise.all(needsFullTeams.map(async (season) => {
            try {
              const detailResponse = await fetch(`/api/seasons/${season.id}`);
              if (!detailResponse.ok) return null;
              const detailPayload = await detailResponse.json().catch(() => ({})) as { schedule?: GeneratedSchedule };
              const teams = detailPayload.schedule?.setup?.teams;
              return Array.isArray(teams) && teams.length > (season.teams?.length ?? 0) ? [season.id, teams] as const : null;
            } catch {
              return null;
            }
          })).then((hydrated) => {
            if (!active) return;
            const fullTeamEntries = hydrated.filter((entry): entry is readonly [string, Team[]] => Boolean(entry));
            setCloudTeamDetails((current) => {
              const next = { ...current };
              for (const [id, teams] of fullTeamEntries) next[id] = teams;
              return next;
            });
            if (fullTeamEntries.length) {
              setSeasons((current) => current.map((season) => {
                const match = fullTeamEntries.find(([id]) => id === season.id);
                return match ? { ...season, teams: match[1] } : season;
              }));
            }
          });
        }
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Saved schedules could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }

    fetchSavedLeaguePresets()
      .then((leagueResult) => {
        if (!active) return;
        if (leagueResult.signedOut) {
          setSignedOut(true);
          setSavedLeagues([]);
          return;
        }
        setSavedLeagues(leagueResult.presets);
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Saved leagues could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view]);

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
  const allSchedules = [...seasons.map((season) => ({ id: `cloud:${season.id}`, source: "cloud" as const, season, name: season.title, updatedAt: season.updated_at, teamCount: teamPreviewForSeason(season).length })), ...localSeasons.map((season) => ({ id: `local:${season.id}`, source: "local" as const, season, name: season.name, updatedAt: String(season.savedAt), teamCount: season.teamCount }))];
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
  const pageCount = Math.ceil(activeItems.length / DASHBOARD_PAGE_SIZE);
  const pageStart = page * DASHBOARD_PAGE_SIZE;
  const pagedSchedules = scheduleItems.slice(pageStart, pageStart + DASHBOARD_PAGE_SIZE);
  const pagedLeagues = leagueItems.slice(pageStart, pageStart + DASHBOARD_PAGE_SIZE);
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
          setSeasons(payload.seasons ?? []);
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
        if (response.ok) setSeasons((current) => current.filter((season) => season.id !== item.season.id));
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
        if (normalized) setSavedLeagues((current) => [normalized, ...current]);
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
        setSavedLeagues((current) => current.filter((item) => item.id !== preset.id));
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
        setSeasons((current) => current.filter((season) => !selected.some((item) => item.source === "cloud" && item.season.id === season.id)));
      } else {
        const selected = savedLeagues.filter((preset) => selectedIds.has(`league:${preset.id}`));
        await Promise.all(selected.map((preset) => fetch(`/api/saved-leagues?id=${encodeURIComponent(preset.id)}`, { method: "DELETE" })));
        setSavedLeagues((current) => current.filter((preset) => !selectedIds.has(`league:${preset.id}`)));
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
        <label><span>Filter</span><select value={isSchedules ? scheduleFilter : leagueFilter} onChange={(event) => { isSchedules ? setScheduleFilter(event.target.value as ScheduleFilter) : setLeagueFilter(event.target.value as LeagueFilter); setPage(0); }}>
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

    {loading && <LoadingPlaybook label={isSchedules ? "Downloading your schedules..." : "Loading saved leagues..."} />}
    {message && <div className="product-message" role="alert">{message}</div>}

    {!loading && isSchedules && <div className="product-dashboard-grid product-dashboard-grid-single">
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
              { label: "Recap", href: `/season/${entry.season.id}?recap=1`, icon: <Sparkles /> },
              { label: "Copy", icon: <Copy />, loading: busyAction === `copy:${entry.id}`, disabled: Boolean(busyAction), onSelect: () => void copySchedule(entry) },
              { label: "Delete", icon: <Trash2 />, loading: busyAction === `delete:${entry.id}`, disabled: Boolean(busyAction), danger: true, onSelect: () => void deleteSchedule(entry) },
            ];
            return <article className="product-row product-manager-row" key={entry.id}>
              <input type="checkbox" aria-label={`Select ${title}`} checked={selectedIds.has(entry.id)} onChange={() => toggleSelected(entry.id)} />
              <Link className="product-row-main" href={`/season/${entry.season.id}`}>
                <EntityLogo size={44} color={color} logoUrl={logoUrl} monogram={resolveInitials(initials, leagueAcronym(title))} entityType="league" />
                <span><strong>{title}</strong><small>{isCloud ? seasonLabel(entry.season) : localSeasonLabel(entry.season)}</small><small>{isCloud ? `Updated ${formatTimestamp(entry.season.updated_at)}` : "Guest schedule"}</small></span>
              </Link>
              <TeamStrip teams={seasonTeams} />
              <div className="product-row-actions">
                <Link className="button-secondary" href={`/season/${entry.season.id}?recap=1`}><Sparkles />Recap</Link>
                <button type="button" className="button-secondary" disabled={Boolean(busyAction)} onClick={() => void copySchedule(entry)}>{busyAction === `copy:${entry.id}` ? <LoaderCircle className="spin" /> : <Copy />}Copy</button>
                <button type="button" className="button-secondary product-danger-action" disabled={Boolean(busyAction)} onClick={() => void deleteSchedule(entry)}>{busyAction === `delete:${entry.id}` ? <LoaderCircle className="spin" /> : <Trash2 />}Delete</button>
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

    {!loading && !isSchedules && <div className="product-dashboard-grid product-dashboard-grid-single">
      <section className="product-panel">
        <header><span><strong>Saved leagues</strong><small>Reuse league details for fantasy schedules.</small></span></header>
        <div className="product-list">
          {savedLeagues.length ? pagedLeagues.map((preset) => {
            const league = preset.data.league;
            const id = `league:${preset.id}`;
            const rowActions: DashboardRowAction[] = [
              { label: "Use", href: `/build?savedLeagueId=${preset.id}` },
              { label: "Edit", disabled: Boolean(busyAction), onSelect: () => setEditingPreset(preset) },
              { label: "Copy", icon: <Copy />, loading: busyAction === `copy:${id}`, disabled: Boolean(busyAction), onSelect: () => void copyLeague(preset) },
              { label: "Delete", icon: <Trash2 />, loading: busyAction === `delete:${id}`, disabled: Boolean(busyAction), danger: true, onSelect: () => void deleteLeague(preset) },
            ];
            return <article className="product-row product-manager-row" key={preset.id}>
              <input type="checkbox" aria-label={`Select ${league.name || preset.name}`} checked={selectedIds.has(id)} onChange={() => toggleSelected(id)} />
              <Link className="product-row-main" href={`/build?savedLeagueId=${preset.id}`}>
                <EntityLogo size={44} color={league.color} logoUrl={league.logoUrl} monogram={resolveInitials(league.initials, leagueAcronym(league.name))} entityType="league" />
                <span><strong>{league.name || preset.name}</strong><small>{teamCountLabel(preset.data.teams.length)} · {preset.data.divisions.length} divisions</small><small>Updated {formatTimestamp(preset.updatedAt)}</small></span>
              </Link>
              <TeamStrip teams={preset.data.teams} />
              <div className="product-row-actions">
                <Link className="button-secondary" href={`/build?savedLeagueId=${preset.id}`}>Use</Link>
                <button type="button" className="button-secondary" disabled={Boolean(busyAction)} onClick={() => setEditingPreset(preset)}>Edit</button>
                <button type="button" className="button-secondary" disabled={Boolean(busyAction)} onClick={() => void copyLeague(preset)}>{busyAction === `copy:${id}` ? <LoaderCircle className="spin" /> : <Copy />}Copy</button>
                <button type="button" className="button-secondary product-danger-action" disabled={Boolean(busyAction)} onClick={() => void deleteLeague(preset)}>{busyAction === `delete:${id}` ? <LoaderCircle className="spin" /> : <Trash2 />}Delete</button>
              </div>
              <RowActionsMenu actions={rowActions} label={`${league.name || preset.name} actions`} />
            </article>;
          }) : <div className="product-empty product-empty-action"><FolderHeart /><span><strong>{signedOut ? "Sign in to see saved leagues." : "No saved leagues yet."}</strong><small>{signedOut ? "Saved leagues live in your League Weaver account." : "Save one from the builder after confirming teams and divisions."}</small></span>{signedOut && <Link className="button-secondary" href="/account?next=/fantasy/leagues">Sign in</Link>}<Link className="button-primary" href="/build">Start building</Link></div>}
          {savedLeagues.length > 0 && !pagedLeagues.length && <div className="product-empty"><Search /><span><strong>No saved leagues match.</strong><small>Try a different search or filter.</small></span></div>}
        </div>
        {renderPagination()}
      </section>
    </div>}
    {editingPreset && <SavedLeagueEditor preset={editingPreset} onClose={() => setEditingPreset(null)} onSaved={(updated) => { setSavedLeagues((current) => current.map((preset) => preset.id === updated.id ? updated : preset)); setEditingPreset(null); }} />}
  </section>;
}
