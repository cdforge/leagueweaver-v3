"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  BookmarkPlus,
  LogIn,
  Medal,
  PencilRuler,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  WandSparkles,
  X,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { ImportLeagueModal, type ImportSource } from "@/components/imports/ImportLeagueModal";
import { useAuthModal } from "@/components/account/AuthModalProvider";
import { createClient } from "@/lib/supabase/client";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmDialog } from "@/components/ui/Modal";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import { createBlankSetup, createDefaultSetup, createDivisions, createTeams } from "@/lib/defaults";
import { identityFromSetup, normalizeSavedLeague } from "@/lib/savedLeagues";
import { generateLeagueSchedule, getNflWeeks, getNflWeekWindow, getWeekDateLabel } from "@/lib/schedule";
import { createLocalSeasonId, listLocalSeasons, loadSetup, saveSeason, saveSetup } from "@/lib/storage";
import { divisionAcronym, entityMonogram, leagueAcronym, resolveInitials } from "@/lib/monograms";
import { accessibleAccentColor, readableTextColor } from "@/lib/colorContrast";
import { formatDraftPlace, getTeamsMissingDraftPlaces, getWeekOneTeamOrder, hasCompleteDraftRanking } from "@/lib/rankings";
import {
  getMaximumPlayoffFieldSize,
  getPlayoffByeCount,
  getPlayoffGameBrandingSlots,
  getPlayoffRoundNames,
  isPlayoffPlacementUsable,
  normalizePlayoffSettings,
  PLAYOFF_THEME_COLORS,
} from "@/lib/playoffs";
import { projectConsolationBracket } from "@/lib/consolation";
import { BracketConnectorLayer, type BracketConnection } from "@/components/season/BracketConnectorLayer";
import { teamDisplayName, teamInitials, teamMonogram } from "@/lib/teamIdentity";
import type { Division, GeneratedSchedule, ImportPreview, LeagueSetupInput, SavedLeagueIdentity, SavedLeaguePreset, Team } from "@/lib/types";
import { GenerationReveal } from "@/components/builder/GenerationReveal";

const STEPS = [
  { label: "Start", shortLabel: "Start" },
  { label: "League", shortLabel: "League" },
  { label: "Teams", shortLabel: "Teams" },
  { label: "Divisions", shortLabel: "Divisions" },
  { label: "Season", shortLabel: "Season" },
  { label: "Seeding", shortLabel: "Seeding" },
  { label: "Week 1 Ranking", shortLabel: "Week 1" },
  { label: "Schedule Rules", shortLabel: "Rules" },
  { label: "Playoffs", shortLabel: "Playoffs" },
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

function formatSavedLeagueDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function SavedLeagueRow({ preset, latest, onChoose }: { preset: SavedLeaguePreset; latest?: boolean; onChoose: (preset: SavedLeaguePreset) => void }) {
  const league = preset.data.league;
  const connection = connectedLabel(preset);
  const updated = formatSavedLeagueDate(preset.updatedAt);
  return (
    <button type="button" className="saved-league-row" style={{ "--row-accent": league.color } as React.CSSProperties} onClick={() => onChoose(preset)}>
      <EntityLogo size={32} color={league.color} logoUrl={league.logoUrl} monogram={resolveInitials(league.initials, leagueAcronym(league.name))} />
      <span className="saved-league-row-who">
        <strong>{league.name || preset.name}{latest && <span className="saved-league-recency">Last used</span>}</strong>
        <small>{preset.data.teams.length} teams · {preset.data.divisions.length} divisions{connection ? ` · ${connection}` : ""}</small>
      </span>
      {updated && <span className="saved-league-when">Updated · <b>{updated}</b></span>}
      <span className="saved-league-load-cue">Load<ChevronRight aria-hidden="true" /></span>
    </button>
  );
}

// Step 2's picker only ever *resumes* a saved league. Doing nothing here and
// filling in the form below is how a new league is started, so there is no
// "new league" button. First-timers (no presets) see nothing at all.
function SavedLeagueShortcut({ presets, loadedPreset, onChoose, onStartFresh }: { presets: SavedLeaguePreset[]; loadedPreset: SavedLeaguePreset | null; onChoose: (preset: SavedLeaguePreset) => void; onStartFresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!presets.length) return null;
  if (loadedPreset) {
    return (
      <div className="saved-league-shortcut saved-league-loaded">
        <span className="saved-league-loaded-check"><Check aria-hidden="true" /></span>
        <div className="saved-league-loaded-copy">
          <strong>{loadedPreset.data.league.name || loadedPreset.name}</strong>
          <small>Teams, divisions, colors &amp; logos loaded — edit below, or continue to Season.</small>
        </div>
        <button type="button" className="saved-league-startfresh" onClick={onStartFresh}><RotateCcw aria-hidden="true" />Start fresh instead</button>
      </div>
    );
  }
  const [latest, ...rest] = presets;
  return (
    <div className="saved-league-shortcut">
      <div className="saved-league-resume-head"><strong>Continue a saved league</strong><span>or ignore this and start fresh below</span></div>
      <div className="saved-league-rows">
        <SavedLeagueRow preset={latest} latest onChoose={onChoose} />
        {expanded && rest.map((preset) => <SavedLeagueRow key={preset.id} preset={preset} onChoose={onChoose} />)}
      </div>
      {rest.length > 0 && (
        <button type="button" className="saved-league-disclosure" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show fewer" : `Other saved leagues (${rest.length})`}<ChevronDown aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function SourceStep({ onManual, onImport }: { onManual: () => void; onImport: (source: ImportSource) => void }) {
  return (
    <div className="step-stack">
      <div className="section-heading">
        <span className="step-kicker">Step 1 of 10</span>
        <h1>How do you want to enter your data?</h1>
        <p>Build from scratch, or bring in your teams from ESPN, Sleeper, or a CSV. You’ll confirm every step before we generate the schedule.</p>
      </div>
      <div className="source-step start-grid" role="group" aria-label="Choose how to enter your league data">
        <button type="button" className="start-option start-option--main" onClick={onManual}>
          <span className="start-option-icon"><PencilRuler aria-hidden="true" /></span>
          <span className="start-option-copy">
            <strong>Start manually</strong>
            <small>Build a clean league from scratch. We’ll walk you through every step.</small>
          </span>
          <span className="start-option-go" aria-hidden="true"><ArrowRight /></span>
        </button>
        <div className="start-divider"><span>or bring in your league</span></div>
        <div className="start-import-row">
          <button type="button" className="start-option" onClick={() => onImport("espn")}>
            <span className="start-option-icon import-icon espn"><img src="/providers/espn.png" alt="" /></span>
            <span className="start-option-copy">
              <strong>Connect ESPN</strong>
              <small>Prefill teams from your ESPN league.</small>
            </span>
          </button>
          <button type="button" className="start-option" onClick={() => onImport("sleeper")}>
            <span className="start-option-icon import-icon sleeper"><img src="/providers/sleeper.png" alt="" /></span>
            <span className="start-option-copy">
              <strong>Connect Sleeper</strong>
              <small>Pull teams from the read-only Sleeper API.</small>
            </span>
          </button>
          <button type="button" className="start-option" onClick={() => onImport("csv")}>
            <span className="start-option-icon"><FileSpreadsheet aria-hidden="true" /></span>
            <span className="start-option-copy">
              <strong>CSV or paste</strong>
              <small>Upload a file or paste a roster. Template included.</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LeagueStep({ setup, setSetup, presets, loadedPreset, onQuickImport, onStartFresh, onLeagueLogoUploaded }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>; presets: SavedLeaguePreset[]; loadedPreset: SavedLeaguePreset | null; onQuickImport: (preset: SavedLeaguePreset) => void; onStartFresh: () => void; onLeagueLogoUploaded: (logoUrl: string) => void }) {
  return (
    <div className="step-stack">
      <div className="section-heading">
        <span className="step-kicker">Step 2 of 10</span>
        <h1>Start with your league.</h1>
        <p>{presets.length ? "Pick up where you left off, or just fill in the form to start fresh." : "Name it, then set its colors and logo."}</p>
      </div>
      <SavedLeagueShortcut presets={presets} loadedPreset={loadedPreset} onChoose={onQuickImport} onStartFresh={onStartFresh} />
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
          onChange={(next) => {
            if (next.logoUrl && next.logoUrl !== setup.logoUrl) onLeagueLogoUploaded(next.logoUrl);
            setSetup((current) => ({ ...current, ...next }));
          }}
        />
        <div className="image-color-note"><Sparkles /><span><strong>Logo-aware colors</strong><small>Upload a logo to choose from its three strongest colors or use a custom swatch.</small></span></div>
      </div>
    </div>
  );
}

function TeamsStep({ setup, setSetup, showErrors }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>; showErrors: boolean }) {
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
      <div className="section-heading"><span className="step-kicker">Step 3 of 10</span><h1>Add every team.</h1><p>Confirm team identities now. You’ll organize divisions on the next step.</p></div>
      <div className="team-details-stage">
        <div className="team-meta-controls"><div><FieldLabel>Teams</FieldLabel><div className="stepper"><button type="button" aria-label="Remove two teams" onClick={() => setTeamCount(setup.teams.length - 2)}><Minus /></button><strong>{setup.teams.length}</strong><button type="button" aria-label="Add two teams" onClick={() => setTeamCount(setup.teams.length + 2)}><Plus /></button></div></div><div><FieldLabel>Optional team details</FieldLabel><div className="field-switches"><FieldSwitch checked={setup.display.cityNames} onChange={(cityNames) => updateDisplay({ cityNames })} label="City names" /><FieldSwitch checked={setup.display.managers} onChange={(managers) => updateDisplay({ managers })} label="Managers" /><FieldSwitch checked={setup.display.venues} onChange={(venues) => updateDisplay({ venues })} label="Venues" /></div></div></div>
        <div className="team-editor-table" style={{ "--team-columns": teamColumns } as React.CSSProperties}>
          <div className="team-editor-head"><span>Identity</span>{setup.display.cityNames && <span>City</span>}<span>Team name</span><span>Initials</span>{setup.display.managers && <span>Manager</span>}{setup.display.venues && <span>Home venue</span>}</div>
          <div className="team-editor-list">{setup.teams.map((team) => <div className="team-editor-row" key={team.id}>
            <IdentityColorPicker compact name={teamDisplayName(team, setup.display.cityNames)} abbreviation={teamInitials(team)} color={team.color} logoUrl={team.logoUrl} onChange={(next) => updateTeam(team.id, next)} />
            {setup.display.cityNames && <label className="team-editor-field"><span>City</span><input aria-label={`Team ${team.overallRank} city`} placeholder="City" value={team.city} onChange={(event) => updateTeam(team.id, { city: event.target.value })} /></label>}
            <label className="team-editor-field"><span>Team name</span><input aria-label={`Team ${team.overallRank} name`} aria-invalid={showErrors && !team.name.trim()} placeholder="Team name" value={team.name} onChange={(event) => updateTeam(team.id, { name: event.target.value })} /></label>
            <label className="team-editor-field"><span>Initials</span><input aria-label={`${teamDisplayName(team)} initials override`} maxLength={4} placeholder={`Auto: ${entityMonogram(team.name, team.city)}`} value={team.initials ?? ""} onChange={(event) => updateTeam(team.id, { initials: event.target.value || undefined })} /></label>
            {setup.display.managers && <label className="team-editor-field"><span>Manager</span><input aria-label={`${teamDisplayName(team)} manager`} placeholder="Manager" value={team.manager} onChange={(event) => updateTeam(team.id, { manager: event.target.value })} /></label>}
            {setup.display.venues && <label className="team-editor-field"><span>Home venue</span><input aria-label={`${teamDisplayName(team)} venue`} placeholder="Home venue" value={team.stadium} onChange={(event) => updateTeam(team.id, { stadium: event.target.value })} /></label>}
          </div>)}</div>
        </div>
      </div>
    </div>
  );
}

function DivisionsStep({ setup, setSetup, showErrors }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>; showErrors: boolean }) {
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
    <div className="section-heading"><span className="step-kicker">Step 4 of 10</span><h1>Build the divisions.</h1><p>Name each group, keep its color and logo visible, then place every team.</p></div>
    <div className="division-stage">
      <div className="compact-controls division-controls"><div><FieldLabel>Divisions</FieldLabel><div className="segmented"><button type="button" className={setup.divisions.length === 2 ? "active" : ""} onClick={() => setDivisionCount(2)}>2</button><button type="button" className={setup.divisions.length === 3 ? "active" : ""} onClick={() => setDivisionCount(3)}>3</button><button type="button" className={setup.divisions.length === 4 ? "active" : ""} onClick={() => setDivisionCount(4)}>4</button></div></div><div className={`roster-status ${balanced ? "" : "warning"}`}>{balanced ? <Check /> : <CircleAlert />}<span><strong>{balanced ? "Balanced divisions" : "Divisions need rebalancing"}</strong><small>{counts.join(" · ")} teams</small></span></div></div>
      <div className="division-strip">{setup.divisions.map((division) => <div className="division-identity-edit" key={division.id}><IdentityColorPicker compact name={`${division.name} division`} abbreviation={resolveInitials(division.initials, divisionAcronym(division.name))} color={division.color} logoUrl={division.logoUrl} onChange={(next) => updateDivision(division.id, next)} /><div><input aria-label={`${division.name} division name`} aria-invalid={showErrors && !division.name.trim()} value={division.name} onChange={(event) => updateDivision(division.id, { name: event.target.value })} /><input aria-label={`${division.name} division initials override`} maxLength={4} placeholder={`Auto: ${divisionAcronym(division.name)}`} value={division.initials ?? ""} onChange={(event) => updateDivision(division.id, { initials: event.target.value || undefined })} /></div></div>)}</div>
      <div className="division-assignments"><div className="division-assign-head"><strong>Place each team</strong><span>Keep each division within one team of the others.</span></div><div>{setup.teams.map((team) => <div className="division-assign-row" key={team.id}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} /><span>{setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong>{team.name}</strong>{setup.display.managers && <small>{team.manager || "No manager"}</small>}</span><CustomSelect label={`${teamDisplayName(team)} division`} value={team.divisionId} onChange={(divisionId) => updateTeam(team.id, divisionId)} options={setup.divisions.map((division) => ({ value: division.id, label: division.name, swatch: division.color, logoUrl: division.logoUrl, monogram: resolveInitials(division.initials, divisionAcronym(division.name)) }))} /></div>)}</div></div>
    </div>
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
      <div className="section-heading"><span className="step-kicker">Step 5 of 10</span><h1>Frame the season.</h1><p>League Weaver uses real NFL week windows for the regular season.</p></div>
      <div className="field-grid two-col season-controls">
        <div><FieldLabel>Regular-season length</FieldLabel><div className="choice-row"><button type="button" disabled={requiresFourteenWeeks} className={setup.weeks === 13 ? "active" : ""} onClick={() => setRegularSeasonWeeks(13)}><strong>13 weeks</strong><small>{requiresFourteenWeeks ? "Unavailable for this division shape" : "Compact regular season"}</small></button><button type="button" className={setup.weeks === 14 ? "active" : ""} onClick={() => setRegularSeasonWeeks(14)}><strong>14 weeks</strong><small>Extra regular-season week</small></button></div></div>
        <div><FieldLabel>NFL season</FieldLabel><CustomSelect label="NFL season" value={String(setup.seasonYear)} onChange={(seasonYear) => setSetup((current) => ({ ...current, seasonYear: Number(seasonYear) }))} options={[2025, 2026, 2027].map((year) => ({ value: String(year), label: `${year} season`, description: year === 2026 ? "Current planning year" : "NFL week calendar" }))} /></div>
      </div>
      {requiresFourteenWeeks && <div className="info-callout"><Info /><span><strong>Fourteen weeks keeps this shape complete.</strong> This division layout needs the extra week so every divisional opponent can play twice without byes.</span></div>}
      <div className="week-window">
        <div className="week-window-head"><span><CalendarDays /><strong>{setup.seasonYear} fantasy week windows</strong></span><small>Tuesday 4:00 AM ET rollover</small></div>
        <div className="week-chip-grid">{weeks.map((week) => <span className={week.holidays.length ? "holiday" : ""} key={week.week}><strong>W{week.week}</strong>{week.label.replace(`, ${setup.seasonYear}`, "")}{week.holidays.map((holiday) => <em key={holiday}>{holiday}</em>)}</span>)}</div>
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
    <div className="section-heading"><span className="step-kicker">Step 6 of 10</span><h1>Set last season’s order.</h1><p>Seeding is optional. Use it only when prior-season results should shape cross-division matchups.</p></div>
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
    <div className="section-heading"><span className="step-kicker">Step 7 of 10</span><h1>Rank the opening week.</h1><p>Choose what should shape Week 1 marquee matchups and the first Game of the Week.</p></div>
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
      <div className="section-heading"><span className="step-kicker">Step 8 of 10</span><h1>Set your schedule rules.</h1><p>Every rule is checked before the schedule is shown. These controls shape the feel and highlights of the season.</p></div>
      <div className="rule-group">
        <div className="rule-group-title"><ShieldCheck /><span><strong>Ground rules</strong><small>Always applied to every schedule</small></span></div>
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

function PlayoffsStep({ setup, setSetup }: { setup: LeagueSetupInput; setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>> }) {
  const p = setup.playoffs;
  const [subPage, setSubPage] = useState<"format" | "rules" | "brand" | "logos">("format");
  const [expandedRounds, setExpandedRounds] = useState<number[]>([]);
  const [previewView, setPreviewView] = useState<"championship" | "consolation">("championship");
  const divisionCount = setup.divisions.length;
  const maxFieldSize = getMaximumPlayoffFieldSize(setup.teams.length, setup.weeks, p.bracketType);
  const patch = (next: Partial<LeagueSetupInput["playoffs"]>) =>
    setSetup((current) => ({ ...current, playoffs: { ...current.playoffs, ...next } }));

  const setFieldSize = (fieldSize: number) => {
    const halvesUsable = isPlayoffPlacementUsable("division-halves", divisionCount, fieldSize);
    patch({
      fieldSize,
      placementMode: p.placementMode === "division-halves" && !halvesUsable ? "overall" : p.placementMode,
      consolationMode: p.consolationMode === "division-halves" && !halvesUsable ? "standard" : p.consolationMode,
      thirdPlaceGame: p.consolationMode !== "off" && fieldSize >= 4,
      fieldStatus: "live",
      lockedTeamIds: [],
    });
  };
  const setTheme = (theme: LeagueSetupInput["playoffs"]["theme"]) =>
    patch(theme === "custom" ? { theme } : { theme, color: PLAYOFF_THEME_COLORS[theme] });
  const setConsolation = (consolationMode: LeagueSetupInput["playoffs"]["consolationMode"]) =>
    patch({ consolationMode, thirdPlaceGame: consolationMode !== "off" && p.fieldSize >= 4 });

  // Division halves is the recommended default for eligible builds: pre-select it
  // once on mount when the league is still on "auto" and halves are usable.
  useEffect(() => {
    // "auto" is no longer a user-facing option — resolve it to a concrete mode (halves preferred).
    if (p.placementMode === "auto") {
      patch({ placementMode: isPlayoffPlacementUsable("division-halves", divisionCount, p.fieldSize) ? "division-halves" : isPlayoffPlacementUsable("division-leaders", divisionCount, p.fieldSize) ? "division-leaders" : "overall" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byeCount = getPlayoffByeCount(p.fieldSize);
  const fieldSizeOptions: number[] = [];
  for (let n = 2; n <= maxFieldSize; n += 2) fieldSizeOptions.push(n);
  if (!fieldSizeOptions.includes(maxFieldSize)) fieldSizeOptions.push(maxFieldSize);

  const halvesUsable = isPlayoffPlacementUsable("division-halves", divisionCount, p.fieldSize);
  const placementOptions = [
    ...(halvesUsable
      ? [{ value: "division-halves", label: "Division halves (Recommended)", description: "NFL-style — each half runs its own tournament to the final" }] : []),
    ...(isPlayoffPlacementUsable("division-leaders", divisionCount, p.fieldSize)
      ? [{ value: "division-leaders", label: "Division leaders protected", description: "Classic fantasy — each division winner is guaranteed a top seed on its own side" }] : []),
    { value: "overall", label: "Overall standings", description: "Simple — top finishers qualify by overall seed, regardless of division" },
  ];
  const consolationOptions = [
    { value: "off", label: "No consolation bracket", description: "Championship bracket only" },
    { value: "standard", label: "Standard placement", description: "Placement bracket for non-qualifiers" },
    ...(isPlayoffPlacementUsable("division-halves", divisionCount, p.fieldSize)
      ? [{ value: "division-halves", label: "Division-halves placement", description: "Open inside the division, then cross over" }] : []),
  ];
  const themes: Array<LeagueSetupInput["playoffs"]["theme"]> = ["gold", "silver", "bronze", "custom"];

  // Presets set several fields at once; the form remains the "customize" fallback.

  // Round & game branding — the slots derive from the format choices, so they exist before generation.
  const normalized = normalizePlayoffSettings(p, setup.teams.length, setup.color, setup.weeks);
  const roundNames = getPlayoffRoundNames(normalized, divisionCount);
  const gameSlots = getPlayoffGameBrandingSlots(normalized, divisionCount);
  // Consolation slots derive from a stubbed schedule (structure is deterministic from settings).
  const consolationSlots: Array<{ id: string; label: string; roundName: string; roundIndex: number }> = (() => {
    if (p.consolationMode === "off") return [];
    try {
      const stub = { id: "wizard-preview", seed: "0", createdAt: "", setup: { ...setup, playoffs: normalized }, weeks: [], playoffGames: [], revision: 0, fairness: {} } as unknown as GeneratedSchedule;
      const bracket = projectConsolationBracket(stub);
      return bracket?.rounds.flatMap((round) => round.games.map((game) => ({ id: game.id, label: game.label, roundName: round.name, roundIndex: round.roundIndex }))) ?? [];
    } catch { return []; }
  })();
  const updateRoundName = (roundIndex: number, name: string) => {
    const next = [...(p.roundNames ?? roundNames)];
    next[roundIndex] = name.slice(0, 40);
    patch({ roundNames: next });
  };
  const updateRoundLogo = (roundIndex: number, logoUrl?: string) => {
    const next = [...(p.roundLogoUrls ?? Array(roundNames.length).fill(""))];
    next[roundIndex] = logoUrl || "";
    patch({ roundLogoUrls: next });
  };
  const updateGameName = (gameId: string, name: string) => {
    const next = { ...(p.gameNames ?? {}) };
    if (name.trim()) next[gameId] = name.slice(0, 60); else delete next[gameId];
    patch({ gameNames: next });
  };
  const updateGameLogo = (gameId: string, logoUrl?: string) => {
    const next = { ...(p.gameLogoUrls ?? {}) };
    if (logoUrl) next[gameId] = logoUrl; else delete next[gameId];
    patch({ gameLogoUrls: next });
  };

  // Live preview — a real left-to-right bracket (one column per round) with connector lines,
  // structural slots (seed + division, not sample teams), division logos/colors, and a
  // championship ↔ consolation toggle.
  const divisions = setup.divisions;
  const divById = new Map(divisions.map((d) => [d.id, d]));
  const seeded = [...setup.teams].sort((a, b) => (a.overallRank ?? 99) - (b.overallRank ?? 99));
  const divOfSeed = (seed: number) => { const t = seeded[seed - 1]; return t ? divById.get(t.divisionId) : undefined; };
  const divInitials = (d?: Division) => (d?.initials?.trim() || d?.name || "D").slice(0, 3).toUpperCase();
  const previewHalves = p.placementMode === "division-halves" && halvesUsable && divisions.length >= 2;

  type PSlot = { division?: Division; seed?: number; feederId?: string; text?: string };
  type PMatch = { id: string; accent?: string; gold?: boolean; gameNo?: number; slots: PSlot[] };
  type PRound = { name: string; matches: PMatch[] };
  type PBracket = { rounds: PRound[]; connections: BracketConnection[]; gameNo: Record<string, number> };

  // Number every game across the bracket (round order, top to bottom) so later rounds can
  // reference "Winner · Game N".
  const numberGames = (rounds: PRound[]): Record<string, number> => {
    const map: Record<string, number> = {}; let g = 0;
    rounds.forEach((round) => round.matches.forEach((m) => { g += 1; m.gameNo = g; map[m.id] = g; }));
    return map;
  };

  const buildPool = (kind: "championship" | "consolation"): PBracket => {
    const rounds: PRound[] = []; const conns: BracketConnection[] = [];
    const link = (source: string, target: string, color?: string) => conns.push({ id: `k-${source}-${target}`, sourceGameId: source, targetGameId: target, outcome: "winner", color });
    const n = p.fieldSize;
    const isCons = kind === "consolation";
    const total = seeded.length;

    // General single-elimination sub-bracket for a seeded list (any size; top seeds get byes when
    // the count isn't a power of two). Returns the games per round + the id of its final game.
    const buildSeedBracket = (seeds: number[], prefix: string, slotFor: (s: number) => PSlot): { rounds: PMatch[][]; championId: string } => {
      const size = seeds.length;
      if (size <= 1) return { rounds: [], championId: `${prefix}-solo` };
      let bracketSize = 1; while (bracketSize < size) bracketSize *= 2;
      // Standard bracket-seeding permutation of positions 1..bracketSize so #1 and #2
      // always sit in opposite halves and byes attach to the correct top seeds.
      let order = [1, 2];
      while (order.length < bracketSize) {
        const s = order.length * 2; const next: number[] = [];
        for (const x of order) { next.push(x); next.push(s + 1 - x); }
        order = next;
      }
      // Each bracket slot holds a seed (1..size) or null when that rank is a bye.
      const slotAt = order.map((rank) => (rank <= size ? seeds[rank - 1] : null));
      const out: PMatch[][] = [];
      const r1: PMatch[] = [];
      let advancers: PSlot[] = [];
      for (let j = 0; j < bracketSize / 2; j++) {
        const a = slotAt[2 * j], b = slotAt[2 * j + 1];
        if (a != null && b != null) {
          const id = `${prefix}-r1-${j}`;
          r1.push({ id, accent: slotFor(a).division?.color, slots: [slotFor(a), slotFor(b)] });
          advancers.push({ feederId: id });
        } else {
          const s = (a != null ? a : b) as number; // bye — present seed advances
          advancers.push(slotFor(s));
        }
      }
      if (r1.length) out.push(r1);
      let ri = out.length;
      while (advancers.length > 1) {
        const matches: PMatch[] = []; const next: PSlot[] = [];
        for (let k = 0; k < Math.floor(advancers.length / 2); k++) {
          const s1 = advancers[2 * k], s2 = advancers[2 * k + 1];
          const id = `${prefix}-r${ri + 1}-${k}`;
          if (s1?.feederId) link(s1.feederId, id, s1.division?.color);
          if (s2?.feederId) link(s2.feederId, id, s2.division?.color);
          matches.push({ id, accent: s1?.division?.color ?? s2?.division?.color, slots: [s1, s2] });
          next.push({ feederId: id });
        }
        out.push(matches); advancers = next; ri += 1;
      }
      return { rounds: out, championId: out.length ? out[out.length - 1][0].id : `${prefix}-r1-0` };
    };

    if (previewHalves) {
      const per = Math.ceil(n / 2);
      const divCount = (d?: Division) => seeded.filter((t) => divById.get(t.divisionId)?.id === d?.id).length;
      const offset = isCons ? per : 0; // consolation continues each division's seed ranking below the qualifiers
      const counts = [0, 1].map((hi) => (isCons ? Math.max(0, divCount(divisions[hi]) - per) : per));
      if (counts[0] + counts[1] >= 2 && counts[0] >= 1 && counts[1] >= 1) {
        const champLabel = (d?: Division) => { const nm = d?.name ?? "Division"; return nm.length <= 11 ? `${nm} champ` : "Div champ"; };
        const halves = [0, 1].map((hi) => {
          const d = divisions[hi] ?? divisions[0];
          const localSeeds = Array.from({ length: counts[hi] }, (_, i) => i + 1);
          return { d, count: counts[hi], ...buildSeedBracket(localSeeds, `pv-h${hi}`, (s) => ({ division: d, seed: offset + s })) };
        });
        const maxRounds = Math.max(halves[0].rounds.length, halves[1].rounds.length);
        for (let r = 0; r < maxRounds; r++) {
          const name = isCons
            ? (r === maxRounds - 1 ? "Division consolation" : `Consolation round ${r + 1}`)
            : (roundNames[r] ?? (r === 0 ? "Wild Card" : "Divisional Championship"));
          rounds.push({ name, matches: halves.flatMap((h) => h.rounds[r] ?? []) });
        }
        const finalSlots: PSlot[] = isCons
          ? halves.map((h) => (h.count >= 2 ? { feederId: h.championId } : { division: h.d, seed: offset + 1 }))
          : [{ division: divisions[0], text: champLabel(divisions[0]) }, { division: divisions[1], text: champLabel(divisions[1]) }];
        const final: PMatch = { id: isCons ? "pv-cons-final" : "pv-final", gold: !isCons, slots: finalSlots };
        halves.forEach((h, hi) => { if (h.count >= 2) link(h.championId, final.id, divisions[hi]?.color); });
        rounds.push({ name: isCons ? "Consolation final" : (roundNames[maxRounds] ?? "Championship"), matches: [final] });
        return { rounds, connections: conns, gameNo: numberGames(rounds) };
      }
      // consolation leftovers too small/uneven to split by division — fall through to a plain seed list
    }

    // Overall / division-leaders championship, or a plain seed-ordered consolation of the teams
    // that missed the field (seeds n+1 … total). Consolation always uses pure overall seeds.
    const isOverall = p.placementMode === "overall";
    const leaderLabel = divisions.length === 2 ? "#1 / #2 seed" : `#1–${divisions.length} seed`;
    // In division-leaders, only the protected leaders take fixed top seeds; every wild-card
    // seed below them shifts with the leaders' records, so pair them off (#3 / #4, #5 / #6…).
    const wildStart = divisions.length + 1;
    const seedPairLabel = (s: number): string => {
      const lo = wildStart + Math.floor((s - wildStart) / 2) * 2;
      return `#${lo} / #${lo + 1} seed`;
    };
    const poolSeeds = isCons
      ? Array.from({ length: Math.max(0, total - n) }, (_, i) => n + 1 + i)
      : Array.from({ length: n }, (_, i) => i + 1);
    if (poolSeeds.length < 2) return { rounds: [], connections: [], gameNo: {} };
    const slotFor = (s: number): PSlot => isCons
      ? { seed: s }
      : (isOverall ? { seed: s } : (s <= divisions.length ? { division: divOfSeed(s), text: leaderLabel } : { text: seedPairLabel(s) }));
    const { rounds: bracketRounds } = buildSeedBracket(poolSeeds, isCons ? "pv-c" : "pv", slotFor);
    bracketRounds.forEach((matches, i) => {
      const last = i === bracketRounds.length - 1;
      const name = isCons ? (last ? "Consolation final" : `Consolation round ${i + 1}`) : (roundNames[i] ?? (last ? "Championship" : `Round ${i + 1}`));
      rounds.push({ name, matches });
    });
    const lastRound = rounds[rounds.length - 1];
    if (lastRound?.matches.length === 1 && !isCons) { lastRound.matches[0].gold = true; lastRound.name = roundNames[rounds.length - 1] ?? "Championship"; }
    return { rounds, connections: conns, gameNo: numberGames(rounds) };
  };
  const buildChampionship = (): PBracket => buildPool("championship");
  const buildConsolation = (): PBracket => buildPool("consolation");

  const consolationAvailable = consolationSlots.length > 0 && (seeded.length - p.fieldSize) >= 2;
  const showConsolationView = previewView === "consolation" && consolationAvailable;
  const bracketSignature = [
    showConsolationView, p.fieldSize, p.bracketType, p.placementMode, byeCount, previewHalves,
    roundNames.join("~"),
    divisions.map((d) => `${d.id}:${d.color}:${d.logoUrl ?? ""}`).join(","),
    setup.teams.map((t) => `${t.id}:${t.overallRank}:${t.divisionId}`).join(","),
    consolationSlots.map((s) => s.id).join(","),
  ].join("|");
  // Stabilize the bracket (and its connections array) so BracketConnectorLayer measures once
  // instead of churning on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewBracket = useMemo(() => (showConsolationView ? buildConsolation() : buildChampionship()), [bracketSignature]);

  const renderSlot = (slot: PSlot, gameNo: Record<string, number>, key: number) => {
    const d = slot.division;
    const color = d?.color ?? "#586761";
    const label = slot.text ?? (slot.seed != null ? `#${slot.seed} seed` : slot.feederId ? `Winner · Game ${gameNo[slot.feederId] ?? "?"}` : "TBD");
    return <span key={key} className="ppw-slot" style={{ "--slot-c": color, color: accessibleAccentColor(color, "#161d18") } as React.CSSProperties}>
      {d?.logoUrl ? <img className="ppw-slogo" src={d.logoUrl} alt="" /> : <b className="ppw-dchip" style={{ background: color, color: readableTextColor(color) } as React.CSSProperties}>{d ? divInitials(d) : "#"}</b>}
      <span className="ppw-name">{label}</span>
    </span>;
  };
  const renderBracket = (data: PBracket) => (
    <BracketConnectorLayer className="ppw-bracket" connections={data.connections}>
      {data.rounds.map((round, ri) => <div key={ri} className={`ppw-col ${ri === data.rounds.length - 1 ? "ppw-final" : ""}`}>
        <span className="ppw-rh">{round.name}</span>
        <div className="ppw-col-games">{round.matches.map((m) => <div key={m.id} data-bracket-game-id={m.id} className={`ppw-match ${m.gold ? "ppw-gold" : ""}`} style={{ "--ppw-accent": m.gold ? "var(--gold)" : (m.accent ?? "#3fbf7f") } as React.CSSProperties}>
          {m.slots.length === 2 && <span className="ppw-gameno">Game {m.gameNo}</span>}
          {m.slots.map((s, i) => renderSlot(s, data.gameNo, i))}
        </div>)}</div>
      </div>)}
    </BracketConnectorLayer>
  );

  const subPages: Array<{ key: typeof subPage; label: string; sub: string }> = [
    { key: "format", label: "Format", sub: "Field & bracket" },
    { key: "rules", label: "Rules", sub: "Seeding & venue" },
    { key: "brand", label: "Branding", sub: "Name & trophy" },
    { key: "logos", label: "Logos", sub: "Optional" },
  ];

  return <div className="step-stack playoff-wizard">
    <div className="section-heading"><span className="step-kicker">Step 9 of 10</span><h1>Shape the playoffs.</h1><p>Set the field and format, fine-tune the rules, then brand every round. You can change any of this later on the Playoffs page.</p></div>

    <div className="playoff-wizard-subnav" role="tablist" aria-label="Playoff setup sections">
      {subPages.map((sp, i) => <button key={sp.key} type="button" role="tab" aria-selected={subPage === sp.key} className={subPage === sp.key ? "active" : ""} onClick={() => setSubPage(sp.key)}><span className="ppw-n">{i + 1}</span><span className="ppw-lab"><strong>{sp.label}</strong><small>{sp.sub}</small></span></button>)}
    </div>

    <div className="playoff-wizard-layout">
      <div className="playoff-wizard-form">
        {subPage === "format" && <>
          <div className="ppw-group"><FieldLabel hint={byeCount ? `${byeCount} bye${byeCount === 1 ? "" : "s"} for the top seed${byeCount === 1 ? "" : "s"}` : "every qualifier opens play"}>Playoff teams</FieldLabel>
            <CustomSelect label="Playoff field size" value={String(p.fieldSize)} onChange={(value) => setFieldSize(Number(value))} options={fieldSizeOptions.map((n) => ({ value: String(n), label: `${n} teams`, description: getPlayoffByeCount(n) ? `${getPlayoffByeCount(n)} bye${getPlayoffByeCount(n) === 1 ? "" : "s"}` : "No byes" }))} />
          </div>
          <div className="ppw-group"><FieldLabel>Qualification</FieldLabel>
            <CustomSelect label="Playoff qualification" value={p.placementMode} onChange={(value) => patch({ placementMode: value as LeagueSetupInput["playoffs"]["placementMode"] })} options={placementOptions} />
          </div>
        </>}

        {subPage === "rules" && <>
          <div className="ppw-group"><FieldLabel>Reseeding</FieldLabel>
            <CustomSelect label="Reseeding" value={p.reseedMode} onChange={(value) => patch({ reseedMode: value as LeagueSetupInput["playoffs"]["reseedMode"] })} options={[
              { value: "protected", label: "Protected reseed (Recommended)", description: "Reseed while protecting bracket halves" },
              { value: "fixed", label: "Fixed bracket", description: "Winners follow set bracket paths" },
              { value: "each-round", label: "Reseed each round", description: "Top remaining seed always hosts the lowest" },
            ]} />
          </div>
          <div className="ppw-group"><FieldLabel>Championship venue</FieldLabel>
            <div className="choice-row">
              <button type="button" className={p.championshipVenueMode === "higher-seed" ? "active" : ""} onClick={() => patch({ championshipVenueMode: "higher-seed" })}><strong>Higher seed hosts</strong><small>Top seed keeps home field</small></button>
              <button type="button" className={p.championshipVenueMode === "neutral-site" ? "active" : ""} onClick={() => patch({ championshipVenueMode: "neutral-site" })}><strong>Neutral site</strong><small>Title game at a set venue</small></button>
            </div>
          </div>
          <div className="ppw-group"><FieldLabel>Seed labels</FieldLabel>
            <div className="choice-row">
              <button type="button" className={p.seedDisplayMode === "reranked" ? "active" : ""} onClick={() => patch({ seedDisplayMode: "reranked" })}><strong>Bracket seeds</strong><small>1…N by playoff seeding</small></button>
              <button type="button" className={p.seedDisplayMode === "standings-finish" ? "active" : ""} onClick={() => patch({ seedDisplayMode: "standings-finish" })}><strong>Standings finish</strong><small>Show regular-season place</small></button>
            </div>
          </div>
          <div className="ppw-group"><FieldLabel>Consolation bracket</FieldLabel>
            <CustomSelect label="Consolation bracket" value={p.consolationMode} onChange={(value) => setConsolation(value as LeagueSetupInput["playoffs"]["consolationMode"])} options={consolationOptions} />
          </div>
        </>}

        {subPage === "brand" && <>
          <div className="ppw-group"><FieldLabel>Playoff identity</FieldLabel>
            <div className="playoff-branding-row">
              <IdentityColorPicker name={p.name || "Championship Playoffs"} abbreviation="PO" color={p.color} logoUrl={p.logoUrl} showColorControl={p.theme === "custom"} onChange={(next) => patch({ ...(p.theme === "custom" ? { color: next.color } : {}), logoUrl: next.logoUrl })} />
              <div className="playoff-name-field"><FieldLabel>Playoff name</FieldLabel><input aria-label="Playoff name" value={p.name} maxLength={40} placeholder="Championship Playoffs" onChange={(event) => patch({ name: event.target.value })} /></div>
            </div>
          </div>
          <div className="ppw-group"><FieldLabel>Trophy theme</FieldLabel>
            <div className="choice-row playoff-theme-row">
              {themes.map((t) => <button key={t} type="button" className={p.theme === t ? "active" : ""} onClick={() => setTheme(t)}><span className="playoff-theme-swatch" style={{ background: t === "custom" ? p.color : PLAYOFF_THEME_COLORS[t] }} /><strong>{t.charAt(0).toUpperCase() + t.slice(1)}</strong></button>)}
            </div>
          </div>
        </>}

        {subPage === "logos" && <>
          <div className="ppw-optional"><span className="ppw-optional-tag">Optional</span><span>Add custom art — divisional logos, bowl-game badges, whatever your league runs. Skip it and every round falls back to your playoff logo.</span></div>
          <div className="ppw-group"><FieldLabel>Championship bracket</FieldLabel>
            <p className="ppw-rgnote">Name and badge each round. Multi-game rounds — like division halves — expand to logo each game.</p>
            <div className="ppw-rounds">{roundNames.map((round, roundIndex) => {
              const slots = gameSlots.filter((slot) => slot.roundIndex === roundIndex);
              const expanded = expandedRounds.includes(roundIndex);
              const brandedGames = slots.filter((slot) => p.gameLogoUrls?.[slot.id] || p.gameNames?.[slot.id]).length;
              return <div className="ppw-round" key={roundIndex}>
                <div className="ppw-round-head">
                  <IdentityColorPicker compact showColorControl={false} showAbbreviation={false} imagePresentation="bare" name={`${round} round`} abbreviation={(round || "R").slice(0, 3).toUpperCase()} color={p.color} logoUrl={p.roundLogoUrls?.[roundIndex]} onChange={(next) => updateRoundLogo(roundIndex, next.logoUrl)} />
                  <label className="ppw-round-name"><input aria-label={`Round ${roundIndex + 1} name`} defaultValue={round} maxLength={40} onBlur={(event) => updateRoundName(roundIndex, event.target.value)} /><small>{slots.length} game{slots.length === 1 ? "" : "s"}{brandedGames ? ` · ${brandedGames} branded` : ""}</small></label>
                  {slots.length > 1 && <button type="button" className="ppw-expand" aria-expanded={expanded} onClick={() => setExpandedRounds((cur) => cur.includes(roundIndex) ? cur.filter((x) => x !== roundIndex) : [...cur, roundIndex])}>{expanded ? "Hide games" : "Logo each game"}</button>}
                </div>
                {slots.length > 1 && expanded && <div className="ppw-games">{slots.map((slot) => {
                  const fallback = `${round} · Game ${slot.gameIndex + 1}`;
                  return <div className="ppw-game" key={slot.id}>
                    <IdentityColorPicker compact showColorControl={false} showAbbreviation={false} imagePresentation="bare" name={fallback} abbreviation={`G${slot.gameIndex + 1}`} color={p.color} logoUrl={p.gameLogoUrls?.[slot.id]} onChange={(next) => updateGameLogo(slot.id, next.logoUrl)} />
                    <input aria-label={`${fallback} name`} defaultValue={p.gameNames?.[slot.id] ?? fallback} maxLength={60} onBlur={(event) => updateGameName(slot.id, event.target.value)} />
                  </div>;
                })}</div>}
              </div>;
            })}</div>
          </div>
          {consolationSlots.length > 0 && <div className="ppw-group"><FieldLabel>Consolation bracket</FieldLabel>
            <p className="ppw-rgnote">Placement and bowl games for the teams outside the title hunt — each gets its own logo.</p>
            <div className="ppw-rounds">{[...new Map(consolationSlots.map((s) => [s.roundIndex, s.roundName])).entries()].map(([roundIndex, roundName]) => {
              const slots = consolationSlots.filter((s) => s.roundIndex === roundIndex);
              return <div className="ppw-round" key={`cons-${roundIndex}`}>
                <div className="ppw-round-head ppw-round-head-plain"><span className="ppw-cons-round">{roundName}</span><small>{slots.length} game{slots.length === 1 ? "" : "s"}</small></div>
                <div className="ppw-games ppw-games-flush">{slots.map((slot) => <div className="ppw-game" key={slot.id}>
                  <IdentityColorPicker compact showColorControl={false} showAbbreviation={false} imagePresentation="bare" name={slot.label} abbreviation="CG" color={p.color} logoUrl={p.gameLogoUrls?.[slot.id]} onChange={(next) => updateGameLogo(slot.id, next.logoUrl)} />
                  <input aria-label={`${slot.label} name`} defaultValue={p.gameNames?.[slot.id] ?? slot.label} maxLength={60} onBlur={(event) => updateGameName(slot.id, event.target.value)} />
                </div>)}</div>
              </div>;
            })}</div>
          </div>}
        </>}
      </div>

      <aside className="playoff-wizard-preview" aria-label="Live bracket preview">
        <div className="ppw-preview-head"><span className="ppw-preview-eyebrow">Live preview</span><span className="ppw-preview-live">Updates as you set</span></div>
        {consolationAvailable && <div className="ppw-preview-toggle" role="tablist" aria-label="Preview bracket">
          <button type="button" role="tab" aria-selected={!showConsolationView} className={!showConsolationView ? "active" : ""} onClick={() => setPreviewView("championship")}>Championship</button>
          <button type="button" role="tab" aria-selected={showConsolationView} className={showConsolationView ? "active" : ""} onClick={() => setPreviewView("consolation")}>Consolation</button>
        </div>}
        <strong className="ppw-preview-title">{showConsolationView ? "Placement bracket" : p.bracketType === "ladder" ? "The playoff ladder" : "Road to the title"}</strong>
        <small className="ppw-preview-sub">{showConsolationView ? `${Math.max(0, setup.teams.length - p.fieldSize)} teams outside the title hunt` : `${p.fieldSize} teams · ${previewHalves ? "division halves" : p.placementMode === "overall" ? "overall seeds" : "auto seeding"} · ${byeCount ? `${byeCount} bye${byeCount === 1 ? "" : "s"}` : "no byes"}`}</small>
        {renderBracket(previewBracket)}
        <div className="ppw-facts">
          <span className="ppw-fact">🏟 <b>{p.championshipVenueMode === "neutral-site" ? "Neutral site" : "Higher seed hosts"}</b></span>
          <span className="ppw-fact">🔀 <b>{p.reseedMode === "each-round" ? "Reseed each round" : p.reseedMode === "protected" ? "Protected" : "Fixed bracket"}</b></span>
          {byeCount > 0 && <span className="ppw-fact">🎫 <b>{byeCount} bye{byeCount === 1 ? "" : "s"}</b></span>}
        </div>
      </aside>
    </div>
  </div>;
}

function ReviewStep({ setup }: { setup: LeagueSetupInput }) {
  const checks = [
    `${setup.teams.length} teams balanced across ${setup.divisions.length} divisions`,
    `${setup.weeks}-week season with one matchup per team each week`,
    `Week 1 ranked by ${setup.weekOne.rankingSource === "draft-day" ? hasCompleteDraftRanking(setup) ? "draft-day place" : "draft-day place (set after the draft)" : "last season’s finish"}`,
    "Every divisional opponent scheduled twice",
    `Home and away streaks capped at ${setup.fairness.maxHomeAwayStreak}`,
  ];
  return (
    <div className="step-stack">
      <div className="section-heading"><span className="step-kicker">Step 10 of 10</span><h1>Your league is ready to weave.</h1><p>One final check, then we’ll build the complete season.</p></div>
      <div className="review-banner" style={{ borderColor: setup.color }}><EntityLogo className="review-mark" size={54} color={setup.color} logoUrl={setup.logoUrl} monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))} /><div><span>{setup.seasonYear} FANTASY SEASON</span><h2>{setup.name}</h2><p>{setup.description}</p></div></div>
      <div className="review-metrics"><div><strong>{setup.teams.length}</strong><span>Teams</span></div><div><strong>{setup.divisions.length}</strong><span>Divisions</span></div><div><strong>{setup.weeks}</strong><span>Weeks</span></div><div><strong>{setup.teams.length * setup.weeks / 2}</strong><span>Matchups</span></div></div>
      <div className="validation-list">{checks.map((check) => <div key={check}><Check />{check}</div>)}</div>
      <div className="generation-note"><WandSparkles /><span><strong>Generation is deterministic and validated.</strong><small>We’ll check team frequency, matchup inventory, divisional balance, and home/away totals before showing the result.</small></span></div>
    </div>
  );
}

function previewDivisions(setup: LeagueSetupInput) {
  return setup.divisions.map((division) => ({ ...division, teams: setup.teams.filter((team) => team.divisionId === division.id) }));
}

function setupProgress(step: number) {
  return Math.round(((step + 1) / STEPS.length) * 100);
}

function BlueprintRoster({ setup }: { setup: LeagueSetupInput }) {
  const divisions = previewDivisions(setup);
  return (
    <div className="preview-divisions">
      {divisions.map((division) => <div key={division.id}><div className="preview-division-title"><EntityLogo className="preview-division-mark" color={division.color} logoUrl={division.logoUrl} monogram={resolveInitials(division.initials, divisionAcronym(division.name))} /><strong>{division.name}</strong><small>{division.teams.length}</small></div>{division.teams.map((team) => { const accent = accessibleAccentColor(team.color); return <div className="preview-team" key={team.id} title={`${teamDisplayName(team, setup.display.cityNames)} · Rank ${team.overallRank}`}><EntityLogo color={team.color} logoUrl={team.logoUrl} monogram={teamInitials(team)} /><span>{setup.display.cityNames && team.city && <small className="team-city">{team.city}</small>}<strong style={setup.display.cityNames ? { color: accent } : undefined}>{team.name}</strong><small>{[teamInitials(team), setup.display.managers ? team.manager || "No manager" : "", setup.display.venues ? team.stadium || "Venue TBD" : ""].filter(Boolean).join(" · ")}</small></span><b style={{ color: accent }}>#{team.overallRank}</b></div>; })}</div>)}
    </div>
  );
}

type BuilderActionProps = {
  step: number;
  generating: boolean;
  skipDraftRankForNow: boolean;
  back: () => void;
  next: () => void;
  generate: () => void;
};

function BuilderActionButtons({ step, generating, skipDraftRankForNow, back, next, generate }: BuilderActionProps) {
  return (
    <>
      <button type="button" className="button-secondary" onClick={back} disabled={generating}><ArrowLeft />Back</button>
      {step < STEPS.length - 1
        ? <button type="button" className="button-primary" onClick={next}>{skipDraftRankForNow ? "Skip draft rank for now" : "Continue"}<ArrowRight /></button>
        : <button type="button" className="button-primary generate-button" onClick={generate} disabled={generating}>{generating ? <><span className="spinner" />Weaving schedule…</> : <><Sparkles />Generate my season</>}</button>}
    </>
  );
}

function LivePreview({ setup, step }: { setup: LeagueSetupInput; step: number }) {
  if (step === 0) {
    return (
      <aside className="builder-preview builder-preview-empty">
        <div className="preview-top"><span>LEAGUE BLUEPRINT</span><em>LIVE</em></div>
        <div className="preview-empty-body">
          <span className="preview-empty-mark"><WandSparkles /></span>
          <strong>Your blueprint builds here</strong>
          <p>Choose how to start below. As you add teams and divisions, they&rsquo;ll appear here in real time.</p>
        </div>
        <div className="preview-footer"><span>Setup progress</span><strong>0%</strong><div><i style={{ width: "0%" }} /></div></div>
      </aside>
    );
  }
  return (
    <aside className="builder-preview">
      <div className="preview-top"><span>LEAGUE BLUEPRINT</span><em>LIVE</em></div>
      <div className="preview-brand"><EntityLogo className="preview-logo" size={50} color={setup.color} logoUrl={setup.logoUrl} monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))} /><div><h2>{setup.name || "Untitled league"}</h2><p>{setup.seasonYear} · {setup.weeks} weeks</p></div></div>
      <div className="preview-status"><span><Users />{setup.teams.length} teams</span><span><CalendarDays />{setup.weeks} weeks</span><span><ShieldCheck />Rules on</span></div>
      <BlueprintRoster setup={setup} />
      <div className="preview-footer"><span>Setup progress</span><strong>{setupProgress(step)}%</strong><div><i style={{ width: `${setupProgress(step)}%` }} /></div></div>
    </aside>
  );
}

// Tablet/mobile: the blueprint can't be a side rail, so it becomes a pinned bar
// merged with the Back/Continue actions. Collapsed by default, taps open a sheet
// with the full roster.
function BuilderBlueprintBar({ setup, step, open, onToggle, actions }: {
  setup: LeagueSetupInput;
  step: number;
  open: boolean;
  onToggle: () => void;
  actions: BuilderActionProps;
}) {
  if (step === 0) return null;
  const progress = setupProgress(step);
  const sheetId = "blueprint-bar-sheet";
  return (
    <>
      {open && <div className="blueprint-bar-backdrop" role="presentation" onMouseDown={onToggle} />}
      <div className={`builder-blueprint-bar${open ? " open" : ""}`}>
        <div id={sheetId} className="blueprint-bar-sheet" role="region" aria-label="League blueprint" hidden={!open}>
          <div className="preview-brand"><EntityLogo className="preview-logo" size={44} color={setup.color} logoUrl={setup.logoUrl} monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))} /><div><h2>{setup.name || "Untitled league"}</h2><p>{setup.seasonYear} · {setup.weeks} weeks</p></div></div>
          <div className="preview-status"><span><Users />{setup.teams.length} teams</span><span><CalendarDays />{setup.weeks} weeks</span><span><ShieldCheck />Rules on</span></div>
          <BlueprintRoster setup={setup} />
        </div>
        <div className="blueprint-bar-progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
        <div className="blueprint-bar-row">
          <button type="button" className="blueprint-bar-toggle" aria-expanded={open} aria-controls={sheetId} onClick={onToggle}>
            <EntityLogo size={30} color={setup.color} logoUrl={setup.logoUrl} monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))} />
            <span><strong>{setup.name || "Untitled league"}</strong><small>{setup.teams.length} teams · {progress}% set up</small></span>
            <ChevronUp className={`blueprint-bar-chevron${open ? " flip" : ""}`} />
          </button>
          <div className="blueprint-bar-actions"><BuilderActionButtons {...actions} /></div>
        </div>
      </div>
    </>
  );
}

export function LeagueBuilder() {
  const router = useRouter();
  const { openSignIn } = useAuthModal();
  const [step, setStep] = useState(0);
  const progressTrackRef = useRef<HTMLOListElement>(null);
  const builderContentRef = useRef<HTMLDivElement>(null);
  const stepMountedRef = useRef(false);
  const [setup, setSetup] = useState<LeagueSetupInput>(createDefaultSetup);
  const logoBaseline = useRef<Map<string, string>>(new Map(setupLogoEntries(setup)));
  const [generating, setGenerating] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [revealSeason, setRevealSeason] = useState<GeneratedSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  // Save-state messages are surfaced by the logo prompt / save prompt UI; the
  // raw string isn't rendered on its own, so only the setter is retained.
  const [, setLeagueSaveState] = useState<string | null>(null);
  const [activeSavedLeagueId, setActiveSavedLeagueId] = useState<string | null>(null);
  const [loadedPreset, setLoadedPreset] = useState<SavedLeaguePreset | null>(null);
  const [connectedSavedLeaguePrompt, setConnectedSavedLeaguePrompt] = useState<SavedLeaguePreset | null>(null);
  const [logoSavePrompt, setLogoSavePrompt] = useState<LogoSavePrompt | null>(null);
  const [logoSaveBusy, setLogoSaveBusy] = useState(false);
  const [logoSaveError, setLogoSaveError] = useState<string | null>(null);
  const dismissedLogoFingerprint = useRef<string | null>(null);
  const [guestGenerateWarning, setGuestGenerateWarning] = useState(false);
  // The reuse loop is now seeded at generate: a signed-in commissioner who built
  // a brand-new league is offered to save it. Resolved once per league so a
  // repeat generate never nags.
  const [saveLeaguePrompt, setSaveLeaguePrompt] = useState(false);
  const [saveLeaguePromptBusy, setSaveLeaguePromptBusy] = useState(false);
  const savePromptResolved = useRef(false);
  const [hasAvatar, setHasAvatar] = useState(false);
  const [avatarNudge, setAvatarNudge] = useState<string | null>(null);
  const [avatarNudgeState, setAvatarNudgeState] = useState<"idle" | "saving" | "saved">("idle");
  const avatarNudgeDismissed = useRef(false);

  const startNewLeague = () => {
    const blankSetup = createBlankSetup();
    setSetup(blankSetup);
    logoBaseline.current = new Map(setupLogoEntries(blankSetup));
    setActiveSavedLeagueId(null);
    setLoadedPreset(null);
    dismissedLogoFingerprint.current = null;
    savePromptResolved.current = false;
    setLeagueSaveState(null);
    setStep(1);
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("start") === "new") {
      startNewLeague();
      const url = new URL(window.location.href);
      url.searchParams.delete("start");
      window.history.replaceState({}, "", url);
      return;
    }
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
    setShowFieldErrors(false);
    if (!stepMountedRef.current) { stepMountedRef.current = true; return; }
    builderContentRef.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    const loadAccountState = () => {
      fetch("/api/entitlements").then((response) => response.json()).then((payload: { signedIn?: boolean; avatarUrl?: string | null }) => { setSignedIn(Boolean(payload.signedIn)); setHasAvatar(Boolean(payload.avatarUrl)); }).catch(() => undefined);
      fetch("/api/saved-leagues").then((response) => response.json()).then((payload: { presets?: Array<{ id: string; name: string; data: unknown; updated_at?: string }> }) => {
        setSavedLeagues((payload.presets ?? []).map(normalizeSavedLeague).filter((preset): preset is SavedLeaguePreset => Boolean(preset)));
      }).catch(() => undefined);
    };
    loadAccountState();
    // Keep the builder in sync when the user signs in/out via the modal without a page reload.
    const supabase = createClient();
    const { data: listener } = supabase?.auth.onAuthStateChange(() => loadAccountState()) ?? { data: null };
    return () => listener?.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!blueprintOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setBlueprintOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blueprintOpen]);
  useEffect(() => {
    const importParam = new URLSearchParams(window.location.search).get("import");
    if (importParam !== "espn" && importParam !== "sleeper" && importParam !== "csv") return;
    setImportSource(importParam);
    const url = new URL(window.location.href);
    url.searchParams.delete("import");
    window.history.replaceState({}, "", url);
  }, []);

  const validationError = useMemo(() => {
    if (step === 1 && !setup.name.trim()) return "Enter a league name before continuing.";
    if (step === 2) {
      if (setup.teams.length < 8 || setup.teams.length > 16 || setup.teams.length % 2) return "Use an even number of teams from 8 through 16.";
      const missingTeam = setup.teams.findIndex((team) => !team.name.trim());
      if (missingTeam >= 0) return "Enter a name for every team before continuing — the missing one is highlighted below.";
    }
    if (step === 3) {
      if (setup.divisions.some((division) => !division.name.trim())) return "Give every division a name before continuing.";
      if (setup.teams.some((team) => !setup.divisions.some((division) => division.id === team.divisionId))) return "Place every team in a division before continuing.";
      const counts = setup.divisions.map((division) => setup.teams.filter((team) => team.divisionId === division.id).length);
      if (Math.max(...counts) - Math.min(...counts) > 1) return `Rebalance the divisions. Current team counts are ${counts.join(", ")}.`;
    }
    if (step === 6 && setup.weekOne.rankingSource === "draft-day") {
      const selectedPlaces = setup.teams.filter((team) => Number.isInteger(team.draftPlace));
      if (selectedPlaces.length > 0 && selectedPlaces.length < setup.teams.length) return `Finish the draft order for all ${setup.teams.length} teams, or clear every draft place to skip it for now.`;
      if (selectedPlaces.length === setup.teams.length && new Set(selectedPlaces.map((team) => team.draftPlace)).size !== setup.teams.length) return "Give every team a unique draft place before continuing.";
    }
    return null;
  }, [setup, step]);
  const advanceToStep = (nextStep: number) => {
    setStep(Math.min(STEPS.length - 1, nextStep));
    setBlueprintOpen(false);
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
    setLoadedPreset(preset);
    logoBaseline.current = new Map(savedLogoEntries(preset.data));
    dismissedLogoFingerprint.current = null;
    setConnectedSavedLeaguePrompt(null);
    // Stay on the League step and show the "loaded" confirm bar so the user can
    // eyeball the roster for churn before continuing — no silent jump to Season.
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const next = () => {
    if (validationError) {
      setError(validationError);
      setShowFieldErrors(true);
      requestAnimationFrame(() => {
        const invalid = builderContentRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (invalid) {
          invalid.scrollIntoView({ block: "center", behavior: "smooth" });
          invalid.focus({ preventScroll: true });
        }
      });
      return;
    }
    setError(null);
    setShowFieldErrors(false);
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

  const skipDraftRankForNow = step === 6 && setup.weekOne.rankingSource === "draft-day" && getTeamsMissingDraftPlaces(setup).length === setup.teams.length;
  const back = () => { setError(null); setStep((current) => Math.max(0, current - 1)); setBlueprintOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const quickImportSavedLeague = (preset: SavedLeaguePreset) => {
    if (preset.data.platformConnection) {
      setConnectedSavedLeaguePrompt(preset);
      return;
    }
    applySavedLeaguePreset(preset, false);
  };
  // Soft nudge: a signed-in commissioner with no avatar just uploaded a league logo — offer it as their profile image.
  const suggestAvatarFromLogo = (logoUrl: string) => {
    if (!logoUrl || !signedIn || hasAvatar || avatarNudgeDismissed.current) return;
    setAvatarNudgeState("idle");
    setAvatarNudge(logoUrl);
  };
  const dismissAvatarNudge = () => { avatarNudgeDismissed.current = true; setAvatarNudge(null); };
  const acceptAvatarNudge = async () => {
    if (!avatarNudge) return;
    const supabase = createClient();
    if (!supabase) return;
    setAvatarNudgeState("saving");
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarNudge } });
    if (error) { setAvatarNudgeState("idle"); return; }
    setHasAvatar(true);
    avatarNudgeDismissed.current = true;
    setAvatarNudgeState("saved");
    window.setTimeout(() => setAvatarNudge(null), 2200);
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
      setLeagueSaveState(targetId ? "Saved league updated." : "League saved. It will be ready on the League step next time.");
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
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const runGenerate = () => {
    if (generating) return;
    setGuestGenerateWarning(false);
    setGenerating(true);
    setError(null);
    window.setTimeout(() => {
      try {
        const season = generateLeagueSchedule(setup);
        // Give every guest schedule its own device-local id so a new season never
        // overwrites an earlier one. Signing in later claims it into the account.
        const localSeason = { ...season, id: createLocalSeasonId() };
        saveSeason(localSeason);
        // Keep `generating` true so the button stays locked; the reveal overlay
        // now owns the transition and routes to the workspace when it finishes.
        setRevealSeason(localSeason);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We couldn’t build this schedule yet.");
        setGenerating(false);
      }
    }, 80);
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
    // Signed-in commissioner who built a league we haven't saved yet: offer to
    // keep it so next season is two clicks. Only for brand-new leagues, and only
    // once, so this never nags on a repeat generate or an already-saved league.
    if (signedIn && !savePromptResolved.current && !matchingSavedLeague()) {
      setSaveLeaguePrompt(true);
      return;
    }
    // Suggest (never force) an account once a guest has schedules living only on
    // this device — a new one is safe, but signing in keeps them all.
    if (!signedIn && listLocalSeasons().some((season) => season.id.startsWith("local-"))) {
      setGuestGenerateWarning(true);
      return;
    }
    runGenerate();
  };
  const dismissSavePrompt = () => {
    savePromptResolved.current = true;
    setSaveLeaguePrompt(false);
    runGenerate();
  };
  const acceptSavePrompt = async () => {
    if (saveLeaguePromptBusy) return;
    savePromptResolved.current = true;
    setSaveLeaguePromptBusy(true);
    await saveLeaguePreset();
    setSaveLeaguePromptBusy(false);
    setSaveLeaguePrompt(false);
    runGenerate();
  };

  return (
    <section className="builder-section" aria-label="League schedule builder">
      <div className="page-width builder-heading-row">
        <div><p className="eyebrow">Fantasy football schedule maker</p><h2>Build the season your league deserves.</h2></div>
      </div>
      <div className="page-width wizard-progress" aria-label="Setup progress">
        <div className="wizard-progress-summary">
          <span><small>Step {step + 1} of {STEPS.length}</small><strong>{STEPS[step].label}</strong></span>
          <em>{Math.round(((step + 1) / STEPS.length) * 100)}% complete</em>
          <div aria-hidden="true"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        </div>
        <ol className="wizard-progress-track" ref={progressTrackRef} style={{ "--wizard-progress-ratio": step / (STEPS.length - 1), "--wizard-steps": STEPS.length } as React.CSSProperties}>
          {STEPS.map((item, index) => <li key={item.label}><button type="button" title={item.label} aria-current={index === step ? "step" : undefined} aria-label={`Step ${index + 1}: ${item.label}${index < step ? ", complete" : index === step ? ", current" : ", upcoming"}`} disabled={index > step} className={index === step ? "active" : index < step ? "complete" : ""} onClick={() => { setError(null); setStep(index); }}><span>{index < step ? <Check /> : index + 1}</span><em><b>{item.label}</b><small>{item.shortLabel}</small></em></button></li>)}
        </ol>
      </div>
      <div className="page-width builder-layout">
        <div className="builder-tool">
          <p className="sr-only" aria-live="polite">Step {step + 1} of {STEPS.length}: {STEPS[step].label}</p>
          <div className="builder-content" ref={builderContentRef} tabIndex={-1}>
            {step === 0 && <SourceStep onManual={() => advanceToStep(1)} onImport={(source) => setImportSource(source)} />}
            {step === 1 && <LeagueStep setup={setup} setSetup={setSetup} presets={savedLeagues} loadedPreset={loadedPreset} onQuickImport={quickImportSavedLeague} onStartFresh={startNewLeague} onLeagueLogoUploaded={suggestAvatarFromLogo} />}
            {step === 2 && <TeamsStep setup={setup} setSetup={setSetup} showErrors={showFieldErrors} />}
            {step === 3 && <DivisionsStep setup={setup} setSetup={setSetup} showErrors={showFieldErrors} />}
            {step === 4 && <SeasonStep setup={setup} setSetup={setSetup} />}
            {step === 5 && <SeedingStep setup={setup} setSetup={setSetup} />}
            {step === 6 && <OpeningWeekStep setup={setup} setSetup={setSetup} />}
            {step === 7 && <FairnessStep setup={setup} setSetup={setSetup} />}
            {step === 8 && <PlayoffsStep setup={setup} setSetup={setSetup} />}
            {step === 9 && <ReviewStep setup={setup} />}
          </div>
          {error && <div className="builder-error" role="alert"><CircleAlert />{error}</div>}
          {step > 0 && <div className="builder-actions">
            <BuilderActionButtons step={step} generating={generating} skipDraftRankForNow={skipDraftRankForNow} back={back} next={next} generate={generate} />
          </div>}
        </div>
        <LivePreview setup={setup} step={step} />
      </div>
      <BuilderBlueprintBar setup={setup} step={step} open={blueprintOpen} onToggle={() => setBlueprintOpen((current) => !current)} actions={{ step, generating, skipDraftRankForNow, back, next, generate }} />
      {importSource && <ImportLeagueModal source={importSource} setup={setup} onClose={() => setImportSource(null)} onConfirm={applyImport} />}
      {connectedSavedLeaguePrompt && <ConfirmDialog
        markClassName="provider-app-icon"
        mark={connectedSavedLeaguePrompt.data.platformConnection?.provider === "espn" ? <img src="/providers/espn.png" alt="" /> : <img src="/providers/sleeper.png" alt="" />}
        kicker={connectedLabel(connectedSavedLeaguePrompt)?.toUpperCase()}
        title="Use connected league data?"
        labelId="connected-saved-league-title"
        descriptionId="connected-saved-league-description"
        closeLabel="Close connected saved league choice"
        onClose={() => setConnectedSavedLeaguePrompt(null)}
        actions={[
          { label: "Roster only", onClick: () => applySavedLeaguePreset(connectedSavedLeaguePrompt, false), variant: "secondary", autoFocus: true },
          { label: "Use saved connection", onClick: () => applySavedLeaguePreset(connectedSavedLeaguePrompt, true), variant: "primary", icon: <RefreshCw /> },
        ]}
      >
        <strong>{connectedSavedLeaguePrompt.name}</strong>
        <p id="connected-saved-league-description">This saved league includes {connectedSavedLeaguePrompt.data.platformConnection?.provider === "espn" ? "ESPN" : "Sleeper"} League {connectedSavedLeaguePrompt.data.platformConnection?.providerLeagueId}. You can keep that connection for score refresh later, or load only the teams and divisions.</p>
        <small>LeagueWeaver still generates the schedule here. It will not update ESPN or Sleeper for you.</small>
      </ConfirmDialog>}
      {logoSavePrompt && <ConfirmDialog
        icon={<ImagePlus />}
        kicker={logoSavePrompt.presetId ? "NEW LOGOS FOUND" : "KEEP YOUR NEW LOGOS"}
        title={logoSavePrompt.presetId ? `Update ${logoSavePrompt.presetName}?` : "Save these with your league?"}
        labelId="league-logo-save-title"
        descriptionId="league-logo-save-description"
        closeLabel="Close logo save recommendation"
        busy={logoSaveBusy}
        onClose={() => setLogoSavePrompt(null)}
        actions={[
          { label: "Not now", onClick: skipPromptLogoSave, variant: "secondary", autoFocus: true },
          signedIn
            ? { label: logoSaveBusy ? "Saving…" : logoSavePrompt.presetId ? "Update saved league" : "Save league and logos", onClick: () => void savePromptLogos(), variant: "primary", icon: <BookmarkPlus /> }
            : { label: "Sign in to save", onClick: () => openSignIn(), variant: "primary", icon: <LogIn /> },
        ]}
      >
        <strong>{logoSavePrompt.changedCount} new or changed {logoSavePrompt.changedCount === 1 ? "image" : "images"}</strong>
        <p id="league-logo-save-description">{logoSavePrompt.presetId ? "Save the new league, division, team, and playoff logos to this saved league so they are ready next season." : "Save this league setup with its logos so you will not need to upload them again."}</p>
        <small>This includes the main playoff logo plus any round-specific and game-specific playoff logos.</small>
        {logoSaveError && <span className="league-logo-save-error" role="alert">{logoSaveError}</span>}
      </ConfirmDialog>}
      {guestGenerateWarning && <ConfirmDialog
        icon={<ShieldCheck />}
        kicker="KEEP YOUR SCHEDULES SAFE"
        title="Save your schedules to an account?"
        labelId="guest-generate-title"
        descriptionId="guest-generate-description"
        closeLabel="Close save reminder"
        onClose={() => setGuestGenerateWarning(false)}
        actions={[
          { label: "Continue as guest", onClick: runGenerate, variant: "secondary", autoFocus: true },
          { label: "Create free account", onClick: () => { setGuestGenerateWarning(false); openSignIn("signup"); }, variant: "primary", icon: <LogIn /> },
        ]}
      >
        <p id="guest-generate-description">Your schedules are saved on this device only. Create a free account and they will be safe — plus you can open them on any device. You can keep going as a guest; nothing you have already made will be deleted.</p>
      </ConfirmDialog>}
      {saveLeaguePrompt && <ConfirmDialog
        icon={<BookmarkPlus />}
        kicker="BEFORE YOU GO"
        title="Save this league for next season?"
        labelId="save-league-title"
        descriptionId="save-league-description"
        closeLabel="Close save reminder"
        busy={saveLeaguePromptBusy}
        onClose={dismissSavePrompt}
        actions={[
          { label: "Not now", onClick: dismissSavePrompt, variant: "secondary", autoFocus: true },
          { label: saveLeaguePromptBusy ? "Saving…" : "Save league", onClick: () => void acceptSavePrompt(), variant: "primary", icon: <BookmarkPlus /> },
        ]}
      >
        <p id="save-league-description">We’ll remember your teams, divisions, colors, and logos — so next year you skip straight to Season. You can edit or delete it any time from your account.</p>
      </ConfirmDialog>}
      {revealSeason && <GenerationReveal schedule={revealSeason} onComplete={() => router.push(`/season/${revealSeason.id}`)} />}
      {avatarNudge && <div className="avatar-nudge" role="status">
        <span className="avatar-nudge-thumb"><img src={avatarNudge} alt="" /></span>
        <div className="avatar-nudge-copy">
          <strong>{avatarNudgeState === "saved" ? "Set as your profile image" : "Use this as your profile image?"}</strong>
          <small>{avatarNudgeState === "saved" ? "Your league logo now shows on your commissioner account." : "Show your league logo as your commissioner avatar."}</small>
        </div>
        {avatarNudgeState !== "saved" && <div className="avatar-nudge-actions">
          <button type="button" className="button-secondary" onClick={dismissAvatarNudge}>Not now</button>
          <button type="button" className="button-primary" disabled={avatarNudgeState === "saving"} onClick={() => void acceptAvatarNudge()}>{avatarNudgeState === "saving" ? <><span className="spinner" />Saving…</> : "Use photo"}</button>
        </div>}
        <button type="button" className="avatar-nudge-close" aria-label="Dismiss suggestion" onClick={dismissAvatarNudge}><X /></button>
      </div>}
    </section>
  );
}
