/**
 * NON-PRODUCTION QA fixtures only.
 *
 * Public ESPN and Sleeper leagues used for LeagueWeaver import QA, schedule
 * sync QA, roster-shape QA, and weekly player-scoring QA. These are public
 * leagues found on the open internet, not a permanent contract — the owning
 * commissioner can go private or delete the league at any time. Revalidate
 * with `npm run test:fixtures` (and `npm run test:fixtures:limit` for the
 * high-scale group) before leaning on these in automated CI.
 *
 * Full write-up, sources, and rejected candidates: docs/QA-public-league-fixtures.md
 */

export type FixtureProvider = "espn" | "sleeper";
export type FixtureSeason = 2023 | 2024 | 2025 | 2026;

export interface EspnSeasonShape {
  season: FixtureSeason;
  /** Documented team count at validation time. */
  teams: number;
  /** Documented `schedule` array length. */
  scheduleCount: number | null;
  /** Documented total roster entries across all teams. */
  rosterEntries: number;
  /** Set when zero roster entries is the *expected* (documented) state for this season. */
  allowEmptyRoster?: boolean;
}

export interface EspnFixture {
  provider: "espn";
  externalLeagueId: string;
  name: string;
  seasons: EspnSeasonShape[];
  /** Raw ESPN roster slot labels documented for this league (not exhaustive per-season). */
  slotLabels?: string[];
  /** Raw numeric ESPN lineupSlotId -> label, where explicitly documented (e.g. HC = 19). */
  slotIds?: Record<string, string>;
  lastValidatedAt: string;
  notes?: string;
}

export interface SleeperSeasonShape {
  season: number;
  leagueId: string;
  /** Documented team/roster count at validation time. */
  teams: number;
  /** Documented `status` value ("complete", "in_season", "pre_draft", ...). */
  expectedStatus: string;
  /** Set false when this season is not expected to have matchups yet (e.g. pre_draft). */
  expectMatchups?: boolean;
}

export interface SleeperFixture {
  provider: "sleeper";
  /** Entry-point league ID — the most recent season in `seasons`. */
  externalLeagueId: string;
  name: string;
  /** Chain of seasons, oldest first. Walk `previous_league_id` backward from the newest. */
  seasons: SleeperSeasonShape[];
  /** Documented `roster_positions` shape (Sleeper truncates deep benches with "..."). */
  rosterPositions?: string;
  /** True when week-1 `players_points` is documented as unreliable/empty for this fixture. */
  weekOnePlayerPointsUnreliable?: boolean;
  lastValidatedAt: string;
  notes?: string;
}

export type PublicLeagueFixture = EspnFixture | SleeperFixture;

const VALIDATED = "2026-08-01";

// ---------------------------------------------------------------------------
// Normalized slot label lookup (ESPN raw label -> LeagueWeaver normalized
// value), per docs/QA-public-league-fixtures.md > "Normalized Values Layer".
// This is reference metadata for the seed only; the full normalized-values
// import layer is a separate follow-up.
// ---------------------------------------------------------------------------
export const ESPN_NORMALIZED_SLOT_LABELS: Record<string, string> = {
  "QB": "QUARTERBACK",
  "RB": "RUNNING_BACK",
  "WR": "WIDE_RECEIVER",
  "TE": "TIGHT_END",
  "K": "KICKER",
  "D/ST": "TEAM_DEFENSE",
  "HC": "HEAD_COACH",
  "FLEX": "FLEX_STANDARD",
  "OP": "SUPER_FLEX",
  "DL": "DEFENSIVE_LINE",
  "LB": "LINEBACKER",
  "DB": "DEFENSIVE_BACK",
  "DP": "DEFENSIVE_PLAYER",
  "Bench": "BENCH",
  "IR": "INJURED_RESERVE",
};

// ---------------------------------------------------------------------------
// 10 ESPN public league IDs (stable leagueId across seasons).
// ---------------------------------------------------------------------------
export const ESPN_FIXTURES: EspnFixture[] = [
  {
    provider: "espn",
    externalLeagueId: "42654852",
    name: "FFLR Test League",
    seasons: [
      { season: 2023, teams: 4, scheduleCount: 34, rosterEntries: 64 },
      { season: 2024, teams: 4, scheduleCount: 34, rosterEntries: 64 },
      { season: 2025, teams: 4, scheduleCount: 34, rosterEntries: 64 },
    ],
    slotLabels: ["QB", "RB", "WR", "TE", "D/ST", "K", "FLEX", "Bench", "IR"],
    lastValidatedAt: VALIDATED,
    notes: "Small stable fixture; fast import smoke test.",
  },
  {
    provider: "espn",
    externalLeagueId: "1127533051",
    name: "JamisonVirtualSquads-NFLRock",
    seasons: [
      { season: 2023, teams: 10, scheduleCount: 86, rosterEntries: 363 },
      { season: 2024, teams: 10, scheduleCount: 86, rosterEntries: 364 },
      { season: 2025, teams: 10, scheduleCount: 86, rosterEntries: 364 },
    ],
    slotLabels: ["RB/WR", "OP", "LB", "DL", "DB", "DP", "K", "Bench", "IR"],
    lastValidatedAt: VALIDATED,
    notes: "Large roster, IDP slots, offensive player slot, many bench/IR spots.",
  },
  {
    provider: "espn",
    externalLeagueId: "620064817",
    name: "Jamison/Jamieson Blu crew variants",
    seasons: [
      { season: 2023, teams: 10, scheduleCount: 86, rosterEntries: 360 },
      { season: 2024, teams: 10, scheduleCount: 86, rosterEntries: 362 },
      { season: 2025, teams: 10, scheduleCount: 86, rosterEntries: 370 },
    ],
    slotLabels: ["RB/WR", "OP", "LB", "DL", "DB", "DP", "K", "Bench", "IR"],
    lastValidatedAt: VALIDATED,
    notes: "Similar IDP-heavy setup with changing league display names.",
  },
  {
    provider: "espn",
    externalLeagueId: "1305",
    name: "All-Star League",
    seasons: [
      { season: 2023, teams: 12, scheduleCount: 103, rosterEntries: 330 },
      { season: 2024, teams: 12, scheduleCount: 103, rosterEntries: 322 },
      { season: 2025, teams: 12, scheduleCount: 103, rosterEntries: 334 },
    ],
    slotLabels: ["OP", "FLEX"],
    lastValidatedAt: VALIDATED,
    notes: "Superflex/OP-style roster without normal K/DST slots.",
  },
  {
    provider: "espn",
    externalLeagueId: "16525",
    name: "Tyler Perry's League Schmuck",
    seasons: [
      { season: 2023, teams: 12, scheduleCount: 103, rosterEntries: 186 },
      { season: 2024, teams: 12, scheduleCount: 103, rosterEntries: 193 },
      { season: 2025, teams: 12, scheduleCount: 103, rosterEntries: 201 },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Roster settings changed between seasons: 2023 had D/ST + one FLEX; 2024/2025 had two FLEX and no D/ST in the active slot map.",
  },
  {
    provider: "espn",
    externalLeagueId: "40849",
    name: "CHFFL",
    seasons: [
      { season: 2023, teams: 12, scheduleCount: 103, rosterEntries: 196 },
      { season: 2024, teams: 12, scheduleCount: 84, rosterEntries: 196 },
      { season: 2025, teams: 12, scheduleCount: 84, rosterEntries: 196 },
    ],
    slotLabels: ["QB", "RB", "WR", "TE", "D/ST", "K", "FLEX"],
    lastValidatedAt: VALIDATED,
    notes: "Schedule size changed from 103 to 84 while league stayed public.",
  },
  {
    provider: "espn",
    externalLeagueId: "957075",
    name: "Strip Sack Siege - IDP Superflex",
    seasons: [
      { season: 2023, teams: 16, scheduleCount: 139, rosterEntries: 676 },
      { season: 2024, teams: 14, scheduleCount: 122, rosterEntries: 586 },
      { season: 2025, teams: 12, scheduleCount: 105, rosterEntries: 524 },
    ],
    slotLabels: ["OP", "LB", "DL", "DB", "DP", "FLEX", "FLEX"],
    lastValidatedAt: VALIDATED,
    notes: "Best ESPN stress fixture: team count changes, IDP, Superflex/OP, very large rosters.",
  },
  {
    provider: "espn",
    externalLeagueId: "11593953",
    name: "Prodigies vs Esteemed FFL",
    seasons: [
      { season: 2023, teams: 8, scheduleCount: 69, rosterEntries: 166 },
      { season: 2024, teams: 10, scheduleCount: 86, rosterEntries: 177 },
      { season: 2025, teams: 10, scheduleCount: 86, rosterEntries: 183 },
    ],
    slotLabels: ["HC", "K", "D/ST", "FLEX"],
    slotIds: { "19": "HC" },
    lastValidatedAt: VALIDATED,
    notes: "Rare ESPN Head Coach fixture; slot 19 is present as HC.",
  },
  {
    provider: "espn",
    externalLeagueId: "53072",
    name: "The Pigskin Kings",
    seasons: [
      { season: 2023, teams: 12, scheduleCount: 109, rosterEntries: 190 },
      { season: 2024, teams: 12, scheduleCount: 109, rosterEntries: 193 },
      { season: 2025, teams: 12, scheduleCount: 109, rosterEntries: 191 },
    ],
    slotLabels: ["QB", "RB", "WR", "TE", "D/ST", "K"],
    lastValidatedAt: VALIDATED,
    notes: "Standard-ish league with K/DST and no flex slot.",
  },
  {
    provider: "espn",
    externalLeagueId: "520992816",
    name: "My 2023/2024/2025 League",
    seasons: [
      { season: 2023, teams: 12, scheduleCount: 103, rosterEntries: 197 },
      { season: 2024, teams: 12, scheduleCount: 103, rosterEntries: 200 },
      { season: 2025, teams: 12, scheduleCount: 103, rosterEntries: 203 },
    ],
    slotLabels: ["RB", "WR", "WR", "FLEX", "FLEX", "K", "D/ST", "IR"],
    lastValidatedAt: VALIDATED,
    notes: "Public league with confirmed history and changing season names.",
  },
];

// ---------------------------------------------------------------------------
// 10 Sleeper public league chains (new league_id each season; entry point is
// the 2025 ID, walk backward through previous_league_id for 2024 and 2023).
// ---------------------------------------------------------------------------
export const SLEEPER_FIXTURES: SleeperFixture[] = [
  {
    provider: "sleeper",
    externalLeagueId: "1180985894268776448",
    name: "The Dynasty IDP",
    seasons: [
      { season: 2023, leagueId: "929477896622698496", teams: 14, expectedStatus: "complete" },
      { season: 2024, leagueId: "1049003802214518784", teams: 14, expectedStatus: "complete" },
      { season: 2025, leagueId: "1180985894268776448", teams: 14, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Strong IDP fixture with DL/LB/DB slots and deep benches. Links back beyond 2023.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1257478892810162176",
    name: "Best Ballssss",
    seasons: [
      { season: 2023, leagueId: "965839099934384128", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1124824107297280000", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1257478892810162176", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Best ball + Superflex style fixture.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1256776172377739264",
    name: "Game of Inches",
    seasons: [
      { season: 2023, leagueId: "986498514869874688", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1065845090503020544", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1256776172377739264", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Three FLEX slots; useful for flex handling.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1208532804833378304",
    name: "Dynasty for Experts - 12",
    seasons: [
      { season: 2023, leagueId: "922133357666856960", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1053106166944894976", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1208532804833378304", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Multiple FLEX plus Superflex; stable 12-team dynasty chain.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1199526163391713280",
    name: "The League",
    seasons: [
      { season: 2023, leagueId: "983487036449406976", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1048344076036259840", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1199526163391713280", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Similar multi-flex/Superflex setup; good duplicate-shape regression fixture.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1183056458424250368",
    name: "Real Dynasty SF League",
    seasons: [
      { season: 2023, leagueId: "928050220875829248", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1051924735317176320", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1183056458424250368", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Superflex dynasty with larger bench.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1221298010177146880",
    name: "The East Coast Roast",
    seasons: [
      { season: 2023, leagueId: "982311375378657280", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1124839895194402816", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1221298010177146880", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "More standard Sleeper redraft-style roster with DEF and no K.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1257451451014201344",
    name: "La Gut Forever",
    seasons: [
      { season: 2023, leagueId: "938576485823107072", teams: 10, expectedStatus: "complete" },
      { season: 2024, leagueId: "1078780479580540928", teams: 10, expectedStatus: "complete" },
      { season: 2025, leagueId: "1257451451014201344", teams: 8, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Team count changes plus K, DEF, DL, LB, DB. The doc's source table lists team counts in "
      + "2025->2024->2023 column order (8 -> 10 -> 10); mapped here to 2023=10, 2024=10, 2025=8. "
      + "Team-count checks are informational (DRIFT), not a hard fail, so a wrong direction here does not break the run.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1250504712831123456",
    name: "FTA #6 House of Pain",
    seasons: [
      { season: 2023, leagueId: "981673630453030912", teams: 14, expectedStatus: "complete" },
      { season: 2024, leagueId: "1114647006913351680", teams: 14, expectedStatus: "complete" },
      { season: 2025, leagueId: "1250504712831123456", teams: 14, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "14-team standard-ish fixture with K/DEF.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1256617584954978304",
    name: "Northern Indiana",
    seasons: [
      { season: 2023, leagueId: "993251309690109952", teams: 12, expectedStatus: "complete" },
      { season: 2024, leagueId: "1116235333244407808", teams: 12, expectedStatus: "complete" },
      { season: 2025, leagueId: "1256617584954978304", teams: 12, expectedStatus: "complete" },
    ],
    lastValidatedAt: VALIDATED,
    notes: "Compact bench, two FLEX, DEF, no K.",
  },
];

export const PUBLIC_LEAGUE_FIXTURES: PublicLeagueFixture[] = [...ESPN_FIXTURES, ...SLEEPER_FIXTURES];

// ---------------------------------------------------------------------------
// High-scale / limit-testing fixtures. Kept in a SEPARATE group so normal
// import QA runs (`npm run test:fixtures`) stay fast; run these explicitly
// with `npm run test:fixtures:limit`.
// ---------------------------------------------------------------------------
export const ESPN_LIMIT_FIXTURES: EspnFixture[] = [
  {
    provider: "espn",
    externalLeagueId: "1368762714",
    name: "20-team public ESPN league",
    seasons: [
      { season: 2025, teams: 20, scheduleCount: 160, rosterEntries: 322 },
      { season: 2026, teams: 20, scheduleCount: null, rosterEntries: 0, allowEmptyRoster: true },
    ],
    slotLabels: ["QB", "RB", "RB", "WR", "WR", "TE", "D/ST", "K", "FLEX", "Bench", "IR"],
    lastValidatedAt: VALIDATED,
    notes: "Best ESPN 20-team fixture found. 2026 was public with zero roster entries at validation "
      + "time — treat as schedule/settings only until rosters populate.",
  },
  {
    provider: "espn",
    externalLeagueId: "957075",
    name: "Strip Sack Siege - IDP Superflex (2023, 16-team stress shape)",
    seasons: [{ season: 2023, teams: 16, scheduleCount: 139, rosterEntries: 676 }],
    slotLabels: ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "OP", "FLEX", "FLEX", "DL", "DL", "DL", "LB", "LB", "LB", "DB", "DB", "DB", "DP", "DP", "Bench", "IR"],
    lastValidatedAt: VALIDATED,
    notes: "Same league as the 2023-2025 chain in the main 10; kept here because 2023 is the "
      + "16-team stress shape referenced by the recommended high-scale QA path.",
  },
];

export const SLEEPER_LIMIT_FIXTURES: SleeperFixture[] = [
  {
    provider: "sleeper",
    externalLeagueId: "1346973753954820096",
    name: "32-team score-import stress fixture (2026)",
    seasons: [{ season: 2026, leagueId: "1346973753954820096", teams: 32, expectedStatus: "in_season" }],
    rosterPositions: "QB/RB/WR/WR/TE/FLEX/K/IDP_FLEX/IDP_FLEX/IDP_FLEX/BN...",
    lastValidatedAt: VALIDATED,
    notes: "Best current 32-team Sleeper stress fixture. Includes IDP_FLEX, K, and deep benches.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1126896305147629568",
    name: "32-team score-import stress fixture (2024, complete)",
    seasons: [{ season: 2024, leagueId: "1126896305147629568", teams: 32, expectedStatus: "complete" }],
    rosterPositions: "RB/WR/TE/FLEX/FLEX/SUPER_FLEX/BN...",
    lastValidatedAt: VALIDATED,
    notes: "Compact 32-team completed fixture with SUPER_FLEX; good for per-player score import and performance tests.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1103082281528369152",
    name: "32-team dynasty stress fixture (2024)",
    seasons: [{ season: 2024, leagueId: "1103082281528369152", teams: 32, expectedStatus: "complete" }],
    rosterPositions: "RB/WR/WR/FLEX/FLEX/SUPER_FLEX/BN...",
    lastValidatedAt: VALIDATED,
    notes: "32-team dynasty fixture with SUPER_FLEX and multiple flex slots.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "923716894677458944",
    name: "32-team player-score stress fixture (2023)",
    seasons: [{ season: 2023, leagueId: "923716894677458944", teams: 32, expectedStatus: "complete" }],
    rosterPositions: "RB/WR/WR/TE/FLEX/SUPER_FLEX/IDP_FLEX/IDP_FLEX/IDP_FLEX/BN...",
    lastValidatedAt: VALIDATED,
    notes: "32-team completed fixture with SUPER_FLEX and IDP_FLEX; good 2023 player-score stress test.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1017257785409134592",
    name: "Largest roster-shape stress fixture (2023)",
    seasons: [{ season: 2023, leagueId: "1017257785409134592", teams: 32, expectedStatus: "complete" }],
    rosterPositions: "QB/RB/RB/WR/WR/WR/TE/TE/FLEX/FLEX/FLEX/K/DL/DL/LB/LB/DB/DB/IDP_FLEX/IDP_FLEX/IDP_FLEX/BN...",
    weekOnePlayerPointsUnreliable: true,
    lastValidatedAt: VALIDATED,
    notes: "Largest roster-shape fixture found: offense, K, DL/LB/DB, three IDP_FLEX, and very deep "
      + "bench. Week 1/2 did not return player points at validation time — use week 8 or later for score QA.",
  },
  {
    provider: "sleeper",
    externalLeagueId: "1381132434342416384",
    name: "Future 32-team roster-template fixture (2026, pre-draft)",
    seasons: [{ season: 2026, leagueId: "1381132434342416384", teams: 32, expectedStatus: "pre_draft", expectMatchups: false }],
    rosterPositions: "FLEX/FLEX/FLEX/FLEX/SUPER_FLEX/DL/LB/DB/IDP_FLEX/IDP_FLEX/BN...",
    lastValidatedAt: VALIDATED,
    notes: "Good for importer settings/roster-template QA only — no matchups or player points yet.",
  },
];

export const LIMIT_FIXTURES: PublicLeagueFixture[] = [...ESPN_LIMIT_FIXTURES, ...SLEEPER_LIMIT_FIXTURES];
