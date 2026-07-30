"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  FileSpreadsheet,
  GripVertical,
  ImagePlus,
  Info,
  LockKeyhole,
  BookmarkPlus,
  LogIn,
  Medal,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  Users,
  WandSparkles,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ImportLeagueModal, type ImportSource } from "@/components/imports/ImportLeagueModal";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { ProBadge } from "@/components/ui/ProBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { createBlankSetup, createDefaultSetup, createDivisions, createTeams } from "@/lib/defaults";
import { identityFromSetup, normalizeSavedLeague } from "@/lib/savedLeagues";
import { generateLeagueSchedule, getNflWeeks, getNflWeekWindow, getWeekDateLabel } from "@/lib/schedule";
import { loadSetup, saveSeason, saveSetup } from "@/lib/storage";
import { divisionAcronym, entityMonogram, leagueAcronym, resolveInitials } from "@/lib/monograms";
import { accessibleAccentColor } from "@/lib/colorContrast";
import { isDivisionHalvesConsolationUsable } from "@/lib/consolation";
import { formatDraftPlace, getTeamsMissingDraftPlaces, getWeekOneTeamOrder, hasCompleteDraftRanking } from "@/lib/rankings";
import {
  getPlayoffByeCount,
  getMaximumPlayoffFieldSize,
  getMaximumPlayoffWeeks,
  getPlayoffGameBrandingSlots,
  getPlayoffRoundNames,
  getRequiredPlayoffWeeks,
  isPlayoffPlacementUsable,
  PLAYOFF_THEME_COLORS,
  playoffPlacementLabel,
  resolvePlayoffPlacementMode,
} from "@/lib/playoffs";
import { teamDisplayName, teamInitials, teamMonogram } from "@/lib/teamIdentity";
import type { Division, ImportPreview, LeagueSetupInput, PlayoffFieldSize, SavedLeagueIdentity, SavedLeaguePreset, Team } from "@/lib/types";

const STEPS = [
  { label: "League & Import", shortLabel: "League" },
  { label: "Teams", shortLabel: "Teams" },
  { label: "Divisions", shortLabel: "Divisions" },
  { label: "Season", shortLabel: "Season" },
  { label: "Seeding", shortLabel: "Seeding" },
  { label: "Week 1 Ranking", shortLabel: "Week 1" },
  { label: "Fairness Rules", shortLabel: "Fairness" },
  { label: "Playoffs", shortLabel: "Playoffs", pro: true },
  { label: "Review & Generate", shortLabel: "Review" },
];

type LogoSavePrompt = {
  changedCount: number;
  fingerprint: string;
  nextStep: number;
  presetId?: string;
  presetName: string;
};

function setupLogoEntries(setup: LeagueSetupInput) {
  return [
    ["league", setup.logoUrl],
    ...setup.divisions.map((division) => [`division:${division.id}`, division.logoUrl]),
    ...setup.teams.map((team) => [`team:${team.id}`, team.logoUrl]),
    ["playoffs", setup.playoffs.logoUrl],
    ...(setup.playoffs.roundLogoUrls ?? []).map((logoUrl, index) => [`playoff-round:${index}`, logoUrl]),
    ...Object.entries(setup.playoffs.gameLogoUrls ?? {}).map(([gameId, logoUrl]) => [`playoff-game:${gameId}`, logoUrl]),
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
}

function savedLogoEntries(identity?: SavedLeagueIdentity) {
  if (!identity) return [];
  return [
    ["league", identity.league.logoUrl],
    ...identity.divisions.map((division) => [`division:${division.id}`, division.logoUrl]),
    ...identity.teams.map((team) => [`team:${team.id}`, team.logoUrl]),
    ["playoffs", identity.playoffs?.logoUrl],
    ...(identity.playoffs?.roundLogoUrls ?? []).map((logoUrl, index) => [`playoff-round:${index}`, logoUrl]),
    ...Object.entries(identity.playoffs?.gameLogoUrls ?? {}).map(([gameId, logoUrl]) => [`playoff-game:${gameId}`, logoUrl]),
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
}

function logoFingerprint(setup: LeagueSetupInput) {
  return JSON.stringify(setupLogoEntries(setup).sort(([left], [right]) => left.localeCompare(right)));
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="field-label">
      <span>{children}</span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Toggle({ checked, onChange, label, description, disabled = false }: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label className={`toggle-row ${disabled ? "disabled" : ""}`}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

function FieldSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="field-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /><span>{label}</span></label>;
}

function connectedLabel(preset: SavedLeaguePreset) {
  const provider = preset.data.platformConnection?.provider;
  if (!provider) return null;
  return provider === "espn" ? "ESPN connected" : "Sleeper connected";
}

function SavedLeagueShortcut({ presets, signedIn, onChoose, onStartNew }: { presets: SavedLeaguePreset[]; signedIn: boolean; onChoose: (preset: SavedLeaguePreset) => void; onStartNew: () => void }) {
  const [selectedId, setSelectedId] = useState("new");
  const selectLeague = (value: string) => {
    setSelectedId(value);
    if (value === "new") return onStartNew();
    const preset = presets.find((item) => item.id === value);
    if (preset) onChoose(preset);
  };
  return (
    <div className="saved-league-shortcut">
      <span className="saved-league-icon"><BookmarkPlus /></span>
      <div className="saved-league-copy"><strong>{presets.length ? "Start from a saved league" : "Skip setup next season"}</strong><small>{presets.length ? "Load every saved league, team, division, color, and logo detail." : signedIn ? "Save a league after confirming its teams and divisions." : "Sign in to save this league and skip League, Teams, and Divisions next time."}</small></div>
      <CustomSelect label="League setup" value={selectedId} onChange={selectLeague} options={[{ value: "new", label: "Start a new league", description: "Clear identity fields and begin fresh", swatch: "#607069", monogram: "+" }, ...presets.map((preset) => {
        const connection = preset.data.platformConnection;
        return { value: preset.id, label: preset.name, description: connection ? `${connectedLabel(preset)} · League ${connection.providerLeagueId} · ${preset.data.teams.length} teams` : `${preset.data.teams.length} teams · ${preset.data.divisions.length} divisions · skip to Season`, logoUrl: preset.data.league.logoUrl, swatch: preset.data.league.color, monogram: resolveInitials(preset.data.league.initials, leagueAcronym(preset.data.league.name)) };
      })]} />
      {!signedIn && <Link href="/account?next=/" className="button-secondary saved-league-signin"><LogIn />Sign in</Link>}
    </div>
  );
}

function LeagueStep({ setup, setSetup, onImport, presets, signedIn, onQuickImport, onStartNew }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>; onImport: (source: ImportSource) => void; presets: SavedLeaguePreset[]; signedIn: boolean; onQuickImport: (preset: SavedLeaguePreset) => void; onStartNew: () => void }) {
  return (
    <div className="step-stack">
      <div className="section-heading">
        <span className="step-kicker">Step 1 of 9</span>
        <h1>Start with your league.</h1>
        <p>Name it, bring in a roster, or start from a clean lineup.</p>
      </div>
      <div>
        <FieldLabel>Setup source</FieldLabel>
        <div className="source-choice-panel" aria-label="Choose league setup source">
          <button type="button" onClick={() => onImport("espn")}><span className="import-icon espn"><img src="/providers/espn.ico" alt="" /></span><strong>Connect ESPN</strong><small>Prefill teams now. Refresh scores later after you update ESPN.</small></button>
          <button type="button" onClick={() => onImport("sleeper")}><span className="import-icon sleeper"><img src="/providers/sleeper.ico" alt="" /></span><strong>Connect Sleeper</strong><small>Use the read-only Sleeper API for teams and sync-ready IDs.</small></button>
          <button type="button" onClick={onStartNew}><Users /><strong>Start manually</strong><small>Build a clean league from scratch.</small></button>
        </div>
      </div>
      <SavedLeagueShortcut presets={presets} signedIn={signedIn} onChoose={onQuickImport} onStartNew={onStartNew} />
      <div className="field-grid two-col">
        <div>
          <FieldLabel hint="Required">League name</FieldLabel>
          <input className="text-input" value={setup.name} maxLength={80} onChange={(event) => { const name = event.target.value; setSetup((current) => ({ ...current, name, abbreviation: leagueAcronym(name) })); }} />
        </div>
        <div>
          <FieldLabel hint="Optional · max 4">Initials override</FieldLabel>
          <input className="text-input" value={setup.initials ?? ""} maxLength={4} placeholder={`Auto: ${leagueAcronym(setup.name)}`} onChange={(event) => setSetup((current) => ({ ...current, initials: event.target.value || undefined }))} />
        </div>
      </div>
      <div>
        <FieldLabel hint={`${setup.description.length}/220`}>League description</FieldLabel>
        <textarea className="text-input textarea" maxLength={220} value={setup.description} onChange={(event) => setSetup((current) => ({ ...current, description: event.target.value }))} />
      </div>
      <div className="brand-row">
        <IdentityColorPicker
          name="League"
          abbreviation={resolveInitials(setup.initials, leagueAcronym(setup.name))}
          color={setup.color}
          logoUrl={setup.logoUrl}
          onChange={(next) => setSetup((current) => ({ ...current, ...next }))}
        />
        <div className="image-color-note"><Sparkles /><span><strong>Logo-aware colors</strong><small>Upload a logo to choose from its three strongest colors or use a custom swatch.</small></span></div>
      </div>
      <div className="divider-label"><span>or import a league</span></div>
      <div className="import-grid">
        <button type="button" onClick={() => onImport("sleeper")}><span className="import-icon sleeper"><img src="/providers/sleeper.ico" alt="" /></span><strong>Sleeper</strong><small>League ID or username</small></button>
        <button type="button" onClick={() => onImport("espn")}><span className="import-icon espn"><img src="/providers/espn.ico" alt="" /></span><strong>ESPN</strong><small>League URL or ID</small></button>
        <button type="button" onClick={() => onImport("csv")}><FileSpreadsheet /><strong>CSV or paste</strong><small>Roster template included</small></button>
        <button type="button" onClick={() => onImport("screenshot")}><Upload /><strong>Screenshot</strong><small>Teams and weekly scores</small></button>
      </div>
      <div className="info-callout"><ShieldCheck size={19} /><span><strong>Your existing league stays put.</strong> League Weaver works beside your fantasy platform and never asks for its password.</span></div>
    </div>
  );
}

function TeamsStep({ setup, setSetup }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>> }) {
  const updateTeam = (id: string, patch: Partial<Team>) => setSetup((current) => ({
    ...current,
    teams: current.teams.map((team) => {
      if (team.id !== id) return team;
      const next = { ...team, ...patch };
      return { ...next, shortName: resolveInitials(next.initials, entityMonogram(next.name, next.city)) };
    }),
  }));
  const setTeamCount = (count: number) => {
    const next = Math.max(8, Math.min(16, count + (count % 2)));
    setSetup((current) => ({ ...current, teams: createTeams(next, current.divisions), priorSeason: { ...current.priorSeason, enabled: false, hasData: false, entryMode: "none" } }));
  };
  const updateDisplay = (patch: Partial<LeagueSetupInput["display"]>) => setSetup((current) => ({ ...current, display: { ...current.display, ...patch } }));
  const teamColumns = ["74px", setup.display.cityNames && "112px", "minmax(145px,1.2fr)", "72px", setup.display.managers && "118px", setup.display.venues && "minmax(140px,1fr)"].filter(Boolean).join(" ");

  return (
    <div className="step-stack">
      <div className="section-heading"><span className="step-kicker">Step 2 of 9</span><h1>Add every team.</h1><p>Confirm team identities now. You’ll organize divisions on the next step.</p></div>
      <div className="team-details-stage">
        <div className="team-meta-controls"><div><FieldLabel>Teams</FieldLabel><div className="stepper"><button type="button" aria-label="Remove two teams" onClick={() => setTeamCount(setup.teams.length - 2)}><Minus /></button><strong>{setup.teams.length}</strong><button type="button" aria-label="Add two teams" onClick={() => setTeamCount(setup.teams.length + 2)}><Plus /></button></div></div><div><FieldLabel>Optional team details</FieldLabel><div className="field-switches"><FieldSwitch checked={setup.display.cityNames} onChange={(cityNames) => updateDisplay({ cityNames })} label="City names" /><FieldSwitch checked={setup.display.managers} onChange={(managers) => updateDisplay({ managers })} label="Managers" /><FieldSwitch checked={setup.display.venues} onChange={(venues) => updateDisplay({ venues })} label="Venues" /></div></div></div>
        <div className="team-editor-table" style={{ "--team-columns": teamColumns } as React.CSSProperties}>
          <div className="team-editor-head"><span>Identity</span>{setup.display.cityNames && <span>City</span>}<span>Team name</span><span>Initials</span>{setup.display.managers && <span>Manager</span>}{setup.display.venues && <span>Home venue</span>}</div>
          <div className="team-editor-list">{setup.teams.map((team) => <div className="team-editor-row" key={team.id}>
            <IdentityColorPicker compact name={teamDisplayName(team, setup.display.cityNames)} abbreviation={teamInitials(team)} color={team.color} logoUrl={team.logoUrl} onChange={(next) => updateTeam(team.id, next)} />
            {setup.display.cityNames && <label className="team-editor-field"><span>City</span><input aria-label={`Team ${team.overallRank} city`} placeholder="City" value={team.city} onChange={(event) => updateTeam(team.id, { city: event.target.value })} /></label>}
            <label className="team-editor-field"><span>Team name</span><input aria-label={`Team ${team.overallRank} name`} placeholder="Team name" value={team.name} onChange={(event) => updateTeam(team.id, { name: event.target.value })} /></label>
            <label className="team-editor-field"><span>Initials</span><input aria-label={`${teamDisplayName(team)} initials override`} maxLength={4} placeholder={`Auto: ${entityMonogram(team.name, team.city)}`} value={team.initials ?? ""} onChange={(event) => updateTeam(team.id, { initials: event.target.value || undefined })} /></label>
            {setup.display.managers && <label className="team-editor-field"><span>Manager</span><input aria-label={`${teamDisplayName(team)} manager`} placeholder="Manager" value={team.manager} onChange={(event) => updateTeam(team.id, { manager: event.target.value })} /></label>}
            {setup.display.venues && <label className="team-editor-field"><span>Home venue</span><input aria-label={`${teamDisplayName(team)} venue`} placeholder="Home venue" value={team.stadium} onChange={(event) => updateTeam(team.id, { stadium: event.target.value })} /></label>}
          </div>)}</div>
        </div>
      </div>
    </div>
  );
}

function DivisionsStep({ setup, setSetup, signedIn, saveState, onSaveLeague }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>; signedIn: boolean; saveState: string | null; onSaveLeague: () => void }) {
  const setDivisionCount = (count: 2 | 3 | 4) => {
    const divisions = createDivisions(count);
    setSetup((current) => ({
      ...current,
      divisions,
      teams: current.teams.map((team, index) => ({ ...team, divisionId: divisions[index % count].id })),
      playoffs: { ...current.playoffs, placementMode: "auto", fieldStatus: "live", lockedTeamIds: [] },
    }));
  };
  const updateDivision = (id: string, patch: Partial<Division>) => setSetup((current) => ({ ...current, divisions: current.divisions.map((division) => division.id === id ? { ...division, ...patch } : division) }));
  const updateTeam = (id: string, divisionId: string) => setSetup((current) => ({ ...current, teams: current.teams.map((team) => team.id === id ? { ...team, divisionId } : team) }));
  const counts = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
  const balanced = Math.max(...counts) - Math.min(...counts) <= 1;
  return <div className="step-stack">
    <div className="section-heading"><span className="step-kicker">Step 3 of 9</span><h1>Build the divisions.</h1><p>Name each group, keep its color and logo visible, then place every team.</p></div>
    <div className="division-stage">
      <div className="compact-controls division-controls"><div><FieldLabel>Divisions</FieldLabel><div className="segmented"><button type="button" className={setup.divisions.length === 2 ? "active" : ""} onClick={() => setDivisionCount(2)}>2</button><button type="button" className={setup.divisions.length === 3 ? "active" : ""} onClick={() => setDivisionCount(3)}>3</button><button type="button" className={setup.divisions.length === 4 ? "active" : ""} onClick={() => setDivisionCount(4)}>4</button></div></div><div className={`roster-status ${balanced ? "" : "warning"}`}>{balanced ? <Check /> : <CircleAlert />}<span><strong>{balanced ? "Balanced divisions" : "Divisions need rebalancing"}</strong><small>{counts.join(" · ")} teams</small></span></div></div>
      <div className="division-strip">{setup.divisions.map((division) => <div className="division-identity-edit" key={division.id}><IdentityColorPicker compact name={`${division.name} division`} abbreviation={resolveInitials(division.initials, divisionAcronym(division.name))} color={division.color} logoUrl={division.logoUrl} onChange={(next) => updateDivision(division.id, next)} /><div><input aria-label={`${division.name} division name`} value={division.name} onChange={(event) => updateDivision(division.id, { name: event.target.value })} /><input aria-label={`${division.name} division initials override`} maxLength={4} placeholder={`Auto: ${divisionAcronym(division.name)}`} value={division.initials ?? ""} onChange={(event) => updateDivision(division.id, { initials: event.target.value || undefined })} /></div></div>)}</div>
      <div className="division-assignments"><div className="division-assign-head"><strong>Place each team</strong><span>Keep each division within one team of the others.</span></div><div>{setup.teams.map((team) => <div className="division-assign-row" key={team.id}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} /><span>{setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong>{setup.display.managers && <small>{team.manager || "No manager"}</small>}</span><CustomSelect label={`${teamDisplayName(team)} division`} value={team.divisionId} onChange={(divisionId) => updateTeam(team.id, divisionId)} options={setup.divisions.map((division) => ({ value: division.id, label: division.name, swatch: division.color, logoUrl: division.logoUrl, monogram: resolveInitials(division.initials, divisionAcronym(division.name)) }))} /></div>)}</div></div>
    </div>
    <div className="save-league-row"><span><BookmarkPlus /><span><strong>Reuse this league setup</strong><small>Save cities, team names, initials, colors, logos, managers, divisions, rankings, and venues.</small></span></span><div>{saveState && <small role="status">{saveState}</small>}{!signedIn && <Link href="/account?next=/">Sign in to enable</Link>}<button type="button" className="button-secondary" onClick={() => onSaveLeague()} disabled={!signedIn}><BookmarkPlus />Save league</button></div></div>
  </div>;
}

function SeasonStep({ setup, setSetup }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>> }) {
  const weeks = getNflWeeks(setup.seasonYear, setup.weeks);
  const divisionSizes = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
  const requiresFourteenWeeks = (setup.divisions.length === 3 && setup.teams.length === 10) || divisionSizes.some((size) => 2 * (size - 1) > 13 || (size % 2 === 1 && 13 < 2 * size));
  const setRegularSeasonWeeks = (regularSeasonWeeks: 13 | 14) => setSetup((current) => {
    const maximumFieldSize = getMaximumPlayoffFieldSize(current.teams.length, regularSeasonWeeks, current.playoffs.bracketType);
    return {
      ...current,
      weeks: regularSeasonWeeks,
      playoffs: {
        ...current.playoffs,
        fieldSize: Math.min(current.playoffs.fieldSize, maximumFieldSize),
        fieldStatus: "live",
        lockedTeamIds: [],
        roundNames: undefined,
      },
    };
  });
  useEffect(() => {
    if (requiresFourteenWeeks && setup.weeks === 13) setRegularSeasonWeeks(14);
  }, [requiresFourteenWeeks, setSetup, setup.weeks]);
  return (
    <div className="step-stack">
      <div className="section-heading"><span className="step-kicker">Step 4 of 9</span><h1>Frame the season.</h1><p>League Weaver uses real NFL week windows, including the path through the championship.</p></div>
      <div className="field-grid two-col season-controls">
        <div><FieldLabel>Regular-season length</FieldLabel><div className="choice-row"><button type="button" disabled={requiresFourteenWeeks} className={setup.weeks === 13 ? "active" : ""} onClick={() => setRegularSeasonWeeks(13)}><strong>13 weeks</strong><small>{requiresFourteenWeeks ? "Unavailable for this division shape" : "Allows playoffs through Week 17"}</small></button><button type="button" className={setup.weeks === 14 ? "active" : ""} onClick={() => setRegularSeasonWeeks(14)}><strong>14 weeks</strong><small>Three playoff weeks through Week 17</small></button></div></div>
        <div><FieldLabel>NFL season</FieldLabel><CustomSelect label="NFL season" value={String(setup.seasonYear)} onChange={(seasonYear) => setSetup((current) => ({ ...current, seasonYear: Number(seasonYear) }))} options={[2025, 2026, 2027].map((year) => ({ value: String(year), label: `${year} season`, description: year === 2026 ? "Current planning year" : "NFL week calendar" }))} /></div>
      </div>
      {requiresFourteenWeeks && <div className="info-callout"><Info /><span><strong>Fourteen weeks keeps this shape complete.</strong> This division layout needs the extra week so every divisional opponent can play twice without byes.</span></div>}
      <div className="week-window">
        <div className="week-window-head"><span><CalendarDays /><strong>{setup.seasonYear} fantasy week windows</strong></span><small>Tuesday 4:00 AM ET rollover</small></div>
        <div className="week-chip-grid">{weeks.map((week) => <span className={week.holidays.length ? "holiday" : ""} key={week.week}><strong>W{week.week}</strong>{week.label.replace(`, ${setup.seasonYear}`, "")}{week.holidays.map((holiday) => <em key={holiday}>{holiday}</em>)}</span>)}</div>
      </div>
      <div className="week-window playoff-window">
        <div className="week-window-head"><span><Trophy /><strong>Playoff week windows</strong></span><small>{setup.playoffs.fieldSize}-team field</small></div>
        <div className="playoff-week-grid">{getPlayoffRoundNames(setup.playoffs, setup.divisions.length).map((round, index) => { const week = setup.weeks + index + 1; const window = getNflWeekWindow(setup.seasonYear, week); return <span className={window.holidays.length ? "holiday" : ""} key={`${round}-${index}`}><strong>{round}</strong><small>NFL Week {week}</small>{window.label.replace(`, ${setup.seasonYear}`, "")}{window.holidays.map((holiday) => <em key={holiday}>{holiday}</em>)}</span>; })}</div>
      </div>
    </div>
  );
}

function SeedingStep({ setup, setSetup }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>> }) {
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const rankedTeams = [...setup.teams].sort((left, right) => left.overallRank - right.overallRank || left.id.localeCompare(right.id));
  const moveTeam = (teamId: string, nextIndex: number) => {
    const ordered = [...rankedTeams];
    const currentIndex = ordered.findIndex((team) => team.id === teamId);
    if (currentIndex < 0) return;
    const [team] = ordered.splice(currentIndex, 1);
    ordered.splice(Math.max(0, Math.min(ordered.length, nextIndex)), 0, team);
    setSetup((current) => ({ ...current, teams: ordered.map((item, index) => ({ ...item, overallRank: index + 1 })) }));
  };
  return <div className="step-stack">
    <div className="section-heading"><span className="step-kicker">Step 5 of 9</span><h1>Set last season’s order.</h1><p>Seeding is optional. Use it only when prior-season results should shape cross-division matchups.</p></div>
    <div className="seeding-methods" role="group" aria-label="Seeding method">
      <button type="button" className={setup.priorSeason.entryMode === "manual" ? "active" : ""} onClick={() => setSetup((current) => ({ ...current, priorSeason: { ...current.priorSeason, enabled: true, entryMode: "manual" } }))}><span><GripVertical /></span><strong>Enter order manually</strong><small>Recommended for most leagues. Drag teams or choose each rank.</small></button>
      <button type="button" disabled={!setup.priorSeason.hasData} className={setup.priorSeason.entryMode === "history" && setup.priorSeason.source === "playoffs" ? "active" : ""} onClick={() => setSetup((current) => ({ ...current, priorSeason: { ...current.priorSeason, enabled: true, entryMode: "history", source: "playoffs" } }))}><span><Trophy /></span><strong>Last year’s playoff finish</strong><small>{setup.priorSeason.hasData ? "Use imported or saved playoff placement." : "No imported history available."}</small></button>
      <button type="button" disabled={!setup.priorSeason.hasData} className={setup.priorSeason.entryMode === "history" && setup.priorSeason.source === "regular-season" ? "active" : ""} onClick={() => setSetup((current) => ({ ...current, priorSeason: { ...current.priorSeason, enabled: true, entryMode: "history", source: "regular-season" } }))}><span><Medal /></span><strong>Last year’s regular season</strong><small>{setup.priorSeason.hasData ? "Use imported or saved final standings." : "No imported history available."}</small></button>
    </div>
    {!setup.priorSeason.hasData && <div className="info-callout gold"><Info /><span><strong>Manual order is ready.</strong> League history was not imported, so the two automatic choices stay unavailable.</span></div>}
    {setup.priorSeason.entryMode !== "none" && setup.priorSeason.enabled && <div className="ranking-editor">
      <div className="ranking-head"><div><span className="step-kicker">{setup.seasonYear - 1} {setup.priorSeason.entryMode === "manual" ? "manual order" : setup.priorSeason.source === "playoffs" ? "playoff finish" : "regular-season finish"}</span><h2>Slot teams into their final rank.</h2><p>Drag a row or choose its number. Rank 1 is last season’s strongest finish.</p></div><span>{rankedTeams.length} teams</span></div>
      <div className="ranking-list" role="list" aria-label="Prior-season team ranking">
        {rankedTeams.map((team, index) => <div className={`ranking-row ${draggedTeamId === team.id ? "dragging" : ""}`} role="listitem" draggable key={team.id} onDragStart={() => setDraggedTeamId(team.id)} onDragEnd={() => setDraggedTeamId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedTeamId) moveTeam(draggedTeamId, index); setDraggedTeamId(null); }}>
          <GripVertical className="ranking-grip" aria-hidden="true" />
          <CustomSelect label={`${teamDisplayName(team)} rank`} value={String(index + 1)} onChange={(value) => moveTeam(team.id, Number(value) - 1)} options={rankedTeams.map((_, optionIndex) => ({ value: String(optionIndex + 1), label: `#${optionIndex + 1}`, description: optionIndex === 0 ? "Strongest finish" : optionIndex === rankedTeams.length - 1 ? "Last-place finish" : "Prior-season order" }))} />
          <EntityLogo className="ranking-mark" color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />
          <span className="ranking-team">{setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong><small>{setup.display.managers ? `${team.manager || "No manager"} · ` : ""}{setup.divisions.find((division) => division.id === team.divisionId)?.name || "No division"}</small></span>
          <span className="ranking-actions"><Tooltip label="Move up"><button type="button" aria-label={`Move ${teamDisplayName(team)} up`} disabled={index === 0} onClick={() => moveTeam(team.id, index - 1)}><ArrowUp /></button></Tooltip><Tooltip label="Move down"><button type="button" aria-label={`Move ${teamDisplayName(team)} down`} disabled={index === rankedTeams.length - 1} onClick={() => moveTeam(team.id, index + 1)}><ArrowDown /></button></Tooltip></span>
        </div>)}
      </div>
    </div>}
    {setup.priorSeason.entryMode !== "none" && <button type="button" className="seeding-skip" onClick={() => setSetup((current) => ({ ...current, priorSeason: { ...current.priorSeason, enabled: false, entryMode: "none" } }))}>Skip seeding for this season</button>}
  </div>;
}

function OpeningWeekStep({ setup, setSetup }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>> }) {
  const orderedTeams = getWeekOneTeamOrder(setup);
  const missingDraftPlaces = getTeamsMissingDraftPlaces(setup);
  const selectedCount = setup.teams.length - missingDraftPlaces.length;
  const placeOptions = [{ value: "unranked", label: "Not set", description: "Choose draft place" }, ...setup.teams.map((_, index) => ({ value: String(index + 1), label: formatDraftPlace(index + 1, setup.teams.length) }))];
  const updatePlace = (teamId: string, value: string) => setSetup((current) => {
    const nextPlace = value === "unranked" ? undefined : Number(value);
    const currentTeam = current.teams.find((team) => team.id === teamId);
    const previousPlace = currentTeam?.draftPlace;
    return {
      ...current,
      teams: current.teams.map((team) => {
        if (team.id === teamId) return { ...team, draftPlace: nextPlace };
        if (nextPlace && team.draftPlace === nextPlace) return { ...team, draftPlace: previousPlace };
        return team;
      }),
    };
  });
  const chooseSource = (rankingSource: LeagueSetupInput["weekOne"]["rankingSource"]) => setSetup((current) => ({ ...current, weekOne: { rankingSource } }));
  return <div className="step-stack">
    <div className="section-heading"><span className="step-kicker">Step 6 of 9</span><h1>Rank the opening week.</h1><p>Choose what should shape Week 1 marquee matchups and the first Game of the Week.</p></div>
    <div className="opening-rank-methods" role="group" aria-label="Week 1 ranking source">
      <button type="button" className={setup.weekOne.rankingSource === "prior-season" ? "active" : ""} onClick={() => chooseSource("prior-season")}><span><Medal /></span><strong>Last season’s finish</strong><small>Use the order from the Seeding step. This remains the recommended default.</small></button>
      <button type="button" className={setup.weekOne.rankingSource === "draft-day" ? "active" : ""} onClick={() => chooseSource("draft-day")}><span><FileSpreadsheet /></span><strong>Draft-day place</strong><small>Choose who drafted first through last to set the Week 1 order and Game of the Week.</small></button>
    </div>
    <div className="info-callout"><Info /><span><strong>Only Week 1 changes.</strong> Draft-day ranking does not replace last season’s finish for the rest of the schedule or playoff setup.</span></div>
    {setup.weekOne.rankingSource === "draft-day" && <div className="draft-later-callout"><FileSpreadsheet /><span><strong>{selectedCount === 0 ? "No draft order yet? Skip it for now." : missingDraftPlaces.length ? "Finish every draft place before continuing." : "Draft ranking is ready."}</strong><small>{selectedCount === 0 ? "Leave every team unranked and use “Skip draft rank for now.” The season workspace will remind you until Week 2 starts." : missingDraftPlaces.length ? `${missingDraftPlaces.length} team${missingDraftPlaces.length === 1 ? " still needs" : "s still need"} a unique place. Complete the order or clear every selection to skip it.` : "Every team has a unique place from first through last."}</small></span></div>}
    {setup.weekOne.rankingSource === "draft-day" && <div className="ranking-editor draft-ranking-editor">
      <div className="ranking-head"><div><span className="step-kicker">Draft-day order</span><h2>Place teams from first to last.</h2><p>Choose each position once. Selecting an occupied place swaps the two teams.</p></div><span>{orderedTeams.length} teams</span></div>
      <div className="draft-ranking-list" role="list" aria-label="Draft-day team ranking">{orderedTeams.map((team, index) => <div className="draft-ranking-row" role="listitem" key={team.id}>
        <b>{team.draftPlace ? `#${team.draftPlace}` : "—"}</b>
        <EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} />
        <span>{setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong><small>{setup.divisions.find((division) => division.id === team.divisionId)?.name || "No division"}</small></span>
        <CustomSelect label={`${teamDisplayName(team)} draft place`} value={team.draftPlace ? String(team.draftPlace) : "unranked"} onChange={(value) => updatePlace(team.id, value)} options={placeOptions} />
      </div>)}</div>
    </div>}
  </div>;
}

function FairnessStep({ setup, setSetup }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>> }) {
  const update = (patch: Partial<LeagueSetupInput["fairness"]>) => setSetup((current) => ({ ...current, fairness: { ...current.fairness, ...patch } }));
  const thanksgivingWeek = getNflWeeks(setup.seasonYear, 14).find((week) => week.holidays.includes("Thanksgiving"))?.week;
  return (
    <div className="step-stack">
      <div className="section-heading"><span className="step-kicker">Step 7 of 9</span><h1>Set the fairness guardrails.</h1><p>Every hard rule remains included on Free. These controls shape the feel of the season.</p></div>
      <div className="rule-group">
        <div className="rule-group-title"><ShieldCheck /><span><strong>Competitive balance</strong><small>Hard rules are always checked</small></span></div>
        <Toggle checked={setup.fairness.preventImmediateRematches} onChange={(value) => update({ preventImmediateRematches: value })} label="Space out repeat opponents" description="Avoid playing the same team in consecutive weeks." />
        <div className="streak-control"><span><strong>Maximum home or away streak</strong><small>Keep long runs from tilting the season.</small></span><div className="segmented"><button type="button" className={setup.fairness.maxHomeAwayStreak === 2 ? "active" : ""} onClick={() => update({ maxHomeAwayStreak: 2 })}>2</button><button type="button" className={setup.fairness.maxHomeAwayStreak === 3 ? "active" : ""} onClick={() => update({ maxHomeAwayStreak: 3 })}>3</button><button type="button" className={setup.fairness.maxHomeAwayStreak === 4 ? "active" : ""} onClick={() => update({ maxHomeAwayStreak: 4 })}>4</button></div></div>
      </div>
      <div className="rule-group">
        <div className="rule-group-title"><Trophy /><span><strong>Season moments</strong><small>Preferences improve the shape, never invalidate it</small></span></div>
        <Toggle checked={setup.fairness.finalWeekDivisional} onChange={(value) => update({ finalWeekDivisional: value })} label="Division-focused final week" description="Close with divisional matchups wherever the league shape allows." />
        <Toggle checked={setup.fairness.prioritizeOpeningWeek} onChange={(value) => update({ prioritizeOpeningWeek: value })} label="Strong opening week" description="Favor closely ranked matchups in Week 1." />
        <Toggle checked={setup.fairness.prioritizeThanksgiving} onChange={(value) => update({ prioritizeThanksgiving: value })} label={`Thanksgiving spotlight${thanksgivingWeek ? ` · Week ${thanksgivingWeek}` : ""}`} description="Favor marquee matchups during the exact Tuesday-to-Tuesday holiday window." />
      </div>
      <div className="info-callout gold"><Info size={19} /><span><strong>Good to know.</strong> Preferences help score valid schedules. They will never cause a valid league to fail generation.</span></div>
    </div>
  );
}

function PlayoffsStep({ setup, setSetup, isPro, onSkip }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>; isPro: boolean; onSkip: () => void }) {
  const update = (patch: Partial<LeagueSetupInput["playoffs"]>) => setSetup((current) => ({ ...current, playoffs: { ...current.playoffs, ...patch } }));
  const updateBracketType = (bracketType: LeagueSetupInput["playoffs"]["bracketType"]) => {
    const maximum = getMaximumPlayoffFieldSize(setup.teams.length, setup.weeks, bracketType);
    update({
      bracketType,
      fieldSize: Math.min(setup.playoffs.fieldSize, maximum),
      fieldStatus: "live",
      lockedTeamIds: [],
      roundNames: undefined,
      roundLogoUrls: undefined,
      gameNames: undefined,
      gameLogoUrls: undefined,
    });
  };
  const updateFieldSize = (fieldSize: PlayoffFieldSize) => update({
    fieldSize,
    fieldStatus: "live",
    lockedTeamIds: [],
    roundNames: undefined,
    roundLogoUrls: undefined,
    gameNames: undefined,
    gameLogoUrls: undefined,
    consolationMode: setup.playoffs.consolationMode === "division-halves" && !isDivisionHalvesConsolationUsable(setup, fieldSize)
      ? "standard"
      : setup.playoffs.consolationMode,
  });
  const updateRoundName = (index: number, name: string) => {
    const roundNames = [...(setup.playoffs.roundNames ?? Array(getPlayoffRoundNames(setup.playoffs, setup.divisions.length).length).fill(""))];
    roundNames[index] = name;
    update({ roundNames });
  };
  const updateRoundLogo = (index: number, logoUrl?: string) => {
    const roundLogoUrls = [...(setup.playoffs.roundLogoUrls ?? Array(getPlayoffRoundNames(setup.playoffs, setup.divisions.length).length).fill(""))];
    roundLogoUrls[index] = logoUrl || "";
    update({ roundLogoUrls });
  };
  const rounds = getPlayoffRoundNames(setup.playoffs, setup.divisions.length);
  const gameBrandingSlots = getPlayoffGameBrandingSlots(setup.playoffs, setup.divisions.length);
  const updateGameLogo = (gameId: string, logoUrl?: string) => {
    const gameLogoUrls = { ...(setup.playoffs.gameLogoUrls ?? {}) };
    if (logoUrl) gameLogoUrls[gameId] = logoUrl;
    else delete gameLogoUrls[gameId];
    update({ gameLogoUrls });
  };
  const updateGameName = (gameId: string, name: string) => {
    const gameNames = { ...(setup.playoffs.gameNames ?? {}) };
    if (name.trim()) gameNames[gameId] = name.slice(0, 60);
    else delete gameNames[gameId];
    update({ gameNames });
  };
  const maximumFieldSize = getMaximumPlayoffFieldSize(setup.teams.length, setup.weeks, setup.playoffs.bracketType);
  const maximumPlayoffWeeks = getMaximumPlayoffWeeks(setup.weeks);
  const requiredPlayoffWeeks = getRequiredPlayoffWeeks(setup.playoffs.fieldSize, setup.playoffs.bracketType);
  const resolvedPlacement = resolvePlayoffPlacementMode(setup);
  const byeCount = getPlayoffByeCount(setup.playoffs.fieldSize);
  const qualifiersPerHalf = setup.playoffs.fieldSize / 2;
  const placementOptions = [
    ...(setup.playoffs.bracketType === "single-elimination" && isPlayoffPlacementUsable("division-halves", setup.divisions.length, setup.playoffs.fieldSize) ? [{ value: "division-halves", label: "Division Halves", description: `${qualifiersPerHalf} qualifiers per half; each side crowns a champion, then those champions meet in the final` }] : []),
    ...(setup.playoffs.bracketType === "single-elimination" && isPlayoffPlacementUsable("division-leaders", setup.divisions.length, setup.playoffs.fieldSize) ? [{ value: "division-leaders", label: "Division Leaders Priority", description: "Division winners receive the top seeds and any available byes" }] : []),
    { value: "overall", label: "Overall Standings", description: "The top teams qualify in order, regardless of division finish" },
  ];
  const bracketOptions = [
    { value: "single-elimination", label: "Single elimination", description: "One loss eliminates a team; the standard fantasy playoff" },
    { value: "ladder", label: "Playoff ladder", description: "Lower seeds play first and advance toward the top seed" },
  ];
  const reseedOptions = [
    { value: "fixed", label: "Fixed bracket", description: "Winners follow the matchup path set at the start" },
    { value: "each-round", label: "Reseed each round", description: resolvedPlacement === "division-halves" ? "Highest plays lowest within each half until the championship" : "The highest remaining seed plays the lowest remaining seed" },
    { value: "protected", label: "Protected reseed", description: "Reseed teams while preserving division placement rules" },
  ];
  const championshipVenueOptions = [
    { value: "higher-seed", label: "Higher seed hosts", description: "The better seed uses its saved team venue" },
    { value: "neutral-site", label: "Neutral championship", description: "The title game is shown at a neutral venue" },
  ];
  const seedDisplayOptions = [
    { value: "reranked", label: "Bracket seed", description: "Show each team’s current playoff seed" },
    { value: "standings-finish", label: "Standings finish", description: "Keep the team’s final regular-season position visible" },
  ];
  const consolationOptions = [
    { value: "standard", label: "Standard placement", description: "ESPN-style placement games keep eliminated teams active without letting them re-enter the title bracket" },
    ...(isDivisionHalvesConsolationUsable(setup) ? [{ value: "division-halves", label: "Division-halves placement", description: "Non-playoff teams open inside their division, then winners and losers cross divisions for final places" }] : []),
    { value: "off", label: "No consolation bracket", description: "Only the championship bracket is played" },
  ];
  const selectTheme = (theme: LeagueSetupInput["playoffs"]["theme"]) => update({
    theme,
    color: theme === "custom" ? setup.playoffs.color : PLAYOFF_THEME_COLORS[theme],
  });
  return <div className="step-stack">
    <div className="section-heading"><span className="step-kicker">Step 8 of 9 <ProBadge compact /></span><h1>Shape the playoff run.</h1><p>Preview the postseason on Free. Pro commissioners can customize the bracket and carry it into the season workspace.</p></div>
    <div className={`playoff-builder ${isPro ? "" : "playoff-builder-locked"}`}>
      <div className="playoff-builder-head"><span>{setup.playoffs.logoUrl && <EntityLogo color={setup.playoffs.color} logoUrl={setup.playoffs.logoUrl} monogram="PO" />}<span><strong>{setup.playoffs.name}</strong><small>{rounds.length} rounds · starts NFL Week {setup.weeks + 1}</small></span></span><ProBadge label={isPro ? "PRO ACTIVE" : "PRO PREVIEW"} className="playoff-pro-status" /></div>
      <div className="playoff-recommendation"><ShieldCheck /><span><strong>Recommended for this league</strong><small>Single elimination · {setup.playoffs.fieldSize} teams · {playoffPlacementLabel(resolvedPlacement)} · {byeCount ? `${byeCount} first-round byes` : "no byes"} · higher seed hosts · fixed bracket</small></span><em>AUTO</em></div>
      <fieldset className="playoff-settings" disabled={!isPro}>
        <div className="playoff-identity-row">
          <div><FieldLabel hint="Upload a logo and choose from its top colors">Playoff identity</FieldLabel><IdentityColorPicker name="Playoff" abbreviation="PO" color={setup.playoffs.color} logoUrl={setup.playoffs.logoUrl} onChange={(next) => update({ ...next, ...(next.color ? { theme: "custom" as const } : {}) })} /></div>
          <div><FieldLabel>Name</FieldLabel><input className="text-input" value={setup.playoffs.name} maxLength={60} onChange={(event) => update({ name: event.target.value })} /></div>
        </div>
        <div className="playoff-theme-field"><FieldLabel hint="Gold is the standard">Playoff color</FieldLabel><div className="playoff-theme-selector" role="group" aria-label="Playoff color theme">{(["gold", "silver", "bronze", "custom"] as const).map((theme) => <button type="button" className={setup.playoffs.theme === theme ? "active" : ""} aria-pressed={setup.playoffs.theme === theme} key={theme} onClick={() => selectTheme(theme)}><span className={`playoff-theme-swatch ${theme}`} style={theme === "custom" ? { background: setup.playoffs.color } : undefined} /><strong>{theme[0].toUpperCase() + theme.slice(1)}</strong><small>{theme === "custom" ? "Use the color picker above" : `${theme[0].toUpperCase() + theme.slice(1)} finish`}</small></button>)}</div></div>
        <div className="playoff-config-grid expanded">
          <div><FieldLabel>Bracket type</FieldLabel><CustomSelect label="Bracket type" value={setup.playoffs.bracketType} onChange={(value) => updateBracketType(value as LeagueSetupInput["playoffs"]["bracketType"])} options={bracketOptions} /></div>
          <div><FieldLabel hint={`2–${maximumFieldSize}`}>Playoff teams</FieldLabel><div className="stepper playoff-field-stepper"><button type="button" aria-label="Remove one playoff team" disabled={setup.playoffs.fieldSize <= 2} onClick={() => updateFieldSize(setup.playoffs.fieldSize - 1)}><Minus /></button><strong>{setup.playoffs.fieldSize}</strong><button type="button" aria-label="Add one playoff team" disabled={setup.playoffs.fieldSize >= maximumFieldSize} onClick={() => updateFieldSize(setup.playoffs.fieldSize + 1)}><Plus /></button></div><small>{byeCount ? `${byeCount} byes go to the top ${byeCount === 1 ? "seed" : "seeds"}.` : "Every qualifying team opens in the first round."} {requiredPlayoffWeeks} of {maximumPlayoffWeeks} available playoff weeks used.</small></div>
          <div className="playoff-placement-control"><FieldLabel hint={`Recommended: ${playoffPlacementLabel(resolvedPlacement)}`}>Division placement</FieldLabel><CustomSelect label="Division placement" value={setup.playoffs.placementMode === "auto" ? resolvedPlacement : setup.playoffs.placementMode} onChange={(value) => update({ placementMode: value as LeagueSetupInput["playoffs"]["placementMode"], fieldStatus: "live", lockedTeamIds: [] })} options={placementOptions} /></div>
          <div><FieldLabel>Reseeding</FieldLabel><CustomSelect label="Reseeding mode" value={setup.playoffs.reseedMode} onChange={(value) => update({ reseedMode: value as LeagueSetupInput["playoffs"]["reseedMode"] })} options={reseedOptions} /></div>
          <div><FieldLabel hint="Earlier rounds always use the higher seed">Championship venue</FieldLabel><CustomSelect label="Championship venue" value={setup.playoffs.championshipVenueMode} onChange={(value) => update({ championshipVenueMode: value as LeagueSetupInput["playoffs"]["championshipVenueMode"] })} options={championshipVenueOptions} /></div>
          <div><FieldLabel>Seed display</FieldLabel><CustomSelect label="Seed display" value={setup.playoffs.seedDisplayMode} onChange={(value) => update({ seedDisplayMode: value as LeagueSetupInput["playoffs"]["seedDisplayMode"] })} options={seedDisplayOptions} /></div>
          <div><FieldLabel hint="All placement games stay separate from the title bracket">Consolation format</FieldLabel><CustomSelect label="Consolation format" value={setup.playoffs.consolationMode} onChange={(value) => update({ consolationMode: value as LeagueSetupInput["playoffs"]["consolationMode"], thirdPlaceGame: value !== "off" })} options={consolationOptions} /></div>
        </div>
        <div className="playoff-rounds-head"><span><strong>Round names, logos, and dates</strong><small>Rename any round and optionally add its own logo. Empty logo spots are never shown in the bracket.</small></span><em>Field stays live until you lock it in the season workspace.</em></div>
        <div className="playoff-round-preview">{rounds.map((round, index) => { const week = setup.weeks + index + 1; const abbreviation = round.split(/\s+/).map((word) => word[0]).join("").slice(0, 3).toUpperCase(); return <div key={`${round}-${index}`}><span>{index + 1}</span><IdentityColorPicker compact showColorControl={false} showAbbreviation={false} name={`${round} round`} abbreviation={abbreviation} color={setup.playoffs.color} logoUrl={setup.playoffs.roundLogoUrls?.[index]} onChange={(next) => updateRoundLogo(index, next.logoUrl)} /><input aria-label={`Round ${index + 1} name`} value={round} maxLength={40} onChange={(event) => updateRoundName(index, event.target.value)} /><small>NFL Week {week}</small><b>{getWeekDateLabel(setup.seasonYear, week).replace(`, ${setup.seasonYear}`, "")}</b></div>; })}</div>
        <div className="playoff-rounds-head playoff-game-branding-head"><span><strong>Specific game names and logos</strong><small>Rename individual matchups and optionally override the round logo.</small></span><em>{gameBrandingSlots.length} playoff games</em></div>
        <div className="playoff-game-branding-grid">{gameBrandingSlots.map((slot) => {
          const sameRound = gameBrandingSlots.filter((item) => item.roundIndex === slot.roundIndex);
          const divisionLabel = resolvedPlacement === "division-halves" && setup.divisions.length === 2 && sameRound.length === 2 && slot.roundIndex < rounds.length - 1
            ? setup.divisions[slot.gameIndex]?.name
            : undefined;
          const fallback = divisionLabel ? `${divisionLabel} ${slot.roundName}` : sameRound.length === 1 ? slot.roundName : `${slot.roundName} · Game ${slot.gameIndex + 1}`;
          const label = setup.playoffs.gameNames?.[slot.id] || fallback;
          return <div key={slot.id}><span><input className="text-input" aria-label={`${fallback} name`} defaultValue={label} maxLength={60} onBlur={(event) => updateGameName(slot.id, event.target.value)} /><small>NFL Week {setup.weeks + slot.roundIndex + 1}</small></span><IdentityColorPicker compact showColorControl={false} showAbbreviation={false} name={label} abbreviation={`G${slot.gameIndex + 1}`} color={setup.playoffs.color} logoUrl={setup.playoffs.gameLogoUrls?.[slot.id]} onChange={(next) => updateGameLogo(slot.id, next.logoUrl)} /></div>;
        })}</div>
      </fieldset>
    </div>
    {!isPro && <div className="playoff-upgrade"><LockKeyhole /><span><strong>Unlock the playoff builder with Pro.</strong><small>Your regular-season schedule stays complete on Free. Upgrade for bracket controls, projections, and live playoff tracking, or skip this step.</small></span><Link href="/pricing" className="button-primary">See Pro plans</Link><button type="button" className="button-secondary" onClick={onSkip}>Skip playoffs</button></div>}
  </div>;
}

function ReviewStep({ setup }: { setup: LeagueSetupInput }) {
  const checks = [
    `${setup.teams.length} teams balanced across ${setup.divisions.length} divisions`,
    `${setup.weeks}-week season with one matchup per team each week`,
    `Week 1 ranked by ${setup.weekOne.rankingSource === "draft-day" ? hasCompleteDraftRanking(setup) ? "draft-day place" : "draft-day place (set after the draft)" : "last season’s finish"}`,
    `${setup.playoffs.fieldSize}-team playoffs finish by NFL Week ${setup.weeks + getPlayoffRoundNames(setup.playoffs, setup.divisions.length).length}`,
    "Every divisional opponent scheduled twice",
    `Home and away streaks capped at ${setup.fairness.maxHomeAwayStreak}`,
  ];
  return (
    <div className="step-stack">
      <div className="section-heading"><span className="step-kicker">Step 9 of 9</span><h1>Your league is ready to weave.</h1><p>One final check, then we’ll build the complete season.</p></div>
      <div className="review-banner" style={{ borderColor: setup.color }}><EntityLogo className="review-mark" size={54} color={setup.color} logoUrl={setup.logoUrl} monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))} /><div><span>{setup.seasonYear} FANTASY SEASON</span><h2>{setup.name}</h2><p>{setup.description}</p></div></div>
      <div className="review-metrics"><div><strong>{setup.teams.length}</strong><span>Teams</span></div><div><strong>{setup.divisions.length}</strong><span>Divisions</span></div><div><strong>{setup.weeks}</strong><span>Weeks</span></div><div><strong>{setup.teams.length * setup.weeks / 2}</strong><span>Matchups</span></div></div>
      <div className="validation-list">{checks.map((check) => <div key={check}><Check />{check}</div>)}</div>
      <div className="generation-note"><WandSparkles /><span><strong>Generation is deterministic and validated.</strong><small>We’ll check team frequency, matchup inventory, divisional balance, and home/away totals before showing the result.</small></span></div>
    </div>
  );
}

function LivePreview({ setup, step }: { setup: LeagueSetupInput; step: number }) {
  const divisions = setup.divisions.map((division) => ({ ...division, teams: setup.teams.filter((team) => team.divisionId === division.id) }));
  return (
    <aside className="builder-preview">
      <div className="preview-top"><span>LEAGUE BLUEPRINT</span><em>LIVE</em></div>
      <div className="preview-brand"><EntityLogo className="preview-logo" size={50} color={setup.color} logoUrl={setup.logoUrl} monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))} /><div><h2>{setup.name || "Untitled league"}</h2><p>{setup.seasonYear} · {setup.weeks} weeks</p></div></div>
      <div className="preview-status"><span><Users />{setup.teams.length} teams</span><span><CalendarDays />{setup.weeks} weeks</span><span><ShieldCheck />Fairness on</span></div>
      <div className="preview-divisions">
        {divisions.map((division) => <div key={division.id}><div className="preview-division-title"><EntityLogo className="preview-division-mark" color={division.color} logoUrl={division.logoUrl} monogram={resolveInitials(division.initials, divisionAcronym(division.name))} /><strong>{division.name}</strong><small>{division.teams.length}</small></div>{division.teams.map((team) => { const accent = accessibleAccentColor(team.color); return <div className="preview-team" key={team.id} title={`${teamDisplayName(team, setup.display.cityNames)} · Rank ${team.overallRank}`}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} /><span>{setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong style={setup.display.cityNames ? { color: accent } : undefined}>{team.name}</strong><small>{[teamInitials(team), setup.display.managers ? team.manager || "No manager" : "", setup.display.venues ? team.stadium || "Venue TBD" : ""].filter(Boolean).join(" · ")}</small></span><b style={{ color: accent }}>#{team.overallRank}</b></div>; })}</div>)}
      </div>
      <div className="preview-footer"><span>Setup progress</span><strong>{Math.round(((step + 1) / STEPS.length) * 100)}%</strong><div><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div></div>
    </aside>
  );
}

export function LeagueBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const progressTrackRef = useRef<HTMLOListElement>(null);
  const [setup, setSetup] = useState<LeagueSetupInput>(createDefaultSetup);
  const logoBaseline = useRef<Map<string, string>>(new Map(setupLogoEntries(setup)));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [leagueSaveState, setLeagueSaveState] = useState<string | null>(null);
  const [activeSavedLeagueId, setActiveSavedLeagueId] = useState<string | null>(null);
  const [connectedSavedLeaguePrompt, setConnectedSavedLeaguePrompt] = useState<SavedLeaguePreset | null>(null);
  const [logoSavePrompt, setLogoSavePrompt] = useState<LogoSavePrompt | null>(null);
  const [logoSaveBusy, setLogoSaveBusy] = useState(false);
  const [logoSaveError, setLogoSaveError] = useState<string | null>(null);
  const dismissedLogoFingerprint = useRef<string | null>(null);

  useEffect(() => {
    const stored = loadSetup();
    if (stored) setSetup(stored);
  }, []);
  useEffect(() => saveSetup(setup), [setup]);
  useEffect(() => {
    const track = progressTrackRef.current;
    const activeStep = track?.querySelector<HTMLElement>("button.active");
    if (!track || !activeStep || track.scrollWidth <= track.clientWidth) return;
    track.scrollTo({ left: activeStep.offsetLeft - (track.clientWidth - activeStep.offsetWidth) / 2, behavior: "smooth" });
  }, [step]);
  useEffect(() => {
    fetch("/api/entitlements").then((response) => response.json()).then((payload: { signedIn?: boolean; plan?: "free" | "pro" }) => { setSignedIn(Boolean(payload.signedIn)); setPlan(payload.plan || "free"); }).catch(() => undefined);
    fetch("/api/saved-leagues").then((response) => response.json()).then((payload: { presets?: Array<{ id: string; name: string; data: unknown; updated_at?: string }> }) => {
      setSavedLeagues((payload.presets ?? []).map(normalizeSavedLeague).filter((preset): preset is SavedLeaguePreset => Boolean(preset)));
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const savedLeagueId = new URLSearchParams(window.location.search).get("savedLeague");
    if (!savedLeagueId) return;
    const preset = savedLeagues.find((item) => item.id === savedLeagueId);
    if (!preset) return;
    if (preset.data.platformConnection) setConnectedSavedLeaguePrompt(preset);
    else applySavedLeaguePreset(preset, true);
    const url = new URL(window.location.href);
    url.searchParams.delete("savedLeague");
    window.history.replaceState({}, "", url);
  }, [savedLeagues]);
  useEffect(() => {
    if (!logoSavePrompt) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !logoSaveBusy) setLogoSavePrompt(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [logoSaveBusy, logoSavePrompt]);

  const validationError = useMemo(() => {
    if (step === 0 && !setup.name.trim()) return "Enter a league name before continuing.";
    if (step === 1) {
      if (setup.teams.length < 8 || setup.teams.length > 16 || setup.teams.length % 2) return "Use an even number of teams from 8 through 16.";
      const missingTeam = setup.teams.findIndex((team) => !team.name.trim());
      if (missingTeam >= 0) return `Enter a name for Team ${missingTeam + 1}.`;
    }
    if (step === 2) {
      if (setup.divisions.some((division) => !division.name.trim())) return "Give every division a name before continuing.";
      if (setup.teams.some((team) => !setup.divisions.some((division) => division.id === team.divisionId))) return "Place every team in a division before continuing.";
      const counts = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
      if (Math.max(...counts) - Math.min(...counts) > 1) return `Rebalance the divisions. Current team counts are ${counts.join(", ")}.`;
    }
    if (step === 5 && setup.weekOne.rankingSource === "draft-day") {
      const selectedPlaces = setup.teams.filter((team) => Number.isInteger(team.draftPlace));
      if (selectedPlaces.length > 0 && selectedPlaces.length < setup.teams.length) return `Finish the draft order for all ${setup.teams.length} teams, or clear every draft place to skip it for now.`;
      if (selectedPlaces.length === setup.teams.length && new Set(selectedPlaces.map((team) => team.draftPlace)).size !== setup.teams.length) return "Give every team a unique draft place before continuing.";
    }
    return null;
  }, [setup, step]);
  const advanceToStep = (nextStep: number) => {
    setStep(Math.min(STEPS.length - 1, nextStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const matchingSavedLeague = () => savedLeagues.find((preset) => preset.id === activeSavedLeagueId)
    ?? savedLeagues.find((preset) => preset.name.trim().toLowerCase() === setup.name.trim().toLowerCase());
  function applySavedLeaguePreset(preset: SavedLeaguePreset, includeConnection: boolean) {
    setSetup((current) => ({
      ...current,
      ...preset.data.league,
      display: preset.data.display,
      divisions: preset.data.divisions,
      teams: preset.data.teams,
      platformConnection: includeConnection ? preset.data.platformConnection : undefined,
      priorSeason: preset.data.priorSeason ?? { ...current.priorSeason, enabled: false, hasData: false, entryMode: "none" },
      playoffs: preset.data.playoffs ? { ...current.playoffs, ...preset.data.playoffs } : current.playoffs,
    }));
    setActiveSavedLeagueId(preset.id);
    logoBaseline.current = new Map(savedLogoEntries(preset.data));
    dismissedLogoFingerprint.current = null;
    setConnectedSavedLeaguePrompt(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const next = () => {
    if (validationError) return setError(validationError);
    setError(null);
    const fingerprint = logoFingerprint(setup);
    const targetPreset = matchingSavedLeague();
    const savedLogos = new Map(savedLogoEntries(targetPreset?.data));
    const changedCount = setupLogoEntries(setup).filter(([key, logoUrl]) => logoBaseline.current.get(key) !== logoUrl && savedLogos.get(key) !== logoUrl).length;
    if (changedCount > 0 && dismissedLogoFingerprint.current !== fingerprint) {
      setLogoSaveError(null);
      setLogoSavePrompt({
        changedCount,
        fingerprint,
        nextStep: step + 1,
        presetId: targetPreset?.id,
        presetName: targetPreset?.name || setup.name || "this league",
      });
      return;
    }
    advanceToStep(step + 1);
  };

  const skipDraftRankForNow = step === 5 && setup.weekOne.rankingSource === "draft-day" && getTeamsMissingDraftPlaces(setup).length === setup.teams.length;
  const back = () => { setError(null); setStep((current) => Math.max(0, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const quickImportSavedLeague = (preset: SavedLeaguePreset) => {
    if (preset.data.platformConnection) {
      setConnectedSavedLeaguePrompt(preset);
      return;
    }
    applySavedLeaguePreset(preset, false);
  };
  const startNewLeague = () => {
    const blankSetup = createBlankSetup();
    setSetup(blankSetup);
    logoBaseline.current = new Map(setupLogoEntries(blankSetup));
    setActiveSavedLeagueId(null);
    dismissedLogoFingerprint.current = null;
    setLeagueSaveState(null);
    setStep(0);
  };
  const saveLeaguePreset = async (requestedId?: string) => {
    if (!signedIn) {
      setLeagueSaveState("Sign in first, then this shortcut will stay with your account.");
      return false;
    }
    const targetId = requestedId ?? matchingSavedLeague()?.id;
    setLeagueSaveState("Saving…");
    try {
      const response = await fetch("/api/saved-leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: targetId, name: setup.name, data: identityFromSetup(setup) }) });
      const payload = await response.json() as { preset?: { id: string; name: string; data: unknown; updated_at?: string }; error?: string };
      if (!response.ok || !payload.preset) throw new Error(payload.error || "This league could not be saved.");
      const normalized = normalizeSavedLeague(payload.preset);
      if (!normalized) throw new Error("The saved league response could not be read.");
      setSavedLeagues((current) => [normalized, ...current.filter((preset) => preset.id !== normalized.id)]);
      setActiveSavedLeagueId(normalized.id);
      logoBaseline.current = new Map(setupLogoEntries(setup));
      dismissedLogoFingerprint.current = null;
      setLeagueSaveState(targetId ? "Saved league updated." : "League saved. It will be ready from Step 1 next time.");
      return true;
    } catch (caught) {
      setLeagueSaveState(caught instanceof Error ? caught.message : "This league could not be saved.");
      return false;
    }
  };
  const savePromptLogos = async () => {
    if (!logoSavePrompt || !signedIn) return;
    setLogoSaveBusy(true);
    setLogoSaveError(null);
    const saved = await saveLeaguePreset(logoSavePrompt.presetId);
    setLogoSaveBusy(false);
    if (!saved) {
      setLogoSaveError("The logos could not be saved yet. Your wizard entries are still here.");
      return;
    }
    const nextStep = logoSavePrompt.nextStep;
    setLogoSavePrompt(null);
    advanceToStep(nextStep);
  };
  const skipPromptLogoSave = () => {
    if (!logoSavePrompt) return;
    dismissedLogoFingerprint.current = logoSavePrompt.fingerprint;
    const nextStep = logoSavePrompt.nextStep;
    setLogoSavePrompt(null);
    advanceToStep(nextStep);
  };
  const applyImport = (preview: ImportPreview) => {
    const importedDivisionNames = Array.from(new Set(preview.teams.map((team) => team.division?.replace(/\s+division$/i, "").trim()).filter((name): name is string => Boolean(name))));
    const divisionCount: 2 | 3 | 4 = importedDivisionNames.length === 4 ? 4 : importedDivisionNames.length === 3 ? 3 : 2;
    const divisions = createDivisions(divisionCount).map((division, index) => ({
      ...division,
      name: importedDivisionNames[index] || division.name,
    }));
    const divisionByName = new Map(divisions.map((division) => [division.name.toLowerCase(), division.id]));
    const teams = preview.teams.map((team, index): Team => {
      const name = team.name.trim() || `Team ${index + 1}`;
      return {
        id: `team-${index + 1}`,
        providerId: team.providerId,
        city: team.city?.trim() || "",
        name,
        shortName: teamMonogram(team.city || "", name),
        manager: team.manager?.trim() || `Manager ${index + 1}`,
        color: team.color || createTeams(preview.teams.length, divisions)[index].color,
        logoUrl: team.logoUrl,
        divisionId: team.division ? divisionByName.get(team.division.trim().toLowerCase()) || divisions[index % divisionCount].id : divisions[index % divisionCount].id,
        overallRank: team.rank || index + 1,
        stadium: team.stadium?.trim() || `${name} Stadium`,
      };
    });
    setSetup((current) => {
      const leagueName = preview.leagueName?.trim() || current.name;
      return {
        ...current,
        name: leagueName,
        abbreviation: leagueAcronym(leagueName),
        initials: undefined,
        color: preview.leagueColor || current.color,
        logoUrl: preview.leagueLogoUrl || current.logoUrl,
        seasonYear: preview.seasonYear || current.seasonYear,
        divisions,
        teams,
        platformConnection: preview.provider === "espn" || preview.provider === "sleeper" ? {
          provider: preview.provider,
          providerLeagueId: preview.providerLeagueId || "",
          providerLeagueName: leagueName,
          seasonYear: preview.seasonYear || current.seasonYear,
          syncMode: preview.syncMode || "manual",
          authType: preview.authType || "public",
          status: "idle",
          warnings: preview.warnings,
          availableHistoryYears: preview.dataFound?.availableHistoryYears,
          blockedHistoryYears: preview.dataFound?.blockedHistoryYears,
          hasDraftData: preview.dataFound?.hasDraftData,
          hasRosterData: preview.dataFound?.hasRosterData,
          hasPlayerData: preview.dataFound?.hasPlayerData,
          hasScoreSync: preview.dataFound?.hasScoreSync,
        } : undefined,
        priorSeason: { ...current.priorSeason, enabled: Boolean(preview.hasPriorSeasonRanks), hasData: Boolean(preview.hasPriorSeasonRanks), entryMode: preview.hasPriorSeasonRanks ? "history" : "none" },
      };
    });
    setImportSource(null);
    setActiveSavedLeagueId(null);
    dismissedLogoFingerprint.current = null;
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const generate = () => {
    if (generating) return;
    const missingCore = !setup.name.trim() || setup.teams.length < 8 || setup.teams.some((team) => !team.name.trim());
    if (missingCore) {
      setError("Return to League and Teams to complete every required name before generating.");
      return;
    }
    const counts = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
    if (Math.max(...counts) - Math.min(...counts) > 1) {
      setError(`Return to Divisions and rebalance the team counts: ${counts.join(", ")}.`);
      return;
    }
    setGenerating(true);
    setError(null);
    window.setTimeout(() => {
      try {
        const season = generateLeagueSchedule(setup);
        saveSeason(season);
        router.push(`/season/${season.id}`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We couldn’t build this schedule yet.");
        setGenerating(false);
      }
    }, 80);
  };

  return (
    <section className="builder-section" aria-label="League schedule builder">
      <div className="page-width builder-heading-row">
        <div><p className="eyebrow">Fantasy football schedule maker</p><h2>Build the season your league deserves.</h2></div>
        <p>Fair matchups. Real NFL weeks. No spreadsheet math.</p>
      </div>
      <div className="page-width wizard-progress" aria-label="Setup progress">
        <div className="wizard-progress-summary">
          <span><small>Step {step + 1} of {STEPS.length}</small><strong>{STEPS[step].label}</strong></span>
          <em>{Math.round(((step + 1) / STEPS.length) * 100)}% complete</em>
          <div aria-hidden="true"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        </div>
        <ol className="wizard-progress-track" ref={progressTrackRef} style={{ "--wizard-progress-ratio": step / (STEPS.length - 1) } as React.CSSProperties}>
          {STEPS.map((item, index) => <li key={item.label}><button type="button" title={item.label} aria-current={index === step ? "step" : undefined} aria-label={`Step ${index + 1}: ${item.label}${item.pro ? ", Pro feature" : ""}${index < step ? ", complete" : index === step ? ", current" : ", upcoming"}`} disabled={index > step} className={index === step ? "active" : index < step ? "complete" : ""} onClick={() => { setError(null); setStep(index); }}><span>{index < step ? <Check /> : index + 1}</span><em><b>{item.label}</b><small>{item.shortLabel}</small>{item.pro && <ProBadge compact />}</em></button></li>)}
        </ol>
      </div>
      <div className="page-width builder-layout">
        <div className="builder-tool">
          <div className="builder-content">
            {step === 0 && <LeagueStep setup={setup} setSetup={setSetup} onImport={setImportSource} presets={savedLeagues} signedIn={signedIn} onQuickImport={quickImportSavedLeague} onStartNew={startNewLeague} />}
            {step === 1 && <TeamsStep setup={setup} setSetup={setSetup} />}
            {step === 2 && <DivisionsStep setup={setup} setSetup={setSetup} signedIn={signedIn} saveState={leagueSaveState} onSaveLeague={saveLeaguePreset} />}
            {step === 3 && <SeasonStep setup={setup} setSetup={setSetup} />}
            {step === 4 && <SeedingStep setup={setup} setSetup={setSetup} />}
            {step === 5 && <OpeningWeekStep setup={setup} setSetup={setSetup} />}
            {step === 6 && <FairnessStep setup={setup} setSetup={setSetup} />}
            {step === 7 && <PlayoffsStep setup={setup} setSetup={setSetup} isPro={plan === "pro"} onSkip={next} />}
            {step === 8 && <ReviewStep setup={setup} />}
          </div>
          {error && <div className="builder-error" role="alert"><CircleAlert />{error}</div>}
          <div className="builder-actions">
            <button type="button" className="button-secondary" onClick={back} disabled={step === 0}><ArrowLeft />Back</button>
            {step < STEPS.length - 1 ? <button type="button" className="button-primary" onClick={next}>{step === 7 && plan !== "pro" ? "Skip playoffs" : skipDraftRankForNow ? "Skip draft rank for now" : "Continue"}<ArrowRight /></button> : <button type="button" className="button-primary generate-button" onClick={generate} disabled={generating}>{generating ? <><span className="spinner" />Weaving schedule…</> : <><Sparkles />Generate my season</>}</button>}
          </div>
        </div>
        <LivePreview setup={setup} step={step} />
      </div>
      {importSource && <ImportLeagueModal source={importSource} setup={setup} onClose={() => setImportSource(null)} onConfirm={applyImport} />}
      {connectedSavedLeaguePrompt && <div className="modal-backdrop connected-saved-league-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConnectedSavedLeaguePrompt(null); }}>
        <section className="season-save-conflict connected-saved-league-modal" role="dialog" aria-modal="true" aria-labelledby="connected-saved-league-title" aria-describedby="connected-saved-league-description">
          <header>
            <span className="season-save-conflict-mark">{connectedSavedLeaguePrompt.data.platformConnection?.provider === "espn" ? <img src="/providers/espn.ico" alt="" /> : <img src="/providers/sleeper.ico" alt="" />}</span>
            <span><small>{connectedLabel(connectedSavedLeaguePrompt)?.toUpperCase()}</small><h2 id="connected-saved-league-title">Use connected league data?</h2></span>
            <button type="button" aria-label="Close connected saved league choice" onClick={() => setConnectedSavedLeaguePrompt(null)}><X /></button>
          </header>
          <div>
            <strong>{connectedSavedLeaguePrompt.name}</strong>
            <p id="connected-saved-league-description">This saved league includes {connectedSavedLeaguePrompt.data.platformConnection?.provider === "espn" ? "ESPN" : "Sleeper"} League {connectedSavedLeaguePrompt.data.platformConnection?.providerLeagueId}. You can keep that connection for score refresh later, or load only the teams and divisions.</p>
            <small>LeagueWeaver still generates the schedule here. It will not update ESPN or Sleeper for you.</small>
          </div>
          <footer>
            <button type="button" className="button-secondary" onClick={() => applySavedLeaguePreset(connectedSavedLeaguePrompt, false)}>Roster only</button>
            <button type="button" className="button-primary" onClick={() => applySavedLeaguePreset(connectedSavedLeaguePrompt, true)}><RefreshCw />Use saved connection</button>
          </footer>
        </section>
      </div>}
      {logoSavePrompt && <div className="modal-backdrop league-logo-save-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !logoSaveBusy) setLogoSavePrompt(null); }}>
        <section className="season-save-conflict league-logo-save-modal" role="dialog" aria-modal="true" aria-labelledby="league-logo-save-title" aria-describedby="league-logo-save-description">
          <header>
            <span className="season-save-conflict-mark"><ImagePlus /></span>
            <span><small>{logoSavePrompt.presetId ? "NEW LOGOS FOUND" : "KEEP YOUR NEW LOGOS"}</small><h2 id="league-logo-save-title">{logoSavePrompt.presetId ? `Update ${logoSavePrompt.presetName}?` : "Save these with your league?"}</h2></span>
            <button type="button" aria-label="Close logo save recommendation" disabled={logoSaveBusy} onClick={() => setLogoSavePrompt(null)}><X /></button>
          </header>
          <div>
            <strong>{logoSavePrompt.changedCount} new or changed {logoSavePrompt.changedCount === 1 ? "image" : "images"}</strong>
            <p id="league-logo-save-description">{logoSavePrompt.presetId ? "Save the new league, division, team, and playoff logos to this saved league so they are ready next season." : "Save this league setup with its logos so you will not need to upload them again."}</p>
            <small>This includes the main playoff logo plus any round-specific and game-specific playoff logos.</small>
            {logoSaveError && <span className="league-logo-save-error" role="alert">{logoSaveError}</span>}
          </div>
          <footer>
            <button type="button" className="button-secondary" disabled={logoSaveBusy} onClick={skipPromptLogoSave}>Not now</button>
            {signedIn
              ? <button type="button" className="button-primary" disabled={logoSaveBusy} onClick={() => void savePromptLogos()}><BookmarkPlus />{logoSaveBusy ? "Saving…" : logoSavePrompt.presetId ? "Update saved league" : "Save league and logos"}</button>
              : <Link href="/account?next=/" className="button-primary"><LogIn />Sign in to save</Link>}
          </footer>
        </section>
      </div>}
    </section>
  );
}
