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
  Flag,
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
  SlidersHorizontal,
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
  ChevronLeft,
  RotateCcw,
  FolderClock,
  Zap,
  Shuffle,
  Lock,
  Maximize2,
} from "lucide-react";
import {
  ImportLeagueModal,
  type ImportSource,
} from "@/components/imports/ImportLeagueModal";
import { useAuthModal } from "@/components/account/AuthModalProvider";
import { createClient } from "@/lib/supabase/client";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { IdentityColorPicker } from "@/components/ui/IdentityColorPicker";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  createBlankSetup,
  createConferences,
  createDefaultSetup,
  createDivisions,
  createPlaceholderTeams,
  createTeams,
  divisionLetterName,
} from "@/lib/defaults";
import {
  conferenceOfDivision,
  conferencesApply,
  defaultConferenceAssignment,
  hasConferences,
} from "@/lib/conferences";
import { identityFromSetup, normalizeSavedLeague } from "@/lib/savedLeagues";
import {
  getNflWeeks,
  getNflWeekWindow,
  getWeekDateLabel,
} from "@/lib/schedule";
import { generateScheduleAsync } from "@/lib/generateScheduleAsync";
import {
  createLocalSeasonId,
  listLocalSeasons,
  loadSetup,
  saveSeason,
  saveSetup,
} from "@/lib/storage";
import {
  conferenceAcronym,
  conferenceDivisionAcronym,
  divisionAcronym,
  entityMonogram,
  leagueAcronym,
  resolveInitials,
} from "@/lib/monograms";
import { accessibleAccentColor, readableTextColor } from "@/lib/colorContrast";
import {
  formatDraftPlace,
  getTeamsMissingDraftPlaces,
  getWeekOneTeamOrder,
  hasCompleteDraftRanking,
} from "@/lib/rankings";
import {
  getMaximumPlayoffFieldSize,
  getPlayoffByeCount,
  getPlayoffGameBrandingSlots,
  getPlayoffRoundNames,
  isPlayoffPlacementUsable,
  normalizePlayoffSettings,
  PLAYOFF_THEME_COLORS,
  recommendedPlayoffStructure,
} from "@/lib/playoffs";
import {
  projectConsolationBracket,
  projectPlacementChart,
} from "@/lib/consolation";
import {
  BracketConnectorLayer,
  type BracketConnection,
} from "@/components/season/BracketConnectorLayer";
import {
  teamDisplayName,
  teamInitials,
  teamMonogram,
} from "@/lib/teamIdentity";
import type {
  Conference,
  Division,
  DivisionPlacementMode,
  GeneratedSchedule,
  ImportPreview,
  LeagueSetupInput,
  SavedLeagueIdentity,
  SavedLeaguePreset,
  Team,
} from "@/lib/types";
import { GenerationReveal } from "@/components/builder/GenerationReveal";
import { PlayoffLivePreview } from "@/components/playoffs/PlayoffLivePreview";

// Six grouped steps. Teams+Divisions and Season+Seeding+Week1+Rules each collapse into one
// pill with internal sub-tabs (the same "one pill, internal tablist" pattern the Playoffs step
// already uses), so the tracker reads as a short commitment while every field stays reachable.
const STEPS = [
  { label: "Start", shortLabel: "Start" },
  { label: "League", shortLabel: "League" },
  { label: "Teams & Divisions", shortLabel: "Teams" },
  { label: "Season & Rules", shortLabel: "Season" },
  { label: "Playoffs", shortLabel: "Playoffs" },
  { label: "Review & Generate", shortLabel: "Review" },
];

type TeamsTab =
  | "teams"
  | "division-count"
  | "conferences"
  | "division-details"
  | "team-assignment";
type SeasonTab = "season" | "seeding" | "week1" | "rules";

type LogoSavePrompt = {
  fingerprint: string;
  nextStep?: number;
  generateAfter?: boolean;
  presetId?: string;
  presetName: string;
  mode: "update" | "new";
  summary: string;
};

function savedLeagueStructureSignature(identity: SavedLeagueIdentity) {
  return JSON.stringify({
    conferences: (identity.conferences ?? []).map(
      (conference) => conference.id,
    ),
    divisionPlacementMode: identity.divisionPlacementMode ?? "manual",
    divisions: identity.divisions.map((division) => ({
      id: division.id,
      conferenceId: division.conferenceId ?? "",
    })),
    teams: identity.teams.map((team) => ({
      id: team.id,
      divisionId: team.divisionId,
      overallRank: team.overallRank,
      priorRegularSeasonRank: team.priorRegularSeasonRank,
      priorPlayoffRank: team.priorPlayoffRank,
      draftPlace: team.draftPlace,
    })),
    priorSeason: identity.priorSeason ?? null,
  });
}

function savedLeagueDetailSignature(identity: SavedLeagueIdentity) {
  return JSON.stringify({
    league: identity.league,
    display: identity.display,
    divisions: identity.divisions.map((division) => ({
      id: division.id,
      name: division.name,
      initials: division.initials ?? "",
      color: division.color,
      logoUrl: division.logoUrl ?? "",
    })),
    conferences: (identity.conferences ?? []).map((conference) => ({
      id: conference.id,
      name: conference.name,
      initials: conference.initials ?? "",
      color: conference.color,
      logoUrl: conference.logoUrl ?? "",
    })),
    teams: identity.teams.map((team) => ({
      id: team.id,
      providerId: team.providerId ?? "",
      city: team.city,
      name: team.name,
      shortName: team.shortName,
      initials: team.initials ?? "",
      manager: team.manager,
      color: team.color,
      logoUrl: team.logoUrl ?? "",
      stadium: team.stadium,
    })),
    playoffs: identity.playoffs ?? null,
  });
}

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field-label">
      <span>{children}</span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
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
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

function FieldSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="field-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

function connectedLabel(preset: SavedLeaguePreset) {
  const provider = preset.data.platformConnection?.provider;
  if (!provider) return null;
  return provider === "espn" ? "ESPN connected" : "Sleeper connected";
}

function providerName(provider: "espn" | "sleeper") {
  return provider === "espn" ? "ESPN" : "Sleeper";
}

function formatSavedLeagueDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function SavedLeagueRow({
  preset,
  latest,
  onChoose,
}: {
  preset: SavedLeaguePreset;
  latest?: boolean;
  onChoose: (preset: SavedLeaguePreset) => void;
}) {
  const league = preset.data.league;
  const connection = connectedLabel(preset);
  const updated = formatSavedLeagueDate(preset.updatedAt);
  return (
    <button
      type="button"
      className="saved-league-row"
      style={{ "--row-accent": league.color } as React.CSSProperties}
      onClick={() => onChoose(preset)}
    >
      <EntityLogo
        size={32}
        color={league.color}
        logoUrl={league.logoUrl}
        monogram={resolveInitials(league.initials, leagueAcronym(league.name))}
      />
      <span className="saved-league-row-who">
        <strong>
          <span className="saved-league-row-name">
            {league.name || preset.name}
          </span>
          {latest && <span className="saved-league-recency">Last used</span>}
        </strong>
        <small>
          {preset.data.teams.length} teams · {preset.data.divisions.length}{" "}
          divisions{connection ? ` · ${connection}` : ""}
        </small>
      </span>
      {updated && (
        <span className="saved-league-when">
          Updated · <b>{updated}</b>
        </span>
      )}
      <span className="saved-league-load-cue">
        Load
        <ChevronRight aria-hidden="true" />
      </span>
    </button>
  );
}

// League selection now lives on Step 1 (the "Continue a saved league" entry +
// modal), so Step 2 only shows the *loaded* confirmation bar — a place to eyeball
// the roster for churn before continuing. First-timers / not-yet-loaded see nothing.
function SavedLeagueShortcut({
  loadedPreset,
  onStartFresh,
}: {
  loadedPreset: SavedLeaguePreset | null;
  onStartFresh: () => void;
}) {
  if (!loadedPreset) return null;
  return (
    <div className="saved-league-shortcut saved-league-loaded">
      <span className="saved-league-loaded-check">
        <Check aria-hidden="true" />
      </span>
      <div className="saved-league-loaded-copy">
        <strong>{loadedPreset.data.league.name || loadedPreset.name}</strong>
        <small>
          Teams, divisions, colors, and logos loaded. Edit below, or continue to
          Teams.
        </small>
      </div>
      <button
        type="button"
        className="saved-league-startfresh"
        onClick={onStartFresh}
      >
        <RotateCcw aria-hidden="true" />
        Start fresh instead
      </button>
    </div>
  );
}

type CreatePathMode = "customize" | "quick";
type ImportedConnectionPrompt = {
  provider: "espn" | "sleeper";
  providerLeagueId: string;
  leagueName: string;
};

// The Quick create ⁄ Customize fork is an untracked decision screen between
// Start and League. It is not part of the numbered wizard, but it participates
// in Back/Continue so the setup flow still feels linear.
function CreatePathStep({
  setup,
  mode,
  weeks,
  quickCreateReady,
  quickCreateReason,
  onModeChange,
  onWeeksChange,
}: {
  setup: LeagueSetupInput;
  mode: CreatePathMode;
  weeks: 13 | 14;
  quickCreateReady: boolean;
  quickCreateReason: string;
  onModeChange: (mode: CreatePathMode) => void;
  onWeeksChange: (weeks: 13 | 14) => void;
}) {
  const rec = recommendedPlayoffStructure(setup.teams.length, weeks);
  const grouping = rosterGroupingNoun(setup);
  const quickSelected = mode === "quick";
  const quickSeedLabel = setup.priorSeason.hasData
    ? "Imported last-season history"
    : "Current team order";
  return (
    <div className="step-stack create-path-screen">
      <div className="section-heading create-path-heading">
        <span className="step-kicker">Build path</span>
        <h1>How do you want to build this season?</h1>
        <p>
          Customize every setting yourself, or pick a season length and let
          League Weaver create a ready-to-review schedule.
        </p>
      </div>
      <div
        className={`create-path-options is-${mode}`}
        role="group"
        aria-label="Choose setup path"
      >
        <button
          type="button"
          className={`start-option start-option--main create-path-recommended${mode === "customize" ? " is-selected" : " is-compact"}`}
          onClick={() => onModeChange("customize")}
          aria-pressed={mode === "customize"}
        >
          <span className="start-option-icon">
            <SlidersHorizontal aria-hidden="true" />
          </span>
          <span className="start-option-copy">
            <span className="build-fork-tag">Recommended</span>
            <strong>Customize everything</strong>
            <small>
              Walk each section yourself: league identity, teams, divisions,
              season rules, seeding, and playoffs.
            </small>
          </span>
        </button>
        <section
          className={`create-path-choice create-path-choice-quick${quickSelected ? " is-selected" : " is-compact"}`}
          aria-labelledby="quick-create-heading"
          aria-pressed={quickSelected}
          role="button"
          tabIndex={quickSelected ? -1 : 0}
          onClick={() => onModeChange("quick")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onModeChange("quick");
            }
          }}
        >
          <div className="create-path-choice-head">
            <span className="create-path-choice-icon">
              <Zap aria-hidden="true" />
            </span>
            <span className="create-path-choice-copy">
              <strong id="quick-create-heading">Quick create</strong>
              <small>
                {quickSelected
                  ? "Pick a season length. League Weaver applies recommended settings, then sends you to Review."
                  : "Use recommended settings and review before generating."}
              </small>
            </span>
          </div>
          {quickSelected && (
            <div className="create-path-quick-settings">
              <div className="build-fork-weeks">
                <span>Regular season</span>
                <div className="segmented">
                  <button
                    type="button"
                    className={weeks === 13 ? "active" : ""}
                    onClick={(event) => {
                      event.stopPropagation();
                      onWeeksChange(13);
                    }}
                  >
                    13 weeks
                  </button>
                  <button
                    type="button"
                    className={weeks === 14 ? "active" : ""}
                    onClick={(event) => {
                      event.stopPropagation();
                      onWeeksChange(14);
                    }}
                  >
                    14 weeks
                  </button>
                </div>
              </div>
              <ul className="build-fork-summary">
                <li>
                  {grouping} · <b>{setup.teams.length} teams</b>
                  {setup.divisions.length > 1
                    ? ` · ${setup.divisions.length} divisions`
                    : ""}
                </li>
                <li>
                  <b>{weeks}-week</b> season · <b>{rec.playoffWeeks}-week</b>{" "}
                  playoff
                </li>
                <li>
                  <b>{rec.fieldSize}-team</b> recommended playoff field
                </li>
                <li>
                  Seeding starts from <b>{quickSeedLabel}</b>
                </li>
                <li>Balanced schedule rules &amp; standard tiebreakers</li>
              </ul>
            </div>
          )}
          {quickSelected && (
            <div className="create-path-quick-action">
              <p className="build-fork-note build-fork-note-danger">
                <CircleAlert aria-hidden="true" />
                {quickCreateReady
                  ? "These lock when you generate. To change them later, you'll regenerate the schedule."
                  : quickCreateReason}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// PVE (Prodigies vs. Esteemed) — the commissioner's house settings, pulled from
// the real league and baked as the Quick Create defaults. These are applied on
// top of whatever roster the user entered; teams/divisions always come from the
// import/saved league, never from PVE.
const QUICK_CREATE_DEFAULTS = {
  weeks: 14,
  playoffs: {
    fieldSize: 6,
    theme: "gold",
    bracketType: "single-elimination",
    reseedMode: "fixed",
    draftOrderMode: "placement-reward",
    consolationMode: "standard",
    thirdPlaceGame: true,
  },
  weekOne: { rankingSource: "prior-season" },
  fairness: {
    maxHomeAwayStreak: 3,
    finalWeekDivisional: true,
    prioritizeOpeningWeek: true,
    prioritizeThanksgiving: true,
    preventImmediateRematches: true,
  },
  display: { venues: true, managers: true, cityNames: true },
} as const;

// Resolve the "auto" placement the same way the Playoffs step's mount effect does
// (halves preferred → leaders → overall), so Quick Create never ships an unresolved
// "auto" past generation.
function resolveQuickPlacement(
  divisionCount: number,
  fieldSize: number,
): LeagueSetupInput["playoffs"]["placementMode"] {
  if (isPlayoffPlacementUsable("division-halves", divisionCount, fieldSize))
    return "division-halves";
  if (isPlayoffPlacementUsable("division-leaders", divisionCount, fieldSize))
    return "division-leaders";
  return "overall";
}

function recommendedConsolationMode(
  divisionCount: number,
  fieldSize: number,
): LeagueSetupInput["playoffs"]["consolationMode"] {
  return isPlayoffPlacementUsable("division-halves", divisionCount, fieldSize)
    ? "division-halves"
    : "standard";
}

function applyQuickCreateDefaults(
  setup: LeagueSetupInput,
  weeks: 13 | 14,
): LeagueSetupInput {
  const d = QUICK_CREATE_DEFAULTS;
  // Season length is the user's choice; the playoff field + tourney length are the recommended
  // NFL-shaped structure for the roster under that season length (docs/PLAYOFF-RECOMMENDATION-MATRIX.md).
  const rec = recommendedPlayoffStructure(setup.teams.length, weeks);
  const fieldSize = rec.fieldSize;
  const placementMode = resolveQuickPlacement(
    setup.divisions.length,
    fieldSize,
  );
  const priorSeason = setup.priorSeason.hasData
    ? {
        ...setup.priorSeason,
        enabled: true,
        entryMode: "history" as const,
        source: "regular-season" as const,
      }
    : {
        ...setup.priorSeason,
        enabled: true,
        entryMode: "manual" as const,
        hasData: false,
      };
  return {
    ...setup,
    weeks,
    priorSeason,
    weekOne: { ...setup.weekOne, ...d.weekOne },
    fairness: { ...setup.fairness, ...d.fairness },
    display: { ...setup.display, ...d.display },
    playoffs: {
      ...setup.playoffs,
      fieldSize,
      playoffWeeks: rec.playoffWeeks,
      placementMode,
      theme: d.playoffs.theme,
      color: PLAYOFF_THEME_COLORS[d.playoffs.theme],
      bracketType: d.playoffs.bracketType,
      reseedMode: d.playoffs.reseedMode,
      draftOrderMode: d.playoffs.draftOrderMode,
      consolationMode: recommendedConsolationMode(
        setup.divisions.length,
        fieldSize,
      ),
      thirdPlaceGame: d.playoffs.thirdPlaceGame && fieldSize >= 4,
      fieldStatus: "live",
      lockedTeamIds: [],
    },
  };
}

// Roster grouping noun — conference-aware. There is no conference entity today
// (grouping is divisions only), so this reads "Teams and Divisions"; if a
// `conferences` grouping is ever added to the setup it upgrades automatically.
function rosterGroupingNoun(setup: LeagueSetupInput): string {
  const parts = ["Teams"];
  if (setup.divisions.length > 0) parts.push("Divisions");
  const conferences = (setup as { conferences?: unknown[] }).conferences;
  if (Array.isArray(conferences) && conferences.length > 0)
    parts.push("Conferences");
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function quickCreateBlocker(setup: LeagueSetupInput): string | null {
  if (!setup.name.trim())
    return "Quick Create unlocks after your league has a name and a ready team list.";
  if (
    setup.teams.length < 8 ||
    setup.teams.length > 32 ||
    setup.teams.length % 2
  )
    return "Quick Create needs an even number of teams from 8 through 32.";
  if (setup.teams.some((team) => !team.name.trim()))
    return "Quick Create unlocks after every team has a name.";
  if (setup.divisions.some((division) => !division.name.trim()))
    return "Quick Create unlocks after every division has a name.";
  if (
    setup.divisionPlacementMode === "manual" &&
    setup.teams.some(
      (team) =>
        !setup.divisions.some((division) => division.id === team.divisionId),
    )
  )
    return "Quick Create needs every team assigned to a division, or use Random or Seed Draft.";
  const resolvedSetup = resolveDivisionPlacement(setup);
  const counts = resolvedSetup.divisions.map(
    (division) =>
      resolvedSetup.teams.filter((team) => team.divisionId === division.id)
        .length,
  );
  if (counts.length && Math.max(...counts) - Math.min(...counts) > 1)
    return `Quick Create needs balanced divisions. Current team counts are ${counts.join(", ")}.`;
  return null;
}

function SourceStep({
  presets,
  onManual,
  onChooseSaved,
  onImport,
}: {
  presets: SavedLeaguePreset[];
  onManual: () => void;
  onChooseSaved: () => void;
  onImport: (source: ImportSource) => void;
}) {
  const hasSaved = presets.length > 0;
  return (
    <div className="step-stack">
      <div className="section-heading">
        <span className="step-kicker">Step 1 of 6</span>
        <h1>How do you want to enter your data?</h1>
        <p>
          Build from scratch, or bring in your teams from ESPN, Sleeper, or a
          CSV. You’ll confirm every step before we generate the schedule.
        </p>
      </div>
      <div
        className="source-step start-grid"
        role="group"
        aria-label="Choose how to enter your league data"
      >
        <div className={`start-primary-row${hasSaved ? " has-saved" : ""}`}>
          <button
            type="button"
            className="start-option start-option--main"
            onClick={onManual}
          >
            <span className="start-option-icon">
              <PencilRuler aria-hidden="true" />
            </span>
            <span className="start-option-copy">
              <strong>Start manually</strong>
              <small>
                Build a clean league from scratch. We’ll walk you through every
                step.
              </small>
            </span>
            <span className="start-option-go" aria-hidden="true">
              <ArrowRight />
            </span>
          </button>
          {hasSaved && (
            <button
              type="button"
              className="start-option start-option--saved"
              onClick={onChooseSaved}
            >
              <span className="start-option-icon">
                <FolderClock aria-hidden="true" />
              </span>
              <span className="start-option-copy">
                <strong>Continue a saved league</strong>
                <small>
                  Pick up a league you saved before. {presets.length} ready.
                </small>
              </span>
              <span className="start-option-go" aria-hidden="true">
                <ArrowRight />
              </span>
            </button>
          )}
        </div>
        <div className="start-divider">
          <span>or bring in your league</span>
        </div>
        <div className="start-import-row">
          <button
            type="button"
            className="start-option"
            onClick={() => onImport("espn")}
          >
            <span className="start-option-icon import-icon espn">
              <img src="/providers/espn.png" alt="" />
            </span>
            <span className="start-option-copy">
              <strong>Connect ESPN</strong>
              <small>Prefill teams from your ESPN league.</small>
            </span>
          </button>
          <button
            type="button"
            className="start-option"
            onClick={() => onImport("sleeper")}
          >
            <span className="start-option-icon import-icon sleeper">
              <img src="/providers/sleeper.png" alt="" />
            </span>
            <span className="start-option-copy">
              <strong>Connect Sleeper</strong>
              <small>Pull teams from the read-only Sleeper API.</small>
            </span>
          </button>
          <button
            type="button"
            className="start-option"
            onClick={() => onImport("csv")}
          >
            <span className="start-option-icon">
              <FileSpreadsheet aria-hidden="true" />
            </span>
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

// Saved-league picker modal. Mirrors the import (Connect ESPN) modal chrome —
// same header / scroll-body / footer grid — and paginates the list so a large
// account stays manageable.
const SAVED_PAGE_SIZE = 5;
function SavedLeaguePicker({
  presets,
  onChoose,
  onClose,
}: {
  presets: SavedLeaguePreset[];
  onChoose: (preset: SavedLeaguePreset) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(presets.length / SAVED_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * SAVED_PAGE_SIZE;
  const visible = presets.slice(start, start + SAVED_PAGE_SIZE);
  return (
    <Modal
      className="import-modal saved-league-modal"
      labelledBy="saved-league-modal-title"
      onClose={onClose}
    >
      <header className="import-modal-head">
        <span className="import-provider-mark saved">
          <FolderClock aria-hidden="true" />
        </span>
        <div>
          <span className="step-kicker">Saved leagues</span>
          <h2 id="saved-league-modal-title">Continue a saved league</h2>
          <p>Pick one to load its teams, divisions, colors, and logos.</p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close saved leagues"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="import-modal-body saved-league-modal-list">
        {visible.map((preset, index) => (
          <SavedLeagueRow
            key={preset.id}
            preset={preset}
            latest={start + index === 0}
            onChoose={onChoose}
          />
        ))}
      </div>
      {pageCount > 1 && (
        <footer className="import-modal-actions saved-league-pager">
          <button
            type="button"
            className="button-secondary"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </button>
          <span className="saved-league-pager-count">
            Page {safePage + 1} of {pageCount} · {presets.length} leagues
          </span>
          <button
            type="button"
            className="button-secondary"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </button>
        </footer>
      )}
    </Modal>
  );
}

function TeamSourcePicker({
  savedCount,
  onChooseSaved,
  onImport,
  onClose,
}: {
  savedCount: number;
  onChooseSaved: () => void;
  onImport: (source: ImportSource) => void;
  onClose: () => void;
}) {
  const chooseImport = (source: ImportSource) => {
    onClose();
    onImport(source);
  };
  const chooseSaved = () => {
    if (savedCount === 0) return;
    onClose();
    onChooseSaved();
  };
  return (
    <Modal
      className="import-modal team-source-modal"
      labelledBy="team-source-modal-title"
      onClose={onClose}
    >
      <header className="import-modal-head">
        <span className="import-provider-mark saved">
          <RefreshCw aria-hidden="true" />
        </span>
        <div>
          <span className="step-kicker">Team source</span>
          <h2 id="team-source-modal-title">Use another team source</h2>
          <p>
            Replace the current roster with a saved league, ESPN, Sleeper, or
            CSV import.
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Close team source choices"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="import-modal-body team-source-body">
        <div className="info-callout gold">
          <Info aria-hidden="true" />
          <span>
            <strong>This replaces your current team setup.</strong>
            <small>
              After you choose a source, review the pulled teams, divisions,
              colors, and logos before continuing.
            </small>
          </span>
        </div>
        <div
          className="team-source-grid"
          role="group"
          aria-label="Choose a replacement team source"
        >
          <button
            type="button"
            disabled={savedCount === 0}
            onClick={chooseSaved}
          >
            <FolderClock aria-hidden="true" />
            <span>
              <strong>Saved league</strong>
              <small>
                {savedCount > 0
                  ? `${savedCount} saved ${savedCount === 1 ? "league" : "leagues"} ready`
                  : "No saved leagues yet"}
              </small>
            </span>
          </button>
          <button type="button" onClick={() => chooseImport("espn")}>
            <span className="import-icon espn">
              <img src="/providers/espn.png" alt="" />
            </span>
            <span>
              <strong>ESPN</strong>
              <small>Bring in teams from a public ESPN league.</small>
            </span>
          </button>
          <button type="button" onClick={() => chooseImport("sleeper")}>
            <span className="import-icon sleeper">
              <img src="/providers/sleeper.png" alt="" />
            </span>
            <span>
              <strong>Sleeper</strong>
              <small>Use a league ID or username.</small>
            </span>
          </button>
          <button type="button" onClick={() => chooseImport("csv")}>
            <FileSpreadsheet aria-hidden="true" />
            <span>
              <strong>CSV or paste</strong>
              <small>Upload a file or paste rows.</small>
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function LeagueStep({
  setup,
  setSetup,
  presets,
  loadedPreset,
  onStartFresh,
  onLeagueLogoUploaded,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
  presets: SavedLeaguePreset[];
  loadedPreset: SavedLeaguePreset | null;
  onStartFresh: () => void;
  onLeagueLogoUploaded: (logoUrl: string) => void;
}) {
  return (
    <div className="step-stack">
      <div className="section-heading">
        <span className="step-kicker">Step 2 of 6</span>
        <h1>Start with your league.</h1>
        <p>
          {presets.length
            ? "Pick up where you left off, or just fill in the form to start fresh."
            : "Name it, then set its colors and logo."}
        </p>
      </div>
      <SavedLeagueShortcut
        loadedPreset={loadedPreset}
        onStartFresh={onStartFresh}
      />
      <div className="field-grid two-col">
        <div>
          <FieldLabel hint="Required">League name</FieldLabel>
          <input
            className="text-input"
            value={setup.name}
            maxLength={80}
            onChange={(event) => {
              const name = event.target.value;
              setSetup((current) => ({
                ...current,
                name,
                abbreviation: leagueAcronym(name),
              }));
            }}
          />
        </div>
        <div>
          <FieldLabel hint="Optional · max 4">Initials override</FieldLabel>
          <input
            className="text-input"
            value={setup.initials ?? ""}
            maxLength={4}
            placeholder={`Auto: ${leagueAcronym(setup.name)}`}
            onChange={(event) =>
              setSetup((current) => ({
                ...current,
                initials: event.target.value || undefined,
              }))
            }
          />
        </div>
      </div>
      <div>
        <FieldLabel hint={`${setup.description.length}/220`}>
          League description
        </FieldLabel>
        <textarea
          className="text-input textarea"
          maxLength={220}
          value={setup.description}
          onChange={(event) =>
            setSetup((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </div>
      <div className="brand-row">
        <IdentityColorPicker
          name="League"
          abbreviation={resolveInitials(
            setup.initials,
            leagueAcronym(setup.name),
          )}
          color={setup.color}
          logoUrl={setup.logoUrl}
          onChange={(next) => {
            if (next.logoUrl && next.logoUrl !== setup.logoUrl)
              onLeagueLogoUploaded(next.logoUrl);
            setSetup((current) => ({ ...current, ...next }));
          }}
        />
        <div className="image-color-note">
          <Sparkles />
          <span>
            <strong>Logo-aware colors</strong>
            <small>
              Upload a logo to choose from its three strongest colors or use a
              custom swatch.
            </small>
          </span>
        </div>
      </div>
    </div>
  );
}

// League-size bounds, anchored to what the import platforms allow (Sleeper: up
// to 32 teams / plenty of divisions; ESPN: 20 / 4). See the ESPN over-limit notice.
const MAX_TEAMS = 32;
const MAX_DIVISIONS = 8;

// Balanced split of `teamCount` into `divisionCount` groups (sizes differ by ≤1).
function divisionSizesFor(teamCount: number, divisionCount: number): number[] {
  const base = Math.floor(teamCount / divisionCount);
  const remainder = teamCount % divisionCount;
  return Array.from(
    { length: divisionCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

// A division of `size` fits a 14-week, bye-free fantasy season when its guaranteed
// divisional games (2 per opponent) leave room: even sizes up to 8, odd up to 7
// (an odd division must send a team cross every week, needing weeks ≥ 2·size).
function sizeSchedulable(size: number): boolean {
  return size % 2 === 0 ? 2 * (size - 1) <= 14 : 2 * size <= 14;
}

// Whether `teamCount` can split into `divisionCount` balanced, schedulable divisions.
function divisionCountSchedulable(
  teamCount: number,
  divisionCount: number,
): boolean {
  if (divisionCount < 2 || divisionCount > MAX_DIVISIONS) return false;
  const sizes = divisionSizesFor(teamCount, divisionCount);
  if (Math.min(...sizes) < 2) return false;
  if (!sizes.every(sizeSchedulable)) return false;
  // Reliability guard: divisions of 7–8 only schedule cleanly as a simple two-way
  // (bipartite) split. With 3+ divisions, size-7/8 members leave the cross-division
  // allocator a sparse odd-degree problem it solves slowly or not at all — so steer
  // to divisions of ≤6 there (i.e. use more, smaller divisions). Larger divisions
  // across 3+ groups are deferred to a later engine-hardening pass.
  if (divisionCount >= 3 && Math.max(...sizes) > 6) return false;
  return true;
}

// The division counts the builder offers for a given roster (min size 2, capped at 8).
function divisionCountOptions(teamCount: number): number[] {
  const max = Math.min(MAX_DIVISIONS, Math.floor(teamCount / 2));
  return Array.from({ length: Math.max(0, max - 1) }, (_, index) => index + 2);
}

// Smallest schedulable division count — the fallback when a roster change makes the
// current division count infeasible (e.g. bumping to 32 teams while on 2 divisions).
function minSchedulableDivisions(teamCount: number): number {
  return (
    divisionCountOptions(teamCount).find((count) =>
      divisionCountSchedulable(teamCount, count),
    ) ?? 2
  );
}

function divisionRecommendationScore(
  teamCount: number,
  divisionCount: number,
): number {
  if (!divisionCountSchedulable(teamCount, divisionCount))
    return Number.NEGATIVE_INFINITY;
  const sizes = divisionSizesFor(teamCount, divisionCount);
  const average = teamCount / divisionCount;
  const perfectSplit = teamCount % divisionCount === 0 ? 1000 : 0;
  const evenDivisionCount = divisionCount % 2 === 0 ? 100 : 0;
  const healthySize = -Math.abs(average - 5) * 10;
  const overFragmented = -divisionCount;
  return perfectSplit + evenDivisionCount + healthySize + overFragmented;
}

function recommendedDivisionCounts(teamCount: number): number[] {
  const best = divisionCountOptions(teamCount)
    .filter((count) => divisionCountSchedulable(teamCount, count))
    .map((count) => ({
      count,
      score: divisionRecommendationScore(teamCount, count),
    }))
    .sort(
      (left, right) => right.score - left.score || left.count - right.count,
    )[0]?.count;
  return best ? [best] : [];
}

function recommendedDivisionCount(teamCount: number): number {
  return (
    recommendedDivisionCounts(teamCount)[0] ??
    minSchedulableDivisions(teamCount)
  );
}

function divisionRecommendationCopy(
  teamCount: number,
  divisionCount: number,
  recommended: number[],
) {
  const sizes = divisionSizesFor(teamCount, divisionCount);
  const shape = sizes.join(" · ");
  const isRecommended = recommended.includes(divisionCount);
  if (isRecommended && conferencesApply(divisionCount)) {
    return `Recommended: ${shape} teams per division, with two conference halves for more varied seasonal play.`;
  }
  if (isRecommended) {
    return `Recommended: ${shape} teams per division keeps required division games from taking over the season.`;
  }
  if (divisionCount === 2 && Math.max(...sizes) >= 7) {
    return `Allowed, but division-heavy: ${shape} teams means most or all regular-season games stay inside the division.`;
  }
  if (conferencesApply(divisionCount)) {
    return `Allowed: ${shape} teams per division, with conferences available for bracket halves.`;
  }
  return `Allowed: ${shape} teams per division.`;
}

// Resize the roster WITHOUT discarding what the user already entered: keep every
// existing team, append fresh defaults only for added slots, trim from the end when
// shrinking, and repair any divisionId that no longer points at a live division.
function isPlaceholderTeam(team: Team, index: number) {
  return (
    !team.city.trim() &&
    team.name.trim() === `Team ${index + 1}` &&
    !team.manager.trim() &&
    team.stadium.trim() === `Team ${index + 1} Stadium`
  );
}

function resizeTeams(
  existing: Team[],
  nextCount: number,
  divisions: Division[],
) {
  const placeholderRoster =
    existing.length > 0 && existing.every(isPlaceholderTeam);
  const template = placeholderRoster
    ? createPlaceholderTeams(nextCount, divisions)
    : createTeams(nextCount, divisions);
  return Array.from({ length: nextCount }, (_, index) => {
    const kept = existing[index];
    if (!kept) return template[index];
    const divisionId = divisions.some(
      (division) => division.id === kept.divisionId,
    )
      ? kept.divisionId
      : divisions[index % divisions.length].id;
    return { ...kept, overallRank: index + 1, divisionId };
  });
}

// Resize divisions WITHOUT discarding the user's named/colored/logo'd divisions:
// keep existing ones and only append defaults for added slots or trim from the end.
function resizeDivisions(existing: Division[], count: number): Division[] {
  const template = createDivisions(count);
  return Array.from(
    { length: count },
    (_, index) => existing[index] ?? template[index],
  );
}

const AUTO_DIVISION_NAMES = new Set([
  "North",
  "South",
  "East",
  "West",
  "Central",
  "Atlantic",
  "Pacific",
  "Mountain",
]);

function isAutoDivisionName(name: string) {
  const trimmed = name.trim();
  return (
    AUTO_DIVISION_NAMES.has(trimmed) ||
    /^Division\s+([A-Z]|\d+)$/i.test(trimmed)
  );
}

function applyNoConferenceDivisionNames(divisions: Division[]) {
  return divisions.map((division, index) =>
    isAutoDivisionName(division.name)
      ? {
          ...division,
          name: divisionLetterName(index),
          conferenceId: undefined,
        }
      : { ...division, conferenceId: undefined },
  );
}

function autoAssignTeamsToDivisions(
  teams: Team[],
  divisions: Division[],
  conferences?: Conference[],
) {
  if (!conferencesApply(divisions.length) || conferences?.length !== 2) {
    return teams.map((team, index) => ({
      ...team,
      divisionId: divisions[index % divisions.length].id,
    }));
  }
  const divisionGroups = conferences.map((conference) =>
    divisions.filter((division) => division.conferenceId === conference.id),
  );
  if (divisionGroups.some((group) => group.length === 0)) {
    return teams.map((team, index) => ({
      ...team,
      divisionId: divisions[index % divisions.length].id,
    }));
  }
  const cursors = divisionGroups.map(() => 0);
  return teams.map((team, index) => {
    const conferenceIndex = index % conferences.length;
    const group = divisionGroups[conferenceIndex];
    const division = group[cursors[conferenceIndex] % group.length];
    cursors[conferenceIndex] += 1;
    return { ...team, divisionId: division.id };
  });
}

function clearTeamDivisionAssignments(teams: Team[]) {
  return teams.map((team) => ({ ...team, divisionId: "" }));
}

function shuffledTeams(teams: Team[]) {
  const next = [...teams];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function snakeDivisionForRank(index: number, divisions: Division[]) {
  const round = Math.floor(index / divisions.length);
  const position = index % divisions.length;
  return divisions[
    round % 2 === 0 ? position : divisions.length - 1 - position
  ];
}

function seedDraftAssignTeamsToDivisions(teams: Team[], divisions: Division[]) {
  const byId = new Map(teams.map((team) => [team.id, team]));
  const assigned = [...teams]
    .sort(
      (left, right) =>
        left.overallRank - right.overallRank || left.id.localeCompare(right.id),
    )
    .map((team, index) => ({
      ...team,
      divisionId: snakeDivisionForRank(index, divisions).id,
    }));
  assigned.forEach((team) => byId.set(team.id, team));
  return teams.map((team) => byId.get(team.id) ?? team);
}

function resolveDivisionPlacement(setup: LeagueSetupInput) {
  if (setup.divisionPlacementMode === "random") {
    return {
      ...setup,
      teams: autoAssignTeamsToDivisions(
        shuffledTeams(setup.teams),
        setup.divisions,
        setup.conferences,
      ),
    };
  }
  if (setup.divisionPlacementMode === "rank-snake") {
    return {
      ...setup,
      teams: seedDraftAssignTeamsToDivisions(setup.teams, setup.divisions),
    };
  }
  return setup;
}

function withLiveSeedDraftPlacement(setup: LeagueSetupInput, teams: Team[]) {
  return setup.divisionPlacementMode === "rank-snake"
    ? seedDraftAssignTeamsToDivisions(teams, setup.divisions)
    : teams;
}

function colorParts(color: string) {
  const clean = color.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((part) => part + part)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(value)) return [17, 122, 69];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function mixHex(color: string, target: string, amount: number) {
  const from = colorParts(color);
  const to = colorParts(target);
  const mixed = from.map((value, index) =>
    Math.round(value + (to[index] - value) * amount),
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function conferenceDivisionColor(conferenceColor: string, index: number) {
  const variants: Array<[string, number]> = [
    ["#FFFFFF", 0.1],
    ["#FFFFFF", 0.28],
    ["#15231C", 0.12],
    ["#FFFFFF", 0.44],
  ];
  const [target, amount] = variants[index % variants.length];
  return mixHex(conferenceColor, target, amount);
}

function applyConferenceDivisionColors(
  divisions: Division[],
  conferences: Conference[],
): Division[] {
  return divisions.map((division) => {
    const conference = conferences.find(
      (entry) => entry.id === division.conferenceId,
    );
    if (!conference || division.colorSource === "manual" || division.logoUrl)
      return division;
    const conferenceDivisions = divisions.filter(
      (entry) => entry.conferenceId === conference.id,
    );
    const index = Math.max(
      0,
      conferenceDivisions.findIndex((entry) => entry.id === division.id),
    );
    return {
      ...division,
      color: conferenceDivisionColor(conference.color, index),
      colorSource: "auto" as const,
    };
  });
}

function structureForDivisionCount(existing: Division[], count: number) {
  const conferenceReady = conferencesApply(count);
  const conferences = conferenceReady ? createConferences(2) : undefined;
  const resized = resizeDivisions(existing, count);
  const assigned = conferenceReady
    ? defaultConferenceAssignment(resized, conferences!)
    : applyNoConferenceDivisionNames(resized);
  const divisions = conferenceReady
    ? applyConferenceDivisionColors(assigned, conferences!)
    : assigned;
  return { conferences, divisions };
}

function conferenceDisplayInitials(conference: Conference) {
  return resolveInitials(
    conference.initials,
    conferenceAcronym(conference.name),
  );
}

function divisionDisplayInitials(
  setup: Pick<LeagueSetupInput, "divisions" | "conferences">,
  division: Division,
) {
  const conference = hasConferences(setup)
    ? conferenceOfDivision(setup, division.id)
    : undefined;
  return conference
    ? conferenceDivisionAcronym(
        division.name,
        division.initials,
        conference.name,
        conference.initials,
      )
    : resolveInitials(division.initials, divisionAcronym(division.name));
}

function divisionInitialsPlaceholder(
  setup: Pick<LeagueSetupInput, "divisions" | "conferences">,
  division: Division,
) {
  const conference = hasConferences(setup)
    ? conferenceOfDivision(setup, division.id)
    : undefined;
  if (!conference) return divisionAcronym(division.name);
  const mark = conferenceDivisionAcronym(
    division.name,
    division.initials,
    conference.name,
    conference.initials,
  );
  return mark;
}

function divisionPlacementOption(
  setup: Pick<LeagueSetupInput, "divisions" | "conferences">,
  division: Division,
) {
  const conference = hasConferences(setup)
    ? conferenceOfDivision(setup, division.id)
    : undefined;
  return {
    value: division.id,
    label: conference
      ? `${conferenceDisplayInitials(conference)} · ${division.name}`
      : division.name,
    description: conference ? `${conference.name} conference` : undefined,
    groupLabel: conference
      ? `${conferenceDisplayInitials(conference)} · ${conference.name}`
      : undefined,
    swatch: division.color,
    logoUrl: division.logoUrl,
    monogram: divisionDisplayInitials(setup, division),
    entityType: "division" as const,
  };
}

// Split a folded-in name back into city + name when "City names" is turned on again.
// Prefers the exact city we stashed when it was folded off (so an untouched round-trip is
// lossless); otherwise falls back to the same last-word heuristic the ESPN import uses.
function splitCityFromName(
  fullName: string,
  stashedCity?: string,
): { city: string; name: string } {
  const trimmed = fullName.trim();
  const stashed = stashedCity?.trim();
  if (
    stashed &&
    trimmed.toLowerCase().startsWith(`${stashed.toLowerCase()} `)
  ) {
    return {
      city: trimmed.slice(0, stashed.length),
      name: trimmed.slice(stashed.length).trim(),
    };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { city: "", name: trimmed };
  return { city: parts.slice(0, -1).join(" "), name: parts[parts.length - 1] };
}

function TeamsStep({
  setup,
  setSetup,
  showErrors,
  savedCount,
  onChooseSaved,
  onImport,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
  showErrors: boolean;
  savedCount: number;
  onChooseSaved: () => void;
  onImport: (source: ImportSource) => void;
}) {
  // Remembers each team's city while "City names" is off, so flipping it back on restores
  // the original split exactly (unless the merged name was hand-edited in the meantime).
  const cityStashRef = useRef<Map<string, string>>(new Map());
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const updateTeam = (id: string, patch: Partial<Team>) =>
    setSetup((current) => ({
      ...current,
      teams: current.teams.map((team) => {
        if (team.id !== id) return team;
        const next = { ...team, ...patch };
        return {
          ...next,
          shortName: resolveInitials(
            next.initials,
            teamMonogram(next.city, next.name),
          ),
        };
      }),
    }));
  const setTeamCount = (count: number) => {
    const next = Math.max(8, Math.min(MAX_TEAMS, count + (count % 2)));
    setSetup((current) => {
      const recommendedCount = recommendedDivisionCount(next);
      const { conferences, divisions } = structureForDivisionCount(
        current.divisions,
        recommendedCount,
      );
      return {
        ...current,
        conferences,
        divisions,
        teams:
          current.divisionPlacementMode === "manual"
            ? resizeTeams(current.teams, next, divisions).map(
                (team, index) => ({
                  ...team,
                  divisionId: divisions[index % divisions.length].id,
                }),
              )
            : resizeTeams(current.teams, next, divisions),
        priorSeason: {
          ...current.priorSeason,
          enabled: false,
          hasData: false,
          entryMode: "none",
        },
      };
    });
  };
  const updateDisplay = (patch: Partial<LeagueSetupInput["display"]>) =>
    setSetup((current) => ({
      ...current,
      display: { ...current.display, ...patch },
    }));
  // Turning "City names" off folds each city into the team name (Green Bay + Packers →
  // "Green Bay Packers"); turning it back on re-splits it. Only teams whose city we folded
  // in this session are re-split, so a team that never had a city can't get one invented.
  // All stash mutation happens here in the handler body (runs once). The setSetup updater
  // stays pure and only *reads* the snapshot, so React's dev double-invoke can't corrupt it.
  const toggleCityNames = (next: boolean) => {
    const stash = cityStashRef.current;
    if (!next)
      setup.teams.forEach((team) => {
        if (team.city.trim()) stash.set(team.id, team.city);
      });
    const snapshot = new Map(stash);
    if (next) stash.clear();
    setSetup((current) => ({
      ...current,
      display: { ...current.display, cityNames: next },
      teams: current.teams.map((team) => {
        if (!next) {
          if (!team.city.trim()) return team;
          const name = `${team.city.trim()} ${team.name.trim()}`.trim();
          return {
            ...team,
            city: "",
            name,
            shortName: resolveInitials(team.initials, teamMonogram("", name)),
          };
        }
        const stashed = snapshot.get(team.id);
        if (stashed === undefined) return team;
        const { city, name } = splitCityFromName(team.name, stashed);
        return {
          ...team,
          city,
          name,
          shortName: resolveInitials(team.initials, teamMonogram(city, name)),
        };
      }),
    }));
  };
  const teamColumns = [
    "60px",
    setup.display.cityNames && "112px",
    "minmax(145px,1.2fr)",
    "72px",
    setup.display.managers && "118px",
    setup.display.venues && "minmax(140px,1fr)",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="step-stack">
      <div className="section-heading section-heading-with-action">
        <div>
          <h1>Add every team.</h1>
          <p>
            Confirm team identities now. Organize divisions on the next tab.
          </p>
        </div>
        <button
          type="button"
          className="button-secondary team-source-trigger"
          onClick={() => setSourcePickerOpen(true)}
        >
          <RefreshCw aria-hidden="true" />
          Use another source
        </button>
      </div>
      <div className="team-details-stage">
        <div className="team-meta-controls">
          <div>
            <FieldLabel>Teams</FieldLabel>
            <div className="stepper">
              <button
                type="button"
                aria-label="Remove two teams"
                onClick={() => setTeamCount(setup.teams.length - 2)}
              >
                <Minus />
              </button>
              <strong>{setup.teams.length}</strong>
              <button
                type="button"
                aria-label="Add two teams"
                onClick={() => setTeamCount(setup.teams.length + 2)}
              >
                <Plus />
              </button>
            </div>
          </div>
          <div>
            <FieldLabel>Optional team details</FieldLabel>
            <div className="field-switches">
              <FieldSwitch
                checked={setup.display.cityNames}
                onChange={toggleCityNames}
                label="City names"
              />
              <FieldSwitch
                checked={setup.display.managers}
                onChange={(managers) => updateDisplay({ managers })}
                label="Managers"
              />
              <FieldSwitch
                checked={setup.display.venues}
                onChange={(venues) => updateDisplay({ venues })}
                label="Venues"
              />
            </div>
          </div>
        </div>
        <div
          className="team-editor-table"
          style={{ "--team-columns": teamColumns } as React.CSSProperties}
        >
          <div className="team-editor-head">
            <span>Identity</span>
            {setup.display.cityNames && <span>City</span>}
            <span>Team name</span>
            <span>Initials</span>
            {setup.display.managers && <span>Manager</span>}
            {setup.display.venues && <span>Home venue</span>}
          </div>
          <div className="team-editor-list">
            {setup.teams.map((team) => (
              <div className="team-editor-row" key={team.id}>
                <IdentityColorPicker
                  compact
                  showAbbreviation={false}
                  name={teamDisplayName(team, setup.display.cityNames)}
                  abbreviation={teamInitials(team, setup.teams)}
                  color={team.color}
                  logoUrl={team.logoUrl}
                  onChange={(next) => updateTeam(team.id, next)}
                />
                {setup.display.cityNames && (
                  <label className="team-editor-field">
                    <span>City</span>
                    <input
                      aria-label={`Team ${team.overallRank} city`}
                      placeholder="City"
                      value={team.city}
                      onChange={(event) =>
                        updateTeam(team.id, { city: event.target.value })
                      }
                    />
                  </label>
                )}
                <label className="team-editor-field">
                  <span>Team name</span>
                  <input
                    aria-label={`Team ${team.overallRank} name`}
                    aria-invalid={showErrors && !team.name.trim()}
                    placeholder="Team name"
                    value={team.name}
                    onChange={(event) =>
                      updateTeam(team.id, { name: event.target.value })
                    }
                  />
                </label>
                <label className="team-editor-field">
                  <span>Initials</span>
                  <input
                    aria-label={`${teamDisplayName(team)} initials override`}
                    maxLength={4}
                    placeholder={`Auto: ${teamInitials({ ...team, initials: undefined }, setup.teams)}`}
                    value={team.initials ?? ""}
                    onChange={(event) =>
                      updateTeam(team.id, {
                        initials: event.target.value || undefined,
                      })
                    }
                  />
                </label>
                {setup.display.managers && (
                  <label className="team-editor-field">
                    <span>Manager</span>
                    <input
                      aria-label={`${teamDisplayName(team)} manager`}
                      placeholder="Manager"
                      value={team.manager}
                      onChange={(event) =>
                        updateTeam(team.id, { manager: event.target.value })
                      }
                    />
                  </label>
                )}
                {setup.display.venues && (
                  <label className="team-editor-field">
                    <span>Home venue</span>
                    <input
                      aria-label={`${teamDisplayName(team)} venue`}
                      placeholder="Home venue"
                      value={team.stadium}
                      onChange={(event) =>
                        updateTeam(team.id, { stadium: event.target.value })
                      }
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {sourcePickerOpen && (
        <TeamSourcePicker
          savedCount={savedCount}
          onChooseSaved={onChooseSaved}
          onImport={onImport}
          onClose={() => setSourcePickerOpen(false)}
        />
      )}
    </div>
  );
}

function setDivisionShape(
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>,
  count: number,
) {
  setSetup((current) => {
    const { conferences, divisions } = structureForDivisionCount(
      current.divisions,
      count,
    );
    return {
      ...current,
      divisions,
      conferences,
      divisionPlacementMode: "manual",
      teams: current.teams.map((team, index) => ({
        ...team,
        divisionId: divisions[index % divisions.length].id,
      })),
      playoffs: {
        ...current.playoffs,
        placementMode: "auto",
        fieldStatus: "live",
        lockedTeamIds: [],
      },
    };
  });
}

function DivisionCountStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const setDivisionCount = (count: number) => {
    setDivisionShape(setSetup, count);
  };
  const recommendedCounts = recommendedDivisionCounts(setup.teams.length);
  const recommendationCopy = divisionRecommendationCopy(
    setup.teams.length,
    setup.divisions.length,
    recommendedCounts,
  );
  const counts = setup.divisions.map(
    (division) =>
      setup.teams.filter((team) => team.divisionId === division.id).length,
  );
  const balanced = Math.max(...counts) - Math.min(...counts) <= 1;
  const hasConferencePreview = conferencesApply(setup.divisions.length);
  const half = Math.ceil(setup.divisions.length / 2);
  const groups = hasConferencePreview
    ? [setup.divisions.slice(0, half), setup.divisions.slice(half)]
    : [setup.divisions];
  const previewConferenceCodes = ["NFC", "AFC"];
  const divisionLetter = (index: number) => String.fromCharCode(65 + index);
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Choose the division shape.</h1>
        <p>
          Pick the count first. This preview shows the structure only; names and
          logos come next.
        </p>
      </div>
      <div className="division-stage">
        <div className="compact-controls division-controls">
          <div>
            <FieldLabel>Divisions</FieldLabel>
            <div className="segmented segmented-wrap division-count-options">
              {divisionCountOptions(setup.teams.length).map((count) => {
                const schedulable = divisionCountSchedulable(
                  setup.teams.length,
                  count,
                );
                const recommended = recommendedCounts.includes(count);
                return (
                  <button
                    key={count}
                    type="button"
                    disabled={!schedulable}
                    title={
                      schedulable
                        ? divisionRecommendationCopy(
                            setup.teams.length,
                            count,
                            recommendedCounts,
                          )
                        : `${setup.teams.length} teams can’t split into ${count} balanced divisions within a 14-week season`
                    }
                    className={`${setup.divisions.length === count ? "active" : ""} ${recommended ? "recommended" : ""}`}
                    onClick={() => setDivisionCount(count)}
                  >
                    <span>{count}</span>
                    {recommended && <em>Best</em>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`roster-status ${balanced ? "" : "warning"}`}>
            {balanced ? <Check /> : <CircleAlert />}
            <span>
              <strong>
                {balanced ? "Balanced divisions" : "Divisions need rebalancing"}
              </strong>
              <small>{counts.join(" · ")} teams</small>
            </span>
          </div>
        </div>
        <div className="division-recommendation-note">
          <Sparkles />
          <span>
            <strong>
              {recommendedCounts.length
                ? `Best fit: ${recommendedCounts.join(" or ")} division${recommendedCounts.length === 1 && recommendedCounts[0] === 1 ? "" : "s"}`
                : "Schedule fit"}
            </strong>
            <small>{recommendationCopy}</small>
          </span>
        </div>
        <div className="division-shape-heading">
          <strong>League Structure Preview</strong>
          <span>
            {hasConferencePreview
              ? "Conferences contain divisions"
              : "Divisions sit directly under the league"}
          </span>
        </div>
        <div
          className={`division-shape-preview ${hasConferencePreview ? "with-conferences" : ""}`}
        >
          {groups.map((group, groupIndex) => (
            <div
              className="division-shape-group"
              key={groupIndex}
              style={
                hasConferencePreview
                  ? ({
                      "--shape-conference-color":
                        setup.conferences?.[groupIndex]?.color ?? "#117A45",
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {hasConferencePreview &&
                (() => {
                  const conference = setup.conferences?.[groupIndex];
                  const code =
                    previewConferenceCodes[groupIndex] ?? `C${groupIndex + 1}`;
                  return (
                    <div className="division-shape-conference">
                      <EntityLogo
                        color={conference?.color ?? "#117A45"}
                        monogram={code}
                        entityType="conference"
                      />
                      <span>
                        <strong>Conference {groupIndex + 1}</strong>
                        <small>{group.length} divisions</small>
                      </span>
                    </div>
                  );
                })()}
              <div className="division-shape-list">
                {group.map((division) => {
                  const index = setup.divisions.findIndex(
                    (item) => item.id === division.id,
                  );
                  const count = setup.teams.filter(
                    (team) => team.divisionId === division.id,
                  ).length;
                  const letter = divisionLetter(index);
                  const name = divisionLetterName(index);
                  const code = hasConferencePreview
                    ? `${previewConferenceCodes[groupIndex] ?? `C${groupIndex + 1}`}-${letter}`
                    : divisionAcronym(name);
                  return (
                    <div className="division-shape-card" key={division.id}>
                      <EntityLogo
                        color={division.color}
                        monogram={code}
                        entityType="division"
                      />
                      <span>
                        <strong>{name}</strong>
                        <small>{count} teams</small>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DivisionDetailsStep({
  setup,
  setSetup,
  showErrors,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
  showErrors: boolean;
}) {
  const updateDivision = (id: string, patch: Partial<Division>) =>
    setSetup((current) => ({
      ...current,
      divisions: current.divisions.map((division) =>
        division.id === id
          ? {
              ...division,
              ...patch,
              colorSource: patch.color ? "manual" : division.colorSource,
            }
          : division,
      ),
    }));
  const renderDivisionRow = (division: Division) => {
    const automaticMark = divisionDisplayInitials(setup, division);
    return (
      <div className="team-editor-row division-editor-row" key={division.id}>
        <IdentityColorPicker
          compact
          showAbbreviation={false}
          name={`${division.name} division`}
          abbreviation={automaticMark}
          color={division.color}
          logoUrl={division.logoUrl}
          onChange={(next) => updateDivision(division.id, next)}
        />
        <label className="team-editor-field">
          <span>Division name</span>
          <input
            aria-label={`${division.name} division name`}
            aria-invalid={showErrors && !division.name.trim()}
            placeholder="Division name"
            value={division.name}
            onChange={(event) =>
              updateDivision(division.id, { name: event.target.value })
            }
          />
        </label>
        <label className="team-editor-field division-initials-field">
          <span>Initials</span>
          <span className="input-state-wrap">
            <input
              aria-label={`${division.name} division initials override`}
              maxLength={4}
              placeholder={`Auto: ${divisionInitialsPlaceholder(setup, division)}`}
              value={division.initials ?? ""}
              onChange={(event) =>
                updateDivision(division.id, {
                  initials: event.target.value || undefined,
                })
              }
            />
            {hasConferences(setup) && <em>{automaticMark}</em>}
          </span>
        </label>
      </div>
    );
  };
  const conferenceGroups = hasConferences(setup)
    ? setup.conferences!.map((conference) => ({
        conference,
        divisions: setup.divisions.filter(
          (division) => division.conferenceId === conference.id,
        ),
      }))
    : null;
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Set the divisions.</h1>
        <p>Name each group and keep its color and logo visible.</p>
      </div>
      <div className="division-stage">
        {conferenceGroups ? (
          <div className="division-edit-structure">
            {conferenceGroups.map(({ conference, divisions }) => (
              <div
                className="division-edit-conference"
                key={conference.id}
                style={
                  {
                    "--shape-conference-color": conference.color,
                  } as React.CSSProperties
                }
              >
                <div className="division-edit-conference-head">
                  <EntityLogo
                    color={conference.color}
                    logoUrl={conference.logoUrl}
                    monogram={conferenceDisplayInitials(conference)}
                    entityType="conference"
                  />
                  <span>
                    <strong>{conference.name}</strong>
                    <small>{divisions.length} divisions</small>
                  </span>
                </div>
                <div
                  className="team-editor-table division-editor-table"
                  style={
                    {
                      "--team-columns": "60px minmax(180px,1fr) 136px",
                    } as React.CSSProperties
                  }
                >
                  <div className="team-editor-head">
                    <span>Identity</span>
                    <span>Division name</span>
                    <span>Initials</span>
                  </div>
                  <div className="team-editor-list">
                    {divisions.map(renderDivisionRow)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="team-editor-table division-editor-table"
            style={
              {
                "--team-columns": "60px minmax(180px,1fr) 108px",
              } as React.CSSProperties
            }
          >
            <div className="team-editor-head">
              <span>Identity</span>
              <span>Division name</span>
              <span>Initials</span>
            </div>
            <div className="team-editor-list">
              {setup.divisions.map(renderDivisionRow)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamDivisionAssignmentStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const updateTeam = (id: string, divisionId: string) =>
    setSetup((current) => ({
      ...current,
      teams: current.teams.map((team) =>
        team.id === id ? { ...team, divisionId } : team,
      ),
    }));
  const setMode = (mode: DivisionPlacementMode) =>
    setSetup((current) => ({
      ...current,
      divisionPlacementMode: mode,
      teams:
        mode === "manual"
          ? clearTeamDivisionAssignments(current.teams)
          : mode === "rank-snake"
            ? seedDraftAssignTeamsToDivisions(current.teams, current.divisions)
            : clearTeamDivisionAssignments(current.teams),
    }));
  const counts = setup.divisions.map(
    (division) =>
      setup.teams.filter((team) => team.divisionId === division.id).length,
  );
  const unassigned = setup.teams.filter(
    (team) =>
      !setup.divisions.some((division) => division.id === team.divisionId),
  ).length;
  const balanced = Math.max(...counts) - Math.min(...counts) <= 1;
  const manual = setup.divisionPlacementMode === "manual";
  const divisionOptions = [
    { value: "", label: "Unassigned", description: "Choose a division" },
    ...setup.divisions.map((division) =>
      divisionPlacementOption(setup, division),
    ),
  ];
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Assign teams to divisions.</h1>
        <p>
          Choose how teams land in divisions. Manual starts blank; automatic
          modes resolve before the schedule is built.
        </p>
      </div>
      <div className="division-stage">
        <div
          className="division-placement-methods"
          role="group"
          aria-label="Division placement method"
        >
          <button
            type="button"
            className={setup.divisionPlacementMode === "manual" ? "active" : ""}
            onClick={() => setMode("manual")}
          >
            <span>
              <PencilRuler />
            </span>
            <strong>Manual</strong>
            <small>Start blank and place each team yourself.</small>
          </button>
          <button
            type="button"
            className={setup.divisionPlacementMode === "random" ? "active" : ""}
            onClick={() => setMode("random")}
          >
            <span>
              <Shuffle />
            </span>
            <strong>Random</strong>
            <small>
              Shuffle teams into balanced divisions when generating.
            </small>
          </button>
          <button
            type="button"
            className={
              setup.divisionPlacementMode === "rank-snake" ? "active" : ""
            }
            onClick={() => setMode("rank-snake")}
          >
            <span>
              <Medal />
            </span>
            <strong>Seed Draft</strong>
            <small>Snake teams into divisions by overall rank.</small>
          </button>
        </div>
        {manual ? (
          <>
            <div
              className={`roster-status ${balanced && unassigned === 0 ? "" : "warning"}`}
            >
              {balanced && unassigned === 0 ? <Check /> : <CircleAlert />}
              <span>
                <strong>
                  {unassigned
                    ? `${unassigned} team${unassigned === 1 ? "" : "s"} unassigned`
                    : balanced
                      ? "Balanced divisions"
                      : "Divisions need rebalancing"}
                </strong>
                <small>{counts.join(" · ")} teams</small>
              </span>
            </div>
            <div className="division-assignments">
              <div className="division-assign-head">
                <strong>Place each team</strong>
                <span>
                  {hasConferences(setup)
                    ? "Each option shows conference first, then division."
                    : "Keep each division within one team of the others."}
                </span>
              </div>
              <div>
                {setup.teams.map((team) => (
                  <div className="division-assign-row" key={team.id}>
                    <EntityLogo
                      color={team.color}
                      logoUrl={team.logoUrl}
                      monogram={teamInitials(team, setup.teams)}
                    />
                    <span>
                      {setup.display.cityNames && team.city && (
                        <small className="team-city">{team.city}</small>
                      )}
                      <strong>{team.name}</strong>
                      {setup.display.managers && (
                        <small>{team.manager || "No manager"}</small>
                      )}
                    </span>
                    <CustomSelect
                      label={`${teamDisplayName(team)} division`}
                      value={team.divisionId}
                      onChange={(divisionId) => updateTeam(team.id, divisionId)}
                      options={divisionOptions}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="info-callout">
            <Info />
            <span>
              <strong>
                {setup.divisionPlacementMode === "random"
                  ? "Random placement will happen at generation."
                  : "Seed Draft placement is ready."}
              </strong>
              <small>
                {setup.divisionPlacementMode === "random"
                  ? "League Weaver will create a balanced random division draw right before the schedule is built."
                  : `Current division counts are ${counts.join(", ")} by overall rank snake.`}
              </small>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SeasonStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const weeks = getNflWeeks(setup.seasonYear, setup.weeks);
  const divisionSizes = setup.divisions.map(
    (division) =>
      setup.teams.filter((team) => team.divisionId === division.id).length,
  );
  const requiresFourteenWeeks =
    (setup.divisions.length === 3 && setup.teams.length === 10) ||
    divisionSizes.some(
      (size) => 2 * (size - 1) > 13 || (size % 2 === 1 && 13 < 2 * size),
    );
  const setRegularSeasonWeeks = (regularSeasonWeeks: 13 | 14) =>
    setSetup((current) => {
      // 14-week seasons only have 3 open weeks, so a chosen 4-week playoff no longer applies.
      const nextPlayoffWeeks =
        regularSeasonWeeks === 14 ? undefined : current.playoffs.playoffWeeks;
      const maximumFieldSize = getMaximumPlayoffFieldSize(
        current.teams.length,
        regularSeasonWeeks,
        current.playoffs.bracketType,
        nextPlayoffWeeks,
      );
      return {
        ...current,
        weeks: regularSeasonWeeks,
        playoffs: {
          ...current.playoffs,
          playoffWeeks: nextPlayoffWeeks,
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
      <div className="section-heading">
        <h1>Frame the season.</h1>
        <p>League Weaver uses real NFL week windows for the regular season.</p>
      </div>
      <div className="field-grid two-col season-controls">
        <div>
          <FieldLabel>Regular-season length</FieldLabel>
          <div className="choice-row">
            <button
              type="button"
              disabled={requiresFourteenWeeks}
              className={setup.weeks === 13 ? "active" : ""}
              onClick={() => setRegularSeasonWeeks(13)}
            >
              <strong>13 weeks</strong>
              <small>
                {requiresFourteenWeeks
                  ? "Unavailable for this division shape"
                  : "Compact regular season"}
              </small>
            </button>
            <button
              type="button"
              className={setup.weeks === 14 ? "active" : ""}
              onClick={() => setRegularSeasonWeeks(14)}
            >
              <strong>14 weeks</strong>
              <small>Extra regular-season week</small>
            </button>
          </div>
        </div>
        <div>
          <FieldLabel>NFL season</FieldLabel>
          <CustomSelect
            label="NFL season"
            value={String(setup.seasonYear)}
            onChange={(seasonYear) =>
              setSetup((current) => ({
                ...current,
                seasonYear: Number(seasonYear),
              }))
            }
            options={[2025, 2026, 2027].map((year) => ({
              value: String(year),
              label: `${year} season`,
              description:
                year === 2026 ? "Current planning year" : "NFL week calendar",
            }))}
          />
        </div>
      </div>
      {requiresFourteenWeeks && (
        <div className="info-callout">
          <Info />
          <span>
            <strong>Fourteen weeks keeps this shape complete.</strong> This
            division layout needs the extra week so every divisional opponent
            can play twice without byes.
          </span>
        </div>
      )}
      <div className="week-window">
        <div className="week-window-head">
          <span>
            <CalendarDays />
            <strong>{setup.seasonYear} fantasy week windows</strong>
          </span>
          <small>Tuesday 4:00 AM ET rollover</small>
        </div>
        <div className="week-chip-grid">
          {weeks.map((week) => (
            <span
              className={week.holidays.length ? "holiday" : ""}
              key={week.week}
            >
              <strong>W{week.week}</strong>
              {week.label.replace(`, ${setup.seasonYear}`, "")}
              {week.holidays.map((holiday) => (
                <em key={holiday}>{holiday}</em>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A team with no last-season match — seeded last by the "ease the newbie in" house rule. */
function isNewManagerTeam(team: Team) {
  return team.priorRegularSeasonRank == null && team.priorPlayoffRank == null;
}

/**
 * Re-derive the overall order from a chosen prior-season signal. Teams that made the
 * bracket lead by playoff finish; teams that only played the regular season fall in
 * behind by their standings; true newbies (no prior data) sort last. Regular-season
 * mode just orders by standings, newbies last.
 */
function deriveSeedOrder(
  teams: Team[],
  source: LeagueSetupInput["priorSeason"]["source"],
): Team[] {
  const INF = Number.POSITIVE_INFINITY;
  const primary = (team: Team) =>
    source === "playoffs"
      ? (team.priorPlayoffRank ?? INF)
      : (team.priorRegularSeasonRank ?? INF);
  const secondary = (team: Team) => team.priorRegularSeasonRank ?? INF;
  return [...teams].sort(
    (left, right) =>
      primary(left) - primary(right) ||
      secondary(left) - secondary(right) ||
      left.overallRank - right.overallRank ||
      left.id.localeCompare(right.id),
  );
}

function SeedingStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const rankedTeams = [...setup.teams].sort(
    (left, right) =>
      left.overallRank - right.overallRank || left.id.localeCompare(right.id),
  );
  // Newbie handling only applies to a genuinely imported prior season. A saved/sample
  // league can carry hasData without per-team ranks — don't flag everyone as new there.
  const hasAnyPriorData = setup.teams.some(
    (team) =>
      team.priorRegularSeasonRank != null || team.priorPlayoffRank != null,
  );
  const newbieCount = hasAnyPriorData
    ? setup.teams.filter(isNewManagerTeam).length
    : 0;
  const moveTeam = (teamId: string, nextIndex: number) => {
    const ordered = [...rankedTeams];
    const currentIndex = ordered.findIndex((team) => team.id === teamId);
    if (currentIndex < 0) return;
    const [team] = ordered.splice(currentIndex, 1);
    ordered.splice(Math.max(0, Math.min(ordered.length, nextIndex)), 0, team);
    setSetup((current) => {
      const seededTeams = ordered.map((item, index) => ({
        ...item,
        overallRank: index + 1,
      }));
      return {
        ...current,
        teams: withLiveSeedDraftPlacement(current, seededTeams),
      };
    });
  };
  const chooseHistorySource = (
    source: LeagueSetupInput["priorSeason"]["source"],
  ) =>
    setSetup((current) => {
      const seededTeams = deriveSeedOrder(current.teams, source).map(
        (team, index) => ({ ...team, overallRank: index + 1 }),
      );
      return {
        ...current,
        priorSeason: {
          ...current.priorSeason,
          enabled: true,
          entryMode: "history",
          source,
        },
        teams: withLiveSeedDraftPlacement(current, seededTeams),
      };
    });
  const randomizeOrder = () =>
    setSetup((current) => {
      // Fisher–Yates so every order is equally likely; the result stays hidden until the
      // schedule generates. Random is a pure shuffle — newbies take their chances too.
      const shuffled = [...current.teams];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
      }
      const seededTeams = shuffled.map((team, index) => ({
        ...team,
        overallRank: index + 1,
      }));
      return {
        ...current,
        priorSeason: {
          ...current.priorSeason,
          enabled: true,
          entryMode: "random",
        },
        teams: withLiveSeedDraftPlacement(current, seededTeams),
      };
    });
  const showList =
    setup.priorSeason.enabled &&
    (setup.priorSeason.entryMode === "manual" ||
      setup.priorSeason.entryMode === "history");
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Set last season’s order.</h1>
        <p>
          Seeding is optional. Use it only when prior-season results should
          shape cross-division matchups.
        </p>
      </div>
      <div className="seeding-methods" role="group" aria-label="Seeding method">
        <button
          type="button"
          className={setup.priorSeason.entryMode === "manual" ? "active" : ""}
          onClick={() =>
            setSetup((current) => ({
              ...current,
              priorSeason: {
                ...current.priorSeason,
                enabled: true,
                entryMode: "manual",
              },
            }))
          }
        >
          <span>
            <GripVertical />
          </span>
          <strong>Enter order manually</strong>
          <small>
            Recommended for most leagues. Drag teams or choose each rank.
          </small>
        </button>
        <button
          type="button"
          disabled={!setup.priorSeason.hasData}
          className={
            setup.priorSeason.entryMode === "history" &&
            setup.priorSeason.source === "playoffs"
              ? "active"
              : ""
          }
          onClick={() => chooseHistorySource("playoffs")}
        >
          <span>
            <Trophy />
          </span>
          <strong>Last year’s playoff finish</strong>
          <small>
            {setup.priorSeason.hasData
              ? "Use imported or saved playoff placement."
              : "No imported history available."}
          </small>
        </button>
        <button
          type="button"
          disabled={!setup.priorSeason.hasData}
          className={
            setup.priorSeason.entryMode === "history" &&
            setup.priorSeason.source === "regular-season"
              ? "active"
              : ""
          }
          onClick={() => chooseHistorySource("regular-season")}
        >
          <span>
            <Medal />
          </span>
          <strong>Last year’s regular season</strong>
          <small>
            {setup.priorSeason.hasData
              ? "Use imported or saved final standings."
              : "No imported history available."}
          </small>
        </button>
        <button
          type="button"
          className={setup.priorSeason.entryMode === "random" ? "active" : ""}
          onClick={randomizeOrder}
        >
          <span>
            <Shuffle />
          </span>
          <strong>Randomize (sealed)</strong>
          <small>
            Shuffle the order and keep it hidden until the schedule generates.
          </small>
        </button>
      </div>
      {!setup.priorSeason.hasData && (
        <div className="info-callout gold">
          <Info />
          <span>
            <strong>Manual order is ready.</strong> League history was not
            imported, so the two automatic choices stay unavailable — but you
            can still randomize.
          </span>
        </div>
      )}
      {setup.priorSeason.hasData &&
        newbieCount > 0 &&
        setup.priorSeason.entryMode === "history" && (
          <div className="info-callout">
            <Users />
            <span>
              <strong>
                {newbieCount} new manager{newbieCount === 1 ? "" : "s"} seeded
                last.
              </strong>{" "}
              They had no {setup.seasonYear - 1} finish, so they start at the
              bottom for a gentler opening slate. Drag to override.
            </span>
          </div>
        )}
      {setup.priorSeason.entryMode === "random" && (
        <div className="info-callout">
          <Lock />
          <span>
            <strong>Order sealed.</strong> A random seeding has been drawn and
            stays hidden until you generate the schedule — no peeking. Pick
            another method to reveal an order.
          </span>
        </div>
      )}
      {showList && (
        <div className="ranking-editor">
          <div className="ranking-head">
            <div>
              <span className="step-kicker">
                {setup.seasonYear - 1}{" "}
                {setup.priorSeason.entryMode === "manual"
                  ? "manual order"
                  : setup.priorSeason.source === "playoffs"
                    ? "playoff finish"
                    : "regular-season finish"}
              </span>
              <h2>Slot teams into their final rank.</h2>
              <p>
                Drag a row or choose its number. Rank 1 is last season’s
                strongest finish.
              </p>
            </div>
            <span>{rankedTeams.length} teams</span>
          </div>
          <div
            className="ranking-list"
            role="list"
            aria-label="Prior-season team ranking"
          >
            {rankedTeams.map((team, index) => (
              <div
                className={`ranking-row ${draggedTeamId === team.id ? "dragging" : ""}`}
                role="listitem"
                draggable
                key={team.id}
                onDragStart={() => setDraggedTeamId(team.id)}
                onDragEnd={() => setDraggedTeamId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedTeamId) moveTeam(draggedTeamId, index);
                  setDraggedTeamId(null);
                }}
              >
                <GripVertical className="ranking-grip" aria-hidden="true" />
                <CustomSelect
                  label={`${teamDisplayName(team)} rank`}
                  value={String(index + 1)}
                  onChange={(value) => moveTeam(team.id, Number(value) - 1)}
                  options={rankedTeams.map((_, optionIndex) => ({
                    value: String(optionIndex + 1),
                    label: `#${optionIndex + 1}`,
                    description:
                      optionIndex === 0
                        ? "Strongest finish"
                        : optionIndex === rankedTeams.length - 1
                          ? "Last-place finish"
                          : "Prior-season order",
                  }))}
                />
                <EntityLogo
                  className="ranking-mark"
                  color={team.color}
                  logoUrl={team.logoUrl}
                  monogram={teamInitials(team, setup.teams)}
                />
                <span className="ranking-team">
                  <strong>{team.name}</strong>
                  {setup.priorSeason.entryMode === "history" &&
                    hasAnyPriorData &&
                    isNewManagerTeam(team) && (
                      <em className="ranking-newbie">New manager</em>
                    )}
                </span>
                <span className="ranking-actions">
                  <Tooltip label="Move up">
                    <button
                      type="button"
                      aria-label={`Move ${teamDisplayName(team)} up`}
                      disabled={index === 0}
                      onClick={() => moveTeam(team.id, index - 1)}
                    >
                      <ArrowUp />
                    </button>
                  </Tooltip>
                  <Tooltip label="Move down">
                    <button
                      type="button"
                      aria-label={`Move ${teamDisplayName(team)} down`}
                      disabled={index === rankedTeams.length - 1}
                      onClick={() => moveTeam(team.id, index + 1)}
                    >
                      <ArrowDown />
                    </button>
                  </Tooltip>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {setup.priorSeason.entryMode !== "none" && (
        <button
          type="button"
          className="seeding-skip"
          onClick={() =>
            setSetup((current) => ({
              ...current,
              priorSeason: {
                ...current.priorSeason,
                enabled: false,
                entryMode: "none",
              },
            }))
          }
        >
          Skip seeding for this season
        </button>
      )}
    </div>
  );
}

function OpeningWeekStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const orderedTeams = getWeekOneTeamOrder(setup);
  const missingDraftPlaces = getTeamsMissingDraftPlaces(setup);
  const selectedCount = setup.teams.length - missingDraftPlaces.length;
  const placeOptions = [
    { value: "unranked", label: "Not set", description: "Choose draft place" },
    ...setup.teams.map((_, index) => ({
      value: String(index + 1),
      label: formatDraftPlace(index + 1, setup.teams.length),
    })),
  ];
  const updatePlace = (teamId: string, value: string) =>
    setSetup((current) => {
      const nextPlace = value === "unranked" ? undefined : Number(value);
      const currentTeam = current.teams.find((team) => team.id === teamId);
      const previousPlace = currentTeam?.draftPlace;
      return {
        ...current,
        teams: current.teams.map((team) => {
          if (team.id === teamId) return { ...team, draftPlace: nextPlace };
          if (nextPlace && team.draftPlace === nextPlace)
            return { ...team, draftPlace: previousPlace };
          return team;
        }),
      };
    });
  const chooseSource = (
    rankingSource: LeagueSetupInput["weekOne"]["rankingSource"],
  ) => setSetup((current) => ({ ...current, weekOne: { rankingSource } }));
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Rank the opening week.</h1>
        <p>
          Choose what should shape Week 1 marquee matchups and the first Game of
          the Week.
        </p>
      </div>
      <div
        className="opening-rank-methods"
        role="group"
        aria-label="Week 1 ranking source"
      >
        <button
          type="button"
          className={
            setup.weekOne.rankingSource === "prior-season" ? "active" : ""
          }
          onClick={() => chooseSource("prior-season")}
        >
          <span>
            <Medal />
          </span>
          <strong>Last season’s finish</strong>
          <small>
            Use the order from the Seeding step. This remains the recommended
            default.
          </small>
        </button>
        <button
          type="button"
          className={
            setup.weekOne.rankingSource === "draft-day" ? "active" : ""
          }
          onClick={() => chooseSource("draft-day")}
        >
          <span>
            <FileSpreadsheet />
          </span>
          <strong>Draft-day place</strong>
          <small>
            Choose who drafted first through last to set the Week 1 order and
            Game of the Week.
          </small>
        </button>
      </div>
      <div className="info-callout">
        <Info />
        <span>
          <strong>Only Week 1 changes.</strong> Draft-day ranking does not
          replace last season’s finish for the rest of the schedule or playoff
          setup.
        </span>
      </div>
      {setup.weekOne.rankingSource === "draft-day" && (
        <div className="draft-later-callout">
          <FileSpreadsheet />
          <span>
            <strong>
              {selectedCount === 0
                ? "No draft order yet? Skip it for now."
                : missingDraftPlaces.length
                  ? "Finish every draft place before continuing."
                  : "Draft ranking is ready."}
            </strong>
            <small>
              {selectedCount === 0
                ? "Leave every team unranked and use “Skip draft rank for now.” The season workspace will remind you until Week 2 starts."
                : missingDraftPlaces.length
                  ? `${missingDraftPlaces.length} team${missingDraftPlaces.length === 1 ? " still needs" : "s still need"} a unique place. Complete the order or clear every selection to skip it.`
                  : "Every team has a unique place from first through last."}
            </small>
          </span>
        </div>
      )}
      {setup.weekOne.rankingSource === "draft-day" && (
        <div className="ranking-editor draft-ranking-editor">
          <div className="ranking-head">
            <div>
              <span className="step-kicker">Draft-day order</span>
              <h2>Place teams from first to last.</h2>
              <p>
                Choose each position once. Selecting an occupied place swaps the
                two teams.
              </p>
            </div>
            <span>{orderedTeams.length} teams</span>
          </div>
          <div
            className="draft-ranking-list"
            role="list"
            aria-label="Draft-day team ranking"
          >
            {orderedTeams.map((team, index) => (
              <div className="draft-ranking-row" role="listitem" key={team.id}>
                <b>{team.draftPlace ? `#${team.draftPlace}` : "—"}</b>
                <EntityLogo
                  color={team.color}
                  logoUrl={team.logoUrl}
                  monogram={teamInitials(team, setup.teams)}
                />
                <span>
                  {setup.display.cityNames && team.city && (
                    <small className="team-city">{team.city}</small>
                  )}
                  <strong>{team.name}</strong>
                  <small>
                    {setup.divisions.find(
                      (division) => division.id === team.divisionId,
                    )?.name || "No division"}
                  </small>
                </span>
                <CustomSelect
                  label={`${teamDisplayName(team)} draft place`}
                  value={team.draftPlace ? String(team.draftPlace) : "unranked"}
                  onChange={(value) => updatePlace(team.id, value)}
                  options={placeOptions}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FairnessStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const update = (patch: Partial<LeagueSetupInput["fairness"]>) =>
    setSetup((current) => ({
      ...current,
      fairness: { ...current.fairness, ...patch },
    }));
  const thanksgivingWeek = getNflWeeks(setup.seasonYear, 14).find((week) =>
    week.holidays.includes("Thanksgiving"),
  )?.week;
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Set your schedule rules.</h1>
        <p>
          Every rule is checked before the schedule is shown. These controls
          shape the feel and highlights of the season.
        </p>
      </div>
      <div className="rule-group">
        <div className="rule-group-title">
          <ShieldCheck />
          <span>
            <strong>Ground rules</strong>
            <small>Always applied to every schedule</small>
          </span>
        </div>
        <Toggle
          checked={setup.fairness.preventImmediateRematches}
          onChange={(value) => update({ preventImmediateRematches: value })}
          label="Space out repeat opponents"
          description="Avoid playing the same team in consecutive weeks."
        />
        <div className="streak-control">
          <span>
            <strong>Maximum home or away streak</strong>
            <small>Keep long runs from tilting the season.</small>
          </span>
          <div className="segmented">
            <button
              type="button"
              className={setup.fairness.maxHomeAwayStreak === 2 ? "active" : ""}
              onClick={() => update({ maxHomeAwayStreak: 2 })}
            >
              2
            </button>
            <button
              type="button"
              className={setup.fairness.maxHomeAwayStreak === 3 ? "active" : ""}
              onClick={() => update({ maxHomeAwayStreak: 3 })}
            >
              3
            </button>
            <button
              type="button"
              className={setup.fairness.maxHomeAwayStreak === 4 ? "active" : ""}
              onClick={() => update({ maxHomeAwayStreak: 4 })}
            >
              4
            </button>
          </div>
        </div>
      </div>
      <div className="rule-group">
        <div className="rule-group-title">
          <Trophy />
          <span>
            <strong>Season moments</strong>
            <small>Preferences improve the shape, never invalidate it</small>
          </span>
        </div>
        <Toggle
          checked={setup.fairness.finalWeekDivisional}
          onChange={(value) => update({ finalWeekDivisional: value })}
          label="Division-focused final week"
          description="Close with divisional matchups wherever the league shape allows."
        />
        <Toggle
          checked={setup.fairness.prioritizeOpeningWeek}
          onChange={(value) => update({ prioritizeOpeningWeek: value })}
          label="Strong opening week"
          description="Favor closely ranked matchups in Week 1."
        />
        <Toggle
          checked={setup.fairness.prioritizeThanksgiving}
          onChange={(value) => update({ prioritizeThanksgiving: value })}
          label={`Thanksgiving spotlight${thanksgivingWeek ? ` · Week ${thanksgivingWeek}` : ""}`}
          description="Favor marquee matchups during the exact Tuesday-to-Tuesday holiday window."
        />
      </div>
      <div className="info-callout gold">
        <Info size={19} />
        <span>
          <strong>Good to know.</strong> Preferences help score valid schedules.
          They will never cause a valid league to fail generation.
        </span>
      </div>
    </div>
  );
}

function ConferencesStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const updateConference = (id: string, patch: Partial<Conference>) =>
    setSetup((current) => {
      const conferences = current.conferences?.map((conference) =>
        conference.id === id ? { ...conference, ...patch } : conference,
      );
      return {
        ...current,
        conferences,
        divisions: conferences
          ? applyConferenceDivisionColors(current.divisions, conferences)
          : current.divisions,
      };
    });
  if (setup.conferences?.length !== 2) return null;
  return (
    <div className="step-stack">
      <div className="section-heading">
        <h1>Name the conferences.</h1>
        <p>
          These become the bracket halves. Leave initials blank to use the
          automatic FC mark.
        </p>
      </div>
      <div className="conference-stage">
        <div
          className="team-editor-table conference-editor-table"
          style={
            {
              "--team-columns": "60px minmax(180px,1fr) 92px",
            } as React.CSSProperties
          }
        >
          <div className="team-editor-head">
            <span>Identity</span>
            <span>Conference name</span>
            <span>Initials</span>
          </div>
          <div className="team-editor-list">
            {setup.conferences.map((conference) => (
              <div
                className="team-editor-row conference-editor-row"
                key={conference.id}
              >
                <IdentityColorPicker
                  compact
                  showAbbreviation={false}
                  name={conference.name}
                  abbreviation={conferenceDisplayInitials(conference)}
                  color={conference.color}
                  logoUrl={conference.logoUrl}
                  onChange={(next) => updateConference(conference.id, next)}
                />
                <label className="team-editor-field">
                  <span>Conference name</span>
                  <input
                    aria-label={`${conference.name} name`}
                    placeholder="Conference name"
                    value={conference.name}
                    onChange={(event) =>
                      updateConference(conference.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="team-editor-field">
                  <span>Initials</span>
                  <input
                    aria-label={`${conference.name} initials override`}
                    maxLength={4}
                    placeholder={`Auto: ${conferenceAcronym(conference.name)}`}
                    value={conference.initials ?? ""}
                    onChange={(event) =>
                      updateConference(conference.id, {
                        initials: event.target.value || undefined,
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared sub-tab bar for grouped steps — mirrors the Playoffs step's internal tablist so the
// two collapsed steps (Teams & Divisions, Season & Rules) read and behave identically.
function WizardSubnav({
  tabs,
  active,
  onSelect,
  label,
}: {
  tabs: ReadonlyArray<{ key: string; label: string; sub?: string }>;
  active: string;
  onSelect: (key: string) => void;
  label: string;
}) {
  return (
    <div className="wizard-subnav" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={active === tab.key ? "active" : ""}
          onClick={() => onSelect(tab.key)}
        >
          <span className="ppw-n">{index + 1}</span>
          <span className="ppw-lab">
            <strong>{tab.label}</strong>
            {tab.sub && <small>{tab.sub}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}

const TEAMS_DIV_TABS: ReadonlyArray<{
  key: TeamsTab;
  label: string;
  sub: string;
}> = [
  { key: "teams", label: "Teams", sub: "Rosters" },
  { key: "division-count", label: "Division Count", sub: "Structure" },
  { key: "conferences", label: "Conferences", sub: "Names" },
  { key: "division-details", label: "Set Divisions", sub: "Names" },
  { key: "team-assignment", label: "Assign Teams", sub: "To divisions" },
];

function TeamsDivisionsStep({
  setup,
  setSetup,
  showErrors,
  activeTab,
  onTab,
  savedCount,
  onChooseSaved,
  onImport,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
  showErrors: boolean;
  activeTab: TeamsTab;
  onTab: (tab: TeamsTab) => void;
  savedCount: number;
  onChooseSaved: () => void;
  onImport: (source: ImportSource) => void;
}) {
  // Conferences only apply to even division counts ≥ 4 (4/6/8) — the same gate the playoff
  // engine uses. When they don't apply the tab is hidden and any stale "conferences" selection
  // falls back to Divisions.
  const conferences = conferencesApply(setup.divisions.length);
  const tabs = TEAMS_DIV_TABS.filter(
    (tab) => tab.key !== "conferences" || conferences,
  );
  const active: TeamsTab =
    activeTab === "conferences" && !conferences
      ? "division-details"
      : activeTab;
  return (
    <div className="wizard-group-step">
      <WizardSubnav
        tabs={tabs}
        active={active}
        onSelect={(key) => onTab(key as TeamsTab)}
        label="Teams and divisions setup"
      />
      {active === "teams" && (
        <TeamsStep
          setup={setup}
          setSetup={setSetup}
          showErrors={showErrors}
          savedCount={savedCount}
          onChooseSaved={onChooseSaved}
          onImport={onImport}
        />
      )}
      {active === "division-count" && (
        <DivisionCountStep setup={setup} setSetup={setSetup} />
      )}
      {active === "conferences" && (
        <ConferencesStep setup={setup} setSetup={setSetup} />
      )}
      {active === "division-details" && (
        <DivisionDetailsStep
          setup={setup}
          setSetup={setSetup}
          showErrors={showErrors}
        />
      )}
      {active === "team-assignment" && (
        <TeamDivisionAssignmentStep setup={setup} setSetup={setSetup} />
      )}
    </div>
  );
}

const SEASON_TABS: ReadonlyArray<{
  key: SeasonTab;
  label: string;
  sub: string;
}> = [
  { key: "season", label: "Season", sub: "Length & year" },
  { key: "seeding", label: "Seeding", sub: "Optional" },
  { key: "week1", label: "Week 1", sub: "Optional" },
  { key: "rules", label: "Rules", sub: "Optional" },
];

function SeasonRulesStep({
  setup,
  setSetup,
  activeTab,
  onTab,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
  activeTab: SeasonTab;
  onTab: (tab: SeasonTab) => void;
}) {
  return (
    <div className="wizard-group-step">
      <WizardSubnav
        tabs={SEASON_TABS}
        active={activeTab}
        onSelect={(key) => onTab(key as SeasonTab)}
        label="Season and rules setup"
      />
      {activeTab === "season" && (
        <SeasonStep setup={setup} setSetup={setSetup} />
      )}
      {activeTab === "seeding" && (
        <SeedingStep setup={setup} setSetup={setSetup} />
      )}
      {activeTab === "week1" && (
        <OpeningWeekStep setup={setup} setSetup={setSetup} />
      )}
      {activeTab === "rules" && (
        <FairnessStep setup={setup} setSetup={setSetup} />
      )}
    </div>
  );
}

function PlayoffsStep({
  setup,
  setSetup,
}: {
  setup: LeagueSetupInput;
  setSetup: React.Dispatch<React.SetStateAction<LeagueSetupInput>>;
}) {
  const p = setup.playoffs;
  const [subPage, setSubPage] = useState<
    "format" | "rules" | "brand" | "logos"
  >("format");
  const [expandedRounds, setExpandedRounds] = useState<number[]>([]);
  const [previewView, setPreviewView] = useState<
    "championship" | "consolation" | "full" | "placement" | "draft"
  >("championship");
  const [bracketExpanded, setBracketExpanded] = useState(false);
  const divisionCount = setup.divisions.length;
  const maxFieldSize = getMaximumPlayoffFieldSize(
    setup.teams.length,
    setup.weeks,
    p.bracketType,
    p.playoffWeeks,
  );
  const canChoosePlayoffLength = setup.weeks === 13; // 14-week seasons only have 3 open weeks
  const effectivePlayoffWeeks = setup.weeks === 14 ? 3 : (p.playoffWeeks ?? 4);
  const patch = (next: Partial<LeagueSetupInput["playoffs"]>) =>
    setSetup((current) => ({
      ...current,
      playoffs: { ...current.playoffs, ...next },
    }));
  // Recommended NFL-shaped structure for this roster under the chosen season length (season length
  // itself is never recommended — it's the user's choice from the Season step).
  const seasonWeeks: 13 | 14 = setup.weeks === 13 ? 13 : 14;
  const recommended = recommendedPlayoffStructure(
    setup.teams.length,
    seasonWeeks,
  );
  const usingRecommended =
    p.fieldSize === recommended.fieldSize &&
    effectivePlayoffWeeks === recommended.playoffWeeks;
  const applyRecommendedPlayoffs = () =>
    patch({
      fieldSize: recommended.fieldSize,
      playoffWeeks: setup.weeks === 13 ? recommended.playoffWeeks : undefined,
      placementMode: resolveQuickPlacement(
        setup.divisions.length,
        recommended.fieldSize,
      ),
      consolationMode: recommendedConsolationMode(
        setup.divisions.length,
        recommended.fieldSize,
      ),
      thirdPlaceGame: recommended.fieldSize >= 4,
      fieldStatus: "live",
      lockedTeamIds: [],
    });

  const setFieldSize = (fieldSize: number) => {
    const halvesUsable = isPlayoffPlacementUsable(
      "division-halves",
      divisionCount,
      fieldSize,
    );
    patch({
      fieldSize,
      placementMode:
        p.placementMode === "division-halves" && !halvesUsable
          ? "overall"
          : p.placementMode,
      consolationMode:
        p.consolationMode === "division-halves" && !halvesUsable
          ? "standard"
          : p.consolationMode,
      thirdPlaceGame: p.consolationMode !== "off" && fieldSize >= 4,
      fieldStatus: "live",
      lockedTeamIds: [],
    });
  };
  const setTheme = (theme: LeagueSetupInput["playoffs"]["theme"]) =>
    patch(
      theme === "custom"
        ? { theme }
        : { theme, color: PLAYOFF_THEME_COLORS[theme] },
    );
  const setConsolation = (
    consolationMode: LeagueSetupInput["playoffs"]["consolationMode"],
  ) =>
    patch({
      consolationMode,
      thirdPlaceGame: consolationMode !== "off" && p.fieldSize >= 4,
    });

  // Division halves is the recommended default for eligible builds: pre-select it
  // once on mount when the league is still on "auto" and halves are usable.
  useEffect(() => {
    // "auto" is no longer a user-facing option — resolve it to a concrete mode (halves preferred).
    const recommendedConsolation = recommendedConsolationMode(
      divisionCount,
      p.fieldSize,
    );
    const next: Partial<LeagueSetupInput["playoffs"]> = {};
    if (p.placementMode === "auto") {
      next.placementMode = isPlayoffPlacementUsable(
        "division-halves",
        divisionCount,
        p.fieldSize,
      )
        ? "division-halves"
        : isPlayoffPlacementUsable(
              "division-leaders",
              divisionCount,
              p.fieldSize,
            )
          ? "division-leaders"
          : "overall";
    }
    if (
      p.consolationMode === "standard" &&
      recommendedConsolation === "division-halves"
    )
      next.consolationMode = "division-halves";
    if (Object.keys(next).length) patch(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byeCount = getPlayoffByeCount(p.fieldSize);
  const fieldSizeOptions: number[] = [];
  for (let n = 2; n <= maxFieldSize; n += 2) fieldSizeOptions.push(n);
  if (!fieldSizeOptions.includes(maxFieldSize))
    fieldSizeOptions.push(maxFieldSize);

  const halvesUsable = isPlayoffPlacementUsable(
    "division-halves",
    divisionCount,
    p.fieldSize,
  );
  const placementOptions = [
    ...(halvesUsable
      ? [
          {
            value: "division-halves",
            label: `${hasConferences(setup) ? "Conference" : "Division"} halves (Recommended)`,
            description:
              "NFL-style — each half runs its own tournament to the final",
          },
        ]
      : []),
    ...(isPlayoffPlacementUsable("division-leaders", divisionCount, p.fieldSize)
      ? [
          {
            value: "division-leaders",
            label: "Division leaders protected",
            description:
              "Classic fantasy — each division winner is guaranteed a top seed on its own side",
          },
        ]
      : []),
    {
      value: "overall",
      label: "Overall standings",
      description:
        "Simple — top finishers qualify by overall seed, regardless of division",
    },
  ];
  const consolationOptions = [
    ...(isPlayoffPlacementUsable("division-halves", divisionCount, p.fieldSize)
      ? [
          {
            value: "division-halves",
            label: `${hasConferences(setup) ? "Conference" : "Division"} halves placement (Recommended)`,
            description:
              "Open inside each half, then cross over for final placement",
          },
        ]
      : []),
    {
      value: "standard",
      label: "Standard placement",
      description:
        "Seed-order placement bracket for the top available non-qualifiers",
    },
    {
      value: "off",
      label: "No consolation bracket",
      description: "Championship bracket only",
    },
  ];
  const themes: Array<LeagueSetupInput["playoffs"]["theme"]> = [
    "gold",
    "silver",
    "bronze",
    "custom",
  ];

  // Presets set several fields at once; the form remains the "customize" fallback.

  // Round & game branding — the slots derive from the format choices, so they exist before generation.
  const normalized = normalizePlayoffSettings(
    p,
    setup.teams.length,
    setup.color,
    setup.weeks,
  );
  const roundNames = getPlayoffRoundNames(normalized, divisionCount);
  const gameSlots = getPlayoffGameBrandingSlots(normalized, divisionCount);
  const projectedConsolationBracket = (() => {
    if (p.consolationMode === "off") return null;
    try {
      const stub = {
        id: "wizard-preview",
        seed: "0",
        createdAt: "",
        setup: { ...setup, playoffs: normalized },
        weeks: [],
        playoffGames: [],
        revision: 0,
        fairness: {},
      } as unknown as GeneratedSchedule;
      return projectConsolationBracket(stub);
    } catch {
      return null;
    }
  })();
  // Consolation slots derive from a stubbed schedule (structure is deterministic from settings).
  const consolationSlots: Array<{
    id: string;
    label: string;
    roundName: string;
    roundIndex: number;
  }> = (() => {
    return (
      projectedConsolationBracket?.rounds.flatMap((round) =>
        round.games.map((game) => ({
          id: game.id,
          label: game.label,
          roundName: round.name,
          roundIndex: round.roundIndex,
        })),
      ) ?? []
    );
  })();
  // Projected finishing chart (exact places up top, ranges + tail once the calendar runs out).
  const placementChart = (() => {
    try {
      const stub = {
        id: "wizard-preview",
        seed: "0",
        createdAt: "",
        setup: { ...setup, playoffs: normalized },
        weeks: [],
        playoffGames: [],
        revision: 0,
        fairness: {},
      } as unknown as GeneratedSchedule;
      return projectPlacementChart(stub);
    } catch {
      return [];
    }
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
    if (name.trim()) next[gameId] = name.slice(0, 60);
    else delete next[gameId];
    patch({ gameNames: next });
  };
  const updateGameLogo = (gameId: string, logoUrl?: string) => {
    const next = { ...(p.gameLogoUrls ?? {}) };
    if (logoUrl) next[gameId] = logoUrl;
    else delete next[gameId];
    patch({ gameLogoUrls: next });
  };

  // Live preview — a real left-to-right bracket (one column per round) with connector lines,
  // structural slots (seed + division, not sample teams), division logos/colors, and a
  // championship ↔ consolation toggle.
  const divisions = setup.divisions;
  const divById = new Map(divisions.map((d) => [d.id, d]));
  const seeded = [...setup.teams].sort(
    (a, b) => (a.overallRank ?? 99) - (b.overallRank ?? 99),
  );
  const divOfSeed = (seed: number) => {
    const t = seeded[seed - 1];
    return t ? divById.get(t.divisionId) : undefined;
  };
  const divInitials = (d?: Division) =>
    (d?.initials?.trim() || d?.name || "D").slice(0, 3).toUpperCase();
  // The bracket splits into two halves. For 4/6/8-division leagues with a conference assignment the
  // two sides are the two CONFERENCES (each pools all its divisions' teams) — mirroring the engine's
  // `conferenceDivisionGroups` seeding; for a 2-division league the two sides are the divisions.
  const conferencesActive = hasConferences(setup);
  const halfIdentities: Array<Conference | Division | undefined> =
    conferencesActive
      ? [setup.conferences![0], setup.conferences![1]]
      : [divisions[0], divisions[1]];
  const halfDivisionIds: Array<Set<string>> = conferencesActive
    ? [0, 1].map(
        (hi) =>
          new Set(
            divisions
              .filter((d) => d.conferenceId === setup.conferences![hi].id)
              .map((d) => d.id),
          ),
      )
    : [new Set([divisions[0]?.id]), new Set([divisions[1]?.id])];
  const teamInHalf = (hi: number, divisionId: string) =>
    halfDivisionIds[hi]?.has(divisionId) ?? false;
  const previewHalves =
    p.placementMode === "division-halves" &&
    halvesUsable &&
    divisions.length >= 2;

  type PSlot = {
    division?: Division;
    seed?: number;
    feederId?: string;
    text?: string;
    leader?: boolean;
    source?: "championship";
  };
  type PMatch = {
    id: string;
    accent?: string;
    gold?: boolean;
    gameNo?: number;
    slots: PSlot[];
    placementRange?: [number, number];
    placementFinal?: boolean;
    kind?: "game" | "champ-feed" | "consolation-feed" | "bye-feed" | "cutoff";
    feedLabel?: string;
    feedSubLabel?: string;
    bracketContext?: "champ" | "conso";
  };
  type PRound = { name: string; matches: PMatch[]; roundIndex?: number };
  type PBracket = {
    rounds: PRound[];
    connections: BracketConnection[];
    gameNo: Record<string, number>;
  };
  const previewOrdinal = (value: number) => {
    const remainder = value % 100;
    if (remainder >= 11 && remainder <= 13) return `${value}th`;
    if (value % 10 === 1) return `${value}st`;
    if (value % 10 === 2) return `${value}nd`;
    if (value % 10 === 3) return `${value}rd`;
    return `${value}th`;
  };
  const previewPlacementLabel = ([start, end]: [number, number]) =>
    start === end
      ? `${previewOrdinal(start)}`
      : end === start + 1
        ? `${previewOrdinal(start)} / ${previewOrdinal(end)}`
        : `${previewOrdinal(start)}-${previewOrdinal(end)}`;
  const eliminatedCutoffMatches = (prefix = "pv-cutoff"): PMatch[] => {
    const ids = projectedConsolationBracket?.eliminatedTeamIds ?? [];
    return ids.map((teamId, index) => {
      const overallSeed = seeded.findIndex((team) => team.id === teamId) + 1;
      return {
        id: `${prefix}-${teamId}`,
        kind: "cutoff",
        feedLabel:
          overallSeed > 0 ? `#${overallSeed} seed` : `Seed ${index + 1}`,
        feedSubLabel: "Eliminated",
        slots: [],
      };
    });
  };
  const draftOrderRows = (() => {
    const slotForPlace = (place: number) =>
      placementChart.find(
        (slot) => place >= slot.placeStart && place <= slot.placeEnd,
      );
    type DraftTier = "championship" | "consolation" | "eliminated";
    const rows: Array<{
      pickStart: number;
      pickEnd: number;
      label: string;
      source: string;
      exact: boolean;
      tier: DraftTier;
    }> = [];
    let pick = 1;
    const addRow = (
      label: string,
      source: string,
      exact: boolean,
      tier: DraftTier,
      width = 1,
    ) => {
      rows.push({
        pickStart: pick,
        pickEnd: pick + width - 1,
        label,
        source,
        exact,
        tier,
      });
      pick += width;
    };
    type DraftPlacementSlot = (typeof placementChart)[number];
    const slotWidth = (slot: DraftPlacementSlot) =>
      slot.placeEnd - slot.placeStart + 1;
    const draftSlotLabel = (slot: DraftPlacementSlot) => {
      if (slot.exact) return `${previewOrdinal(slot.placeStart)} Place`;
      const start = previewOrdinal(slot.placeStart);
      const end = previewOrdinal(slot.placeEnd);
      return `${start}-${end} Place Range`;
    };
    const addSlot = (slot: DraftPlacementSlot, source: string) => {
      addRow(
        draftSlotLabel(slot),
        source,
        slot.exact,
        slot.tier,
        slotWidth(slot),
      );
    };
    const byPlacement = (a: DraftPlacementSlot, b: DraftPlacementSlot) =>
      a.placeStart - b.placeStart || a.placeEnd - b.placeEnd;
    const draftFieldSize = Math.min(
      setup.teams.length,
      Math.max(2, normalized.fieldSize),
    );
    const placementMatchNote = (place: number) => {
      const pairStart = place % 2 === 0 ? place - 1 : place;
      const pairEnd = place % 2 === 0 ? place : place + 1;
      const result = place === pairStart ? "Won" : "Lost";
      return `${result} the ${previewOrdinal(pairStart)} / ${previewOrdinal(pairEnd)} placement matchup.`;
    };

    if (normalized.draftOrderMode === "reverse-standings") {
      placementChart
        .slice()
        .sort((a, b) => b.placeEnd - a.placeEnd || b.placeStart - a.placeStart)
        .forEach((slot) =>
          addSlot(
            slot,
            slot.exact && slot.placeEnd === setup.teams.length
              ? "Last place drafts first next season."
              : slot.exact && slot.placeStart === 1
                ? "Champion drafts last next season."
                : slot.exact
                  ? "Standard reverse finish: lower final placement drafts earlier."
                  : "Placement range earns this draft-pick range; regular-season standing breaks the range.",
          ),
        );
      return rows;
    }

    placementChart
      .filter((slot) => slot.tier === "consolation")
      .sort(byPlacement)
      .forEach((slot) =>
        addSlot(
          slot,
          slot.exact && slot.placeStart === draftFieldSize + 1
            ? "Consolation winner earns the first pick."
            : slot.exact
              ? placementMatchNote(slot.placeStart)
              : "Consolation range uses regular-season standing as the tiebreaker.",
        ),
      );

    placementChart
      .filter((slot) => slot.tier === "eliminated")
      .sort(byPlacement)
      .forEach((slot) =>
        addSlot(
          slot,
          slot.exact
            ? "Outside-bracket teams follow final standing order after the consolation bracket."
            : "Outside-bracket range follows final standing order after the consolation bracket.",
        ),
      );

    let place = draftFieldSize;
    while (place >= 3) {
      const pairStart = place % 2 === 0 ? place - 1 : place;
      const pairEnd = place;
      const startSlot = slotForPlace(pairStart);
      const endSlot = slotForPlace(pairEnd);
      const slot = endSlot ?? startSlot;
      if (!slot || slot.tier !== "championship") {
        place = pairStart - 1;
        continue;
      }
      if (!slot.exact) {
        addSlot(
          slot,
          "Championship-side range uses regular-season standing as the tiebreaker.",
        );
        place = slot.placeStart - 1;
        continue;
      }
      if (
        pairStart !== pairEnd &&
        startSlot?.tier === "championship" &&
        endSlot?.tier === "championship" &&
        startSlot.exact &&
        endSlot.exact
      ) {
        addRow(
          `${previewOrdinal(pairStart)} Place`,
          `Won the ${previewOrdinal(pairStart)} / ${previewOrdinal(pairEnd)} placement matchup.`,
          true,
          "championship",
        );
        addRow(
          `${previewOrdinal(pairEnd)} Place`,
          `Lost the ${previewOrdinal(pairStart)} / ${previewOrdinal(pairEnd)} placement matchup.`,
          true,
          "championship",
        );
      } else {
        addSlot(slot, "Projected championship-side final placement.");
      }
      place = pairStart - 1;
    }
    if (slotForPlace(2)?.tier === "championship")
      addRow(
        "2nd Place",
        "Runner-up drafts second-to-last.",
        true,
        "championship",
      );
    if (slotForPlace(1)?.tier === "championship")
      addRow("1st Place", "Champion always drafts last.", true, "championship");
    return rows;
  })();

  // Number every game across the bracket (round order, top to bottom) so later rounds can
  // reference "Winner · Game N".
  const numberGames = (rounds: PRound[]): Record<string, number> => {
    const map: Record<string, number> = {};
    let g = 0;
    rounds.forEach((round) =>
      round.matches.forEach((m) => {
        if (
          m.kind === "champ-feed" ||
          m.kind === "consolation-feed" ||
          m.kind === "bye-feed" ||
          m.kind === "cutoff"
        )
          return;
        g += 1;
        m.gameNo = g;
        map[m.id] = g;
      }),
    );
    return map;
  };

  const buildPool = (kind: "championship" | "consolation"): PBracket => {
    const rounds: PRound[] = [];
    const conns: BracketConnection[] = [];
    const link = (source: string, target: string, color?: string) =>
      conns.push({
        id: `k-${source}-${target}`,
        sourceGameId: source,
        targetGameId: target,
        outcome: "winner",
        color,
      });
    const addConsolationExitMarkers = () => {
      if (
        kind !== "championship" ||
        p.consolationMode === "off" ||
        rounds.length < 2
      )
        return;
      const finalPlacementForRound = (roundIndex: number) => {
        const sourcePrefix = `main-r${roundIndex + 1}-`;
        const projectedGame = projectedConsolationBracket?.rounds
          .flatMap((round) => round.games)
          .find(
            (game) =>
              game.placementRange[1] === game.placementRange[0] + 1 &&
              game.entrants.every(
                (entrant) =>
                  entrant.kind === "result" &&
                  entrant.outcome === "loser" &&
                  entrant.gameId.startsWith(sourcePrefix),
              ),
          );
        return projectedGame
          ? previewPlacementLabel(projectedGame.placementRange)
          : undefined;
      };
      for (
        let roundIndex = 0;
        roundIndex < rounds.length - 1;
        roundIndex += 1
      ) {
        const sourceGames = rounds[roundIndex].matches.filter(
          (match) =>
            match.kind !== "champ-feed" &&
            match.kind !== "consolation-feed" &&
            match.kind !== "bye-feed",
        );
        if (!sourceGames.length) continue;
        const feedId = `pv-exit-r${roundIndex + 1}`;
        const targetRound = rounds[roundIndex + 1];
        targetRound.matches = [
          ...targetRound.matches,
          {
            id: feedId,
            kind: "consolation-feed",
            feedLabel: "Consolation bracket",
            feedSubLabel: finalPlacementForRound(roundIndex),
            accent: "var(--field-mid)",
            slots: [],
          },
        ];
        sourceGames.forEach((source) =>
          conns.push({
            id: `k-${source.id}-${feedId}-loser`,
            sourceGameId: source.id,
            targetGameId: feedId,
            outcome: "loser",
            color: "var(--field-mid)",
          }),
        );
      }
    };
    const n = p.fieldSize;
    const isCons = kind === "consolation";
    const total = seeded.length;

    // General single-elimination sub-bracket for a seeded list (any size; top seeds get byes when
    // the count isn't a power of two). Returns the games per round + the id of its final game.
    const buildSeedBracket = (
      seeds: number[],
      prefix: string,
      slotFor: (s: number) => PSlot,
    ): { rounds: PMatch[][]; championId: string } => {
      const size = seeds.length;
      if (size <= 1) return { rounds: [], championId: `${prefix}-solo` };
      let bracketSize = 1;
      while (bracketSize < size) bracketSize *= 2;
      // Standard bracket-seeding permutation of positions 1..bracketSize so #1 and #2
      // always sit in opposite halves and byes attach to the correct top seeds.
      let order = [1, 2];
      while (order.length < bracketSize) {
        const s = order.length * 2;
        const next: number[] = [];
        for (const x of order) {
          next.push(x);
          next.push(s + 1 - x);
        }
        order = next;
      }
      // When both slots of a game belong to the same division, the winner is guaranteed to
      // come from that division — so the winner-feeder inherits its color + icon.
      const guar = (x?: PSlot, y?: PSlot) =>
        x?.division && y?.division && x.division.id === y.division.id
          ? x.division
          : undefined;
      // Each bracket slot holds a seed (1..size) or null when that rank is a bye.
      const slotAt = order.map((rank) =>
        rank <= size ? seeds[rank - 1] : null,
      );
      const out: PMatch[][] = [];
      const r1: PMatch[] = [];
      let advancers: PSlot[] = [];
      for (let j = 0; j < bracketSize / 2; j++) {
        const a = slotAt[2 * j],
          b = slotAt[2 * j + 1];
        if (a != null && b != null) {
          const id = `${prefix}-r1-${j}`;
          const sa = slotFor(a),
            sb = slotFor(b);
          r1.push({ id, accent: sa.division?.color, slots: [sa, sb] });
          advancers.push({ feederId: id, division: guar(sa, sb) });
        } else {
          const s = (a != null ? a : b) as number; // bye — present seed advances
          const byeSlot = slotFor(s);
          const id = `${prefix}-bye-${s}`;
          r1.push({
            id,
            kind: "bye-feed",
            accent: byeSlot.division?.color ?? "var(--gold)",
            feedLabel: "Bye",
            slots: [byeSlot],
          });
          advancers.push({ ...byeSlot, feederId: id });
        }
      }
      if (r1.length) out.push(r1);
      let ri = out.length;
      while (advancers.length > 1) {
        const matches: PMatch[] = [];
        const next: PSlot[] = [];
        for (let k = 0; k < Math.floor(advancers.length / 2); k++) {
          const s1 = advancers[2 * k],
            s2 = advancers[2 * k + 1];
          const id = `${prefix}-r${ri + 1}-${k}`;
          const gd = guar(s1, s2);
          if (s1?.feederId) link(s1.feederId, id, s1.division?.color);
          if (s2?.feederId) link(s2.feederId, id, s2.division?.color);
          matches.push({
            id,
            accent: gd?.color ?? s1?.division?.color ?? s2?.division?.color,
            slots: [s1, s2],
          });
          next.push({ feederId: id, division: gd });
        }
        out.push(matches);
        advancers = next;
        ri += 1;
      }
      return {
        rounds: out,
        championId: out.length ? out[out.length - 1][0].id : `${prefix}-r1-0`,
      };
    };

    if (previewHalves) {
      const per = Math.ceil(n / 2);
      const halfTeamCount = (hi: number) =>
        seeded.filter((t) => teamInHalf(hi, t.divisionId)).length;
      const offset = isCons ? per : 0; // consolation continues each side's seed ranking below the qualifiers
      // Cap consolation per half so the whole consolation bracket stays at/under championship depth.
      const consolCapPerHalf = 2 ** Math.max(0, roundNames.length - 1);
      const counts = [0, 1].map((hi) =>
        isCons
          ? Math.min(Math.max(0, halfTeamCount(hi) - per), consolCapPerHalf)
          : per,
      );
      if (counts[0] + counts[1] >= 2 && counts[0] >= 1 && counts[1] >= 1) {
        // Each side is a conference (4/6/8-div) or a division (2-div); label by its name, or its
        // initials when the name is too long for the slot (e.g. "Conference A" → "A champ").
        const champLabel = (idn?: { name?: string; initials?: string }) => {
          const nm = idn?.name?.trim();
          if (nm && nm.length <= 11) return `${nm} champ`;
          const ini = idn?.initials?.trim();
          return ini ? `${ini} champ` : "Champ";
        };
        const halves = [0, 1].map((hi) => {
          const side = halfIdentities[hi] ?? halfIdentities[0];
          // The top seeds in each half are the reserved division leaders (auto-bid, host); the rest
          // are wildcards. `dCount` = divisions in this half, so seeds 1..dCount are leaders.
          const dCount = halfDivisionIds[hi]?.size ?? 1;
          const localSeeds = Array.from(
            { length: counts[hi] },
            (_, i) => i + 1,
          );
          return {
            side,
            count: counts[hi],
            ...buildSeedBracket(localSeeds, `pv-h${hi}`, (s) => ({
              division: side as Division | undefined,
              seed: offset + s,
              leader: !isCons && s <= dCount,
            })),
          };
        });
        const roundLeaf = conferencesActive
          ? "Conference Championship"
          : "Divisional Championship";
        const maxRounds = Math.max(
          halves[0].rounds.length,
          halves[1].rounds.length,
        );
        for (let r = 0; r < maxRounds; r++) {
          const name = isCons
            ? r === maxRounds - 1
              ? "Consolation"
              : `Consolation round ${r + 1}`
            : (roundNames[r] ?? (r === 0 ? "Wild Card" : roundLeaf));
          rounds.push({
            name,
            matches: halves.flatMap((h) => h.rounds[r] ?? []),
          });
        }
        const finalSlots: PSlot[] = isCons
          ? halves.map((h) =>
              h.count >= 2
                ? { feederId: h.championId }
                : {
                    division: h.side as Division | undefined,
                    seed: offset + 1,
                  },
            )
          : halves.map((h, hi) => ({
              feederId: h.championId,
              division: halfIdentities[hi] as Division | undefined,
              text: champLabel(halfIdentities[hi]),
            }));
        const final: PMatch = {
          id: isCons ? "pv-cons-final" : "pv-final",
          gold: !isCons,
          slots: finalSlots,
          ...(!isCons
            ? {
                placementRange: [1, 2] as [number, number],
                placementFinal: true,
              }
            : {}),
        };
        halves.forEach((h, hi) => {
          if (h.count >= 2)
            link(h.championId, final.id, halfIdentities[hi]?.color);
        });
        rounds.push({
          name: isCons
            ? "Consolation final"
            : (roundNames[maxRounds] ?? "Championship"),
          matches: [final],
        });
        addConsolationExitMarkers();
        return { rounds, connections: conns, gameNo: numberGames(rounds) };
      }
      // consolation leftovers too small/uneven to split by division — fall through to a plain seed list
    }

    // Overall / division-leaders championship, or a plain seed-ordered consolation of the teams
    // that missed the field (seeds n+1 … total). Consolation always uses pure overall seeds.
    const isOverall = p.placementMode === "overall";
    const leaderLabel =
      divisions.length === 2 ? "#1 / #2 seed" : `#1–${divisions.length} seed`;
    // In division-leaders, only the protected leaders take fixed top seeds; every wild-card
    // seed below them shifts with the leaders' records, so pair them off (#3 / #4, #5 / #6…).
    const wildStart = divisions.length + 1;
    const seedPairLabel = (s: number): string => {
      const lo = wildStart + Math.floor((s - wildStart) / 2) * 2;
      return `#${lo} / #${lo + 1} seed`;
    };
    // Consolation is capped at the championship's depth (2^rounds seats); lower seeds beyond that
    // are cut (eliminated), so the consolation bracket never runs more rounds than the championship.
    const poolSeeds = isCons
      ? Array.from(
          { length: Math.min(Math.max(0, total - n), 2 ** roundNames.length) },
          (_, i) => n + 1 + i,
        )
      : Array.from({ length: n }, (_, i) => i + 1);
    if (poolSeeds.length < 2)
      return { rounds: [], connections: [], gameNo: {} };
    const slotFor = (s: number): PSlot =>
      isCons
        ? { seed: s }
        : isOverall
          ? { seed: s }
          : s <= divisions.length
            ? { division: divOfSeed(s), text: leaderLabel, leader: true }
            : { text: seedPairLabel(s) };
    const { rounds: bracketRounds } = buildSeedBracket(
      poolSeeds,
      isCons ? "pv-c" : "pv",
      slotFor,
    );
    bracketRounds.forEach((matches, i) => {
      const last = i === bracketRounds.length - 1;
      const name = isCons
        ? last
          ? "Consolation final"
          : `Consolation round ${i + 1}`
        : (roundNames[i] ?? (last ? "Championship" : `Round ${i + 1}`));
      rounds.push({ name, matches });
    });
    const lastRound = rounds[rounds.length - 1];
    if (lastRound?.matches.length === 1 && !isCons) {
      lastRound.matches[0].gold = true;
      lastRound.matches[0].placementRange = [1, 2];
      lastRound.matches[0].placementFinal = true;
      lastRound.name = roundNames[rounds.length - 1] ?? "Championship";
    }
    addConsolationExitMarkers();
    return { rounds, connections: conns, gameNo: numberGames(rounds) };
  };
  const buildChampionship = (): PBracket => buildPool("championship");
  const buildProjectedConsolation = (): PBracket => {
    if (!projectedConsolationBracket)
      return { rounds: [], connections: [], gameNo: {} };
    const conns: BracketConnection[] = [];
    const champFeedMarkers = new Map<number, PMatch[]>();
    const gameById = new Map(
      projectedConsolationBracket.rounds.flatMap((round) =>
        round.games.map((game) => [game.id, game]),
      ),
    );
    const lastRoundIndex = Math.max(
      ...projectedConsolationBracket.rounds.map((round) => round.roundIndex),
    );
    const consolationKeepsHalves =
      projectedConsolationBracket.mode === "division-halves";
    const consolationSeedByTeamId = new Map(
      projectedConsolationBracket.admittedTeamIds.map((teamId, index) => [
        teamId,
        p.fieldSize + 1 + index,
      ]),
    );
    const sideAccent = (side?: "A" | "B") =>
      side === "A"
        ? halfIdentities[0]?.color
        : side === "B"
          ? halfIdentities[1]?.color
          : undefined;
    const sideName = (side?: "A" | "B") => {
      const identity =
        side === "A"
          ? halfIdentities[0]
          : side === "B"
            ? halfIdentities[1]
            : undefined;
      return (
        identity?.initials?.trim() ||
        identity?.name?.trim() ||
        (side ? `Side ${side}` : "")
      );
    };
    const sideForDivision = (divisionId?: string): "A" | "B" | undefined => {
      if (!divisionId) return undefined;
      if (teamInHalf(0, divisionId)) return "A";
      if (teamInHalf(1, divisionId)) return "B";
      return undefined;
    };
    const halfSeedForTeam = (teamId: string, divisionId?: string) => {
      const side = sideForDivision(divisionId);
      const sideIndex = side === "A" ? 0 : side === "B" ? 1 : -1;
      if (sideIndex < 0) return undefined;
      const rank =
        seeded
          .filter((team) => teamInHalf(sideIndex, team.divisionId))
          .findIndex((team) => team.id === teamId) + 1;
      return rank > 0 ? `${sideName(side)} #${rank} seed` : undefined;
    };
    const gameAccent = (game: {
      divisionId?: string;
      bracketSide?: "A" | "B";
      entrants: readonly unknown[];
    }) => {
      if (!consolationKeepsHalves) return "#586761";
      const teamEntrant = game.entrants.find(
        (entrant): entrant is { kind: "team"; divisionId: string } =>
          Boolean(
            entrant &&
            typeof entrant === "object" &&
            "kind" in entrant &&
            entrant.kind === "team" &&
            "divisionId" in entrant,
          ),
      );
      const resultEntrant = game.entrants.find(
        (entrant): entrant is { kind: "result"; bracketSide?: "A" | "B" } =>
          Boolean(
            entrant &&
            typeof entrant === "object" &&
            "kind" in entrant &&
            entrant.kind === "result" &&
            "bracketSide" in entrant,
          ),
      );
      return (
        (game.divisionId ? divById.get(game.divisionId)?.color : undefined) ??
        sideAccent(game.bracketSide) ??
        (teamEntrant
          ? divById.get(teamEntrant.divisionId)?.color
          : undefined) ??
        sideAccent(resultEntrant?.bracketSide) ??
        "#586761"
      );
    };
    const rounds = projectedConsolationBracket.rounds.map((round): PRound => ({
      name: round.name,
      roundIndex: round.roundIndex,
      matches: [...round.games]
        .sort((left, right) => {
          if (round.roundIndex === 0) return 0;
          const leftChamp = left.entrants.some(
            (entrant) =>
              entrant.kind === "result" && !gameById.has(entrant.gameId),
          );
          const rightChamp = right.entrants.some(
            (entrant) =>
              entrant.kind === "result" && !gameById.has(entrant.gameId),
          );
          if (leftChamp !== rightChamp) return leftChamp ? -1 : 1;
          return (
            left.placementRange[0] - right.placementRange[0] ||
            left.placementRange[1] - right.placementRange[1]
          );
        })
        .map((game): PMatch => {
          const accent = gameAccent(game);
          const champFeedId = `champ-feed-${game.id}`;
          const hasChampFeed = game.entrants.some(
            (entrant) =>
              entrant.kind === "result" && !gameById.has(entrant.gameId),
          );
          if (hasChampFeed) {
            const sourceRoundIndex = Math.max(0, round.roundIndex - 1);
            const markers = champFeedMarkers.get(sourceRoundIndex) ?? [];
            markers.push({
              id: champFeedId,
              kind: "champ-feed",
              feedLabel: "Champ bracket",
              accent: "var(--gold)",
              gold: true,
              slots: [],
              placementRange: game.placementRange,
              placementFinal: true,
            });
            champFeedMarkers.set(sourceRoundIndex, markers);
            conns.push({
              id: `k-${champFeedId}-${game.id}`,
              sourceGameId: champFeedId,
              targetGameId: game.id,
              outcome: "winner",
              color: "var(--gold)",
            });
          }
          const slots = game.entrants.map((entrant): PSlot => {
            if (entrant.kind === "team")
              return {
                division: consolationKeepsHalves
                  ? divById.get(entrant.divisionId)
                  : undefined,
                seed: consolationKeepsHalves
                  ? undefined
                  : (consolationSeedByTeamId.get(entrant.teamId) ??
                    entrant.seed),
                text: consolationKeepsHalves
                  ? halfSeedForTeam(entrant.teamId, entrant.divisionId)
                  : undefined,
              };
            const source = gameById.get(entrant.gameId);
            const compactSourceLabel = source
              ? `${entrant.outcome === "winner" ? "Winner" : "Loser"} · Game ?`
              : entrant.label
                  .replace(/^Winner of /i, "Winner · ")
                  .replace(/^Loser of /i, "Loser · ")
                  .replace(/\s+game\s+/i, " · Game ");
            return {
              feederId: entrant.gameId,
              text: compactSourceLabel,
              division: consolationKeepsHalves
                ? source?.divisionId
                  ? divById.get(source.divisionId)
                  : entrant.bracketSide === "A"
                    ? (halfIdentities[0] as Division | undefined)
                    : entrant.bracketSide === "B"
                      ? (halfIdentities[1] as Division | undefined)
                      : undefined
                : undefined,
            };
          }) as PSlot[];
          game.entrants.forEach((entrant) => {
            if (entrant.kind !== "result") return;
            const source = gameById.get(entrant.gameId);
            if (!source) return;
            conns.push({
              id: `k-${entrant.gameId}-${game.id}-${entrant.outcome}`,
              sourceGameId: entrant.gameId,
              targetGameId: game.id,
              outcome: entrant.outcome,
              color: source ? gameAccent(source) : undefined,
            });
          });
          return {
            id: game.id,
            accent,
            gold:
              game.label.toLowerCase().includes("final") ||
              game.placementRange[1] === game.placementRange[0] + 1,
            placementRange: game.placementRange,
            placementFinal:
              game.placementRange[1] <= game.placementRange[0] + 1 ||
              round.roundIndex === lastRoundIndex,
            slots,
          };
        }),
    }));
    rounds.forEach((round) => {
      const markers = champFeedMarkers.get(round.roundIndex ?? -1) ?? [];
      if (!markers.length) return;
      round.matches = [...round.matches, ...markers].sort((left, right) => {
        if (left.kind !== right.kind && left.kind === "champ-feed") return -1;
        if (left.kind !== right.kind && right.kind === "champ-feed") return 1;
        return (
          (left.placementRange?.[0] ?? 99) -
            (right.placementRange?.[0] ?? 99) ||
          (left.placementRange?.[1] ?? 99) - (right.placementRange?.[1] ?? 99)
        );
      });
    });
    const cutoffMatches = eliminatedCutoffMatches("pv-conso-cutoff");
    if (cutoffMatches.length) {
      if (rounds[0])
        rounds[0].matches = [...rounds[0].matches, ...cutoffMatches];
      else
        rounds.push({
          name: "Eliminated",
          roundIndex: 0,
          matches: cutoffMatches,
        });
    }
    const gameNo = numberGames(rounds);
    rounds.forEach((round) =>
      round.matches.forEach((match) =>
        match.slots.forEach((slot) => {
          if (slot.feederId && slot.text?.endsWith("?")) {
            slot.text = slot.text.replace(
              "?",
              String(gameNo[slot.feederId] ?? "?"),
            );
          }
        }),
      ),
    );
    return { rounds, connections: conns, gameNo };
  };

  const consolationAvailable = Boolean(
    projectedConsolationBracket?.rounds.length,
  );
  const showConsolationView =
    previewView === "consolation" && consolationAvailable;
  const showFullBracketView = previewView === "full" && consolationAvailable;
  const showPlacementView =
    previewView === "placement" && placementChart.length > 0;
  const showDraftView = previewView === "draft" && draftOrderRows.length > 0;
  const previewTierLabel = (
    tier: "championship" | "consolation" | "eliminated",
  ) =>
    tier === "championship"
      ? "Championship bracket"
      : tier === "consolation"
        ? "Consolation bracket"
        : "Eliminated — no bracket";
  const bracketSignature = [
    showConsolationView,
    p.fieldSize,
    p.bracketType,
    p.placementMode,
    byeCount,
    previewHalves,
    roundNames.join("~"),
    divisions.map((d) => `${d.id}:${d.color}:${d.logoUrl ?? ""}`).join(","),
    setup.teams
      .map((t) => `${t.id}:${t.overallRank}:${t.divisionId}`)
      .join(","),
    consolationSlots.map((s) => s.id).join(","),
  ].join("|");
  // Stabilize the bracket (and its connections array) so BracketConnectorLayer measures once
  // instead of churning on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewBrackets = useMemo(
    () => ({
      championship: buildChampionship(),
      consolation: buildProjectedConsolation(),
    }),
    [bracketSignature],
  );
  const previewBracket = showConsolationView
    ? previewBrackets.consolation
    : previewBrackets.championship;

  const renderSlot = (
    slot: PSlot,
    gameNo: Record<string, number>,
    key: number,
  ) => {
    const d = slot.division;
    const color = d?.color ?? "#586761";
    const label =
      slot.text ??
      (slot.seed != null
        ? `#${slot.seed} seed`
        : slot.feederId
          ? `Winner · Game ${gameNo[slot.feederId] ?? "?"}`
          : "TBD");
    return (
      <span
        key={key}
        data-bracket-source-id={slot.feederId}
        className={`ppw-slot ${slot.leader ? "ppw-slot-lead" : ""}`}
        style={
          {
            "--slot-c": color,
            color: accessibleAccentColor(color, "#161d18"),
          } as React.CSSProperties
        }
      >
        {d?.logoUrl ? (
          <img className="ppw-slogo" src={d.logoUrl} alt="" />
        ) : (
          <b
            className="ppw-dchip"
            style={
              {
                background: color,
                color: readableTextColor(color),
              } as React.CSSProperties
            }
          >
            {d ? divInitials(d) : "#"}
          </b>
        )}
        <span className="ppw-name">{label}</span>
        {slot.leader && (
          <ShieldCheck
            className="ppw-slot-leader"
            aria-label="Division leader — hosts at home"
          />
        )}
      </span>
    );
  };
  const slotPreviewLabel = (slot: PSlot, gameNo: Record<string, number>) =>
    slot.text ??
    (slot.seed != null
      ? `#${slot.seed} seed`
      : slot.feederId
        ? `Winner · Game ${gameNo[slot.feederId] ?? "?"}`
        : "TBD");
  const contextLabel = (context?: "champ" | "conso") =>
    context === "champ"
      ? "Champ Bracket"
      : context === "conso"
        ? "Conso Bracket"
        : undefined;
  const roundColumnWidth = (
    round: PRound,
    gameNo: Record<string, number>,
    gameContext?: "champ" | "conso",
  ) => {
    const labels = round.matches.flatMap((match) =>
      match.kind === "champ-feed" || match.kind === "consolation-feed"
        ? [match.feedLabel ?? "Champ bracket", match.feedSubLabel ?? ""]
        : match.kind === "bye-feed"
          ? [
              match.feedLabel ?? "Bye",
              ...match.slots.map((slot) => slotPreviewLabel(slot, gameNo)),
            ]
          : match.kind === "cutoff"
            ? [match.feedLabel ?? "Did not qualify", match.feedSubLabel ?? ""]
            : (() => {
                const labelText = contextLabel(
                  match.bracketContext ?? gameContext,
                );
                const placementText = match.placementRange
                  ? previewPlacementLabel(match.placementRange)
                  : "";
                return [
                  [`Game ${match.gameNo ?? ""}`, labelText, placementText]
                    .filter(Boolean)
                    .join(" "),
                  ...match.slots.map((slot) => slotPreviewLabel(slot, gameNo)),
                ];
              })(),
    );
    const longest = labels.reduce(
      (max, label) => Math.max(max, label.length),
      0,
    );
    return Math.max(156, Math.min(360, Math.ceil(82 + longest * 6.2)));
  };
  const renderBracket = (
    data: PBracket,
    gameContext?: "champ" | "conso",
    className = "ppw-bracket",
  ) => {
    const isFullBracket = className.includes("ppw-full-bracket");
    const isChampionshipBracket = className.includes(
      "ppw-championship-bracket",
    );
    const isConsolationBracket = className.includes("ppw-consolation-bracket");
    const showConsolationDivider =
      isFullBracket || isChampionshipBracket || isConsolationBracket;
    const hasEliminationDivider = data.rounds.some((round) =>
      round.matches.some((match) => match.kind === "cutoff"),
    );
    const fullChampRows = isFullBracket
      ? Math.max(
          1,
          ...data.rounds.map(
            (round) =>
              round.matches.filter((match) => match.bracketContext === "champ")
                .length,
          ),
        )
      : 0;
    const fullConsoRows = isFullBracket
      ? Math.max(
          1,
          ...data.rounds.map(
            (round) =>
              round.matches.filter((match) => match.bracketContext === "conso")
                .length,
          ),
        )
      : 0;
    const fullMatchGridStyle = (
      round: PRound,
      match: PMatch,
      matchIndex: number,
    ): React.CSSProperties | undefined => {
      if (!isFullBracket) return undefined;
      if (match.bracketContext === "champ") {
        const champRow = round.matches
          .slice(0, matchIndex + 1)
          .filter((item) => item.bracketContext === "champ").length;
        const champCount = Math.max(
          1,
          round.matches.filter((item) => item.bracketContext === "champ")
            .length,
        );
        const rowSpan = Math.max(1, Math.floor(fullChampRows / champCount));
        const rowStart = Math.max(1, (champRow - 1) * rowSpan + 1);
        return {
          gridRow: `${rowStart} / span ${rowSpan}`,
          alignSelf: "center",
        };
      }
      if (match.bracketContext === "conso" || match.kind === "cutoff") {
        if (match.kind === "cutoff") {
          const cutoffRow = round.matches
            .slice(0, matchIndex + 1)
            .filter((item) => item.kind === "cutoff").length;
          return { gridRow: fullChampRows + fullConsoRows + cutoffRow + 1 };
        }
        const consoRow = round.matches
          .slice(0, matchIndex + 1)
          .filter((item) => item.bracketContext === "conso").length;
        return { gridRow: fullChampRows + consoRow };
      }
      return undefined;
    };
    const consolationMatchGridStyle = (
      round: PRound,
      match: PMatch,
      matchIndex: number,
    ): React.CSSProperties | undefined => {
      if (!isConsolationBracket) return undefined;
      if (match.kind === "champ-feed") return { gridRow: 1 };
      if (match.kind === "cutoff") {
        const cutoffRow = round.matches
          .slice(0, matchIndex + 1)
          .filter((item) => item.kind === "cutoff").length;
        return { gridRow: consoRowsForDivider + cutoffRow + 3 };
      }
      const consoRow = round.matches
        .slice(0, matchIndex + 1)
        .filter(
          (item) => item.kind !== "champ-feed" && item.kind !== "cutoff",
        ).length;
      return { gridRow: consoRow + 2 };
    };
    const consoRowsForDivider = isConsolationBracket
      ? Math.max(
          1,
          ...data.rounds.map(
            (round) =>
              round.matches.filter(
                (match) =>
                  match.kind !== "champ-feed" && match.kind !== "cutoff",
              ).length,
          ),
        )
      : 0;
    const bracketStyle = isFullBracket
      ? ({
          "--ppw-full-champ-rows": fullChampRows,
          "--ppw-full-divider-top": `${50 + fullChampRows * 94}px`,
          "--ppw-elim-divider-top": `${82 + (fullChampRows + fullConsoRows) * 94}px`,
        } as React.CSSProperties)
      : isConsolationBracket
        ? ({
            "--ppw-elim-divider-top": `${150 + consoRowsForDivider * 94}px`,
          } as React.CSSProperties)
        : undefined;
    return (
      <BracketConnectorLayer
        className={className}
        connections={data.connections}
        style={bracketStyle}
      >
        {showConsolationDivider && (
          <div className="ppw-conso-section-divider" aria-hidden="true">
            <span>Consolation bracket</span>
          </div>
        )}
        {hasEliminationDivider && (
          <div className="ppw-elim-section-divider" aria-hidden="true">
            <span>Elimination</span>
          </div>
        )}
        {data.rounds.map((round, ri) => (
          <div
            key={ri}
            className={`ppw-col ${ri === data.rounds.length - 1 ? "ppw-final" : ""}`}
            style={
              {
                "--ppw-col-w": `${roundColumnWidth(round, data.gameNo, gameContext)}px`,
              } as React.CSSProperties
            }
          >
            <span className="ppw-rh">{round.name}</span>
            <div className="ppw-col-games">
              {round.matches.map((m, mi) => {
                const previous = round.matches[mi - 1];
                const startsFullConsolation =
                  isFullBracket &&
                  m.bracketContext === "conso" &&
                  previous?.bracketContext !== "conso";
                const matchGridStyle =
                  fullMatchGridStyle(round, m, mi) ??
                  consolationMatchGridStyle(round, m, mi);
                if (m.kind === "champ-feed" || m.kind === "consolation-feed") {
                  return (
                    <div
                      key={m.id}
                      data-bracket-game-id={m.id}
                      className={`ppw-feed-node ${m.kind === "consolation-feed" ? "ppw-consolation-feed" : "ppw-champ-feed"}`}
                      style={matchGridStyle}
                    >
                      <span>{m.feedLabel ?? "Champ bracket"}</span>
                      {m.feedSubLabel && <small>{m.feedSubLabel}</small>}
                      <ArrowRight aria-hidden="true" />
                    </div>
                  );
                }
                if (m.kind === "cutoff") {
                  return (
                    <div
                      key={m.id}
                      data-bracket-game-id={m.id}
                      className="ppw-cutoff-node"
                      style={matchGridStyle}
                    >
                      <span>{m.feedLabel ?? "Did not qualify"}</span>
                      {m.feedSubLabel && <small>{m.feedSubLabel}</small>}
                    </div>
                  );
                }
                const labelContext = m.bracketContext ?? gameContext;
                const labelText = contextLabel(labelContext);
                return (
                  <div
                    key={m.id}
                    className={`ppw-match-wrap ${startsFullConsolation ? "ppw-conso-divider-start" : ""}`}
                    style={matchGridStyle}
                  >
                    <div
                      data-bracket-game-id={m.id}
                      className={`ppw-match ${m.gold ? "ppw-gold" : ""} ${m.kind === "bye-feed" ? "ppw-bye" : ""}`}
                      style={
                        {
                          "--ppw-accent": m.gold
                            ? "var(--gold)"
                            : (m.accent ?? "#3fbf7f"),
                        } as React.CSSProperties
                      }
                    >
                      {m.kind === "bye-feed" && (
                        <span className="ppw-gameno">
                          <span>Bye</span>
                        </span>
                      )}
                      {m.slots.length === 2 && (
                        <span className="ppw-gameno">
                          <span>
                            Game {m.gameNo}
                            {labelText && (
                              <>
                                {" "}
                                <em
                                  className={`ppw-bracket-chip ppw-bracket-chip-${labelContext}`}
                                >
                                  {labelText}
                                </em>
                              </>
                            )}
                          </span>
                          {m.placementRange && (
                            <em
                              className={`ppw-place-chip ${m.placementFinal ? "is-final" : ""}`}
                            >
                              {previewPlacementLabel(m.placementRange)}
                            </em>
                          )}
                        </span>
                      )}
                      {m.slots.map((s, i) => renderSlot(s, data.gameNo, i))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </BracketConnectorLayer>
    );
  };
  const fullPreviewBracket = useMemo((): PBracket => {
    const championship = previewBrackets.championship;
    const consolation = previewBrackets.consolation;
    const feedIds = new Set(
      [...championship.rounds, ...consolation.rounds]
        .flatMap((round) => round.matches)
        .filter(
          (match) =>
            match.kind === "champ-feed" || match.kind === "consolation-feed",
        )
        .map((match) => match.id),
    );
    const champGameIdMap = new Map<string, string>();
    championship.rounds.forEach((round, roundIndex) => {
      round.matches
        .filter((match) => !match.kind || match.kind === "game")
        .forEach((match, gameIndex) => {
          champGameIdMap.set(
            `main-r${roundIndex + 1}-g${gameIndex + 1}`,
            match.id,
          );
        });
    });
    const consoGameIds = new Set(
      projectedConsolationBracket?.rounds.flatMap((round) =>
        round.games.map((game) => game.id),
      ) ?? [],
    );
    const directChampToConsoConnections =
      projectedConsolationBracket?.rounds.flatMap((round) =>
        round.games.flatMap((game) =>
          game.entrants.flatMap((entrant) => {
            if (entrant.kind !== "result" || consoGameIds.has(entrant.gameId))
              return [];
            const mappedSourceId = champGameIdMap.get(entrant.gameId);
            if (!mappedSourceId) return [];
            return [
              {
                id: `k-${mappedSourceId}-${game.id}-${entrant.outcome}-full`,
                sourceGameId: mappedSourceId,
                targetGameId: game.id,
                outcome: entrant.outcome,
                color: "var(--gold)",
              } satisfies BracketConnection,
            ];
          }),
        ),
      ) ?? [];
    const combinedGameNo = { ...championship.gameNo, ...consolation.gameNo };
    const copyMatchForFull = (
      match: PMatch,
      bracketContext: "champ" | "conso",
    ): PMatch | null => {
      if (match.kind === "champ-feed" || match.kind === "consolation-feed")
        return null;
      return {
        ...match,
        bracketContext,
        slots: match.slots.map((slot) => {
          const feederId = slot.feederId
            ? (champGameIdMap.get(slot.feederId) ?? slot.feederId)
            : undefined;
          const text =
            feederId && slot.text?.endsWith("?")
              ? slot.text.replace("?", String(combinedGameNo[feederId] ?? "?"))
              : slot.text;
          return { ...slot, feederId, text };
        }),
      };
    };
    const maxRounds = Math.max(
      championship.rounds.length,
      consolation.rounds.length,
    );
    const rounds: PRound[] = Array.from(
      { length: maxRounds },
      (_, roundIndex) => {
        const champRound = championship.rounds[roundIndex];
        const consoRound = consolation.rounds[roundIndex];
        const matches: PMatch[] = [
          ...(champRound?.matches
            .map((match) => copyMatchForFull(match, "champ"))
            .filter((match): match is PMatch => Boolean(match)) ?? []),
          ...(consoRound?.matches
            .map((match) => copyMatchForFull(match, "conso"))
            .filter((match): match is PMatch => Boolean(match)) ?? []),
        ];
        return {
          name:
            champRound?.name ?? consoRound?.name ?? `Round ${roundIndex + 1}`,
          roundIndex,
          matches,
        };
      },
    );
    return {
      rounds,
      connections: [
        ...championship.connections,
        ...consolation.connections,
        ...directChampToConsoConnections,
      ].filter(
        (connection) =>
          !feedIds.has(connection.sourceGameId) &&
          !feedIds.has(connection.targetGameId),
      ),
      gameNo: combinedGameNo,
    };
  }, [
    previewBrackets.championship,
    previewBrackets.consolation,
    projectedConsolationBracket,
  ]);
  const renderFullBracket = () => (
    <div className="ppw-bracket-scroll">
      {renderBracket(
        fullPreviewBracket,
        undefined,
        "ppw-bracket ppw-full-bracket",
      )}
    </div>
  );

  const subPages: Array<{ key: typeof subPage; label: string; sub: string }> = [
    { key: "format", label: "Format", sub: "Field & bracket" },
    { key: "rules", label: "Rules", sub: "Seeding & venue" },
    { key: "brand", label: "Branding", sub: "Name & trophy" },
    { key: "logos", label: "Logos", sub: "Optional" },
  ];

  // Preview legend (top-right of the live-preview head): decodes the bracket swatches by conference,
  // division, and the neutral at-large / wild-card marker — adapting to the league's structure so it
  // only shows the groupings that actually drive this bracket.
  const hasWildcards = p.fieldSize > divisionCount;
  const legendMode: "halves-conf" | "divisions" | "colorkey" | "hidden" =
    divisionCount <= 1
      ? "hidden"
      : conferencesActive && previewHalves
        ? "halves-conf"
        : previewHalves || p.placementMode === "division-leaders"
          ? "divisions"
          : p.placementMode === "overall"
            ? "colorkey"
            : "hidden";
  const WILDCARD_COLOR = "#586761";
  const legendMark = (
    color: string,
    logoUrl: string | undefined,
    initials: string,
  ) =>
    logoUrl ? (
      <img className="ppw-slogo" src={logoUrl} alt="" />
    ) : (
      <b
        className="ppw-dchip"
        style={
          {
            background: color,
            color: readableTextColor(color),
          } as React.CSSProperties
        }
      >
        {initials}
      </b>
    );
  const legendDivision = (division: Division) => (
    <span key={division.id} className="ppw-legend-item is-div">
      {legendMark(division.color, division.logoUrl, divInitials(division))}
      <span className="ppw-legend-name">
        {division.name} <em className="ppw-legend-kind">(Div.)</em>
      </span>
    </span>
  );
  const legendWildcard = (
    <span className="ppw-legend-item is-wild">
      <b
        className="ppw-dchip"
        style={{ background: WILDCARD_COLOR, color: "#fff" }}
      >
        #
      </b>
      <span className="ppw-legend-name">Wild card</span>
    </span>
  );
  // Marks a slot that is reserved for a division leader (auto-bid). Shown wherever leaders are protected.
  const legendLeader = (
    <span className="ppw-legend-item is-leader">
      <ShieldCheck className="ppw-legend-glyph" aria-hidden="true" />
      <span className="ppw-legend-name">Division leader</span>
    </span>
  );
  const showsLeaders =
    legendMode === "halves-conf" || legendMode === "divisions";
  const previewLegend =
    legendMode === "hidden" ? null : (
      <div className="ppw-legend" aria-label="Bracket legend">
        {legendMode === "halves-conf" &&
          setup.conferences!.map((conference, hi) => (
            <div
              key={conference.id}
              className="ppw-legend-group"
              style={
                { "--legend-accent": conference.color } as React.CSSProperties
              }
            >
              <span className="ppw-legend-item is-conf">
                {legendMark(
                  conference.color,
                  conference.logoUrl,
                  conferenceDisplayInitials(conference),
                )}
                <span className="ppw-legend-name">
                  {conference.name} <em className="ppw-legend-kind">(Conf.)</em>
                </span>
              </span>
              {divisions
                .filter((division) => halfDivisionIds[hi].has(division.id))
                .map(legendDivision)}
            </div>
          ))}
        {(legendMode === "divisions" || legendMode === "colorkey") && (
          <div className="ppw-legend-group ppw-legend-group-flat">
            {divisions.map(legendDivision)}
          </div>
        )}
        {(showsLeaders || hasWildcards) && (
          <div className="ppw-legend-tools">
            {showsLeaders && legendLeader}
            {showsLeaders && hasWildcards && legendWildcard}
          </div>
        )}
      </div>
    );
  const previewTitle = showDraftView
    ? "Projected draft order"
    : showPlacementView
      ? "Where everyone finishes"
      : showFullBracketView
        ? "Full playoff bracket"
        : showConsolationView
          ? "Placement bracket"
          : p.bracketType === "ladder"
            ? "The playoff ladder"
            : "Road to the title";
  const previewSubtitle = showDraftView
    ? normalized.draftOrderMode === "reverse-standings"
      ? "Next season · reverse final placement · last place drafts first"
      : "Next season · consolation winner starts at Pick 1 · champion drafts last"
    : showPlacementView
      ? `Projected final order · ${setup.teams.length} teams`
      : showFullBracketView
        ? `${p.fieldSize} title teams · ${projectedConsolationBracket?.rounds.reduce((total, round) => total + round.games.length, 0) ?? 0} placement games · both trees together`
        : showConsolationView
          ? `${projectedConsolationBracket?.rounds.reduce((total, round) => total + round.games.length, 0) ?? 0} placement games · title-side losers and non-qualifiers`
          : `${p.fieldSize} teams · ${previewHalves ? (conferencesActive ? "conference halves" : "division halves") : p.placementMode === "overall" ? "overall seeds" : "auto seeding"} · ${byeCount ? `${byeCount} bye${byeCount === 1 ? "" : "s"}` : "no byes"}`;
  const canExpandBracket = !showDraftView && !showPlacementView;
  const previewTabOptions: Array<{
    key: "championship" | "consolation" | "full" | "placement" | "draft";
    label: string;
    visible: boolean;
  }> = [
    { key: "championship", label: "Championship", visible: true },
    { key: "consolation", label: "Consolation", visible: consolationAvailable },
    { key: "full", label: "Full bracket", visible: consolationAvailable },
    {
      key: "placement",
      label: "Final placement",
      visible: placementChart.length > 0,
    },
    { key: "draft", label: "Draft order", visible: placementChart.length > 0 },
  ];
  const renderPreviewTabs = (
    className = "ppw-preview-toggle",
    label = "Preview view",
  ) => (
    <div className={className} role="tablist" aria-label={label}>
      {previewTabOptions
        .filter((option) => option.visible)
        .map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={previewView === option.key}
            className={previewView === option.key ? "active" : ""}
            onClick={() => setPreviewView(option.key)}
          >
            {option.label}
          </button>
        ))}
    </div>
  );
  const renderPreviewBody = () =>
    showDraftView ? (
      <ol className="ppw-chart ppw-draft">
        {draftOrderRows.flatMap((slot, i) => {
          const changed = i === 0 || draftOrderRows[i - 1].tier !== slot.tier;
          const row = (
            <li
              key={slot.pickStart}
              className={`ppw-chart-row ${slot.exact ? "exact" : "range"}`}
            >
              <span className="ppw-chart-place">
                {slot.pickStart === slot.pickEnd
                  ? `Pick ${slot.pickStart}`
                  : `Picks ${slot.pickStart}-${slot.pickEnd}`}
              </span>
              <span className="ppw-chart-teams">
                <strong>{slot.label}</strong>
              </span>
              <span className="ppw-chart-note">{slot.source}</span>
            </li>
          );
          return changed
            ? [
                <li
                  key={`draft-sep-${slot.pickStart}`}
                  className="ppw-chart-sep"
                  aria-hidden="true"
                >
                  <span>{previewTierLabel(slot.tier)}</span>
                </li>,
                row,
              ]
            : [row];
        })}
      </ol>
    ) : showPlacementView ? (
      <ol className="ppw-chart">
        {placementChart.flatMap((slot, i) => {
          // Draw a labeled separator where the finishing tier changes: championship → consolation,
          // and consolation → eliminated (teams that made neither bracket).
          const changed = i > 0 && placementChart[i - 1].tier !== slot.tier;
          const row = (
            <li
              key={slot.placeStart}
              className={`ppw-chart-row ${slot.exact ? "exact" : "range"}`}
            >
              <span className="ppw-chart-place">{slot.label}</span>
              <span className="ppw-chart-teams">{slot.source}</span>
            </li>
          );
          return changed
            ? [
                <li
                  key={`sep-${slot.placeStart}`}
                  className="ppw-chart-sep"
                  aria-hidden="true"
                >
                  <span>{previewTierLabel(slot.tier)}</span>
                </li>,
                row,
              ]
            : [row];
        })}
      </ol>
    ) : showFullBracketView ? (
      renderFullBracket()
    ) : (
      renderBracket(
        previewBracket,
        undefined,
        showConsolationView
          ? "ppw-bracket ppw-consolation-bracket"
          : "ppw-bracket ppw-championship-bracket",
      )
    );

  return (
    <>
      <div className="step-stack playoff-wizard">
        <div className="section-heading">
          <span className="step-kicker">Step 5 of 6</span>
          <h1>Shape the playoffs.</h1>
          <p>
            Set the field and format, fine-tune the rules, then brand every
            round. You can change any of this later on the Playoffs page.
          </p>
        </div>

        <div
          className="playoff-wizard-subnav"
          role="tablist"
          aria-label="Playoff setup sections"
        >
          {subPages.map((sp, i) => (
            <button
              key={sp.key}
              type="button"
              role="tab"
              aria-selected={subPage === sp.key}
              className={subPage === sp.key ? "active" : ""}
              onClick={() => setSubPage(sp.key)}
            >
              <span className="ppw-n">{i + 1}</span>
              <span className="ppw-lab">
                <strong>{sp.label}</strong>
                <small>{sp.sub}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="playoff-wizard-layout">
          <div className="playoff-wizard-form">
            {subPage === "format" && (
              <>
                <div className={`ppw-reco ${usingRecommended ? "is-set" : ""}`}>
                  <span className="ppw-reco-mark">
                    {usingRecommended ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Sparkles aria-hidden="true" />
                    )}
                  </span>
                  <div className="ppw-reco-copy">
                    <strong>
                      {usingRecommended
                        ? "Recommended playoffs applied"
                        : "Recommended for your league"}
                    </strong>
                    <small>
                      {setup.teams.length} teams · {seasonWeeks}-week season →{" "}
                      <b>{recommended.fieldSize}-team</b> field ·{" "}
                      <b>{recommended.playoffWeeks}-week</b> tourney
                    </small>
                  </div>
                  {usingRecommended ? (
                    <span className="ppw-reco-status">In use</span>
                  ) : (
                    <button
                      type="button"
                      className="button-secondary ppw-reco-apply"
                      onClick={applyRecommendedPlayoffs}
                    >
                      <Check aria-hidden="true" />
                      Use recommended
                    </button>
                  )}
                </div>
                {canChoosePlayoffLength && (
                  <div className="ppw-group">
                    <FieldLabel hint="a 13-week season leaves room for a longer playoff">
                      Playoff length
                    </FieldLabel>
                    <div className="choice-row">
                      {[3, 4].map((wk) => (
                        <button
                          key={wk}
                          type="button"
                          className={
                            effectivePlayoffWeeks === wk ? "active" : ""
                          }
                          onClick={() => {
                            const nextMax = getMaximumPlayoffFieldSize(
                              setup.teams.length,
                              setup.weeks,
                              p.bracketType,
                              wk as 3 | 4,
                            );
                            patch({
                              playoffWeeks: wk as 3 | 4,
                              fieldSize: Math.min(p.fieldSize, nextMax),
                            });
                          }}
                        >
                          <strong>{wk} weeks</strong>
                          <small>
                            {wk === 3 ? "up to 8 seeds" : "up to 16 seeds"}
                          </small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="ppw-group">
                  <FieldLabel
                    hint={
                      byeCount
                        ? `${byeCount} bye${byeCount === 1 ? "" : "s"} for the top seed${byeCount === 1 ? "" : "s"}`
                        : "every qualifier opens play"
                    }
                  >
                    Playoff teams
                  </FieldLabel>
                  <CustomSelect
                    label="Playoff field size"
                    value={String(p.fieldSize)}
                    onChange={(value) => setFieldSize(Number(value))}
                    options={fieldSizeOptions.map((n) => ({
                      value: String(n),
                      label: `${n} teams`,
                      description: getPlayoffByeCount(n)
                        ? `${getPlayoffByeCount(n)} bye${getPlayoffByeCount(n) === 1 ? "" : "s"}`
                        : "No byes",
                    }))}
                  />
                </div>
                <div className="ppw-group">
                  <FieldLabel>Qualification</FieldLabel>
                  <CustomSelect
                    label="Playoff qualification"
                    value={p.placementMode}
                    onChange={(value) =>
                      patch({
                        placementMode:
                          value as LeagueSetupInput["playoffs"]["placementMode"],
                      })
                    }
                    options={placementOptions}
                  />
                </div>
              </>
            )}

            {subPage === "rules" && (
              <>
                <div className="ppw-group">
                  <FieldLabel>Reseeding</FieldLabel>
                  <CustomSelect
                    label="Reseeding"
                    value={p.reseedMode}
                    onChange={(value) =>
                      patch({
                        reseedMode:
                          value as LeagueSetupInput["playoffs"]["reseedMode"],
                      })
                    }
                    options={[
                      {
                        value: "protected",
                        label: "Protected reseed (Recommended)",
                        description: "Reseed while protecting bracket halves",
                      },
                      {
                        value: "fixed",
                        label: "Fixed bracket",
                        description: "Winners follow set bracket paths",
                      },
                      {
                        value: "each-round",
                        label: "Reseed each round",
                        description:
                          "Top remaining seed always hosts the lowest",
                      },
                    ]}
                  />
                </div>
                <div className="ppw-group">
                  <FieldLabel>Championship venue</FieldLabel>
                  <div className="choice-row">
                    <button
                      type="button"
                      className={
                        p.championshipVenueMode === "higher-seed"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        patch({ championshipVenueMode: "higher-seed" })
                      }
                    >
                      <strong>Higher seed hosts</strong>
                      <small>Top seed keeps home field</small>
                    </button>
                    <button
                      type="button"
                      className={
                        p.championshipVenueMode === "neutral-site"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        patch({ championshipVenueMode: "neutral-site" })
                      }
                    >
                      <strong>Neutral site</strong>
                      <small>Title game at a set venue</small>
                    </button>
                  </div>
                  {p.championshipVenueMode === "neutral-site" && (
                    <label className="ppw-followup-field">
                      <span>Neutral site name</span>
                      <input
                        aria-label="Neutral site name"
                        value={p.championshipVenueName ?? ""}
                        maxLength={80}
                        placeholder="Example: League Championship Stadium"
                        onChange={(event) =>
                          patch({ championshipVenueName: event.target.value })
                        }
                      />
                    </label>
                  )}
                </div>
                <div className="ppw-group">
                  <FieldLabel hint="used after this season to set next season's first-round picks">
                    Draft order method
                  </FieldLabel>
                  <div className="choice-row">
                    <button
                      type="button"
                      className={`ppw-choice-recommended ${normalized.draftOrderMode === "placement-reward" ? "active" : ""}`}
                      onClick={() =>
                        patch({ draftOrderMode: "placement-reward" })
                      }
                    >
                      <em>Recommended</em>
                      <strong>Placement reward</strong>
                      <small>
                        Consolation winner can earn Pick 1; champion still
                        drafts last
                      </small>
                    </button>
                    <button
                      type="button"
                      className={
                        normalized.draftOrderMode === "reverse-standings"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        patch({ draftOrderMode: "reverse-standings" })
                      }
                    >
                      <strong>NFL reverse order</strong>
                      <small>
                        Last place gets Pick 1; champion gets the last pick
                      </small>
                    </button>
                  </div>
                </div>
                <div className="ppw-group">
                  <FieldLabel>Seed labels</FieldLabel>
                  <div className="choice-row">
                    <button
                      type="button"
                      className={
                        p.seedDisplayMode === "reranked" ? "active" : ""
                      }
                      onClick={() => patch({ seedDisplayMode: "reranked" })}
                    >
                      <strong>Bracket seeds</strong>
                      <small>1…N by playoff seeding</small>
                    </button>
                    <button
                      type="button"
                      className={
                        p.seedDisplayMode === "standings-finish" ? "active" : ""
                      }
                      onClick={() =>
                        patch({ seedDisplayMode: "standings-finish" })
                      }
                    >
                      <strong>Standings finish</strong>
                      <small>Show regular-season place</small>
                    </button>
                  </div>
                </div>
                <div className="ppw-group">
                  <FieldLabel>Consolation bracket</FieldLabel>
                  <CustomSelect
                    label="Consolation bracket"
                    value={p.consolationMode}
                    onChange={(value) =>
                      setConsolation(
                        value as LeagueSetupInput["playoffs"]["consolationMode"],
                      )
                    }
                    options={consolationOptions}
                  />
                </div>
              </>
            )}

            {subPage === "brand" && (
              <>
                <div className="ppw-group">
                  <FieldLabel>Playoff identity</FieldLabel>
                  <div className="playoff-branding-row">
                    <IdentityColorPicker
                      name={p.name || "Championship Playoffs"}
                      abbreviation="PO"
                      color={p.color}
                      logoUrl={p.logoUrl}
                      showColorControl={p.theme === "custom"}
                      onChange={(next) =>
                        patch({
                          ...(p.theme === "custom"
                            ? { color: next.color }
                            : {}),
                          logoUrl: next.logoUrl,
                        })
                      }
                    />
                    <div className="playoff-name-field">
                      <FieldLabel>Playoff name</FieldLabel>
                      <input
                        aria-label="Playoff name"
                        value={p.name}
                        maxLength={40}
                        placeholder="Championship Playoffs"
                        onChange={(event) =>
                          patch({ name: event.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="ppw-group">
                  <FieldLabel>Trophy theme</FieldLabel>
                  <div className="choice-row playoff-theme-row">
                    {themes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={p.theme === t ? "active" : ""}
                        onClick={() => setTheme(t)}
                      >
                        <span
                          className="playoff-theme-swatch"
                          style={{
                            background:
                              t === "custom"
                                ? p.color
                                : PLAYOFF_THEME_COLORS[t],
                          }}
                        />
                        <strong>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </strong>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {subPage === "logos" && (
              <>
                <div className="ppw-optional">
                  <span className="ppw-optional-tag">Optional</span>
                  <span>
                    Add custom art — divisional logos, bowl-game badges,
                    whatever your league runs. Skip it and every round falls
                    back to your playoff logo.
                  </span>
                </div>
                <div className="ppw-group">
                  <FieldLabel>Championship bracket</FieldLabel>
                  <p className="ppw-rgnote">
                    Name and badge each round. Multi-game rounds — like division
                    halves — expand to logo each game.
                  </p>
                  <div className="ppw-rounds">
                    {roundNames.map((round, roundIndex) => {
                      const slots = gameSlots.filter(
                        (slot) => slot.roundIndex === roundIndex,
                      );
                      const expanded = expandedRounds.includes(roundIndex);
                      const brandedGames = slots.filter(
                        (slot) =>
                          p.gameLogoUrls?.[slot.id] || p.gameNames?.[slot.id],
                      ).length;
                      return (
                        <div className="ppw-round" key={roundIndex}>
                          <div className="ppw-round-head">
                            <IdentityColorPicker
                              compact
                              showColorControl={false}
                              showAbbreviation={false}
                              imagePresentation="bare"
                              name={`${round} round`}
                              abbreviation={(round || "R")
                                .slice(0, 3)
                                .toUpperCase()}
                              color={p.color}
                              logoUrl={p.roundLogoUrls?.[roundIndex]}
                              onChange={(next) =>
                                updateRoundLogo(roundIndex, next.logoUrl)
                              }
                            />
                            <label className="ppw-round-name">
                              <input
                                aria-label={`Round ${roundIndex + 1} name`}
                                defaultValue={round}
                                maxLength={40}
                                onBlur={(event) =>
                                  updateRoundName(
                                    roundIndex,
                                    event.target.value,
                                  )
                                }
                              />
                              <small>
                                {slots.length} game
                                {slots.length === 1 ? "" : "s"}
                                {brandedGames
                                  ? ` · ${brandedGames} branded`
                                  : ""}
                              </small>
                            </label>
                            {slots.length > 1 && (
                              <button
                                type="button"
                                className="ppw-expand"
                                aria-expanded={expanded}
                                onClick={() =>
                                  setExpandedRounds((cur) =>
                                    cur.includes(roundIndex)
                                      ? cur.filter((x) => x !== roundIndex)
                                      : [...cur, roundIndex],
                                  )
                                }
                              >
                                {expanded ? "Hide games" : "Logo each game"}
                              </button>
                            )}
                          </div>
                          {slots.length > 1 && expanded && (
                            <div className="ppw-games">
                              {slots.map((slot) => {
                                const fallback = `${round} · Game ${slot.gameIndex + 1}`;
                                return (
                                  <div className="ppw-game" key={slot.id}>
                                    <IdentityColorPicker
                                      compact
                                      showColorControl={false}
                                      showAbbreviation={false}
                                      imagePresentation="bare"
                                      name={fallback}
                                      abbreviation={`G${slot.gameIndex + 1}`}
                                      color={p.color}
                                      logoUrl={p.gameLogoUrls?.[slot.id]}
                                      onChange={(next) =>
                                        updateGameLogo(slot.id, next.logoUrl)
                                      }
                                    />
                                    <input
                                      aria-label={`${fallback} name`}
                                      defaultValue={
                                        p.gameNames?.[slot.id] ?? fallback
                                      }
                                      maxLength={60}
                                      onBlur={(event) =>
                                        updateGameName(
                                          slot.id,
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {consolationSlots.length > 0 && (
                  <div className="ppw-group">
                    <FieldLabel>Consolation bracket</FieldLabel>
                    <p className="ppw-rgnote">
                      Placement and bowl games for the teams outside the title
                      hunt — each gets its own logo.
                    </p>
                    <div className="ppw-rounds">
                      {[
                        ...new Map(
                          consolationSlots.map((s) => [
                            s.roundIndex,
                            s.roundName,
                          ]),
                        ).entries(),
                      ].map(([roundIndex, roundName]) => {
                        const slots = consolationSlots.filter(
                          (s) => s.roundIndex === roundIndex,
                        );
                        return (
                          <div className="ppw-round" key={`cons-${roundIndex}`}>
                            <div className="ppw-round-head ppw-round-head-plain">
                              <span className="ppw-cons-round">
                                {roundName}
                              </span>
                              <small>
                                {slots.length} game
                                {slots.length === 1 ? "" : "s"}
                              </small>
                            </div>
                            <div className="ppw-games ppw-games-flush">
                              {slots.map((slot) => (
                                <div className="ppw-game" key={slot.id}>
                                  <IdentityColorPicker
                                    compact
                                    showColorControl={false}
                                    showAbbreviation={false}
                                    imagePresentation="bare"
                                    name={slot.label}
                                    abbreviation="CG"
                                    color={p.color}
                                    logoUrl={p.gameLogoUrls?.[slot.id]}
                                    onChange={(next) =>
                                      updateGameLogo(slot.id, next.logoUrl)
                                    }
                                  />
                                  <input
                                    aria-label={`${slot.label} name`}
                                    defaultValue={
                                      p.gameNames?.[slot.id] ?? slot.label
                                    }
                                    maxLength={60}
                                    onBlur={(event) =>
                                      updateGameName(
                                        slot.id,
                                        event.target.value,
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <PlayoffLivePreview setup={setup} />
        </div>
      </div>
    </>
  );
}

function ReviewStep({ setup }: { setup: LeagueSetupInput }) {
  const weekOneLabel =
    setup.weekOne.rankingSource === "draft-day"
      ? hasCompleteDraftRanking(setup)
        ? "draft-day place"
        : "draft-day place (set after the draft)"
      : setup.priorSeason.entryMode === "history"
        ? "last season's finish"
        : setup.priorSeason.entryMode === "random"
          ? "sealed random order"
          : setup.priorSeason.entryMode === "manual"
            ? "manual team order"
            : "current team order";
  const checks = [
    `${setup.teams.length} teams balanced across ${setup.divisions.length} divisions`,
    `${setup.weeks}-week season with one matchup per team each week`,
    `Week 1 ranked by ${weekOneLabel}`,
    "Every divisional opponent scheduled twice",
    `Home and away streaks capped at ${setup.fairness.maxHomeAwayStreak}`,
  ];
  return (
    <div className="step-stack">
      <div className="section-heading">
        <span className="step-kicker">Step 6 of 6</span>
        <h1>Your league is ready to weave.</h1>
        <p>One final check, then we’ll build the complete season.</p>
      </div>
      <div className="review-banner" style={{ borderColor: setup.color }}>
        <EntityLogo
          className="review-mark"
          size={54}
          color={setup.color}
          logoUrl={setup.logoUrl}
          monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))}
        />
        <div>
          <span>{setup.seasonYear} FANTASY SEASON</span>
          <h2>{setup.name}</h2>
          <p>{setup.description}</p>
        </div>
      </div>
      <div className="review-metrics">
        <div>
          <strong>{setup.teams.length}</strong>
          <span>Teams</span>
        </div>
        <div>
          <strong>{setup.divisions.length}</strong>
          <span>Divisions</span>
        </div>
        <div>
          <strong>{setup.weeks}</strong>
          <span>Weeks</span>
        </div>
        <div>
          <strong>{(setup.teams.length * setup.weeks) / 2}</strong>
          <span>Matchups</span>
        </div>
      </div>
      <div className="validation-list">
        {checks.map((check) => (
          <div key={check}>
            <Check />
            {check}
          </div>
        ))}
      </div>
      <div className="generation-note">
        <WandSparkles />
        <span>
          <strong>Generation is deterministic and validated.</strong>
          <small>
            We’ll check team frequency, matchup inventory, divisional balance,
            and home/away totals before showing the result.
          </small>
        </span>
      </div>
    </div>
  );
}

function previewDivisions(setup: LeagueSetupInput) {
  return setup.divisions.map((division) => ({
    ...division,
    teams: setup.teams.filter((team) => team.divisionId === division.id),
  }));
}

function previewConferenceGroups(setup: LeagueSetupInput) {
  const divisions = previewDivisions(setup);
  if (!hasConferences(setup)) return null;
  return setup.conferences!.map((conference) => ({
    conference,
    divisions: divisions.filter(
      (division) => division.conferenceId === conference.id,
    ),
  }));
}

function setupProgress(step: number) {
  return Math.round(((step + 1) / STEPS.length) * 100);
}

function previewStepLabel(step: number) {
  return `Step ${step + 1} of ${STEPS.length} · ${STEPS[step]?.label ?? "Setup"}`;
}

function BlueprintRoster({ setup }: { setup: LeagueSetupInput }) {
  const divisions = previewDivisions(setup);
  const conferenceGroups = previewConferenceGroups(setup);
  const renderTeamChip = (team: Team) => {
    const monogram = teamInitials(team, setup.teams);
    const showRank =
      setup.priorSeason.enabled &&
      (setup.priorSeason.entryMode === "manual" ||
        setup.priorSeason.entryMode === "history");
    return (
      <span
        className="preview-team-chip"
        key={team.id}
        tabIndex={0}
        aria-label={`${teamDisplayName(team, true)} details`}
      >
        <EntityLogo
          color={team.color}
          logoUrl={team.logoUrl}
          monogram={monogram}
          entityType="team"
        />
        <span className="preview-team-card" role="tooltip">
          <span className="preview-team-card-head">
            <EntityLogo
              color={team.color}
              logoUrl={team.logoUrl}
              monogram={monogram}
              entityType="team"
            />
            <span>
              {team.city.trim() && <small>{team.city}</small>}
              <strong>{team.name || "Untitled team"}</strong>
            </span>
          </span>
          <span className="preview-team-card-grid">
            <span>
              <b>Initials</b>
              <em>{monogram}</em>
            </span>
            {team.manager.trim() && (
              <span>
                <b>Manager</b>
                <em>{team.manager}</em>
              </span>
            )}
            {team.stadium.trim() && (
              <span>
                <b>Venue</b>
                <em>{team.stadium}</em>
              </span>
            )}
            {showRank && (
              <span>
                <b>Overall rank</b>
                <em>#{team.overallRank}</em>
              </span>
            )}
          </span>
        </span>
      </span>
    );
  };
  const renderDivision = (
    division: ReturnType<typeof previewDivisions>[number],
  ) => (
    <div className="preview-division-group" key={division.id}>
      <div className="preview-division-title">
        <EntityLogo
          className="preview-division-mark"
          color={division.color}
          logoUrl={division.logoUrl}
          monogram={divisionDisplayInitials(setup, division)}
          entityType="division"
        />
        <strong>{division.name}</strong>
        <small>{division.teams.length} teams</small>
      </div>
      <div className="preview-team-chips" aria-label={`${division.name} teams`}>
        {division.teams.map(renderTeamChip)}
      </div>
    </div>
  );
  return (
    <div className="preview-divisions">
      <div className="preview-section-head">
        <span>Division preview</span>
        <small>Full edit in Step 3</small>
      </div>
      {conferenceGroups
        ? conferenceGroups.map(({ conference, divisions: groupDivisions }) => (
            <div className="preview-conference-group" key={conference.id}>
              <div className="preview-conference-title">
                <EntityLogo
                  color={conference.color}
                  logoUrl={conference.logoUrl}
                  monogram={conferenceDisplayInitials(conference)}
                  entityType="conference"
                />
                <strong>{conference.name}</strong>
                <small>
                  {groupDivisions.reduce(
                    (total, division) => total + division.teams.length,
                    0,
                  )}{" "}
                  teams
                </small>
              </div>
              {groupDivisions.map(renderDivision)}
            </div>
          ))
        : divisions.map(renderDivision)}
      <div className="preview-summary-note">
        <Check />
        <span>
          League identity, teams, divisions, colors, and logos are loaded.
        </span>
      </div>
    </div>
  );
}

type BuilderActionProps = {
  step: number;
  createPath?: boolean;
  createPathMode?: CreatePathMode;
  quickCreateReady?: boolean;
  generating: boolean;
  skipDraftRankForNow: boolean;
  back: () => void;
  next: () => void;
  generate: () => void;
};

function BuilderActionButtons({
  step,
  createPath = false,
  createPathMode = "customize",
  quickCreateReady = true,
  generating,
  skipDraftRankForNow,
  back,
  next,
  generate,
}: BuilderActionProps) {
  const createPathLabel =
    createPathMode === "quick" ? "Review quick create" : "Customize everything";
  const CreatePathIcon = createPathMode === "quick" ? Zap : SlidersHorizontal;
  const showReviewFlag = !createPath && step === STEPS.length - 2;
  return (
    <>
      <button
        type="button"
        className="button-secondary"
        onClick={back}
        disabled={generating}
      >
        <ArrowLeft />
        Back
      </button>
      {step < STEPS.length - 1 ? (
        <button
          type="button"
          className="button-primary"
          onClick={next}
          disabled={
            generating ||
            (createPath && createPathMode === "quick" && !quickCreateReady)
          }
        >
          {createPath ? <CreatePathIcon /> : showReviewFlag ? <Flag /> : null}
          {createPath
            ? createPathLabel
            : skipDraftRankForNow
              ? "Skip draft rank for now"
              : "Continue"}
          <ArrowRight />
        </button>
      ) : (
        <button
          type="button"
          className="button-primary generate-button"
          onClick={generate}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="spinner" />
              Weaving schedule…
            </>
          ) : (
            <>
              <Sparkles />
              Generate my season
            </>
          )}
        </button>
      )}
    </>
  );
}

function LivePreview({
  setup,
  step,
}: {
  setup: LeagueSetupInput;
  step: number;
}) {
  if (step === 0) {
    return (
      <aside className="builder-preview builder-preview-empty">
        <div className="preview-top">
          <span>LEAGUE BLUEPRINT</span>
          <em>LIVE</em>
        </div>
        <div className="preview-empty-body">
          <span className="preview-empty-mark">
            <WandSparkles />
          </span>
          <strong>Your blueprint builds here</strong>
          <p>
            Choose how to start below. As you add teams and divisions,
            they&rsquo;ll appear here in real time.
          </p>
        </div>
        <div className="preview-footer">
          <span>Setup progress</span>
          <strong>0%</strong>
          <div>
            <i style={{ width: "0%" }} />
          </div>
        </div>
      </aside>
    );
  }
  return (
    <aside className="builder-preview">
      <div className="preview-top">
        <span>LEAGUE BLUEPRINT</span>
        <em>LIVE</em>
      </div>
      <div className="preview-progress">
        <div>
          <span>{previewStepLabel(step)}</span>
          <strong>{setupProgress(step)}%</strong>
        </div>
        <i>
          <b style={{ width: `${setupProgress(step)}%` }} />
        </i>
      </div>
      <div className="preview-brand">
        <EntityLogo
          className="preview-logo"
          size={50}
          color={setup.color}
          logoUrl={setup.logoUrl}
          monogram={resolveInitials(setup.initials, leagueAcronym(setup.name))}
          entityType="league"
        />
        <div>
          <h2>{setup.name || "Untitled league"}</h2>
          <p>
            {setup.seasonYear} · {setup.weeks} weeks
          </p>
        </div>
      </div>
      <div className="preview-status">
        <span>
          <Users />
          {setup.teams.length} teams
        </span>
        <span>
          <ShieldCheck />
          {setup.divisions.length} div.
        </span>
        {hasConferences(setup) && (
          <span>
            <Trophy />
            {setup.conferences!.length} conf.
          </span>
        )}
        <span>
          <CalendarDays />
          {setup.weeks} weeks
        </span>
      </div>
      <BlueprintRoster setup={setup} />
    </aside>
  );
}

// Tablet/mobile: the blueprint can't be a side rail, so it becomes a pinned bar
// merged with the Back/Continue actions. Collapsed by default, taps open a sheet
// with the full roster.
function BuilderBlueprintBar({
  setup,
  step,
  open,
  onToggle,
  actions,
}: {
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
      {open && (
        <div
          className="blueprint-bar-backdrop"
          role="presentation"
          onMouseDown={onToggle}
        />
      )}
      <div className={`builder-blueprint-bar${open ? " open" : ""}`}>
        <div
          id={sheetId}
          className="blueprint-bar-sheet"
          role="region"
          aria-label="League blueprint"
          hidden={!open}
        >
          <div className="preview-progress">
            <div>
              <span>{previewStepLabel(step)}</span>
              <strong>{progress}%</strong>
            </div>
            <i>
              <b style={{ width: `${progress}%` }} />
            </i>
          </div>
          <div className="preview-brand">
            <EntityLogo
              className="preview-logo"
              size={44}
              color={setup.color}
              logoUrl={setup.logoUrl}
              monogram={resolveInitials(
                setup.initials,
                leagueAcronym(setup.name),
              )}
              entityType="league"
            />
            <div>
              <h2>{setup.name || "Untitled league"}</h2>
              <p>
                {setup.seasonYear} · {setup.weeks} weeks
              </p>
            </div>
          </div>
          <div className="preview-status">
            <span>
              <Users />
              {setup.teams.length} teams
            </span>
            <span>
              <ShieldCheck />
              {setup.divisions.length} div.
            </span>
            {hasConferences(setup) && (
              <span>
                <Trophy />
                {setup.conferences!.length} conf.
              </span>
            )}
            <span>
              <CalendarDays />
              {setup.weeks} weeks
            </span>
          </div>
          <BlueprintRoster setup={setup} />
        </div>
        <div className="blueprint-bar-progress" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="blueprint-bar-row">
          <button
            type="button"
            className="blueprint-bar-toggle"
            aria-expanded={open}
            aria-controls={sheetId}
            onClick={onToggle}
          >
            <EntityLogo
              size={30}
              color={setup.color}
              logoUrl={setup.logoUrl}
              monogram={resolveInitials(
                setup.initials,
                leagueAcronym(setup.name),
              )}
              entityType="league"
            />
            <span>
              <strong>{setup.name || "Untitled league"}</strong>
              <small>
                {setup.teams.length} teams · {progress}% set up
              </small>
            </span>
            <ChevronUp
              className={`blueprint-bar-chevron${open ? " flip" : ""}`}
            />
          </button>
          <div className="blueprint-bar-actions">
            <BuilderActionButtons {...actions} />
          </div>
        </div>
      </div>
    </>
  );
}

export function LeagueBuilder() {
  const router = useRouter();
  const { openSignIn } = useAuthModal();
  const [step, setStep] = useState(0);
  // Sub-tab selection for the two grouped steps, lifted to the parent so validation can jump to
  // the tab that owns a failing field before showing the error.
  const [teamsTab, setTeamsTab] = useState<TeamsTab>("teams");
  const [seasonTab, setSeasonTab] = useState<SeasonTab>("season");
  const progressTrackRef = useRef<HTMLOListElement>(null);
  const builderContentRef = useRef<HTMLDivElement>(null);
  const builderSectionRef = useRef<HTMLElement>(null);
  const stepMountedRef = useRef(false);
  const [setup, setSetup] = useState<LeagueSetupInput>(createDefaultSetup);
  // Sub-tab walking order for the two grouped steps — Continue advances through these in turn (and
  // Back reverses) before the wizard moves to the next top-level step. The Conferences sub-tab is
  // only in the order for 4/6/8-division leagues.
  const teamsTabOrder: string[] = conferencesApply(setup.divisions.length)
    ? [
        "teams",
        "division-count",
        "conferences",
        "division-details",
        "team-assignment",
      ]
    : ["teams", "division-count", "division-details", "team-assignment"];
  const seasonTabOrder: string[] = ["season", "seeding", "week1", "rules"];
  const [generating, setGenerating] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  // The builder autosaves this draft on every edit; "Save draft" is the explicit,
  // confirmable version of that so a commissioner knows their progress is kept.
  const [draftSaved, setDraftSaved] = useState(false);
  const draftSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealSeason, setRevealSeason] = useState<GeneratedSchedule | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [savedLeagues, setSavedLeagues] = useState<SavedLeaguePreset[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  // Save-state messages are surfaced by the logo prompt / save prompt UI; the
  // raw string isn't rendered on its own, so only the setter is retained.
  const [, setLeagueSaveState] = useState<string | null>(null);
  const [activeSavedLeagueId, setActiveSavedLeagueId] = useState<string | null>(
    null,
  );
  const [loadedPreset, setLoadedPreset] = useState<SavedLeaguePreset | null>(
    null,
  );
  // Step-1 saved-league picker (B1) + the Quick/Customize fork state (B2). The
  // fork only offers itself once a roster is loaded via import or saved league.
  const [savedPickerOpen, setSavedPickerOpen] = useState(false);
  const [showCreatePath, setShowCreatePath] = useState(false);
  const [createPathVisited, setCreatePathVisited] = useState(false);
  const [createPathMode, setCreatePathMode] =
    useState<CreatePathMode>("customize");
  const [createPathWeeks, setCreatePathWeeks] = useState<13 | 14>(14);
  const [quickStartAvailable, setQuickStartAvailable] = useState(false);
  const [connectedSavedLeaguePrompt, setConnectedSavedLeaguePrompt] =
    useState<SavedLeaguePreset | null>(null);
  const [importedConnectionPrompt, setImportedConnectionPrompt] =
    useState<ImportedConnectionPrompt | null>(null);
  const [importedConnectionBusy, setImportedConnectionBusy] = useState(false);
  const [importedConnectionError, setImportedConnectionError] = useState<
    string | null
  >(null);
  const [logoSavePrompt, setLogoSavePrompt] = useState<LogoSavePrompt | null>(
    null,
  );
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
  const [avatarNudgeState, setAvatarNudgeState] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const avatarNudgeDismissed = useRef(false);

  const saveDraft = () => {
    saveSetup(setup);
    setDraftSaved(true);
    if (draftSavedTimer.current) clearTimeout(draftSavedTimer.current);
    draftSavedTimer.current = setTimeout(() => setDraftSaved(false), 2200);
  };
  useEffect(
    () => () => {
      if (draftSavedTimer.current) clearTimeout(draftSavedTimer.current);
    },
    [],
  );

  // The blueprint bar is fixed to the bottom on tablet/mobile and its collapsed
  // height changes (Back/Continue wrap to a second row on narrow screens). Reserve
  // exactly that much space under the content so nothing hides behind it. We measure
  // the persistent footer (progress + action row + safe-area padding), never the
  // expanded sheet, so an open blueprint doesn't balloon the reservation.
  useEffect(() => {
    const section = builderSectionRef.current;
    if (!section) return;
    const setVar = (px: number) =>
      section.style.setProperty("--blueprint-bar-h", `${px}px`);
    const bar = section.querySelector<HTMLElement>(".builder-blueprint-bar");
    if (!bar) {
      setVar(0);
      return;
    }
    const row = bar.querySelector<HTMLElement>(".blueprint-bar-row");
    const progress = bar.querySelector<HTMLElement>(".blueprint-bar-progress");
    const measure = () => {
      if (getComputedStyle(bar).display === "none") {
        setVar(0);
        return;
      }
      const padBottom = parseFloat(getComputedStyle(bar).paddingBottom) || 0;
      const h =
        (row?.offsetHeight ?? 0) + (progress?.offsetHeight ?? 0) + padBottom;
      setVar(Math.ceil(h));
    };
    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (observer && row) observer.observe(row);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [step]);

  function openLeagueStepWithoutCreatePath() {
    setError(null);
    setShowFieldErrors(false);
    setShowCreatePath(false);
    setCreatePathVisited(false);
    setStep(1);
    setBlueprintOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const startNewLeague = () => {
    const blankSetup = createBlankSetup();
    setSetup(blankSetup);
    setActiveSavedLeagueId(null);
    setLoadedPreset(null);
    setQuickStartAvailable(false);
    dismissedLogoFingerprint.current = null;
    savePromptResolved.current = false;
    setLeagueSaveState(null);
    openLeagueStepWithoutCreatePath();
  };
  // Manual entry from Step 1 — a clean slate, no Quick-create fork (there's no
  // roster to fast-forward yet).
  const startManual = () => {
    startNewLeague();
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
    track.scrollTo({
      left:
        activeStep.offsetLeft -
        (track.clientWidth - activeStep.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [step]);
  useEffect(() => {
    setShowFieldErrors(false);
    if (!stepMountedRef.current) {
      stepMountedRef.current = true;
      return;
    }
    builderContentRef.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    const loadAccountState = () => {
      fetch("/api/entitlements")
        .then((response) => response.json())
        .then((payload: { signedIn?: boolean; avatarUrl?: string | null }) => {
          setSignedIn(Boolean(payload.signedIn));
          setHasAvatar(Boolean(payload.avatarUrl));
        })
        .catch(() => undefined);
      fetch("/api/saved-leagues")
        .then((response) => response.json())
        .then(
          (payload: {
            presets?: Array<{
              id: string;
              name: string;
              data: unknown;
              updated_at?: string;
            }>;
          }) => {
            setSavedLeagues(
              (payload.presets ?? [])
                .map(normalizeSavedLeague)
                .filter((preset): preset is SavedLeaguePreset =>
                  Boolean(preset),
                ),
            );
          },
        )
        .catch(() => undefined);
    };
    loadAccountState();
    // Keep the builder in sync when the user signs in/out via the modal without a page reload.
    const supabase = createClient();
    const { data: listener } = supabase?.auth.onAuthStateChange(() =>
      loadAccountState(),
    ) ?? { data: null };
    return () => listener?.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!blueprintOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBlueprintOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blueprintOpen]);
  useEffect(() => {
    const importParam = new URLSearchParams(window.location.search).get(
      "import",
    );
    if (
      importParam !== "espn" &&
      importParam !== "sleeper" &&
      importParam !== "csv"
    )
      return;
    setImportSource(importParam);
    const url = new URL(window.location.href);
    url.searchParams.delete("import");
    window.history.replaceState({}, "", url);
  }, []);

  // Validation is keyed to the six grouped steps. For a grouped step it also reports which
  // sub-tab owns the failing field, so `next()` can switch to it before highlighting the error.
  // Validate a step. `only` restricts the check to one grouped-step sub-tab (used while walking the
  // sub-tabs); with no `only` the whole step is checked (used when leaving it / on non-grouped steps).
  type ValidationResult = {
    error: string;
    teamsTab?: TeamsTab;
    seasonTab?: SeasonTab;
  } | null;
  const validateStep = (only?: {
    teamsTab?: TeamsTab;
    seasonTab?: SeasonTab;
  }): ValidationResult => {
    if (step === 1 && !setup.name.trim())
      return { error: "Enter a league name before continuing." };
    if (step === 2) {
      if (!only || only.teamsTab === "teams") {
        if (
          setup.teams.length < 8 ||
          setup.teams.length > 32 ||
          setup.teams.length % 2
        )
          return {
            error: "Use an even number of teams from 8 through 32.",
            teamsTab: "teams",
          };
        const missingTeam = setup.teams.findIndex((team) => !team.name.trim());
        if (missingTeam >= 0)
          return {
            error:
              "Enter a name for every team before continuing — the missing one is highlighted below.",
            teamsTab: "teams",
          };
      }
      if (
        (!only || only.teamsTab === "conferences") &&
        conferencesApply(setup.divisions.length)
      ) {
        if (setup.conferences?.some((conference) => !conference.name.trim()))
          return {
            error: "Give every conference a name before continuing.",
            teamsTab: "conferences",
          };
      }
      if (!only || only.teamsTab === "division-details") {
        if (setup.divisions.some((division) => !division.name.trim()))
          return {
            error: "Give every division a name before continuing.",
            teamsTab: "division-details",
          };
      }
      if (!only || only.teamsTab === "team-assignment") {
        if (setup.divisionPlacementMode === "manual") {
          if (
            setup.teams.some(
              (team) =>
                !setup.divisions.some(
                  (division) => division.id === team.divisionId,
                ),
            )
          )
            return {
              error:
                "Place every team in a division, or choose Random or Seed Draft.",
              teamsTab: "team-assignment",
            };
          const counts = setup.divisions.map(
            (division) =>
              setup.teams.filter((team) => team.divisionId === division.id)
                .length,
          );
          if (Math.max(...counts) - Math.min(...counts) > 1)
            return {
              error: `Rebalance the divisions. Current team counts are ${counts.join(", ")}.`,
              teamsTab: "team-assignment",
            };
        }
      }
      if (
        (!only || only.teamsTab === "division-details") &&
        conferencesApply(setup.divisions.length)
      ) {
        if (!hasConferences(setup))
          return {
            error: "Set the division structure before continuing.",
            teamsTab: "division-details",
          };
        const confCounts = setup.conferences!.map(
          (conference) =>
            setup.divisions.filter(
              (division) => division.conferenceId === conference.id,
            ).length,
        );
        if (confCounts[0] !== confCounts[1])
          return {
            error: `Balance the conferences. Current division counts are ${confCounts.join(", ")}.`,
            teamsTab: "division-details",
          };
      }
    }
    if (
      step === 3 &&
      (!only || only.seasonTab === "week1") &&
      setup.weekOne.rankingSource === "draft-day"
    ) {
      const selectedPlaces = setup.teams.filter((team) =>
        Number.isInteger(team.draftPlace),
      );
      if (
        selectedPlaces.length > 0 &&
        selectedPlaces.length < setup.teams.length
      )
        return {
          error: `Finish the draft order for all ${setup.teams.length} teams, or clear every draft place to skip it for now.`,
          seasonTab: "week1",
        };
      if (
        selectedPlaces.length === setup.teams.length &&
        new Set(selectedPlaces.map((team) => team.draftPlace)).size !==
          setup.teams.length
      )
        return {
          error: "Give every team a unique draft place before continuing.",
          seasonTab: "week1",
        };
    }
    return null;
  };
  const showValidationError = (result: NonNullable<ValidationResult>) => {
    if (result.teamsTab) setTeamsTab(result.teamsTab);
    if (result.seasonTab) setSeasonTab(result.seasonTab);
    setError(result.error);
    setShowFieldErrors(true);
    requestAnimationFrame(() => {
      const invalid = builderContentRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      if (invalid) {
        invalid.scrollIntoView({ block: "center", behavior: "smooth" });
        invalid.focus({ preventScroll: true });
      }
    });
  };
  // When the wizard moves to a grouped step, land on the entry sub-tab: the first when arriving
  // forward, the last when arriving via Back — so the sequential walk reads naturally either way.
  const advanceToStep = (
    nextStep: number,
    entry: "first" | "last" = "first",
  ) => {
    const target = Math.min(STEPS.length - 1, nextStep);
    if (target === 2)
      setTeamsTab(
        entry === "last"
          ? (teamsTabOrder[teamsTabOrder.length - 1] as TeamsTab)
          : "teams",
      );
    if (target === 3)
      setSeasonTab(
        entry === "last"
          ? (seasonTabOrder[seasonTabOrder.length - 1] as SeasonTab)
          : "season",
      );
    setStep(target);
    setShowCreatePath(false);
    setBlueprintOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openCreatePath = () => {
    setError(null);
    setShowFieldErrors(false);
    setCreatePathVisited(true);
    setCreatePathMode("customize");
    setCreatePathWeeks(setup.weeks === 13 ? 13 : 14);
    setShowCreatePath(true);
    setStep(1);
    setBlueprintOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const customizeEverything = () => advanceToStep(1);
  const matchingSavedLeague = () =>
    savedLeagues.find((preset) => preset.id === activeSavedLeagueId) ??
    savedLeagues.find(
      (preset) =>
        preset.name.trim().toLowerCase() === setup.name.trim().toLowerCase(),
    );
  const sourceSavedLeague = () =>
    activeSavedLeagueId
      ? (savedLeagues.find((preset) => preset.id === activeSavedLeagueId) ??
        loadedPreset)
      : loadedPreset;
  const buildSavedLeagueChangePrompt = (options: {
    nextStep?: number;
    generateAfter?: boolean;
  }): LogoSavePrompt | null => {
    const sourcePreset = sourceSavedLeague();
    if (!sourcePreset) return null;
    const currentIdentity = identityFromSetup(setup);
    const fingerprint = JSON.stringify({
      structure: savedLeagueStructureSignature(currentIdentity),
      details: savedLeagueDetailSignature(currentIdentity),
    });
    if (dismissedLogoFingerprint.current === fingerprint) return null;
    const structureChanged =
      savedLeagueStructureSignature(currentIdentity) !==
      savedLeagueStructureSignature(sourcePreset.data);
    const detailsChanged =
      savedLeagueDetailSignature(currentIdentity) !==
      savedLeagueDetailSignature(sourcePreset.data);
    if (!structureChanged && !detailsChanged) return null;
    return {
      fingerprint,
      nextStep: options.nextStep,
      generateAfter: options.generateAfter,
      presetId: structureChanged ? undefined : sourcePreset.id,
      presetName: sourcePreset.name || setup.name || "this league",
      mode: structureChanged ? "new" : "update",
      summary: structureChanged
        ? "The team, division, conference, assignment, or seed structure changed."
        : "Saved league details changed, but the team and division structure stayed the same.",
    };
  };
  function applySavedLeaguePreset(
    preset: SavedLeaguePreset,
    includeConnection: boolean,
  ) {
    setSetup((current) => ({
      ...current,
      ...preset.data.league,
      display: preset.data.display,
      divisions: preset.data.divisions,
      conferences: preset.data.conferences,
      divisionPlacementMode: preset.data.divisionPlacementMode ?? "manual",
      teams: preset.data.teams,
      platformConnection: includeConnection
        ? preset.data.platformConnection
        : undefined,
      priorSeason: preset.data.priorSeason ?? {
        ...current.priorSeason,
        enabled: false,
        hasData: false,
        entryMode: "none",
      },
      playoffs: preset.data.playoffs
        ? { ...current.playoffs, ...preset.data.playoffs }
        : current.playoffs,
    }));
    setActiveSavedLeagueId(preset.id);
    setLoadedPreset(preset);
    dismissedLogoFingerprint.current = null;
    setConnectedSavedLeaguePrompt(null);
    setQuickStartAvailable(true);
    openCreatePath();
  }
  const next = () => {
    if (showCreatePath) {
      if (createPathMode === "quick") {
        if (!quickCreateReady) {
          setError(
            quickCreateReason ??
              "Quick Create is not ready for this league yet.",
          );
          return;
        }
        reviewQuickCreate(createPathWeeks);
        return;
      }
      customizeEverything();
      return;
    }
    // Grouped steps (Teams & Divisions, Season & Rules) are walked one sub-tab at a time: Continue
    // validates the current sub-tab and moves to the next one; only from the last sub-tab does it
    // leave the step (re-validating the whole step first so nothing skipped slips through).
    const order =
      step === 2 ? teamsTabOrder : step === 3 ? seasonTabOrder : null;
    const current = step === 2 ? teamsTab : step === 3 ? seasonTab : null;
    if (order && current) {
      const index = order.indexOf(current);
      const leaving = index >= order.length - 1;
      const result = leaving
        ? validateStep()
        : validateStep(
            step === 2
              ? { teamsTab: current as TeamsTab }
              : { seasonTab: current as SeasonTab },
          );
      if (result) {
        showValidationError(result);
        return;
      }
      if (!leaving) {
        setError(null);
        setShowFieldErrors(false);
        if (step === 2) setTeamsTab(order[index + 1] as TeamsTab);
        else setSeasonTab(order[index + 1] as SeasonTab);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      // leaving the grouped step — fall through to the step advance below
    } else {
      const result = validateStep();
      if (result) {
        showValidationError(result);
        return;
      }
    }
    setError(null);
    setShowFieldErrors(false);
    advanceToStep(step + 1);
  };

  const skipDraftRankForNow =
    step === 3 &&
    seasonTab === "week1" &&
    setup.weekOne.rankingSource === "draft-day" &&
    getTeamsMissingDraftPlaces(setup).length === setup.teams.length;
  const back = () => {
    setError(null);
    setShowFieldErrors(false);
    if (showCreatePath) {
      setShowCreatePath(false);
      advanceToStep(0);
      return;
    }
    if (step === 1 && createPathVisited && quickStartAvailable) {
      openCreatePath();
      return;
    }
    // Inside a grouped step, Back steps to the previous sub-tab before leaving the step.
    const order =
      step === 2 ? teamsTabOrder : step === 3 ? seasonTabOrder : null;
    const current = step === 2 ? teamsTab : step === 3 ? seasonTab : null;
    if (order && current) {
      const index = order.indexOf(current);
      if (index > 0) {
        if (step === 2) setTeamsTab(order[index - 1] as TeamsTab);
        else setSeasonTab(order[index - 1] as SeasonTab);
        setBlueprintOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    if (step === 0) return;
    advanceToStep(step - 1, "last");
  };
  const quickImportSavedLeague = (preset: SavedLeaguePreset) => {
    if (preset.data.platformConnection) {
      setConnectedSavedLeaguePrompt(preset);
      return;
    }
    applySavedLeaguePreset(preset, false);
  };
  // Soft nudge: a signed-in commissioner with no avatar just uploaded a league logo — offer it as their profile image.
  const suggestAvatarFromLogo = (logoUrl: string) => {
    if (!logoUrl || !signedIn || hasAvatar || avatarNudgeDismissed.current)
      return;
    setAvatarNudgeState("idle");
    setAvatarNudge(logoUrl);
  };
  const dismissAvatarNudge = () => {
    avatarNudgeDismissed.current = true;
    setAvatarNudge(null);
  };
  const acceptAvatarNudge = async () => {
    if (!avatarNudge) return;
    const supabase = createClient();
    if (!supabase) return;
    setAvatarNudgeState("saving");
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: avatarNudge },
    });
    if (error) {
      setAvatarNudgeState("idle");
      return;
    }
    setHasAvatar(true);
    avatarNudgeDismissed.current = true;
    setAvatarNudgeState("saved");
    window.setTimeout(() => setAvatarNudge(null), 2200);
  };
  const saveLeaguePreset = async (
    requestedId?: string,
    options?: { forceNew?: boolean },
  ) => {
    if (!signedIn) {
      setLeagueSaveState(
        "Sign in first, then this shortcut will stay with your account.",
      );
      return false;
    }
    const targetId = options?.forceNew
      ? undefined
      : (requestedId ?? matchingSavedLeague()?.id);
    setLeagueSaveState("Saving…");
    try {
      const response = await fetch("/api/saved-leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          name: setup.name,
          data: identityFromSetup(setup),
        }),
      });
      const payload = (await response.json()) as {
        preset?: {
          id: string;
          name: string;
          data: unknown;
          updated_at?: string;
        };
        error?: string;
      };
      if (!response.ok || !payload.preset)
        throw new Error(payload.error || "This league could not be saved.");
      const normalized = normalizeSavedLeague(payload.preset);
      if (!normalized)
        throw new Error("The saved league response could not be read.");
      setSavedLeagues((current) => [
        normalized,
        ...current.filter((preset) => preset.id !== normalized.id),
      ]);
      setActiveSavedLeagueId(normalized.id);
      dismissedLogoFingerprint.current = null;
      setLeagueSaveState(
        targetId
          ? "Saved league updated."
          : "New saved league created. It will be ready on the League step next time.",
      );
      return true;
    } catch (caught) {
      setLeagueSaveState(
        caught instanceof Error
          ? caught.message
          : "This league could not be saved.",
      );
      return false;
    }
  };
  const savePromptLogos = async () => {
    if (!logoSavePrompt || !signedIn) return;
    setLogoSaveBusy(true);
    setLogoSaveError(null);
    const saved = await saveLeaguePreset(logoSavePrompt.presetId, {
      forceNew: logoSavePrompt.mode === "new",
    });
    setLogoSaveBusy(false);
    if (!saved) {
      setLogoSaveError(
        logoSavePrompt.mode === "new"
          ? "The new saved league could not be created yet. Your wizard entries are still here."
          : "The saved league could not be updated yet. Your wizard entries are still here.",
      );
      return;
    }
    const nextStep = logoSavePrompt.nextStep;
    const generateAfter = logoSavePrompt.generateAfter;
    setLogoSavePrompt(null);
    if (generateAfter) runGenerate();
    else if (nextStep !== undefined) advanceToStep(nextStep);
  };
  const skipPromptLogoSave = () => {
    if (!logoSavePrompt) return;
    dismissedLogoFingerprint.current = logoSavePrompt.fingerprint;
    const nextStep = logoSavePrompt.nextStep;
    const generateAfter = logoSavePrompt.generateAfter;
    setLogoSavePrompt(null);
    if (generateAfter) runGenerate();
    else if (nextStep !== undefined) advanceToStep(nextStep);
  };
  const continueImportedRosterOnly = () => {
    setSetup((current) => ({
      ...current,
      platformConnection: undefined,
      teams: current.teams.map((team) => ({ ...team, providerId: undefined })),
    }));
    setImportedConnectionPrompt(null);
    setImportedConnectionBusy(false);
    setImportedConnectionError(null);
  };
  const saveImportedConnection = async () => {
    if (!importedConnectionPrompt || importedConnectionBusy) return;
    if (!signedIn) {
      openSignIn("signup");
      return;
    }
    setImportedConnectionBusy(true);
    setImportedConnectionError(null);
    const saved = await saveLeaguePreset();
    setImportedConnectionBusy(false);
    if (!saved) {
      setImportedConnectionError(
        "The connection could not be saved yet. You can keep building and save it later from your account.",
      );
      return;
    }
    setImportedConnectionPrompt(null);
  };
  const applyImport = (preview: ImportPreview) => {
    const importedDivisionNames = Array.from(
      new Set(
        preview.teams
          .map((team) => team.division?.replace(/\s+division$/i, "").trim())
          .filter((name): name is string => Boolean(name)),
      ),
    );
    const importedDivisionCount = Math.min(
      MAX_DIVISIONS,
      Math.max(2, importedDivisionNames.length || 2),
    );
    const divisionCount = divisionCountSchedulable(
      preview.teams.length,
      importedDivisionCount,
    )
      ? importedDivisionCount
      : minSchedulableDivisions(preview.teams.length);
    const divisions = createDivisions(divisionCount).map((division, index) => ({
      ...division,
      name: importedDivisionNames[index] || division.name,
    }));
    const divisionByName = new Map(
      divisions.map((division) => [division.name.toLowerCase(), division.id]),
    );
    const teams = preview.teams.map((team, index): Team => {
      const name = team.name.trim() || `Team ${index + 1}`;
      return {
        id: `team-${index + 1}`,
        providerId: team.providerId,
        city: team.city?.trim() || "",
        name,
        shortName: teamMonogram(team.city || "", name),
        manager: team.manager?.trim() || `Manager ${index + 1}`,
        color:
          team.color ||
          createTeams(preview.teams.length, divisions)[index].color,
        logoUrl: team.logoUrl,
        divisionId: team.division
          ? divisionByName.get(team.division.trim().toLowerCase()) ||
            divisions[index % divisionCount].id
          : divisions[index % divisionCount].id,
        overallRank: team.rank || index + 1,
        priorRegularSeasonRank: team.regularSeasonRank,
        priorPlayoffRank: team.playoffRank,
        stadium: team.stadium?.trim() || `${name} Stadium`,
      };
    });
    setSetup((current) => {
      const leagueName =
        preview.leagueName?.trim() || current.name.trim() || "Imported league";
      return {
        ...current,
        name: leagueName,
        abbreviation: leagueAcronym(leagueName),
        initials: undefined,
        color: preview.leagueColor || current.color,
        logoUrl: preview.leagueLogoUrl || current.logoUrl,
        seasonYear: preview.seasonYear || current.seasonYear,
        divisions,
        divisionPlacementMode: "manual",
        teams,
        platformConnection:
          preview.provider === "espn" || preview.provider === "sleeper"
            ? {
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
              }
            : undefined,
        priorSeason: {
          ...current.priorSeason,
          enabled: Boolean(preview.hasPriorSeasonRanks),
          hasData: Boolean(preview.hasPriorSeasonRanks),
          entryMode: preview.hasPriorSeasonRanks ? "history" : "none",
          source: preview.hasPriorSeasonRanks
            ? "regular-season"
            : current.priorSeason.source,
        },
      };
    });
    setImportSource(null);
    setActiveSavedLeagueId(null);
    setQuickStartAvailable(true);
    dismissedLogoFingerprint.current = null;
    if (preview.provider === "espn" || preview.provider === "sleeper") {
      setImportedConnectionPrompt({
        provider: preview.provider,
        providerLeagueId: preview.providerLeagueId || "",
        leagueName: preview.leagueName?.trim() || "Imported league",
      });
      setImportedConnectionError(null);
    }
    openCreatePath();
  };
  const runGenerate = () => {
    if (generating) return;
    setGuestGenerateWarning(false);
    setGenerating(true);
    setError(null);
    const generationSetup = resolveDivisionPlacement(setup);
    // Generation runs off the main thread in a Web Worker, so even the largest
    // leagues (the solver can search for up to ~25s) never freeze the UI — the
    // "Weaving schedule…" state stays live and responsive. The reveal (and its
    // skip control) only mounts once the finished schedule resolves below, so the
    // user can never skip ahead to a schedule that isn't ready yet.
    generateScheduleAsync(generationSetup)
      .then((season) => {
        // Give every guest schedule its own device-local id so a new season never
        // overwrites an earlier one. Signing in later claims it into the account.
        const localSeason = { ...season, id: createLocalSeasonId() };
        saveSeason(localSeason);
        // Keep `generating` true so the button stays locked; the reveal overlay
        // now owns the transition and routes to the workspace when it finishes.
        setRevealSeason(localSeason);
      })
      .catch((caught) => {
        setError(
          caught instanceof Error
            ? caught.message
            : "We couldn’t build this schedule yet.",
        );
        setGenerating(false);
      });
  };
  const generate = () => {
    if (generating) return;
    const missingCore =
      !setup.name.trim() ||
      setup.teams.length < 8 ||
      setup.teams.some((team) => !team.name.trim());
    if (missingCore) {
      setError(
        "Return to League and Teams to complete every required name before generating.",
      );
      return;
    }
    if (
      setup.divisionPlacementMode === "manual" &&
      setup.teams.some(
        (team) =>
          !setup.divisions.some((division) => division.id === team.divisionId),
      )
    ) {
      setError(
        "Return to Assign Teams and place every team in a division, or choose Random or Seed Draft.",
      );
      setTeamsTab("team-assignment");
      setStep(2);
      return;
    }
    const generationSetup = resolveDivisionPlacement(setup);
    const counts = generationSetup.divisions.map(
      (division) =>
        generationSetup.teams.filter((team) => team.divisionId === division.id)
          .length,
    );
    if (Math.max(...counts) - Math.min(...counts) > 1) {
      setError(
        `Return to Divisions and rebalance the team counts: ${counts.join(", ")}.`,
      );
      return;
    }
    const logoPrompt = buildSavedLeagueChangePrompt({ generateAfter: true });
    if (logoPrompt) {
      setLogoSaveError(null);
      setLogoSavePrompt(logoPrompt);
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
    if (
      !signedIn &&
      listLocalSeasons().some((season) => season.id.startsWith("local-"))
    ) {
      setGuestGenerateWarning(true);
      return;
    }
    runGenerate();
  };
  // Quick create applies the recommended setup, then lands on Review so the
  // commissioner can confirm everything before the schedule is generated.
  const reviewQuickCreate = (weeks: 13 | 14) => {
    if (generating) return;
    setSetup((current) => applyQuickCreateDefaults(current, weeks));
    advanceToStep(STEPS.length - 1);
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
  const displayStep = showCreatePath ? 1 : step;
  const quickCreateReason = quickCreateBlocker(setup);
  const quickCreateReady = quickStartAvailable && quickCreateReason == null;

  return (
    <section
      className="builder-section"
      aria-label="League schedule builder"
      ref={builderSectionRef}
    >
      <div className="page-width builder-heading-row">
        <div>
          <p className="eyebrow">Fantasy football schedule maker</p>
          <h2>Build the season your league deserves.</h2>
        </div>
        {step > 0 && (
          <button
            type="button"
            aria-live="polite"
            className={`button-secondary builder-save-draft${draftSaved ? " is-saved" : ""}`}
            onClick={saveDraft}
          >
            {draftSaved ? (
              <>
                <Check />
                Draft saved
              </>
            ) : (
              <>
                <BookmarkPlus />
                Save draft
              </>
            )}
          </button>
        )}
      </div>
      <div className="page-width wizard-progress" aria-label="Setup progress">
        <div className="wizard-progress-summary">
          <span>
            <small>
              {showCreatePath
                ? "Choose build path"
                : `Step ${displayStep + 1} of ${STEPS.length}`}
            </small>
            <strong>
              {showCreatePath ? "League next" : STEPS[displayStep].label}
            </strong>
          </span>
          <em>{setupProgress(displayStep)}% complete</em>
          <div aria-hidden="true">
            <i style={{ width: `${setupProgress(displayStep)}%` }} />
          </div>
        </div>
        <ol
          className="wizard-progress-track"
          ref={progressTrackRef}
          style={
            {
              "--wizard-progress-ratio": displayStep / (STEPS.length - 1),
              "--wizard-steps": STEPS.length,
            } as React.CSSProperties
          }
        >
          {STEPS.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                title={item.label}
                aria-current={index === displayStep ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${item.label}${index < displayStep ? ", complete" : index === displayStep ? ", current" : ", upcoming"}`}
                disabled={index > displayStep}
                className={
                  index === displayStep
                    ? "active"
                    : index < displayStep
                      ? "complete"
                      : ""
                }
                onClick={() => {
                  setError(null);
                  if (showCreatePath && index === 0) {
                    setShowCreatePath(false);
                    setStep(0);
                    return;
                  }
                  if (showCreatePath && index === 1) {
                    customizeEverything();
                    return;
                  }
                  setShowCreatePath(false);
                  setStep(index);
                }}
              >
                <span>{index < displayStep ? <Check /> : index + 1}</span>
                <em>
                  <b>{item.label}</b>
                  <small>{item.shortLabel}</small>
                </em>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="page-width builder-layout">
        <div className="builder-tool">
          <p className="sr-only" aria-live="polite">
            {showCreatePath
              ? "Choose how to build this season. League is the next tracked step."
              : `Step ${displayStep + 1} of ${STEPS.length}: ${STEPS[displayStep].label}`}
          </p>
          <div
            className="builder-content"
            ref={builderContentRef}
            tabIndex={-1}
          >
            {showCreatePath && (
              <CreatePathStep
                setup={setup}
                mode={createPathMode}
                weeks={createPathWeeks}
                quickCreateReady={quickCreateReady}
                quickCreateReason={
                  quickCreateReason ?? "Quick Create is ready for this league."
                }
                onModeChange={setCreatePathMode}
                onWeeksChange={setCreatePathWeeks}
              />
            )}
            {!showCreatePath && step === 0 && (
              <SourceStep
                presets={savedLeagues}
                onManual={startManual}
                onChooseSaved={() => setSavedPickerOpen(true)}
                onImport={(source) => setImportSource(source)}
              />
            )}
            {!showCreatePath && step === 1 && (
              <LeagueStep
                setup={setup}
                setSetup={setSetup}
                presets={savedLeagues}
                loadedPreset={loadedPreset}
                onStartFresh={startNewLeague}
                onLeagueLogoUploaded={suggestAvatarFromLogo}
              />
            )}
            {step === 2 && (
              <TeamsDivisionsStep
                setup={setup}
                setSetup={setSetup}
                showErrors={showFieldErrors}
                activeTab={teamsTab}
                onTab={setTeamsTab}
                savedCount={savedLeagues.length}
                onChooseSaved={() => setSavedPickerOpen(true)}
                onImport={(source) => setImportSource(source)}
              />
            )}
            {step === 3 && (
              <SeasonRulesStep
                setup={setup}
                setSetup={setSetup}
                activeTab={seasonTab}
                onTab={setSeasonTab}
              />
            )}
            {step === 4 && <PlayoffsStep setup={setup} setSetup={setSetup} />}
            {step === 5 && <ReviewStep setup={setup} />}
          </div>
          {error && (
            <div className="builder-error" role="alert">
              <CircleAlert />
              {error}
            </div>
          )}
          {step > 0 && (
            <div className="builder-actions">
              <BuilderActionButtons
                step={displayStep}
                createPath={showCreatePath}
                createPathMode={createPathMode}
                quickCreateReady={quickCreateReady}
                generating={generating}
                skipDraftRankForNow={skipDraftRankForNow}
                back={back}
                next={next}
                generate={generate}
              />
            </div>
          )}
        </div>
        <LivePreview setup={setup} step={displayStep} />
      </div>
      <BuilderBlueprintBar
        setup={setup}
        step={displayStep}
        open={blueprintOpen}
        onToggle={() => setBlueprintOpen((current) => !current)}
        actions={{
          step: displayStep,
          createPath: showCreatePath,
          createPathMode,
          quickCreateReady,
          generating,
          skipDraftRankForNow,
          back,
          next,
          generate,
        }}
      />
      {importSource && (
        <ImportLeagueModal
          source={importSource}
          setup={setup}
          onClose={() => setImportSource(null)}
          onConfirm={applyImport}
        />
      )}
      {savedPickerOpen && (
        <SavedLeaguePicker
          presets={savedLeagues}
          onChoose={(chosen) => {
            setSavedPickerOpen(false);
            quickImportSavedLeague(chosen);
          }}
          onClose={() => setSavedPickerOpen(false)}
        />
      )}
      {connectedSavedLeaguePrompt && (
        <ConfirmDialog
          markClassName="provider-app-icon"
          mark={
            connectedSavedLeaguePrompt.data.platformConnection?.provider ===
            "espn" ? (
              <img src="/providers/espn.png" alt="" />
            ) : (
              <img src="/providers/sleeper.png" alt="" />
            )
          }
          kicker={connectedLabel(connectedSavedLeaguePrompt)?.toUpperCase()}
          title="Use connected league data?"
          labelId="connected-saved-league-title"
          descriptionId="connected-saved-league-description"
          closeLabel="Close connected saved league choice"
          onClose={() => setConnectedSavedLeaguePrompt(null)}
          actions={[
            {
              label: "Roster only",
              onClick: () =>
                applySavedLeaguePreset(connectedSavedLeaguePrompt, false),
              variant: "secondary",
              autoFocus: true,
            },
            {
              label: "Use saved connection",
              onClick: () =>
                applySavedLeaguePreset(connectedSavedLeaguePrompt, true),
              variant: "primary",
              icon: <RefreshCw />,
            },
          ]}
        >
          <strong>{connectedSavedLeaguePrompt.name}</strong>
          <p id="connected-saved-league-description">
            This saved league includes{" "}
            {connectedSavedLeaguePrompt.data.platformConnection?.provider ===
            "espn"
              ? "ESPN"
              : "Sleeper"}{" "}
            League{" "}
            {
              connectedSavedLeaguePrompt.data.platformConnection
                ?.providerLeagueId
            }
            . You can keep that connection for score refresh later, or load only
            the teams and divisions.
          </p>
          <small>
            LeagueWeaver still generates the schedule here. It will not update
            ESPN or Sleeper for you.
          </small>
        </ConfirmDialog>
      )}
      {importedConnectionPrompt && (
        <ConfirmDialog
          markClassName="provider-app-icon"
          mark={
            <img
              src={`/providers/${importedConnectionPrompt.provider}.png`}
              alt=""
            />
          }
          kicker={`${providerName(importedConnectionPrompt.provider)} connected`.toUpperCase()}
          title={
            signedIn
              ? "Use connected league data?"
              : "Create account to use connected league data?"
          }
          labelId="imported-connection-title"
          descriptionId="imported-connection-description"
          closeLabel="Close imported connection choice"
          busy={importedConnectionBusy}
          onClose={continueImportedRosterOnly}
          actions={[
            {
              label: "Roster only",
              onClick: continueImportedRosterOnly,
              variant: "secondary",
              autoFocus: true,
              disabled: importedConnectionBusy,
            },
            {
              label: importedConnectionBusy
                ? "Saving…"
                : signedIn
                  ? "Use & save connection"
                  : "Create free account",
              onClick: () => void saveImportedConnection(),
              variant: "primary",
              icon: signedIn ? <RefreshCw /> : <LogIn />,
              disabled: importedConnectionBusy,
            },
          ]}
        >
          <strong>{importedConnectionPrompt.leagueName}</strong>
          <p id="imported-connection-description">
            {signedIn
              ? `This import includes ${providerName(importedConnectionPrompt.provider)} League ${importedConnectionPrompt.providerLeagueId}. You can save the league with this connection for score refresh later, or load only the teams and divisions.`
              : `This import includes ${providerName(importedConnectionPrompt.provider)} League ${importedConnectionPrompt.providerLeagueId}. Guests can load the roster only. Create a free account to keep this connection for score refresh later.`}
          </p>
          <small>
            League Weaver still cannot update ESPN or Sleeper schedules for you.
          </small>
          {importedConnectionError && (
            <span className="league-logo-save-error" role="alert">
              {importedConnectionError}
            </span>
          )}
        </ConfirmDialog>
      )}
      {logoSavePrompt && (
        <ConfirmDialog
          icon={
            logoSavePrompt.mode === "new" ? <BookmarkPlus /> : <ImagePlus />
          }
          kicker={
            logoSavePrompt.mode === "new"
              ? "STRUCTURE CHANGED"
              : "SAVED LEAGUE CHANGES"
          }
          title={
            logoSavePrompt.mode === "new"
              ? "Save as a new saved league?"
              : `Update ${logoSavePrompt.presetName}?`
          }
          labelId="league-logo-save-title"
          descriptionId="league-logo-save-description"
          closeLabel="Close saved league recommendation"
          busy={logoSaveBusy}
          onClose={() => setLogoSavePrompt(null)}
          actions={[
            {
              label: "Not now",
              onClick: skipPromptLogoSave,
              variant: "secondary",
              autoFocus: true,
            },
            signedIn
              ? {
                  label: logoSaveBusy
                    ? "Saving…"
                    : logoSavePrompt.mode === "new"
                      ? "Save as new league"
                      : "Update saved league",
                  onClick: () => void savePromptLogos(),
                  variant: "primary",
                  icon: <BookmarkPlus />,
                }
              : {
                  label: "Sign in to save",
                  onClick: () => openSignIn(),
                  variant: "primary",
                  icon: <LogIn />,
                },
          ]}
        >
          <strong>{logoSavePrompt.summary}</strong>
          <p id="league-logo-save-description">
            {logoSavePrompt.mode === "new"
              ? `This started from ${logoSavePrompt.presetName}, but the structure changed. Create a new saved league so older schedules that use the original saved league stay clean.`
              : "Save these league, division, team, conference, and playoff branding updates to the saved league so they are ready next season."}
          </p>
          <small>
            {logoSavePrompt.mode === "new"
              ? "New saved league keeps this build reusable without overwriting the original league shape."
              : "This is safe because team count, division count, conferences, assignments, and seed structure did not change."}
          </small>
          {logoSaveError && (
            <span className="league-logo-save-error" role="alert">
              {logoSaveError}
            </span>
          )}
        </ConfirmDialog>
      )}
      {guestGenerateWarning && (
        <ConfirmDialog
          icon={<ShieldCheck />}
          kicker="KEEP YOUR SCHEDULES SAFE"
          title="Save your schedules to an account?"
          labelId="guest-generate-title"
          descriptionId="guest-generate-description"
          closeLabel="Close save reminder"
          onClose={() => setGuestGenerateWarning(false)}
          actions={[
            {
              label: "Continue as guest",
              onClick: runGenerate,
              variant: "secondary",
              autoFocus: true,
            },
            {
              label: "Create free account",
              onClick: () => {
                setGuestGenerateWarning(false);
                openSignIn("signup");
              },
              variant: "primary",
              icon: <LogIn />,
            },
          ]}
        >
          <p id="guest-generate-description">
            Your schedules are saved on this device only. Create a free account
            and they will be safe — plus you can open them on any device. You
            can keep going as a guest; nothing you have already made will be
            deleted.
          </p>
        </ConfirmDialog>
      )}
      {saveLeaguePrompt && (
        <ConfirmDialog
          icon={<BookmarkPlus />}
          kicker="BEFORE YOU GO"
          title="Save this league for next season?"
          labelId="save-league-title"
          descriptionId="save-league-description"
          closeLabel="Close save reminder"
          busy={saveLeaguePromptBusy}
          onClose={dismissSavePrompt}
          actions={[
            {
              label: "Not now",
              onClick: dismissSavePrompt,
              variant: "secondary",
              autoFocus: true,
            },
            {
              label: saveLeaguePromptBusy ? "Saving…" : "Save league",
              onClick: () => void acceptSavePrompt(),
              variant: "primary",
              icon: <BookmarkPlus />,
            },
          ]}
        >
          <p id="save-league-description">
            We’ll remember your teams, divisions, colors, and logos — so next
            year you skip straight to Season. You can edit or delete it any time
            from your account.
          </p>
        </ConfirmDialog>
      )}
      {revealSeason && (
        <GenerationReveal
          schedule={revealSeason}
          onComplete={() =>
            router.push(
              `/season/${revealSeason.id}${revealSeason.setup.platformConnection || revealSeason.setup.teams.some((team) => team.providerId && !/^(manual|screenshot)-/.test(team.providerId)) ? "" : "?connect=scores"}`,
            )
          }
        />
      )}
      {avatarNudge && (
        <div className="avatar-nudge" role="status">
          <span className="avatar-nudge-thumb">
            <img src={avatarNudge} alt="" />
          </span>
          <div className="avatar-nudge-copy">
            <strong>
              {avatarNudgeState === "saved"
                ? "Set as your profile image"
                : "Use this as your profile image?"}
            </strong>
            <small>
              {avatarNudgeState === "saved"
                ? "Your league logo now shows on your commissioner account."
                : "Show your league logo as your commissioner avatar."}
            </small>
          </div>
          {avatarNudgeState !== "saved" && (
            <div className="avatar-nudge-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={dismissAvatarNudge}
              >
                Not now
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={avatarNudgeState === "saving"}
                onClick={() => void acceptAvatarNudge()}
              >
                {avatarNudgeState === "saving" ? (
                  <>
                    <span className="spinner" />
                    Saving…
                  </>
                ) : (
                  "Use photo"
                )}
              </button>
            </div>
          )}
          <button
            type="button"
            className="avatar-nudge-close"
            aria-label="Dismiss suggestion"
            onClick={dismissAvatarNudge}
          >
            <X />
          </button>
        </div>
      )}
    </section>
  );
}
