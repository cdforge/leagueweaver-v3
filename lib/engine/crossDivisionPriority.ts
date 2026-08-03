type CrossDivisionTeamLike = {
  id: string;
  divisionId: string | null | undefined;
  conferenceId?: string | null | undefined;
  divisionSeed: number | null | undefined;
  overallSeed?: number | null | undefined;
  city?: string | null | undefined;
  name?: string | null | undefined;
};

export type CrossDivisionPriorityTeamSummary = {
  teamId: string;
  availableSameSeedOpponentIds: string[];
  playedSameSeedOpponentIds: string[];
  missingSameSeedOpponentIds: string[];
  availableSameConferenceSameSeedOpponentIds?: string[];
  playedSameConferenceSameSeedOpponentIds?: string[];
  missingSameConferenceSameSeedOpponentIds?: string[];
  availableCrossConferenceSameSeedOpponentIds?: string[];
  playedCrossConferenceSameSeedOpponentIds?: string[];
  missingCrossConferenceSameSeedOpponentIds?: string[];
  playedOtherCrossOpponentIds: string[];
  repeatedSameSeedOpponentIds: string[];
  repeatedOtherCrossOpponentIds: string[];
  missingAnySameSeed: boolean;
  skippedSameSeedForOtherCross: boolean;
  skippedSameConferenceSameSeedForCrossConference?: boolean;
  usedRepeatBeforeUniqueExhausted: boolean;
  usedOtherRepeatBeforeSameSeedRepeat: boolean;
  isPriorityCompliant: boolean;
  firstSkippedSameSeedWeek: number | null;
};

export type CrossDivisionPriorityAnalysis = {
  isPriorityCompliant: boolean;
  teamSummaries: CrossDivisionPriorityTeamSummary[];
};

type CrossDivisionPair = {
  teamAId: string;
  teamBId: string;
  sameSeed: boolean;
  sameConferenceSameSeed: boolean;
  crossConferenceSameSeed: boolean;
};

type ScheduledCrossDivisionGameLike = {
  homeTeamId: string;
  awayTeamId: string;
  matchupType?: string | null;
  matchType?: string | null;
};

type ScheduledCrossDivisionWeekLike = {
  weekNumber: number;
  games: ScheduledCrossDivisionGameLike[];
};

function normalizeSeed(seed: number | null | undefined) {
  return Number.isFinite(seed) ? Number(seed) : null;
}

function sameKnownConference(teamA: CrossDivisionTeamLike, teamB: CrossDivisionTeamLike) {
  return Boolean(teamA.conferenceId && teamB.conferenceId && teamA.conferenceId === teamB.conferenceId);
}

function differentKnownConference(teamA: CrossDivisionTeamLike, teamB: CrossDivisionTeamLike) {
  return Boolean(teamA.conferenceId && teamB.conferenceId && teamA.conferenceId !== teamB.conferenceId);
}

export function toCrossDivisionPairKey(teamAId: string, teamBId: string) {
  return [teamAId, teamBId].sort().join("::");
}

function buildCrossDivisionPairs<T extends CrossDivisionTeamLike>(teams: T[]) {
  const sameConferenceSameSeedPairs: CrossDivisionPair[] = [];
  const crossConferenceSameSeedPairs: CrossDivisionPair[] = [];
  const legacySameSeedPairs: CrossDivisionPair[] = [];
  const otherPairs: CrossDivisionPair[] = [];

  for (let index = 0; index < teams.length; index += 1) {
    const teamA = teams[index];
    const teamASeed = normalizeSeed(teamA.divisionSeed);
    if (!teamA.divisionId) continue;

    for (let nextIndex = index + 1; nextIndex < teams.length; nextIndex += 1) {
      const teamB = teams[nextIndex];
      const teamBSeed = normalizeSeed(teamB.divisionSeed);
      if (!teamB.divisionId || teamA.divisionId === teamB.divisionId) continue;

      const sameSeed = teamASeed != null && teamASeed === teamBSeed;
      const pair = {
        teamAId: teamA.id,
        teamBId: teamB.id,
        sameSeed,
        sameConferenceSameSeed: sameSeed && sameKnownConference(teamA, teamB),
        crossConferenceSameSeed: sameSeed && differentKnownConference(teamA, teamB),
      };

      if (pair.sameConferenceSameSeed) {
        sameConferenceSameSeedPairs.push(pair);
      } else if (pair.crossConferenceSameSeed) {
        crossConferenceSameSeedPairs.push(pair);
      } else if (pair.sameSeed) {
        legacySameSeedPairs.push(pair);
      } else {
        otherPairs.push(pair);
      }
    }
  }

  return { sameConferenceSameSeedPairs, crossConferenceSameSeedPairs, legacySameSeedPairs, otherPairs };
}

function shuffleInPlace<T>(items: T[], random: () => number) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  }
}

function allocatePair(
  pair: CrossDivisionPair,
  pairCounts: Map<string, number>,
  remainingGamesByTeam: Map<string, number>,
) {
  const nextA = (remainingGamesByTeam.get(pair.teamAId) ?? 0) - 1;
  const nextB = (remainingGamesByTeam.get(pair.teamBId) ?? 0) - 1;
  if (nextA < 0 || nextB < 0) {
    return false;
  }
  remainingGamesByTeam.set(pair.teamAId, nextA);
  remainingGamesByTeam.set(pair.teamBId, nextB);
  const key = toCrossDivisionPairKey(pair.teamAId, pair.teamBId);
  pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  return true;
}

function allocateUniqueStage(
  sourcePairs: CrossDivisionPair[],
  pairCounts: Map<string, number>,
  remainingGamesByTeam: Map<string, number>,
  random: () => number,
) {
  while (true) {
    const candidates = sourcePairs
      .filter((pair) => (pairCounts.get(toCrossDivisionPairKey(pair.teamAId, pair.teamBId)) ?? 0) === 0)
      .filter(
        (pair) =>
          (remainingGamesByTeam.get(pair.teamAId) ?? 0) > 0 &&
          (remainingGamesByTeam.get(pair.teamBId) ?? 0) > 0,
      )
      .sort((left, right) => {
        const leftNeed =
          (remainingGamesByTeam.get(left.teamAId) ?? 0) + (remainingGamesByTeam.get(left.teamBId) ?? 0);
        const rightNeed =
          (remainingGamesByTeam.get(right.teamAId) ?? 0) + (remainingGamesByTeam.get(right.teamBId) ?? 0);
        if (leftNeed !== rightNeed) {
          return rightNeed - leftNeed;
        }
        return random() < 0.5 ? -1 : 1;
      });

    const candidate = candidates[0];
    if (!candidate) {
      return;
    }

    if (!allocatePair(candidate, pairCounts, remainingGamesByTeam)) {
      return;
    }
  }
}

function allocateRepeatStage(
  sourcePairs: CrossDivisionPair[],
  pairCounts: Map<string, number>,
  remainingGamesByTeam: Map<string, number>,
  random: () => number,
  maxPairCount: number,
) {
  while (true) {
    const candidates = sourcePairs
      .filter((pair) => (pairCounts.get(toCrossDivisionPairKey(pair.teamAId, pair.teamBId)) ?? 0) < maxPairCount)
      .filter(
        (pair) =>
          (remainingGamesByTeam.get(pair.teamAId) ?? 0) > 0 &&
          (remainingGamesByTeam.get(pair.teamBId) ?? 0) > 0,
      )
      .sort((left, right) => {
        const leftCount = pairCounts.get(toCrossDivisionPairKey(left.teamAId, left.teamBId)) ?? 0;
        const rightCount = pairCounts.get(toCrossDivisionPairKey(right.teamAId, right.teamBId)) ?? 0;
        if (leftCount !== rightCount) {
          return leftCount - rightCount;
        }
        const leftNeed =
          (remainingGamesByTeam.get(left.teamAId) ?? 0) + (remainingGamesByTeam.get(left.teamBId) ?? 0);
        const rightNeed =
          (remainingGamesByTeam.get(right.teamAId) ?? 0) + (remainingGamesByTeam.get(right.teamBId) ?? 0);
        if (leftNeed !== rightNeed) {
          return rightNeed - leftNeed;
        }
        return random() < 0.5 ? -1 : 1;
      });

    const candidate = candidates[0];
    if (!candidate) {
      return;
    }
    if (!allocatePair(candidate, pairCounts, remainingGamesByTeam)) {
      return;
    }
  }
}

export function buildPrioritizedCrossDivisionPairCounts<T extends CrossDivisionTeamLike>(
  teams: T[],
  initialRemainingGamesByTeam: Map<string, number>,
  random: () => number = Math.random,
  options?: { maxPairCount?: number },
) {
  const remainingGamesByTeam = new Map(initialRemainingGamesByTeam);
  const pairCounts = new Map<string, number>();
  const maxPairCount = Math.max(1, options?.maxPairCount ?? 2);
  const {
    sameConferenceSameSeedPairs,
    crossConferenceSameSeedPairs,
    legacySameSeedPairs,
    otherPairs,
  } = buildCrossDivisionPairs(teams);

  shuffleInPlace(sameConferenceSameSeedPairs, random);
  shuffleInPlace(crossConferenceSameSeedPairs, random);
  shuffleInPlace(legacySameSeedPairs, random);
  shuffleInPlace(otherPairs, random);

  allocateUniqueStage(sameConferenceSameSeedPairs, pairCounts, remainingGamesByTeam, random);
  allocateUniqueStage(crossConferenceSameSeedPairs, pairCounts, remainingGamesByTeam, random);
  allocateUniqueStage(legacySameSeedPairs, pairCounts, remainingGamesByTeam, random);
  allocateUniqueStage(otherPairs, pairCounts, remainingGamesByTeam, random);
  allocateRepeatStage(sameConferenceSameSeedPairs, pairCounts, remainingGamesByTeam, random, maxPairCount);
  allocateRepeatStage(crossConferenceSameSeedPairs, pairCounts, remainingGamesByTeam, random, maxPairCount);
  allocateRepeatStage(legacySameSeedPairs, pairCounts, remainingGamesByTeam, random, maxPairCount);
  allocateRepeatStage(otherPairs, pairCounts, remainingGamesByTeam, random, maxPairCount);

  return {
    pairCounts,
    remainingGamesByTeam,
  };
}

export function solveCrossDivisionPairCounts<T extends CrossDivisionTeamLike>(
  teams: T[],
  initialRemainingGamesByTeam: Map<string, number>,
  random: () => number = Math.random,
  options?: {
    maxAttempts?: number;
    maxRepairSteps?: number;
    divisionOrder?: Map<string, number>;
    maxPairCount?: number;
  },
) {
  const orderedDivisionIds = Array.from(
    new Set(
      teams
        .map((team) => team.divisionId)
        .filter((divisionId): divisionId is string => Boolean(divisionId)),
    ),
  ).sort((left, right) => {
    const leftOrder = options?.divisionOrder?.get(left) ?? 0;
    const rightOrder = options?.divisionOrder?.get(right) ?? 0;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.localeCompare(right);
  });
  const effectiveDivisionCount = Math.max(1, orderedDivisionIds.length);
  const maxAttempts = Math.max(8, options?.maxAttempts ?? teams.length);
  const maxRepairSteps = Math.max(1_000, options?.maxRepairSteps ?? 20_000);
  const maxPairCount = Math.max(1, options?.maxPairCount ?? 2);

  const teamSort = (left: T, right: T, remainingGamesByTeam: Map<string, number>) => {
    const remainingDifference =
      (remainingGamesByTeam.get(right.id) ?? 0) - (remainingGamesByTeam.get(left.id) ?? 0);
    if (remainingDifference !== 0) return remainingDifference;

    const leftSeed = left.overallSeed ?? Number.MAX_SAFE_INTEGER;
    const rightSeed = right.overallSeed ?? Number.MAX_SAFE_INTEGER;
    if (leftSeed !== rightSeed) return leftSeed - rightSeed;

    const leftLabel = `${left.city ?? ""} ${left.name ?? ""}`.trim() || left.id;
    const rightLabel = `${right.city ?? ""} ${right.name ?? ""}`.trim() || right.id;
    return leftLabel.localeCompare(rightLabel);
  };

  const tryCompleteBuild = (remainingGamesByTeam: Map<string, number>, pairCounts: Map<string, number>) => {
    const nextDivisionIndex = new Map<string, number>(teams.map((team) => [team.id, 0]));

    for (let guard = 0; guard < maxRepairSteps; guard += 1) {
      const needers = teams
        .filter((team) => (remainingGamesByTeam.get(team.id) ?? 0) > 0)
        .sort((left, right) => teamSort(left, right, remainingGamesByTeam));
      if (needers.length === 0) {
        return true;
      }

      const team = needers[0];
      const teamRemaining = remainingGamesByTeam.get(team.id) ?? 0;
      if (teamRemaining <= 0) continue;

      const teamDivisionPreference = nextDivisionIndex.get(team.id) ?? 0;
      const candidates = teams
        .filter((candidate) => candidate.id !== team.id)
        .filter((candidate) => candidate.divisionId !== team.divisionId)
        .filter((candidate) => (remainingGamesByTeam.get(candidate.id) ?? 0) > 0)
        .filter((candidate) => (pairCounts.get(toCrossDivisionPairKey(team.id, candidate.id)) ?? 0) < maxPairCount)
        .sort((left, right) => {
          const leftPairKey = toCrossDivisionPairKey(team.id, left.id);
          const rightPairKey = toCrossDivisionPairKey(team.id, right.id);
          const leftPairCount = pairCounts.get(leftPairKey) ?? 0;
          const rightPairCount = pairCounts.get(rightPairKey) ?? 0;
          if (leftPairCount !== rightPairCount) return leftPairCount - rightPairCount;

          const leftSameSeed = left.divisionSeed === team.divisionSeed ? 1 : 0;
          const rightSameSeed = right.divisionSeed === team.divisionSeed ? 1 : 0;
          if (leftSameSeed !== rightSameSeed) return rightSameSeed - leftSameSeed;

          if (leftSameSeed === 1 && rightSameSeed === 1) {
            const leftSameConference = sameKnownConference(team, left) ? 1 : 0;
            const rightSameConference = sameKnownConference(team, right) ? 1 : 0;
            if (leftSameConference !== rightSameConference) return rightSameConference - leftSameConference;
          }

          const leftDivisionRank = orderedDivisionIds.indexOf(left.divisionId ?? "");
          const rightDivisionRank = orderedDivisionIds.indexOf(right.divisionId ?? "");
          const leftCycleDistance =
            (leftDivisionRank - teamDivisionPreference + effectiveDivisionCount) % effectiveDivisionCount;
          const rightCycleDistance =
            (rightDivisionRank - teamDivisionPreference + effectiveDivisionCount) % effectiveDivisionCount;
          if (leftCycleDistance !== rightCycleDistance) return leftCycleDistance - rightCycleDistance;

          const leftNeed =
            (remainingGamesByTeam.get(team.id) ?? 0) + (remainingGamesByTeam.get(left.id) ?? 0);
          const rightNeed =
            (remainingGamesByTeam.get(team.id) ?? 0) + (remainingGamesByTeam.get(right.id) ?? 0);
          if (leftNeed !== rightNeed) return rightNeed - leftNeed;

          return random() < 0.5 ? -1 : 1;
        });

      const opponent = candidates[0];
      if (!opponent) {
        return false;
      }

      const key = toCrossDivisionPairKey(team.id, opponent.id);
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      remainingGamesByTeam.set(team.id, teamRemaining - 1);
      remainingGamesByTeam.set(opponent.id, (remainingGamesByTeam.get(opponent.id) ?? 0) - 1);

      const opponentDivisionIndex = Math.max(0, orderedDivisionIds.indexOf(opponent.divisionId ?? ""));
      nextDivisionIndex.set(team.id, (opponentDivisionIndex + 1) % effectiveDivisionCount);
      const teamDivisionIndex = Math.max(0, orderedDivisionIds.indexOf(team.divisionId ?? ""));
      nextDivisionIndex.set(opponent.id, (teamDivisionIndex + 1) % effectiveDivisionCount);
    }

    return false;
  };

  let bestPairCounts = new Map<string, number>();
  let bestRemainingGamesByTeam = new Map(initialRemainingGamesByTeam);
  let bestRemainingTotal = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const initialBuild = buildPrioritizedCrossDivisionPairCounts(
      teams,
      initialRemainingGamesByTeam,
      random,
      { maxPairCount },
    );
    const pairCounts = new Map(initialBuild.pairCounts);
    const remainingGamesByTeam = new Map(initialBuild.remainingGamesByTeam);
    const finished = tryCompleteBuild(remainingGamesByTeam, pairCounts);
    const remainingTotal = Array.from(remainingGamesByTeam.values()).reduce(
      (sum, value) => sum + Math.max(0, value),
      0,
    );

    if (remainingTotal < bestRemainingTotal) {
      bestRemainingTotal = remainingTotal;
      bestPairCounts = pairCounts;
      bestRemainingGamesByTeam = remainingGamesByTeam;
    }

    if (finished && remainingTotal === 0) {
      return {
        pairCounts,
        remainingGamesByTeam,
      };
    }
  }

  return {
    pairCounts: bestPairCounts,
    remainingGamesByTeam: bestRemainingGamesByTeam,
  };
}

export function analyzeCrossDivisionPriority<T extends CrossDivisionTeamLike>(
  teams: T[],
  pairCounts: Map<string, number>,
): CrossDivisionPriorityAnalysis {
  const crossOpponentsByTeam = new Map<string, T[]>();
  const sameSeedOpponentsByTeam = new Map<string, T[]>();
  const sameConferenceSameSeedOpponentsByTeam = new Map<string, T[]>();
  const crossConferenceSameSeedOpponentsByTeam = new Map<string, T[]>();
  const playedOpponentsByTeam = new Map<string, Set<string>>();
  const repeatedOpponentsByTeam = new Map<string, Set<string>>();
  const repeatedSameSeedOpponentsByTeam = new Map<string, Set<string>>();
  const repeatedOtherOpponentsByTeam = new Map<string, Set<string>>();
  teams.forEach((team) => {
    crossOpponentsByTeam.set(team.id, []);
    sameSeedOpponentsByTeam.set(team.id, []);
    sameConferenceSameSeedOpponentsByTeam.set(team.id, []);
    crossConferenceSameSeedOpponentsByTeam.set(team.id, []);
    playedOpponentsByTeam.set(team.id, new Set());
    repeatedOpponentsByTeam.set(team.id, new Set());
    repeatedSameSeedOpponentsByTeam.set(team.id, new Set());
    repeatedOtherOpponentsByTeam.set(team.id, new Set());
  });

  for (let index = 0; index < teams.length; index += 1) {
    const teamA = teams[index];
    const seedA = normalizeSeed(teamA.divisionSeed);
    if (!teamA.divisionId) continue;
    for (let nextIndex = index + 1; nextIndex < teams.length; nextIndex += 1) {
      const teamB = teams[nextIndex];
      const seedB = normalizeSeed(teamB.divisionSeed);
      if (!teamB.divisionId || teamA.divisionId === teamB.divisionId) continue;

      crossOpponentsByTeam.get(teamA.id)?.push(teamB);
      crossOpponentsByTeam.get(teamB.id)?.push(teamA);

      const sameSeed = seedA != null && seedA === seedB;
      if (sameSeed) {
        sameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
        sameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
        if (sameKnownConference(teamA, teamB)) {
          sameConferenceSameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
          sameConferenceSameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
        } else if (differentKnownConference(teamA, teamB)) {
          crossConferenceSameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
          crossConferenceSameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
        }
      }

      const pairCount = pairCounts.get(toCrossDivisionPairKey(teamA.id, teamB.id)) ?? 0;
      if (pairCount > 0) {
        playedOpponentsByTeam.get(teamA.id)?.add(teamB.id);
        playedOpponentsByTeam.get(teamB.id)?.add(teamA.id);
      }
      if (pairCount > 1) {
        repeatedOpponentsByTeam.get(teamA.id)?.add(teamB.id);
        repeatedOpponentsByTeam.get(teamB.id)?.add(teamA.id);
        if (sameSeed) {
          repeatedSameSeedOpponentsByTeam.get(teamA.id)?.add(teamB.id);
          repeatedSameSeedOpponentsByTeam.get(teamB.id)?.add(teamA.id);
        } else {
          repeatedOtherOpponentsByTeam.get(teamA.id)?.add(teamB.id);
          repeatedOtherOpponentsByTeam.get(teamB.id)?.add(teamA.id);
        }
      }
    }
  }

  const teamSummaries = teams.map((team) => {
    const sameSeedOpponents = sameSeedOpponentsByTeam.get(team.id) ?? [];
    const playedOpponents = playedOpponentsByTeam.get(team.id) ?? new Set<string>();
    const repeatedSameSeedOpponents = repeatedSameSeedOpponentsByTeam.get(team.id) ?? new Set<string>();
    const repeatedOtherOpponents = repeatedOtherOpponentsByTeam.get(team.id) ?? new Set<string>();

    const availableSameSeedOpponentIds = sameSeedOpponents.map((opponent) => opponent.id);
    const availableSameConferenceSameSeedOpponentIds = (
      sameConferenceSameSeedOpponentsByTeam.get(team.id) ?? []
    ).map((opponent) => opponent.id);
    const availableCrossConferenceSameSeedOpponentIds = (
      crossConferenceSameSeedOpponentsByTeam.get(team.id) ?? []
    ).map((opponent) => opponent.id);
    const playedSameSeedOpponentIds = availableSameSeedOpponentIds.filter((opponentId) =>
      playedOpponents.has(opponentId),
    );
    const playedSameConferenceSameSeedOpponentIds = availableSameConferenceSameSeedOpponentIds.filter(
      (opponentId) => playedOpponents.has(opponentId),
    );
    const playedCrossConferenceSameSeedOpponentIds = availableCrossConferenceSameSeedOpponentIds.filter(
      (opponentId) => playedOpponents.has(opponentId),
    );
    const missingSameSeedOpponentIds = availableSameSeedOpponentIds.filter(
      (opponentId) => !playedOpponents.has(opponentId),
    );
    const missingSameConferenceSameSeedOpponentIds = availableSameConferenceSameSeedOpponentIds.filter(
      (opponentId) => !playedOpponents.has(opponentId),
    );
    const missingCrossConferenceSameSeedOpponentIds = availableCrossConferenceSameSeedOpponentIds.filter(
      (opponentId) => !playedOpponents.has(opponentId),
    );

    const playedOtherCrossOpponentIds = (crossOpponentsByTeam.get(team.id) ?? [])
      .map((opponent) => opponent.id)
      .filter((opponentId) => playedOpponents.has(opponentId))
      .filter((opponentId) => !availableSameSeedOpponentIds.includes(opponentId));

    const unplayedCrossOpponentIds = (crossOpponentsByTeam.get(team.id) ?? [])
      .map((opponent) => opponent.id)
      .filter((opponentId) => !playedOpponents.has(opponentId));

    const hasSameSeedRepeatAvailable = playedSameSeedOpponentIds.some((opponentId) => {
      const pairCount = pairCounts.get(toCrossDivisionPairKey(team.id, opponentId)) ?? 0;
      return pairCount === 1;
    });

    const missingAnySameSeed = missingSameSeedOpponentIds.length > 0;
    const skippedSameSeedForOtherCross = missingAnySameSeed && playedOtherCrossOpponentIds.length > 0;
    const skippedSameConferenceSameSeedForCrossConference =
      missingSameConferenceSameSeedOpponentIds.length > 0 &&
      playedCrossConferenceSameSeedOpponentIds.length > 0;
    const usedRepeatBeforeUniqueExhausted =
      !missingAnySameSeed &&
      repeatedOpponentsByTeam.get(team.id)!.size > 0 &&
      unplayedCrossOpponentIds.length > 0;
    const usedOtherRepeatBeforeSameSeedRepeat =
      repeatedOtherOpponents.size > 0 && hasSameSeedRepeatAvailable;

    return {
      teamId: team.id,
      availableSameSeedOpponentIds,
      playedSameSeedOpponentIds,
      missingSameSeedOpponentIds,
      availableSameConferenceSameSeedOpponentIds,
      playedSameConferenceSameSeedOpponentIds,
      missingSameConferenceSameSeedOpponentIds,
      availableCrossConferenceSameSeedOpponentIds,
      playedCrossConferenceSameSeedOpponentIds,
      missingCrossConferenceSameSeedOpponentIds,
      playedOtherCrossOpponentIds,
      repeatedSameSeedOpponentIds: Array.from(repeatedSameSeedOpponents),
      repeatedOtherCrossOpponentIds: Array.from(repeatedOtherOpponents),
      missingAnySameSeed,
      skippedSameSeedForOtherCross,
      skippedSameConferenceSameSeedForCrossConference,
      usedRepeatBeforeUniqueExhausted,
      usedOtherRepeatBeforeSameSeedRepeat,
      isPriorityCompliant:
        !skippedSameSeedForOtherCross &&
        !skippedSameConferenceSameSeedForCrossConference &&
        !usedRepeatBeforeUniqueExhausted &&
        !usedOtherRepeatBeforeSameSeedRepeat,
      firstSkippedSameSeedWeek: null,
    } satisfies CrossDivisionPriorityTeamSummary;
  });

  return {
    isPriorityCompliant: teamSummaries.every((summary) => summary.isPriorityCompliant),
    teamSummaries,
  };
}

function isCrossDivisionGame(game: ScheduledCrossDivisionGameLike) {
  return (
    game.matchupType === "cross-division" ||
    game.matchupType === "Cross-Divisional" ||
    game.matchType === "cross_division"
  );
}

export function buildScheduledCrossDivisionPairCounts<W extends ScheduledCrossDivisionWeekLike>(weeks: W[]) {
  const pairCounts = new Map<string, number>();

  weeks.forEach((week) => {
    week.games.forEach((game) => {
      if (!isCrossDivisionGame(game)) {
        return;
      }

      const key = toCrossDivisionPairKey(game.homeTeamId, game.awayTeamId);
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    });
  });

  return pairCounts;
}

export function analyzeScheduledCrossDivisionInventoryPriority<
  T extends CrossDivisionTeamLike,
  W extends ScheduledCrossDivisionWeekLike,
>(
  teams: T[],
  weeks: W[],
): CrossDivisionPriorityAnalysis {
  return analyzeCrossDivisionPriority(teams, buildScheduledCrossDivisionPairCounts(weeks));
}

export function analyzeScheduledCrossDivisionPriority<
  T extends CrossDivisionTeamLike,
  W extends ScheduledCrossDivisionWeekLike,
>(
  teams: T[],
  weeks: W[],
): CrossDivisionPriorityAnalysis {
  const crossOpponentsByTeam = new Map<string, T[]>();
  const sameSeedOpponentsByTeam = new Map<string, T[]>();
  const sameConferenceSameSeedOpponentsByTeam = new Map<string, T[]>();
  const crossConferenceSameSeedOpponentsByTeam = new Map<string, T[]>();
  const playedSameSeedByTeam = new Map<string, Set<string>>();
  const playedSameConferenceSameSeedByTeam = new Map<string, Set<string>>();
  const playedCrossConferenceSameSeedByTeam = new Map<string, Set<string>>();
  const playedOtherByTeam = new Map<string, Set<string>>();
  const repeatedSameSeedByTeam = new Map<string, Set<string>>();
  const repeatedOtherByTeam = new Map<string, Set<string>>();
  const playedAnyByTeam = new Map<string, Set<string>>();
  const encounterCountsByTeam = new Map<string, Map<string, number>>();
  const skippedSameSeedWeekByTeam = new Map<string, number | null>();
  const skippedSameConferenceSameSeedByTeam = new Map<string, boolean>();
  const usedRepeatBeforeUniqueExhaustedByTeam = new Map<string, boolean>();
  const usedOtherRepeatBeforeSameSeedRepeatByTeam = new Map<string, boolean>();
  const teamById = new Map(teams.map((team) => [team.id, team] as const));

  teams.forEach((team) => {
    crossOpponentsByTeam.set(team.id, []);
    sameSeedOpponentsByTeam.set(team.id, []);
    sameConferenceSameSeedOpponentsByTeam.set(team.id, []);
    crossConferenceSameSeedOpponentsByTeam.set(team.id, []);
    playedSameSeedByTeam.set(team.id, new Set());
    playedSameConferenceSameSeedByTeam.set(team.id, new Set());
    playedCrossConferenceSameSeedByTeam.set(team.id, new Set());
    playedOtherByTeam.set(team.id, new Set());
    repeatedSameSeedByTeam.set(team.id, new Set());
    repeatedOtherByTeam.set(team.id, new Set());
    playedAnyByTeam.set(team.id, new Set());
    encounterCountsByTeam.set(team.id, new Map());
    skippedSameSeedWeekByTeam.set(team.id, null);
    skippedSameConferenceSameSeedByTeam.set(team.id, false);
    usedRepeatBeforeUniqueExhaustedByTeam.set(team.id, false);
    usedOtherRepeatBeforeSameSeedRepeatByTeam.set(team.id, false);
  });

  for (let index = 0; index < teams.length; index += 1) {
    const teamA = teams[index];
    const seedA = normalizeSeed(teamA.divisionSeed);
    if (!teamA.divisionId) continue;

    for (let nextIndex = index + 1; nextIndex < teams.length; nextIndex += 1) {
      const teamB = teams[nextIndex];
      const seedB = normalizeSeed(teamB.divisionSeed);
      if (!teamB.divisionId || teamA.divisionId === teamB.divisionId) continue;

      crossOpponentsByTeam.get(teamA.id)?.push(teamB);
      crossOpponentsByTeam.get(teamB.id)?.push(teamA);

      if (seedA != null && seedA === seedB) {
        sameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
        sameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
        if (sameKnownConference(teamA, teamB)) {
          sameConferenceSameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
          sameConferenceSameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
        } else if (differentKnownConference(teamA, teamB)) {
          crossConferenceSameSeedOpponentsByTeam.get(teamA.id)?.push(teamB);
          crossConferenceSameSeedOpponentsByTeam.get(teamB.id)?.push(teamA);
        }
      }
    }
  }

  const orderedWeeks = weeks.slice().sort((a, b) => a.weekNumber - b.weekNumber);
  orderedWeeks.forEach((week) => {
    week.games.forEach((game) => {
      if (!isCrossDivisionGame(game)) return;

      const pairings = [
        { teamId: game.homeTeamId, opponentId: game.awayTeamId },
        { teamId: game.awayTeamId, opponentId: game.homeTeamId },
      ];

      pairings.forEach(({ teamId, opponentId }) => {
        const team = teamById.get(teamId);
        const opponent = teamById.get(opponentId);
        if (!team || !opponent || !team.divisionId || team.divisionId === opponent.divisionId) {
          return;
        }

        const isSameSeed =
          normalizeSeed(team.divisionSeed) != null &&
          normalizeSeed(team.divisionSeed) === normalizeSeed(opponent.divisionSeed);
        const isSameConferenceSameSeed = isSameSeed && sameKnownConference(team, opponent);
        const isCrossConferenceSameSeed = isSameSeed && differentKnownConference(team, opponent);
        const availableSameSeedOpponentIds = (
          sameSeedOpponentsByTeam.get(teamId) ?? []
        ).map((candidate) => candidate.id);
        const availableSameConferenceSameSeedOpponentIds = (
          sameConferenceSameSeedOpponentsByTeam.get(teamId) ?? []
        ).map((candidate) => candidate.id);
        const playedSameSeedOpponentIds = playedSameSeedByTeam.get(teamId) ?? new Set<string>();
        const playedSameConferenceSameSeedOpponentIds =
          playedSameConferenceSameSeedByTeam.get(teamId) ?? new Set<string>();
        const encounterCounts = encounterCountsByTeam.get(teamId) ?? new Map<string, number>();
        const priorCount = encounterCounts.get(opponentId) ?? 0;
        const isRepeat = priorCount > 0;

        if (
          !isSameSeed &&
          skippedSameSeedWeekByTeam.get(teamId) == null &&
          availableSameSeedOpponentIds.some((candidateId) => !playedSameSeedOpponentIds.has(candidateId))
        ) {
          skippedSameSeedWeekByTeam.set(teamId, week.weekNumber);
        }

        if (
          isCrossConferenceSameSeed &&
          availableSameConferenceSameSeedOpponentIds.some(
            (candidateId) => !playedSameConferenceSameSeedOpponentIds.has(candidateId),
          )
        ) {
          skippedSameConferenceSameSeedByTeam.set(teamId, true);
        }

        if (isRepeat) {
          const totalCrossOpponentCount = (crossOpponentsByTeam.get(teamId) ?? []).length;
          if ((playedAnyByTeam.get(teamId)?.size ?? 0) < totalCrossOpponentCount) {
            usedRepeatBeforeUniqueExhaustedByTeam.set(teamId, true);
          }
          const hasSameSeedRepeatAvailable = Array.from(encounterCounts.entries()).some(
            ([candidateId, count]) => count === 1 && availableSameSeedOpponentIds.includes(candidateId),
          );
          if (!isSameSeed && hasSameSeedRepeatAvailable) {
            usedOtherRepeatBeforeSameSeedRepeatByTeam.set(teamId, true);
          }
        }

        encounterCounts.set(opponentId, priorCount + 1);
        encounterCountsByTeam.set(teamId, encounterCounts);
        playedAnyByTeam.get(teamId)?.add(opponentId);

        if (isSameSeed) {
          playedSameSeedByTeam.get(teamId)?.add(opponentId);
          if (isSameConferenceSameSeed) {
            playedSameConferenceSameSeedByTeam.get(teamId)?.add(opponentId);
          }
          if (isCrossConferenceSameSeed) {
            playedCrossConferenceSameSeedByTeam.get(teamId)?.add(opponentId);
          }
          if (isRepeat) {
            repeatedSameSeedByTeam.get(teamId)?.add(opponentId);
          }
        } else {
          playedOtherByTeam.get(teamId)?.add(opponentId);
          if (isRepeat) {
            repeatedOtherByTeam.get(teamId)?.add(opponentId);
          }
        }
      });
    });
  });

  const teamSummaries = teams.map((team) => {
    const availableSameSeedOpponentIds = (sameSeedOpponentsByTeam.get(team.id) ?? []).map(
      (opponent) => opponent.id,
    );
    const availableSameConferenceSameSeedOpponentIds = (
      sameConferenceSameSeedOpponentsByTeam.get(team.id) ?? []
    ).map((opponent) => opponent.id);
    const availableCrossConferenceSameSeedOpponentIds = (
      crossConferenceSameSeedOpponentsByTeam.get(team.id) ?? []
    ).map((opponent) => opponent.id);
    const playedSameSeedOpponentIds = Array.from(playedSameSeedByTeam.get(team.id) ?? []);
    const playedSameConferenceSameSeedOpponentIds = Array.from(
      playedSameConferenceSameSeedByTeam.get(team.id) ?? [],
    );
    const playedCrossConferenceSameSeedOpponentIds = Array.from(
      playedCrossConferenceSameSeedByTeam.get(team.id) ?? [],
    );
    const missingSameSeedOpponentIds = availableSameSeedOpponentIds.filter(
      (opponentId) => !playedSameSeedByTeam.get(team.id)?.has(opponentId),
    );
    const missingSameConferenceSameSeedOpponentIds = availableSameConferenceSameSeedOpponentIds.filter(
      (opponentId) => !playedSameConferenceSameSeedByTeam.get(team.id)?.has(opponentId),
    );
    const missingCrossConferenceSameSeedOpponentIds = availableCrossConferenceSameSeedOpponentIds.filter(
      (opponentId) => !playedCrossConferenceSameSeedByTeam.get(team.id)?.has(opponentId),
    );
    const skippedSameSeedForOtherCross = (skippedSameSeedWeekByTeam.get(team.id) ?? null) != null;
    const skippedSameConferenceSameSeedForCrossConference =
      skippedSameConferenceSameSeedByTeam.get(team.id) ?? false;
    const usedRepeatBeforeUniqueExhausted = usedRepeatBeforeUniqueExhaustedByTeam.get(team.id) ?? false;
    const usedOtherRepeatBeforeSameSeedRepeat =
      usedOtherRepeatBeforeSameSeedRepeatByTeam.get(team.id) ?? false;

    return {
      teamId: team.id,
      availableSameSeedOpponentIds,
      playedSameSeedOpponentIds,
      missingSameSeedOpponentIds,
      availableSameConferenceSameSeedOpponentIds,
      playedSameConferenceSameSeedOpponentIds,
      missingSameConferenceSameSeedOpponentIds,
      availableCrossConferenceSameSeedOpponentIds,
      playedCrossConferenceSameSeedOpponentIds,
      missingCrossConferenceSameSeedOpponentIds,
      playedOtherCrossOpponentIds: Array.from(playedOtherByTeam.get(team.id) ?? []),
      repeatedSameSeedOpponentIds: Array.from(repeatedSameSeedByTeam.get(team.id) ?? []),
      repeatedOtherCrossOpponentIds: Array.from(repeatedOtherByTeam.get(team.id) ?? []),
      missingAnySameSeed: missingSameSeedOpponentIds.length > 0,
      skippedSameSeedForOtherCross,
      skippedSameConferenceSameSeedForCrossConference,
      usedRepeatBeforeUniqueExhausted,
      usedOtherRepeatBeforeSameSeedRepeat,
      isPriorityCompliant:
        !skippedSameSeedForOtherCross &&
        !skippedSameConferenceSameSeedForCrossConference &&
        !usedRepeatBeforeUniqueExhausted &&
        !usedOtherRepeatBeforeSameSeedRepeat,
      firstSkippedSameSeedWeek: skippedSameSeedWeekByTeam.get(team.id) ?? null,
    } satisfies CrossDivisionPriorityTeamSummary;
  });

  return {
    isPriorityCompliant: teamSummaries.every((summary) => summary.isPriorityCompliant),
    teamSummaries,
  };
}
