import type { PriorSeasonFinishEntry } from "@/lib/types";

export interface PriorFinishTeamKey {
  /** Stable manager/owner id for this season's team — the primary match key. */
  ownerId?: string;
  /** Provider team/roster id, used as a fallback match (ESPN keeps team ids across seasons). */
  providerTeamId?: string;
}

export interface PriorFinishTeamResult {
  regularSeasonRank?: number;
  playoffRank?: number;
  /** No match in last season (new owner or changed slot) — seeded last by house rule. */
  isNewManager: boolean;
  /** Default overall rank: regular-season order, newbies appended last. */
  rank: number;
}

export interface PriorFinishApplication {
  perTeam: PriorFinishTeamResult[];
  /** True when at least one team matched a prior-season finish. */
  hasData: boolean;
  newbieCount: number;
}

/**
 * Merge last season's finish onto this season's teams. Matches by owner id first
 * (stable across seasons on both platforms), then by provider team id. Teams with no
 * match are newbies: they get no prior rank and are ordered last, which is exactly the
 * "ease the new manager in with a chiller schedule" house rule, automated. The default
 * `rank` reflects regular-season order; the builder can switch to playoff order later.
 */
export function applyPriorFinish(teamKeys: PriorFinishTeamKey[], entries: PriorSeasonFinishEntry[]): PriorFinishApplication {
  const byOwner = new Map(entries.filter((entry) => entry.ownerId).map((entry) => [entry.ownerId as string, entry]));
  const byTeam = new Map(entries.filter((entry) => entry.providerTeamId).map((entry) => [entry.providerTeamId as string, entry]));
  const matches = teamKeys.map((key) =>
    (key.ownerId ? byOwner.get(key.ownerId) : undefined) ??
    (key.providerTeamId ? byTeam.get(key.providerTeamId) : undefined),
  );
  const hasData = matches.some((match) => match && (match.regularSeasonRank != null || match.playoffRank != null));
  if (!hasData) {
    return {
      perTeam: teamKeys.map((_, index) => ({ isNewManager: false, rank: index + 1 })),
      hasData: false,
      newbieCount: 0,
    };
  }
  // Order by regular-season finish; newbies (no match) sort to the bottom, keeping
  // their original relative order. The prior ranks can have gaps if the league grew or
  // shrank between seasons, but sorting by the raw value still preserves relative order.
  const order = teamKeys
    .map((_, index) => index)
    .sort((left, right) => {
      const leftRank = matches[left]?.regularSeasonRank ?? Number.POSITIVE_INFINITY;
      const rightRank = matches[right]?.regularSeasonRank ?? Number.POSITIVE_INFINITY;
      return leftRank - rightRank || left - right;
    });
  const rankByIndex = new Map<number, number>(order.map((teamIndex, position) => [teamIndex, position + 1]));
  const perTeam = teamKeys.map((_, index) => ({
    regularSeasonRank: matches[index]?.regularSeasonRank,
    playoffRank: matches[index]?.playoffRank,
    isNewManager: !matches[index],
    rank: rankByIndex.get(index) ?? index + 1,
  }));
  return { perTeam, hasData: true, newbieCount: perTeam.filter((team) => team.isNewManager).length };
}
