import type { LineupSlotTemplate, LineupTemplate, PlayerWeekStat, SlotKey } from "@/lib/playerData";

export interface AllStarWinner {
  scheduleId: string;
  season: number;
  week: number;
  teamId: string;
  providerRosterId: string;
  providerPlayerId: string;
  canonicalPlayerId: string;
  points: number;
  projected?: number;
  slotConfidence: PlayerWeekStat["slotConfidence"];
}

export interface WeeklyAllStarSlot {
  week: number;
  slot: SlotKey;
  slotIndex: number;
  slotRank?: number;
  slotLabel: string;
  score: number;
  winners: AllStarWinner[];
}

export interface WeeklyAllStars {
  week: number;
  slots: WeeklyAllStarSlot[];
  total: number;
}

export interface AllStarResult {
  weeks: WeeklyAllStars[];
  seasonCountByTeam: Map<string, number>;
}

export interface BuildAllStarsInput {
  lineupTemplate: LineupTemplate;
  stats: PlayerWeekStat[];
  completedWeeks?: Iterable<number>;
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function scoreKey(value: number) {
  return money(value).toFixed(2);
}

function slotLabel(slot: LineupSlotTemplate) {
  return slot.label ?? (slot.rank && slot.rank > 1 ? `${slot.slot}${slot.rank}` : slot.slot);
}

function starterForSlot(row: PlayerWeekStat, slot: LineupSlotTemplate) {
  if (row.lineupStatus !== "starter") return false;
  if (row.starterIndex === slot.index) return true;
  return row.starterIndex == null && row.inferredSlot === slot.slot;
}

function starterInSlotGroup(row: PlayerWeekStat, slots: LineupSlotTemplate[]) {
  if (row.lineupStatus !== "starter") return false;
  if (slots.some((slot) => row.starterIndex === slot.index)) return true;
  return row.starterIndex == null && slots.some((slot) => row.inferredSlot === slot.slot);
}

function toWinner(row: PlayerWeekStat): AllStarWinner {
  return {
    scheduleId: row.scheduleId,
    season: row.season,
    week: row.week,
    teamId: row.teamId,
    providerRosterId: row.providerRosterId,
    providerPlayerId: row.providerPlayerId,
    canonicalPlayerId: row.canonicalPlayerId,
    points: row.points,
    projected: row.projected,
    slotConfidence: row.slotConfidence,
  };
}

export function buildAllStars(input: BuildAllStarsInput): AllStarResult {
  const completedWeeks = input.completedWeeks ? new Set(input.completedWeeks) : undefined;
  const weekNumbers = [...new Set(input.stats.map((row) => row.week))]
    .filter((week) => !completedWeeks || completedWeeks.has(week))
    .sort((left, right) => left - right);
  const seasonCountByTeam = new Map<string, number>();
  const slotsByType = input.lineupTemplate.slots.reduce((map, slot) => {
    if (!map.has(slot.slot)) map.set(slot.slot, []);
    map.get(slot.slot)?.push(slot);
    return map;
  }, new Map<SlotKey, LineupSlotTemplate[]>());
  const weeks = weekNumbers.map((week) => {
    const weekRows = input.stats.filter((row) => row.week === week);
    const slots: WeeklyAllStarSlot[] = [];
    const usedDuplicateWinnerIds = new Set<string>();

    for (const slot of input.lineupTemplate.slots) {
      const duplicateSlots = slotsByType.get(slot.slot) ?? [slot];
      const isDuplicateGroup = duplicateSlots.length > 1;
      const candidates = weekRows
        .filter((row) => isDuplicateGroup ? starterInSlotGroup(row, duplicateSlots) : starterForSlot(row, slot))
        .filter((row) => !isDuplicateGroup || !usedDuplicateWinnerIds.has(row.canonicalPlayerId));
      if (!candidates.length) continue;
      const topScore = Math.max(...candidates.map((row) => row.points));
      const topScoreKey = scoreKey(topScore);
      const winners = candidates
        .filter((row) => scoreKey(row.points) === topScoreKey)
        .sort((left, right) => left.teamId.localeCompare(right.teamId) || left.providerPlayerId.localeCompare(right.providerPlayerId))
        .map(toWinner);

      for (const winner of winners) {
        seasonCountByTeam.set(winner.teamId, (seasonCountByTeam.get(winner.teamId) ?? 0) + 1);
        if (isDuplicateGroup) usedDuplicateWinnerIds.add(winner.canonicalPlayerId);
      }

      slots.push({
        week,
        slot: slot.slot,
        slotIndex: slot.index,
        slotRank: slot.rank,
        slotLabel: slotLabel(slot),
        score: money(topScore),
        winners,
      });
    }

    return {
      week,
      slots,
      total: money(slots.reduce((sum, slot) => sum + slot.score, 0)),
    };
  });

  return {
    weeks,
    seasonCountByTeam,
  };
}
