"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, ChevronDown, FileDown, FileSpreadsheet, HelpCircle, LoaderCircle, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2, Trash, Upload, X } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { extractLogoColors } from "@/lib/imageColors";
import { apiErrorMessage } from "@/lib/apiErrors";
import { tintColor } from "@/lib/colorContrast";
import type { ImportPreview, ImportTeam, LeagueSetupInput } from "@/lib/types";

export type ImportSource = ImportPreview["provider"];

const TEAM_COLORS = ["#B91C1C", "#1D4ED8", "#7C3AED", "#C2410C", "#047857", "#BE185D", "#0369A1", "#4D7C0F", "#A16207", "#4338CA", "#0F766E", "#9F1239", "#6D28D9", "#166534", "#1E40AF", "#854D0E"];
const ESPN_IMPORT_HISTORY_KEY = "leagueweaver:v3:espn-imports";
const MAX_PASTE_IMPORT_CHARS = 50_000;
const MAX_IMPORT_TEAMS = 32;
const CSV_TEMPLATE = "City,Team,Manager,Manager Email,Division,Rank,Venue,Color\n,,,,,,,\n,,,,,,,";
const SAMPLE_ROSTER = [
  "City,Team,Manager,Manager Email,Division,Rank,Venue,Color",
  "Brooklyn,Sunday Architects,Anthony,anthony@example.com,North,1,Foundry Field,#B91C1C",
  "Chicago,Fourth & Forever,Riley,riley@example.com,North,2,The Yard,#1D4ED8",
  "Seattle,Red Zone Society,Morgan,morgan@example.com,North,3,Victory Grounds,#7C3AED",
  "Baltimore,Blitz Department,Casey,casey@example.com,North,4,The Gridiron,#C2410C",
  "Denver,Waiver Wire Works,Jordan,jordan@example.com,North,5,Summit Field,#047857",
  "Austin,Goal Line Guild,Sam,sam@example.com,South,6,Union Stadium,#BE185D",
  "Phoenix,Gridiron Union,Alex,alex@example.com,South,7,Commission Park,#0369A1",
  "Nashville,Huddle House,Drew,drew@example.com,South,8,Music Row,#4D7C0F",
  "Dallas,Sunday Sailors,Pat,pat@example.com,South,9,Star Field,#A16207",
  "Miami,Tide Turners,Lee,lee@example.com,South,10,Palm Bowl,#4338CA",
].join("\n");

function detectRosterShape(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { count: 0, hasHeader: false };
  const firstCells = lines[0].split(/\t|,/).map((cell) => cell.trim().toLowerCase());
  const hasHeader = firstCells.some((cell) => ["city", "team", "team name", "manager", "owner", "email", "manager email", "owner email", "division", "rank", "stadium", "venue", "color", "colour", "hex"].includes(cell));
  return { count: Math.min(hasHeader ? lines.length - 1 : lines.length, MAX_IMPORT_TEAMS), hasHeader };
}

function downloadCsvTemplate() {
  if (typeof document === "undefined") return;
  const anchor = document.createElement("a");
  anchor.href = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;
  anchor.download = "league-weaver-roster-template.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

const SOURCE_META: Record<ImportSource, { title: string; description: string; icon: React.ReactNode }> = {
  sleeper: { title: "Import from Sleeper", description: "Use a league ID or Sleeper username. No password needed.", icon: <img src="/providers/sleeper.png" alt="" /> },
  espn: { title: "Connect ESPN", description: "Paste your public league URL or ID. No password needed.", icon: <img src="/providers/espn.png" alt="" /> },
  csv: { title: "Import CSV roster", description: "Paste rows from a spreadsheet. Headers are optional.", icon: <FileSpreadsheet /> },
  paste: { title: "Paste a team list", description: "Use one team per line or comma-separated rows.", icon: <FileSpreadsheet /> },
  screenshot: { title: "Import a screenshot", description: "Upload a clear league or weekly-score screenshot, then review every result.", icon: <Upload /> },
};

interface SavedEspnImport {
  id: string;
  identifier: string;
  leagueName: string;
  seasonYear: number;
  teamCount: number;
  divisions: string[];
  teamMarks?: { url?: string; color: string }[];
  updatedAt: string;
}

function loadSavedEspnImports() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ESPN_IMPORT_HISTORY_KEY) || "[]") as SavedEspnImport[];
    return parsed.filter((item) => item.id && item.identifier && item.leagueName).slice(0, 5);
  } catch {
    return [];
  }
}

function saveEspnImport(identifier: string, preview: ImportPreview) {
  if (typeof window === "undefined" || preview.provider !== "espn") return [];
  const divisions = Array.from(new Set(preview.teams.map((team) => cleanDivisionName(team.division)).filter(Boolean)));
  const saved: SavedEspnImport = {
    id: preview.providerLeagueId || identifier,
    identifier,
    leagueName: preview.leagueName || "ESPN league",
    seasonYear: preview.seasonYear || new Date().getFullYear(),
    teamCount: preview.teams.length,
    divisions,
    // Every team (not just a capped few) as a colour-filled mark; the logo sits on top when
    // there is one, otherwise the team colour alone stands in.
    teamMarks: preview.teams.map((team, index) => ({ url: team.logoUrl || undefined, color: team.color || TEAM_COLORS[index % TEAM_COLORS.length] || "#5f6f67" })),
    updatedAt: new Date().toISOString(),
  };
  const next = [saved, ...loadSavedEspnImports().filter((item) => item.id !== saved.id && item.identifier !== identifier)].slice(0, 5);
  try {
    window.localStorage.setItem(ESPN_IMPORT_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode write failures — the import still succeeds.
  }
  return next;
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("We couldn't read that image."));
    reader.readAsDataURL(file);
  });
}

function parsePastedRoster(value: string, provider: "csv" | "paste"): ImportPreview {
  const warnings: string[] = [];
  if (value.length > MAX_PASTE_IMPORT_CHARS) {
    warnings.push("Only the first 50,000 characters were reviewed. Paste 8–32 team rows for the cleanest import.");
  }
  const lines = value.slice(0, MAX_PASTE_IMPORT_CHARS).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstCells = lines[0]?.split(/\t|,/).map((cell) => cell.trim().toLowerCase()) ?? [];
  const hasHeader = firstCells.some((cell) => ["city", "team", "team name", "manager", "owner", "email", "manager email", "owner email", "division", "rank", "stadium", "venue", "color", "colour", "hex"].includes(cell));
  const headers = hasHeader ? firstCells : [];
  const dataLines = (hasHeader ? lines.slice(1) : lines).slice(0, MAX_IMPORT_TEAMS);
  if ((hasHeader ? lines.slice(1) : lines).length > MAX_IMPORT_TEAMS) {
    warnings.push("Only the first 32 team rows were imported. League Weaver supports 8–32 teams.");
  }
  const names = new Map<string, number>();
  const teams = dataLines.map((line, index) => {
    const cells = line.split(/\t|,/).map((cell) => cell.trim());
    const at = (names: string[], fallback: number) => {
      const headerIndex = headers.findIndex((header) => names.includes(header));
      return cells[headerIndex >= 0 ? headerIndex : fallback] ?? "";
    };
    const name = (at(["team", "team name"], 0) || `Team ${index + 1}`).slice(0, 80);
    const duplicateKey = name.trim().toLowerCase();
    if (duplicateKey) names.set(duplicateKey, (names.get(duplicateKey) ?? 0) + 1);
    // Colour is header-only (never positional) and validated as a 6-digit hex; anything else
    // falls back to a distinct default so a stray value can't blank a team's colour.
    const colorCell = at(["color", "colour", "hex"], -1).trim().replace(/^#/, "");
    const color = /^[0-9a-fA-F]{6}$/.test(colorCell) ? `#${colorCell.toUpperCase()}` : TEAM_COLORS[index % TEAM_COLORS.length];
    return {
      providerId: `${provider}-${index + 1}`,
      city: (hasHeader ? at(["city", "location"], -1) : "").slice(0, 60),
      name,
      manager: at(["manager", "owner"], 1).slice(0, 80),
      managerEmail: at(["email", "manager email", "owner email"], -1).slice(0, 120),
      division: at(["division"], 2).slice(0, 60),
      rank: Number(at(["rank", "overall rank"], 3)) || index + 1,
      stadium: at(["stadium", "venue"], 4).slice(0, 90),
      color,
    } satisfies ImportTeam;
  });
  const duplicateNames = [...names.entries()].filter(([, count]) => count > 1).map(([name]) => name);
  if (duplicateNames.length) warnings.push(`Duplicate team names found: ${duplicateNames.slice(0, 3).join(", ")}. Rename duplicates before confirming.`);
  return {
    provider,
    teams,
    hasPriorSeasonRanks: hasHeader && headers.some((header) => ["rank", "overall rank"].includes(header)),
    warnings: hasHeader ? warnings : ["No headers were found, so columns were read as team, manager, division, rank, and venue.", ...warnings],
    requiresConfirmation: true,
  };
}

function cleanDivisionName(value?: string) {
  return value?.replace(/\s+division$/i, "").trim() || "";
}

function TeamPreviewRow({ team, index, source, expanded, duplicate, onToggle, onChange, onRemove, canRemove }: { team: ImportTeam; index: number; source: ImportSource; expanded: boolean; duplicate: boolean; onToggle: () => void; onChange: (next: ImportTeam) => void; onRemove: () => void; canRemove: boolean }) {
  const abbreviation = team.name.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase() || `T${index + 1}`;
  const showVenue = source !== "espn";
  const division = cleanDivisionName(team.division);
  const problem = !team.name.trim() ? "Needs a name" : duplicate ? "Duplicate" : null;
  return (
    <div className={`import-review-row${expanded ? " is-open" : ""}${problem ? " has-problem" : ""}`}>
      <button type="button" className="import-review-toggle" aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Edit"} ${team.name || `team ${index + 1}`}`} onClick={onToggle}>
        <span className="import-review-swatch" style={{ background: team.color ?? TEAM_COLORS[index % TEAM_COLORS.length] }}>{team.logoUrl ? <img src={team.logoUrl} alt="" /> : abbreviation}</span>
        <span className="import-review-summary-text"><strong>{team.name || `Team ${index + 1}`}</strong><small>{[division || "No division", team.manager || "No manager"].join(" · ")}</small></span>
        {problem && <span className="import-review-flag">{problem}</span>}
        <ChevronDown className="import-review-chev" aria-hidden="true" />
      </button>
      <div className="import-review-fields">
        <div className="import-review-identity"><span>Logo &amp; color</span><IdentityColorPicker compact showAbbreviation={false} name={team.name} abbreviation={abbreviation} color={team.color ?? TEAM_COLORS[index % TEAM_COLORS.length]} colorSuggestions={team.colorSuggestions} logoUrl={team.logoUrl} onChange={(identity) => onChange({ ...team, ...identity })} /></div>
        <label><span>City</span><input aria-label={`Imported team ${index + 1} city`} value={team.city ?? ""} placeholder="City" onChange={(event) => onChange({ ...team, city: event.target.value })} /></label>
        <label><span>Team name</span><input aria-label={`Imported team ${index + 1} name`} value={team.name} placeholder="Team name" onChange={(event) => onChange({ ...team, name: event.target.value })} /></label>
        <label><span>Manager</span><input aria-label={`${team.name} manager`} value={team.manager ?? ""} placeholder="Manager" onChange={(event) => onChange({ ...team, manager: event.target.value })} /></label>
        <label><span>Manager email</span><input type="email" aria-label={`${team.name} manager email`} value={team.managerEmail ?? ""} placeholder="manager@email.com" onChange={(event) => onChange({ ...team, managerEmail: event.target.value })} /></label>
        <label><span>Division</span><input aria-label={`${team.name} division`} value={division} placeholder="Division" onChange={(event) => onChange({ ...team, division: cleanDivisionName(event.target.value) })} /></label>
        {showVenue && <label><span>Home venue</span><input aria-label={`${team.name} venue`} value={team.stadium ?? ""} placeholder="Home venue" onChange={(event) => onChange({ ...team, stadium: event.target.value })} /></label>}
        <button type="button" className="import-review-remove" aria-label={`Remove ${team.name || `team ${index + 1}`}`} title={canRemove ? "Remove team" : "Keep at least 8 teams"} disabled={!canRemove} onClick={onRemove}><Trash2 /></button>
      </div>
    </div>
  );
}

export function ImportLeagueModal({ source, setup, onClose, onConfirm }: {
  source: ImportSource;
  setup: LeagueSetupInput;
  onClose: () => void;
  onConfirm: (preview: ImportPreview) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [season, setSeason] = useState(String(setup.seasonYear));
  const syncMode = "manual" as const;
  const [pasteValue, setPasteValue] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [espnHelpOpen, setEspnHelpOpen] = useState(false);
  const [savedEspnImports, setSavedEspnImports] = useState<SavedEspnImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<null | "close" | "back">(null);
  const reviewListRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const manualIdCounter = useRef(0);
  // Bumped every time a new roster opens for review so a slow logo-color pass from a
  // superseded import (back button, re-import) can't write onto the current one.
  const enrichTokenRef = useRef(0);
  const meta = SOURCE_META[source];
  // Once someone is editing a parsed roster, an accidental backdrop click or Escape
  // shouldn't silently throw the work away — confirm first. A fresh (untouched)
  // preview or the input step still closes instantly, so we only nag when there's
  // real work to lose.
  const requestClose = () => {
    if (preview && reviewDirty) { setDiscardPrompt("close"); return; }
    abortRef.current?.abort();
    onClose();
  };
  const backToInput = () => {
    if (reviewDirty) { setDiscardPrompt("back"); return; }
    setPreview(null);
    setReviewDirty(false);
  };
  const confirmDiscard = () => {
    if (discardPrompt === "close") { abortRef.current?.abort(); onClose(); }
    else { setPreview(null); setReviewDirty(false); }
    setDiscardPrompt(null);
  };

  // Abort any in-flight import fetch if the modal unmounts mid-request. Focus,
  // scroll lock, and Escape are handled by <Modal>.
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (source !== "espn") return;
    const handle = window.setTimeout(() => setSavedEspnImports(loadSavedEspnImports()), 0);
    return () => window.clearTimeout(handle);
  }, [source]);

  const supported = preview ? preview.teams.length >= 8 && preview.teams.length <= 16 && preview.teams.length % 2 === 0 : false;
  const duplicatePreviewNames = preview ? preview.teams
    .map((team) => team.name.trim().toLowerCase())
    .filter(Boolean)
    .filter((name, index, names) => names.indexOf(name) !== index) : [];
  const rosterMessage = preview && !supported ? `League Weaver needs an even roster of 8–32 teams. This preview has ${preview.teams.length}.` : null;
  const duplicateMessage = duplicatePreviewNames.length ? "Rename duplicate teams before importing. Duplicate names make score entry, standings, and exports confusing." : null;
  // The per-team blockers a commissioner can actually fix in review (unnamed or duplicate).
  // A wrong-count/odd roster isn't in here because jumping to a row wouldn't help with it.
  const problemTeamIndices = preview ? preview.teams.reduce<number[]>((indices, team, index) => {
    const isDuplicate = Boolean(team.name.trim()) && duplicatePreviewNames.includes(team.name.trim().toLowerCase());
    if (!team.name.trim() || isDuplicate) indices.push(index);
    return indices;
  }, []) : [];
  const jumpToProblems = () => {
    if (!problemTeamIndices.length) return;
    setExpandedTeams((current) => { const next = new Set(current); problemTeamIndices.forEach((index) => next.add(index)); return next; });
    // Instant, not smooth: smooth scrollIntoView silently no-ops inside this nested
    // overflow:auto table (the animation gets cancelled by the expand re-render), so the
    // jump would appear to do nothing. An instant scroll reliably brings the row into view.
    requestAnimationFrame(() => reviewListRef.current?.querySelector<HTMLElement>(".import-review-row.has-problem")?.scrollIntoView({ block: "center" }));
  };
  const canStart = source === "csv" || source === "paste" ? pasteValue.trim().length > 0 : source === "screenshot" ? true : identifier.trim().length > 0;
  // ESPN league IDs are numeric (and its share URLs carry `leagueId=<number>`), so a value
  // with no digit at all is almost certainly a typo — flag it before we spend a round-trip.
  // Sleeper accepts a username, so we don't validate its shape.
  const espnIdentifierInvalid = source === "espn" && identifier.trim().length > 0 && !/\d/.test(identifier);
  const reviewColumns = preview?.provider === "espn"
    ? "78px 115px minmax(150px,1.2fr) minmax(120px,.9fr) minmax(110px,.8fr) 40px"
    : "78px 115px minmax(150px,1.2fr) minmax(120px,.9fr) minmax(110px,.8fr) minmax(140px,1fr) 40px";

  const createPreview = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (source === "csv" || source === "paste") {
        const parsed = parsePastedRoster(pasteValue, source);
        if (!parsed.teams.length) {
          setError("We couldn't find any teams in that text. Paste one team per line, or tap “Paste sample” to see the format.");
          return;
        }
        openReview(parsed);
        return;
      }
      if (source === "screenshot") return;
      const response = await fetch(`/api/import/${source}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, seasonYear: Number(season) }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, result.error, "The league could not be imported."));
      result.syncMode = syncMode;
      if (source === "espn") setSavedEspnImports(saveEspnImport(identifier.trim(), result));
      openReview(result);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "The league could not be imported.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const handleScreenshot = async (file?: File) => {
    if (!file) return;
    if (loading) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setError("Choose a PNG, JPG, or WebP image under 8 MB.");
      return;
    }
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const imageDataUrl = await readImage(file);
      const response = await fetch("/api/import/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, seasonYear: Number(season) }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(apiErrorMessage(response.status, result.error, "The screenshot could not be read."));
      openReview(result);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "The screenshot could not be read.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const updateTeam = (index: number, next: ImportTeam) => { setReviewDirty(true); setPreview((current) => current ? ({ ...current, teams: current.teams.map((team, teamIndex) => teamIndex === index ? next : team) }) : current); };
  const removeTeam = (index: number) => { setReviewDirty(true); setPreview((current) => current ? ({ ...current, teams: current.teams.filter((_, teamIndex) => teamIndex !== index) }) : current); };
  const addTeam = () => { setReviewDirty(true); setPreview((current) => {
    if (!current || current.teams.length >= MAX_IMPORT_TEAMS) return current;
    const position = current.teams.length;
    const blank: ImportTeam = { providerId: `manual-${manualIdCounter.current++}`, city: "", name: "", manager: "", division: "", rank: position + 1, stadium: "", color: TEAM_COLORS[position % TEAM_COLORS.length] };
    return { ...current, teams: [...current.teams, blank] };
  }); };
  const customYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = setup.seasonYear + 1; year >= setup.seasonYear - 9; year -= 1) years.push(year);
    return years.map((year) => ({ value: String(year), label: `${year} season` }));
  }, [setup.seasonYear]);
  const csvShape = useMemo(() => detectRosterShape(pasteValue), [pasteValue]);

  // Providers like ESPN and Sleeper give us a team logo but usually no colors. Pull the
  // top colors straight from each logo so the swatches populate and the "best" (most
  // dominant) color is pre-selected — without waiting on the network before showing the
  // roster. Teams that already carry colors (e.g. a curated rule) are left untouched, and
  // this never marks the review dirty, so no bogus "discard edits" prompt appears.
  const enrichLogoColors = async (result: ImportPreview) => {
    const token = ++enrichTokenRef.current;
    const targets = result.teams.filter((team) => team.logoUrl && team.providerId && !team.colorSuggestions?.length);
    if (!targets.length) return;
    await Promise.all(targets.map(async (team) => {
      const colors = await extractLogoColors(team.logoUrl!);
      if (enrichTokenRef.current !== token || !colors.length) return;
      setPreview((current) => current ? {
        ...current,
        teams: current.teams.map((candidate) => candidate.providerId === team.providerId
          ? { ...candidate, colorSuggestions: colors, color: candidate.color || colors[0] }
          : candidate),
      } : current);
    }));
  };

  const openReview = (result: ImportPreview) => {
    const incomplete = new Set<number>();
    result.teams.forEach((team, index) => { if (!team.name.trim()) incomplete.add(index); });
    setExpandedTeams(incomplete);
    setPreview(result);
    setReviewDirty(false);
    void enrichLogoColors(result);
  };
  const toggleTeam = (index: number) => setExpandedTeams((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });
  const handleCsvFile = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Choose a CSV or text file under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setError(null); setPasteValue(String(reader.result || "").slice(0, MAX_PASTE_IMPORT_CHARS)); };
    reader.onerror = () => setError("We couldn't read that file.");
    reader.readAsText(file);
  };

  return (
    <Modal onClose={requestClose} className="import-modal" labelledBy="import-modal-title" busy={loading}>
        <header className="import-modal-head">
          <span className={`import-provider-mark ${source}`}>{meta.icon}</span>
          <div><span className="step-kicker">League import</span><h2 id="import-modal-title">{meta.title}</h2><p>{meta.description}</p></div>
          <button type="button" className="icon-button" aria-label="Close import" onClick={requestClose}><X /></button>
        </header>

        {!preview ? (
          <div className="import-modal-body">
            {(source === "sleeper" || source === "espn") && <>
              <div className="import-form-grid">
                <label><span>{source === "sleeper" ? "League ID or username" : "Public ESPN league URL or ID"}</span><input autoFocus value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={source === "sleeper" ? "Example: 123456789 or username" : "https://fantasy.espn.com/football/league?leagueId=11593953"} /></label>
                <label><span>Season</span><CustomSelect label="Import season" value={season} onChange={setSeason} options={customYearOptions} /></label>
              </div>
              <p className="import-hint"><RefreshCw />{source === "sleeper" ? "Read-only. Works with your league ID or Sleeper username — refresh teams and scores anytime, no password." : "Read-only. Refresh teams and scores whenever you click — no password, ever."}</p>
              {espnIdentifierInvalid && <p className="import-inline-hint"><AlertCircle />Add your league URL or the numeric League ID — usually the number right after “leagueId=”.</p>}
              {source === "espn" && <>
                <div className="import-public-note"><ShieldCheck /><div><strong>Your ESPN league must be public to import.</strong><span>League Weaver reads public league data only — it never needs your ESPN password.</span></div></div>
                <div className="import-help">
                  <button type="button" className="import-help-toggle" aria-expanded={espnHelpOpen} onClick={() => setEspnHelpOpen((current) => !current)}><HelpCircle />Find your League ID &amp; make your league public<ChevronDown className={espnHelpOpen ? "open" : ""} /></button>
                  {espnHelpOpen && <div className="import-help-steps">
                    <div>
                      <strong>On desktop</strong>
                      <ol>
                        <li>Open your league at fantasy.espn.com — your League ID is the number after <code>leagueId=</code> in the address bar. Paste the whole URL or just that number above.</li>
                        <li>From League Home, go to League → Settings.</li>
                        <li>On the Basic Settings card, set “Make League Viewable to Public” to Yes (click Edit first if it’s set to No).</li>
                      </ol>
                    </div>
                    <div>
                      <strong>In the ESPN app</strong>
                      <ol>
                        <li>Tap the League tab, then League Info.</li>
                        <li>Find your League ID on the Basic Settings card.</li>
                        <li>On that same card, confirm “Make League Viewable to Public” is Yes.</li>
                      </ol>
                    </div>
                  </div>}
                </div>
                {savedEspnImports.length > 0 && <div className="saved-imports"><span><strong>Recent ESPN imports</strong><small>Pick a saved public league URL.</small></span>{savedEspnImports.map((item) => <button type="button" key={`${item.id}-${item.seasonYear}`} onClick={() => { setIdentifier(item.identifier); setSeason(String(item.seasonYear)); }}>
                  <span className="saved-import-info"><strong>{item.leagueName}</strong><small>{item.teamCount} teams · {item.divisions.length ? item.divisions.join(" / ") : "No divisions"} · {item.seasonYear}</small></span>
                  {item.teamMarks && item.teamMarks.length > 0 && <span className="saved-import-logos">{item.teamMarks.map((mark, markIndex) => <span key={markIndex} className="saved-import-mark" style={{ background: tintColor(mark.color) }}>{mark.url && <img src={mark.url} alt="" loading="lazy" />}</span>)}</span>}
                </button>)}</div>}
              </>}
            </>}

            {(source === "csv" || source === "paste") && <div className="paste-import">
              <div className="paste-toolbar">
                <button type="button" className="paste-chip" onClick={() => setPasteValue(SAMPLE_ROSTER)}><Sparkles />Paste sample</button>
                {source === "csv" && <button type="button" className="paste-chip" onClick={downloadCsvTemplate}><FileDown />Template</button>}
                {source === "csv" && <label className="paste-chip"><Upload />Upload file<input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(event) => { handleCsvFile(event.target.files?.[0]); event.target.value = ""; }} /></label>}
              </div>
              <label
                className={`paste-field${dragging ? " is-dragging" : ""}`}
                onDragOver={source === "csv" ? (event) => { event.preventDefault(); setDragging(true); } : undefined}
                onDragLeave={source === "csv" ? (event) => { if (event.currentTarget === event.target) setDragging(false); } : undefined}
                onDrop={source === "csv" ? (event) => { event.preventDefault(); setDragging(false); handleCsvFile(event.dataTransfer.files?.[0]); } : undefined}
              >
                <span>Roster rows</span>
                <textarea autoFocus value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={"City, Team, Manager, Division, Rank, Venue\nBrooklyn, Sunday Architects, Anthony, North, 1, Foundry Field"} />
                <small>{source === "csv" ? "Paste from Google Sheets or Excel, drop a .csv here, or upload a file. Tabs and commas both work." : "One team per line, or comma-separated rows."}</small>
              </label>
              {pasteValue.trim().length > 0 && <div className={`paste-detected${csvShape.count >= 8 && csvShape.count <= 16 && csvShape.count % 2 === 0 ? " ok" : ""}`}>
                <Check />
                <span><strong>{csvShape.count} {csvShape.count === 1 ? "team" : "teams"} detected</strong><small>{csvShape.hasHeader ? "Headers found — mapping City · Team · Manager · Division · Rank · Venue · Color." : "No headers — reading columns as Team · Manager · Division · Rank · Venue."}</small></span>
              </div>}
            </div>}

            {source === "screenshot" && <div
              className={`screenshot-drop${dragging ? " is-dragging" : ""}`}
              onDragOver={(event) => { event.preventDefault(); if (!loading) setDragging(true); }}
              onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
              onDrop={(event) => { event.preventDefault(); setDragging(false); if (!loading) handleScreenshot(event.dataTransfer.files?.[0]); }}
            >
              <input id="screenshot-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleScreenshot(event.target.files?.[0])} />
              <label htmlFor="screenshot-file"><Upload /><strong>Choose a league screenshot</strong><span>PNG, JPG, or WebP up to 8 MB</span></label>
              <div className="screenshot-safety"><ShieldCheck />Nothing is saved until you review and confirm.</div>
            </div>}

            {loading && (source === "espn" || source === "sleeper") && <p className="import-inline-hint import-inline-hint-wait"><LoaderCircle className="spin" />Fetching your league — public ESPN and Sleeper leagues usually take just a few seconds.</p>}
            {error && <div className="import-error" role="alert"><AlertCircle />{error}</div>}
          </div>
        ) : (
          <div className="import-modal-body import-review">
            <div className="import-review-summary">
              <div className="import-review-summary-lead">
                {preview.leagueName && <span className="import-review-league">{preview.leagueName}</span>}
                <span className="import-review-count">{preview.teams.length} {preview.teams.length === 1 ? "team" : "teams"} found</span>
                <p>Review team names, logos, team colors, managers, and divisions.</p>
              </div>
              {supported && problemTeamIndices.length === 0
                ? <span className="import-status ready"><Check />Ready</span>
                : problemTeamIndices.length > 0
                  ? <button type="button" className="import-status blocked import-status-button" onClick={jumpToProblems}><AlertCircle />{problemTeamIndices.length} to fix</button>
                  : <span className="import-status blocked"><AlertCircle />Needs edits</span>}
            </div>
            {preview.dataFound && <div className="import-data-found">
              <span><strong>{preview.dataFound.availableHistoryYears.length || "No"} history years</strong><small>{preview.dataFound.availableHistoryYears.join(", ") || "None found yet"}</small></span>
              <span><strong>{preview.dataFound.hasDraftData ? "Draft found" : "No draft yet"}</strong><small>Team setup stays active.</small></span>
              <span><strong>Player data paused</strong><small>Team setup and score refresh stay active.</small></span>
              <span><strong>{preview.dataFound.hasScoreSync ? "Score refresh ready" : "Scores unavailable"}</strong><small>Manual score refresh stays free.</small></span>
            </div>}
            {(rosterMessage || duplicateMessage || preview.warnings.length > 0 || preview.provider === "espn") && <div className="import-warning"><AlertCircle /><div>{rosterMessage && <strong>{rosterMessage}</strong>}{duplicateMessage && <strong>{duplicateMessage}</strong>}{preview.provider === "espn" && <strong>Home venues are added after import on the Teams step.</strong>}{preview.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div></div>}
            <div className="import-review-controls">
              <span>Tap a team to edit its details</span>
              <button type="button" onClick={() => setExpandedTeams(expandedTeams.size === preview.teams.length ? new Set() : new Set(preview.teams.map((_, index) => index)))}>{expandedTeams.size === preview.teams.length ? "Collapse all" : "Expand all"}</button>
            </div>
            <div className="import-review-table" style={{ "--import-review-columns": reviewColumns } as React.CSSProperties}>
              <div className="import-review-head"><span>Logo/color</span><span>City</span><span>Team name</span><span>Manager</span><span>Division</span>{preview.provider !== "espn" && <span>Venue</span>}<span aria-hidden="true" /></div>
              <div className="import-review-list" ref={reviewListRef}>{preview.teams.map((team, index) => <TeamPreviewRow key={team.providerId ?? index} team={team} index={index} source={preview.provider} expanded={expandedTeams.has(index)} duplicate={Boolean(team.name.trim()) && duplicatePreviewNames.includes(team.name.trim().toLowerCase())} onToggle={() => toggleTeam(index)} onChange={(next) => updateTeam(index, next)} onRemove={() => removeTeam(index)} canRemove={preview.teams.length > 8} />)}</div>
            </div>
            <div className="import-review-foot">
              <button type="button" className="import-review-add" disabled={preview.teams.length >= MAX_IMPORT_TEAMS} onClick={addTeam}><Plus />Add a team</button>
              <small>{preview.teams.length} of 8–32 teams · League Weaver needs an even roster.</small>
            </div>
          </div>
        )}

        <footer className="import-modal-actions">
          <button type="button" className="button-secondary visible" disabled={loading} onClick={preview ? backToInput : requestClose}>{preview ? <><ArrowLeft />Back</> : "Cancel"}</button>
          {!preview && source !== "screenshot" && <button type="button" className="button-primary" disabled={!canStart || loading} onClick={createPreview}>{loading ? <><LoaderCircle className="spin" />Importing…</> : "Review import"}</button>}
          {preview && <button type="button" className="button-primary" disabled={!supported || Boolean(duplicateMessage) || preview.teams.some((team) => !team.name.trim())} onClick={() => onConfirm(preview)}><Check />Use this roster</button>}
        </footer>
      {discardPrompt && <ConfirmDialog
        role="alertdialog"
        tone="danger"
        icon={<Trash />}
        kicker="UNSAVED EDITS"
        title={discardPrompt === "close" ? "Discard this imported roster?" : "Discard your edits?"}
        closeLabel="Keep editing"
        onClose={() => setDiscardPrompt(null)}
        actions={[
          { label: "Keep editing", onClick: () => setDiscardPrompt(null), variant: "secondary", autoFocus: true },
          { label: discardPrompt === "close" ? "Discard roster" : "Discard and go back", onClick: confirmDiscard, variant: "danger", icon: <Trash /> },
        ]}
      >
        <p>{discardPrompt === "close" ? "Your team edits won’t be saved." : "Your team edits will be lost, and you’ll choose a different import."}</p>
      </ConfirmDialog>}
    </Modal>
  );
}
