"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Clock3, FileSpreadsheet, LoaderCircle, RefreshCw, ShieldCheck, Upload, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import type { ImportPreview, ImportTeam, LeagueSetupInput } from "@/lib/types";

export type ImportSource = ImportPreview["provider"];

const TEAM_COLORS = ["#B91C1C", "#1D4ED8", "#7C3AED", "#C2410C", "#047857", "#BE185D", "#0369A1", "#4D7C0F", "#A16207", "#4338CA", "#0F766E", "#9F1239", "#6D28D9", "#166534", "#1E40AF", "#854D0E"];
const ESPN_IMPORT_HISTORY_KEY = "leagueweaver:v3:espn-imports";
const MAX_PASTE_IMPORT_CHARS = 50_000;
const MAX_IMPORT_TEAMS = 16;

const SOURCE_META: Record<ImportSource, { title: string; description: string; icon: React.ReactNode }> = {
  sleeper: { title: "Import from Sleeper", description: "Use a league ID or Sleeper username. No password needed.", icon: <img src="/providers/sleeper.ico" alt="" /> },
  espn: { title: "Connect ESPN", description: "Paste a league URL or ID. Public leagues work first; private history can use guided cookie permission.", icon: <img src="/providers/espn.ico" alt="" /> },
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
    updatedAt: new Date().toISOString(),
  };
  const next = [saved, ...loadSavedEspnImports().filter((item) => item.id !== saved.id && item.identifier !== identifier)].slice(0, 5);
  window.localStorage.setItem(ESPN_IMPORT_HISTORY_KEY, JSON.stringify(next));
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
    warnings.push("Only the first 50,000 characters were reviewed. Paste 8–16 team rows for the cleanest import.");
  }
  const lines = value.slice(0, MAX_PASTE_IMPORT_CHARS).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstCells = lines[0]?.split(/\t|,/).map((cell) => cell.trim().toLowerCase()) ?? [];
  const hasHeader = firstCells.some((cell) => ["city", "team", "team name", "manager", "owner", "division", "rank", "stadium", "venue"].includes(cell));
  const headers = hasHeader ? firstCells : [];
  const dataLines = (hasHeader ? lines.slice(1) : lines).slice(0, MAX_IMPORT_TEAMS);
  if ((hasHeader ? lines.slice(1) : lines).length > MAX_IMPORT_TEAMS) {
    warnings.push("Only the first 16 team rows were imported. League Weaver supports 8–16 teams.");
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
    return {
      providerId: `${provider}-${index + 1}`,
      city: (hasHeader ? at(["city", "location"], -1) : "").slice(0, 60),
      name,
      manager: at(["manager", "owner"], 1).slice(0, 80),
      division: at(["division"], 2).slice(0, 60),
      rank: Number(at(["rank", "overall rank"], 3)) || index + 1,
      stadium: at(["stadium", "venue"], 4).slice(0, 90),
      color: TEAM_COLORS[index % TEAM_COLORS.length],
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

function TeamPreviewRow({ team, index, source, onChange }: { team: ImportTeam; index: number; source: ImportSource; onChange: (next: ImportTeam) => void }) {
  const abbreviation = team.name.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase() || `T${index + 1}`;
  const showVenue = source !== "espn";
  return (
    <div className="import-review-row">
      <IdentityColorPicker compact showAbbreviation={false} name={team.name} abbreviation={abbreviation} color={team.color ?? TEAM_COLORS[index % TEAM_COLORS.length]} colorSuggestions={team.colorSuggestions} logoUrl={team.logoUrl} onChange={(identity) => onChange({ ...team, ...identity })} />
      <input aria-label={`Imported team ${index + 1} city`} value={team.city ?? ""} placeholder="City" onChange={(event) => onChange({ ...team, city: event.target.value })} />
      <input aria-label={`Imported team ${index + 1} name`} value={team.name} onChange={(event) => onChange({ ...team, name: event.target.value })} />
      <input aria-label={`${team.name} manager`} value={team.manager ?? ""} placeholder="Manager" onChange={(event) => onChange({ ...team, manager: event.target.value })} />
      <input aria-label={`${team.name} division`} value={cleanDivisionName(team.division)} placeholder="Division" onChange={(event) => onChange({ ...team, division: cleanDivisionName(event.target.value) })} />
      {showVenue && <input aria-label={`${team.name} venue`} value={team.stadium ?? ""} placeholder="Home venue" onChange={(event) => onChange({ ...team, stadium: event.target.value })} />}
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
  const [syncMode, setSyncMode] = useState<"manual" | "assisted" | "auto">("manual");
  const [swid, setSwid] = useState("");
  const [espnS2, setEspnS2] = useState("");
  const [espnPermissionOpen, setEspnPermissionOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [savedEspnImports, setSavedEspnImports] = useState<SavedEspnImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const meta = SOURCE_META[source];

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);
  useEffect(() => {
    if (source === "espn") setSavedEspnImports(loadSavedEspnImports());
  }, [source]);

  const supported = preview ? preview.teams.length >= 8 && preview.teams.length <= 16 && preview.teams.length % 2 === 0 : false;
  const duplicatePreviewNames = preview ? preview.teams
    .map((team) => team.name.trim().toLowerCase())
    .filter(Boolean)
    .filter((name, index, names) => names.indexOf(name) !== index) : [];
  const rosterMessage = preview && !supported ? `League Weaver needs an even roster of 8–16 teams. This preview has ${preview.teams.length}.` : null;
  const duplicateMessage = duplicatePreviewNames.length ? "Rename duplicate teams before importing. Duplicate names make score entry, standings, and exports confusing." : null;
  const canStart = source === "csv" || source === "paste" ? pasteValue.trim().length > 0 : source === "screenshot" ? true : identifier.trim().length > 0;
  const reviewColumns = preview?.provider === "espn"
    ? "78px 115px minmax(150px,1.2fr) minmax(120px,.9fr) minmax(110px,.8fr)"
    : "78px 115px minmax(150px,1.2fr) minmax(120px,.9fr) minmax(110px,.8fr) minmax(140px,1fr)";

  const createPreview = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (source === "csv" || source === "paste") {
        setPreview(parsePastedRoster(pasteValue, source));
        return;
      }
      if (source === "screenshot") return;
      const response = await fetch(`/api/import/${source}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, seasonYear: Number(season), swid, espnS2 }),
      });
      const result = await response.json() as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(result.error || "The league could not be imported.");
      result.syncMode = syncMode;
      if (source === "espn") setSavedEspnImports(saveEspnImport(identifier.trim(), result));
      setPreview(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The league could not be imported.");
    } finally {
      setLoading(false);
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
    try {
      const imageDataUrl = await readImage(file);
      const response = await fetch("/api/import/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, seasonYear: Number(season) }),
      });
      const result = await response.json() as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(result.error || "The screenshot could not be read.");
      setPreview(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The screenshot could not be read.");
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = (index: number, next: ImportTeam) => setPreview((current) => current ? ({ ...current, teams: current.teams.map((team, teamIndex) => teamIndex === index ? next : team) }) : current);
  const customYearOptions = useMemo(() => [setup.seasonYear - 1, setup.seasonYear, setup.seasonYear + 1].map((year) => ({ value: String(year), label: `${year} season` })), [setup.seasonYear]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
        <header className="import-modal-head">
          <span className={`import-provider-mark ${source}`}>{meta.icon}</span>
          <div><span className="step-kicker">League import</span><h2 id="import-modal-title">{meta.title}</h2><p>{meta.description}</p></div>
          <button ref={closeRef} type="button" className="icon-button" aria-label="Close import" onClick={onClose}><X /></button>
        </header>

        {!preview ? (
          <div className="import-modal-body">
            {(source === "sleeper" || source === "espn") && <>
              <div className="import-form-grid">
                <label><span>{source === "sleeper" ? "League ID or username" : "Public ESPN league URL or ID"}</span><input autoFocus value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={source === "sleeper" ? "Example: 123456789 or username" : "https://fantasy.espn.com/football/league?leagueId=11593953"} /></label>
                <label><span>Season</span><CustomSelect label="Import season" value={season} onChange={setSeason} options={customYearOptions} /></label>
              </div>
              <div className="sync-mode-grid" role="group" aria-label="Platform sync mode">
                {[
                  { value: "manual", label: "Manual", copy: "Refresh when you click.", icon: RefreshCw },
                  { value: "assisted", label: "Assisted", copy: "Prompt when data looks stale.", icon: Clock3 },
                  { value: "auto", label: "Auto", copy: "Refresh when possible.", icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  return <button type="button" key={item.value} className={syncMode === item.value ? "active" : ""} onClick={() => setSyncMode(item.value as typeof syncMode)}><Icon /><span><strong>{item.label}</strong><small>{item.copy}</small></span></button>;
                })}
              </div>
              {source === "espn" && savedEspnImports.length > 0 && <div className="saved-imports"><span><strong>Recent ESPN imports</strong><small>Pick a saved public league URL.</small></span>{savedEspnImports.map((item) => <button type="button" key={`${item.id}-${item.seasonYear}`} onClick={() => { setIdentifier(item.identifier); setSeason(String(item.seasonYear)); }}><strong>{item.leagueName}</strong><small>{item.teamCount} teams · {item.divisions.length ? item.divisions.join(" / ") : "No divisions"} · {item.seasonYear}</small></button>)}</div>}
              {source === "espn" && <div className="espn-permission-panel">
                <div className="import-guidance"><ShieldCheck /><div><strong>Start with the ESPN league URL.</strong><span>Most public leagues do not need anything else. Only open advanced permission if ESPN blocks private data or older seasons.</span></div></div>
                <button type="button" className="advanced-permission-toggle" aria-expanded={espnPermissionOpen} onClick={() => setEspnPermissionOpen((current) => !current)}><ShieldCheck />{espnPermissionOpen ? "Hide advanced ESPN permission" : "Advanced ESPN permission"}</button>
                {espnPermissionOpen && <div className="import-form-grid">
                  <label><span>SWID</span><input value={swid} onChange={(event) => setSwid(event.target.value)} placeholder="{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}" /></label>
                  <label><span>espn_s2</span><input value={espnS2} onChange={(event) => setEspnS2(event.target.value)} placeholder="Paste only if ESPN blocks access" /></label>
                </div>}
              </div>}
            </>}

            {(source === "csv" || source === "paste") && <label className="paste-field"><span>Roster rows</span><textarea autoFocus value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={"City, Team, Manager, Division, Rank, Venue\nBrooklyn, Sunday Architects, Anthony, North, 1, Foundry Field"} /><small>Tip: paste directly from Google Sheets or Excel. Tabs and commas both work.</small></label>}

            {source === "screenshot" && <div className="screenshot-drop">
              <input id="screenshot-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleScreenshot(event.target.files?.[0])} />
              <label htmlFor="screenshot-file"><Upload /><strong>Choose a league screenshot</strong><span>PNG, JPG, or WebP up to 8 MB</span></label>
              <div className="screenshot-safety"><ShieldCheck />Nothing is saved until you review and confirm.</div>
            </div>}

            {error && <div className="import-error" role="alert"><AlertCircle />{error}</div>}
          </div>
        ) : (
          <div className="import-modal-body import-review">
            <div className="import-review-summary">
              <span className={`import-review-provider ${preview.provider}`}>{SOURCE_META[preview.provider].icon}</span>
              <div><span>{preview.provider.toUpperCase()} TEAM IMPORT</span><h3>{preview.leagueName || "Imported teams"}</h3><p>{preview.teams.length} teams found · Review team names, logo colors, managers, and divisions.</p></div>
              <span className={`import-status ${supported ? "ready" : "blocked"}`}>{supported ? <><Check />Ready</> : <><AlertCircle />Needs edits</>}</span>
            </div>
            {preview.dataFound && <div className="import-data-found">
              <span><strong>{preview.dataFound.availableHistoryYears.length || "No"} history years</strong><small>{preview.dataFound.availableHistoryYears.join(", ") || "None found yet"}</small></span>
              <span><strong>{preview.dataFound.hasDraftData ? "Draft found" : "No draft yet"}</strong><small>Draft board is a Pro sync feature.</small></span>
              <span><strong>Player data paused</strong><small>Team setup and score refresh stay active.</small></span>
              <span><strong>{preview.dataFound.hasScoreSync ? "Score refresh ready" : "Scores unavailable"}</strong><small>Manual score refresh stays free.</small></span>
            </div>}
            {(rosterMessage || duplicateMessage || preview.warnings.length > 0 || preview.provider === "espn") && <div className="import-warning"><AlertCircle /><div>{rosterMessage && <strong>{rosterMessage}</strong>}{duplicateMessage && <strong>{duplicateMessage}</strong>}{preview.provider === "espn" && <strong>Home venues are added after import on the Teams step.</strong>}{preview.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div></div>}
            <div className="import-review-table" style={{ "--import-review-columns": reviewColumns } as React.CSSProperties}>
              <div className="import-review-head"><span>Logo/color</span><span>City</span><span>Team name</span><span>Manager</span><span>Division</span>{preview.provider !== "espn" && <span>Venue</span>}</div>
              <div className="import-review-list">{preview.teams.map((team, index) => <TeamPreviewRow key={team.providerId ?? index} team={team} index={index} source={preview.provider} onChange={(next) => updateTeam(index, next)} />)}</div>
            </div>
          </div>
        )}

        <footer className="import-modal-actions">
          <button type="button" className="button-secondary visible" disabled={loading} onClick={preview ? () => setPreview(null) : onClose}>{preview ? <><ArrowLeft />Back</> : "Cancel"}</button>
          {!preview && source !== "screenshot" && <button type="button" className="button-primary" disabled={!canStart || loading} onClick={createPreview}>{loading ? <><LoaderCircle className="spin" />Importing…</> : "Review import"}</button>}
          {preview && <button type="button" className="button-primary" disabled={!supported || Boolean(duplicateMessage) || preview.teams.some((team) => !team.name.trim())} onClick={() => onConfirm(preview)}><Check />Use this roster</button>}
        </footer>
      </section>
    </div>
  );
}
