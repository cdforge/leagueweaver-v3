"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Maximize2, ShieldCheck, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  BracketConnectorLayer,
  type BracketConnection,
} from "@/components/season/BracketConnectorLayer";
import { accessibleAccentColor, readableTextColor } from "@/lib/colorContrast";
import { conferenceAcronym } from "@/lib/monograms";
import { hasConferences } from "@/lib/conferences";
import {
  projectConsolationBracket,
  projectPlacementChart,
} from "@/lib/consolation";
import {
  getPlayoffByeCount,
  getPlayoffGameBrandingSlots,
  getPlayoffRoundNames,
  isPlayoffPlacementUsable,
  normalizePlayoffSettings,
} from "@/lib/playoffs";
import type {
  Conference,
  Division,
  GeneratedSchedule,
  LeagueSetupInput,
} from "@/lib/types";

export type PlayoffPreviewTab =
  "championship" | "consolation" | "full" | "placement" | "draft";

function conferenceDisplayInitials(conference: Conference) {
  return (conference.initials?.trim() || conferenceAcronym(conference.name))
    .slice(0, 4)
    .toUpperCase();
}

export function PlayoffLivePreview({
  setup,
  className,
}: {
  setup: LeagueSetupInput;
  className?: string;
}) {
  const [previewView, setPreviewView] =
    useState<PlayoffPreviewTab>("championship");
  const [bracketExpanded, setBracketExpanded] = useState(false);
  const divisionCount = setup.divisions.length;
  const normalized = normalizePlayoffSettings(
    setup.playoffs,
    setup.teams.length,
    setup.color,
    setup.weeks,
  );
  const p = {
    ...normalized,
    placementMode:
      normalized.placementMode === "auto"
        ? isPlayoffPlacementUsable("division-halves", divisionCount, normalized.fieldSize)
          ? "division-halves"
          : isPlayoffPlacementUsable("division-leaders", divisionCount, normalized.fieldSize)
            ? "division-leaders"
            : "overall"
        : normalized.placementMode,
  };
  const roundNames = getPlayoffRoundNames(normalized, divisionCount);
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
  const halvesUsable = isPlayoffPlacementUsable(
    "division-halves",
    divisionCount,
    p.fieldSize,
  );
  const byeCount = getPlayoffByeCount(p.fieldSize);
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
          } as CSSProperties
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
              } as CSSProperties
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
    ): CSSProperties | undefined => {
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
    ): CSSProperties | undefined => {
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
          "--ppw-full-divider-top": `${-18 + fullChampRows * 94}px`,
          "--ppw-elim-divider-top": `${82 + (fullChampRows + fullConsoRows) * 94}px`,
        } as CSSProperties)
      : isConsolationBracket
        ? ({
            "--ppw-elim-divider-top": `${150 + consoRowsForDivider * 94}px`,
          } as CSSProperties)
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
              } as CSSProperties
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
                        } as CSSProperties
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
  const legendMark = (color: string, logoUrl: string | undefined, initials: string) =>
    logoUrl ? (
      <img className="ppw-slogo" src={logoUrl} alt="" />
    ) : (
      <b
        className="ppw-dchip"
        style={{ background: color, color: readableTextColor(color) } as CSSProperties}
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
      <b className="ppw-dchip" style={{ background: WILDCARD_COLOR, color: "#fff" }}>
        #
      </b>
      <span className="ppw-legend-name">Wild card</span>
    </span>
  );
  const legendLeader = (
    <span className="ppw-legend-item is-leader">
      <ShieldCheck className="ppw-legend-glyph" aria-hidden="true" />
      <span className="ppw-legend-name">Division leader</span>
    </span>
  );
  const showsLeaders = legendMode === "halves-conf" || legendMode === "divisions";
  const previewLegend =
    legendMode === "hidden" ? null : (
      <div className="ppw-legend" aria-label="Bracket legend">
        {legendMode === "halves-conf" &&
          setup.conferences!.map((conference, hi) => (
            <div
              key={conference.id}
              className="ppw-legend-group"
              style={{ "--legend-accent": conference.color } as CSSProperties}
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
    key: PlayoffPreviewTab;
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
    tabsClassName = "ppw-preview-toggle",
    label = "Preview view",
  ) => (
    <div className={tabsClassName} role="tablist" aria-label={label}>
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
      <aside
        className={["playoff-wizard-preview", className]
          .filter(Boolean)
          .join(" ")}
        aria-label="Live bracket preview"
      >
        <div className="ppw-preview-head">
          <span className="ppw-preview-eyebrow">Live preview</span>
          {previewLegend}
        </div>
        {(consolationAvailable || placementChart.length > 0) &&
          renderPreviewTabs()}
        <div className="ppw-preview-title-row">
          <span>
            <strong className="ppw-preview-title">{previewTitle}</strong>
            <small className="ppw-preview-sub">{previewSubtitle}</small>
          </span>
          {canExpandBracket && (
            <button
              type="button"
              className="ppw-expand-preview"
              aria-label="Open expanded tournament bracket"
              onClick={() => setBracketExpanded(true)}
            >
              <Maximize2 aria-hidden="true" />
            </button>
          )}
        </div>
        {renderPreviewBody()}
        <div className="ppw-facts">
          <span className="ppw-fact">
            🏟{" "}
            <b>
              {p.championshipVenueMode === "neutral-site"
                ? "Neutral site"
                : "Higher seed hosts"}
            </b>
          </span>
          <span className="ppw-fact">
            🔀{" "}
            <b>
              {p.reseedMode === "each-round"
                ? "Reseed each round"
                : p.reseedMode === "protected"
                  ? "Protected"
                  : "Fixed bracket"}
            </b>
          </span>
          <span className="ppw-fact">
            🧾{" "}
            <b>
              {normalized.draftOrderMode === "reverse-standings"
                ? "Reverse draft"
                : "Reward draft"}
            </b>
          </span>
          {byeCount > 0 && (
            <span className="ppw-fact">
              🎫{" "}
              <b>
                {byeCount} bye{byeCount === 1 ? "" : "s"}
              </b>
            </span>
          )}
        </div>
      </aside>
      {bracketExpanded && (
        <Modal
          className="bracket-expand-modal"
          label="Expanded tournament bracket"
          onClose={() => setBracketExpanded(false)}
        >
          <header>
            <span>
              <small>Tournament bracket</small>
              <h2>{previewTitle}</h2>
              <p>{previewSubtitle}</p>
            </span>
            <button
              type="button"
              aria-label="Close expanded bracket"
              onClick={() => setBracketExpanded(false)}
            >
              <X aria-hidden="true" />
            </button>
          </header>
          {(consolationAvailable || placementChart.length > 0) &&
            renderPreviewTabs(
              "ppw-preview-toggle bracket-expand-tabs",
              "Expanded bracket view",
            )}
          <div key={`expanded-${previewView}`} className="bracket-expand-body">
            {renderPreviewBody()}
          </div>
        </Modal>
      )}
    </>
  );
}
