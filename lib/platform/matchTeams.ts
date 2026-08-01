// Pure, client-safe team matcher for the Connect-for-Scores flow. Given the
// teams a commissioner built by hand and the roster a public ESPN/Sleeper league
// exposes, it proposes which external roster each LeagueWeaver team is — so score
// sync has a `providerId` to join on (see mapSleeperScores / mapEspnScores).
//
// Deliberately NOT `server-only`: this runs inside the mapping modal on the
// client, against candidates the server already fetched. No network here, and
// nothing platform-specific — just names, managers, and cities.

export type MatchConfidence = "high" | "review" | "none";

// A pairing at or above `high` is pre-selected and marked confident; between
// `review` and `high` it is pre-selected but flagged "check this"; below
// `review` the team is left blank for the commissioner to pick. Tuned so a
// silent wrong auto-match (which would feed wrong scores into standings) needs a
// genuinely strong signal, while a same-owner match still lands confidently.
export const MATCH_THRESHOLDS = { high: 0.82, review: 0.5 } as const;

export interface MappableTeam {
  id: string;
  name: string;
  city?: string;
  manager?: string;
}

export interface MappingCandidate {
  /** The value written onto Team.providerId — e.g. `sleeper-99-3` / `espn-42-7`. */
  providerId: string;
  name: string;
  city?: string;
  manager?: string;
  division?: string;
  logoUrl?: string;
}

export interface TeamMatch {
  leagueTeamId: string;
  /** null = unmatched; the commissioner must pick a candidate by hand. */
  providerId: string | null;
  confidence: MatchConfidence;
  /** 0..1 blended similarity, exposed for sorting/telemetry. */
  score: number;
}

// Words that carry no identifying signal, so "The Blitz FC" and "Blitz" read as
// the same team. Kept short on purpose — an over-eager list erases real names.
const FILLER = new Set(["the", "fc", "sc", "afc", "cf", "club", "team"]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// Filler-stripped tokens, but never everything: a name that is *only* filler
// ("The Club") falls back to its raw tokens rather than matching nothing.
function contentTokens(value: string): string[] {
  const all = tokenize(value);
  const kept = all.filter((token) => !FILLER.has(token));
  return kept.length ? kept : all;
}

// Sørensen–Dice over token *sets* — order-independent word overlap.
function diceTokens(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size && !setB.size) return 1;
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  return (2 * intersection) / (setA.size + setB.size);
}

function bigrams(value: string): string[] {
  const joined = tokenize(value).join("");
  if (joined.length < 2) return joined ? [joined] : [];
  const grams: string[] = [];
  for (let index = 0; index < joined.length - 1; index += 1) grams.push(joined.slice(index, index + 2));
  return grams;
}

// Character-bigram Dice — catches spelling/pluralization drift ("Red Zone" vs
// "Redzone", "Architect" vs "Architects") that whole-token overlap misses.
function diceBigrams(a: string, b: string): number {
  const gramsA = bigrams(a);
  const gramsB = bigrams(b);
  if (!gramsA.length && !gramsB.length) return 1;
  if (!gramsA.length || !gramsB.length) return 0;
  const counts = new Map<string, number>();
  for (const gram of gramsA) counts.set(gram, (counts.get(gram) ?? 0) + 1);
  let intersection = 0;
  for (const gram of gramsB) {
    const remaining = counts.get(gram) ?? 0;
    if (remaining > 0) { intersection += 1; counts.set(gram, remaining - 1); }
  }
  return (2 * intersection) / (gramsA.length + gramsB.length);
}

// Take the more forgiving of word-overlap and character-overlap so neither a
// reordered multi-word name nor a one-character typo alone sinks a real match.
function similarity(a: string, b: string): number {
  return Math.max(diceTokens(contentTokens(a), contentTokens(b)), diceBigrams(a, b));
}

interface PairScore {
  score: number;
  exactManager: boolean;
}

function pairScore(team: MappableTeam, candidate: MappingCandidate): PairScore {
  const name = similarity(team.name, candidate.name);

  const teamManager = (team.manager ?? "").trim();
  const candidateManager = (candidate.manager ?? "").trim();
  const managerAvailable = Boolean(teamManager && candidateManager);
  const exactManager = managerAvailable
    && contentTokens(teamManager).join(" ") === contentTokens(candidateManager).join(" ");
  const manager = managerAvailable ? similarity(teamManager, candidateManager) : null;

  const teamCity = (team.city ?? "").trim();
  const candidateCity = (candidate.city ?? "").trim();
  const cityAvailable = Boolean(teamCity && candidateCity);
  const city = cityAvailable ? similarity(teamCity, candidateCity) : null;

  // Weighted mean over the signals actually present. The manager (the human
  // owner) is the most reliable join when both leagues carry it — the fantasy
  // display name drifts season to season — so it carries the most weight.
  const parts: Array<[value: number, weight: number]> = [[name, 0.5]];
  if (manager != null) parts.push([manager, 0.9]);
  if (city != null) parts.push([city, 0.25]);
  const totalWeight = parts.reduce((sum, [, weight]) => sum + weight, 0);
  let score = parts.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;

  // Same owner, spelled the same, is all but definitive inside one league — pull
  // it into the confident band even when the team names look nothing alike.
  if (exactManager) score = Math.max(score, 0.9);

  return { score, exactManager };
}

/**
 * Propose one external roster per LeagueWeaver team. Pairs are scored, then
 * assigned greedily highest-first so each roster maps to at most one team — the
 * same one-to-one relationship score sync assumes. Deterministic for identical
 * input. Teams below the review floor come back unmatched (providerId: null) so
 * the commissioner picks them by hand rather than trusting a weak guess.
 */
export function autoMatchTeams(teams: MappableTeam[], candidates: MappingCandidate[]): TeamMatch[] {
  const pairs: Array<{ teamIndex: number; candidateIndex: number; score: number }> = [];
  teams.forEach((team, teamIndex) => {
    candidates.forEach((candidate, candidateIndex) => {
      pairs.push({ teamIndex, candidateIndex, score: pairScore(team, candidate).score });
    });
  });
  // Score desc, then stable by indices so equal scores never depend on input
  // iteration order — the whole function must be reproducible.
  pairs.sort((a, b) => b.score - a.score || a.teamIndex - b.teamIndex || a.candidateIndex - b.candidateIndex);

  const teamTaken = new Array(teams.length).fill(false);
  const candidateTaken = new Array(candidates.length).fill(false);
  const assigned = new Map<number, { candidateIndex: number; score: number }>();
  for (const pair of pairs) {
    if (pair.score < MATCH_THRESHOLDS.review) break; // sorted desc: nothing usable remains
    if (teamTaken[pair.teamIndex] || candidateTaken[pair.candidateIndex]) continue;
    teamTaken[pair.teamIndex] = true;
    candidateTaken[pair.candidateIndex] = true;
    assigned.set(pair.teamIndex, { candidateIndex: pair.candidateIndex, score: pair.score });
  }

  return teams.map((team, teamIndex) => {
    const match = assigned.get(teamIndex);
    if (!match) return { leagueTeamId: team.id, providerId: null, confidence: "none", score: 0 };
    return {
      leagueTeamId: team.id,
      providerId: candidates[match.candidateIndex].providerId,
      confidence: match.score >= MATCH_THRESHOLDS.high ? "high" : "review",
      score: match.score,
    };
  });
}
