import type { PlatformProvider, ScheduledGame } from "@/lib/types";

export type ProviderGameLink = {
  provider: PlatformProvider;
  label: string;
  href: string;
};

type ProviderMatchupParts = {
  provider: PlatformProvider;
  providerLeagueId: string;
  week: number;
  matchupId: string;
  providerTeamIds?: [string, string];
};

function normalizedProviderTeamIds(providerTeamIds?: Array<string | number | undefined | null>) {
  const ids = (providerTeamIds ?? [])
    .map((id) => String(id ?? "").trim())
    .filter(Boolean)
    .sort();
  return ids.length === 2 ? [ids[0], ids[1]] as [string, string] : undefined;
}

export function providerMatchupId(provider: PlatformProvider, providerLeagueId: string, week: number, matchupId: string | number, providerTeamIds?: Array<string | number | undefined | null>) {
  const teamIds = normalizedProviderTeamIds(providerTeamIds);
  const teamSegment = teamIds ? `:teams-${teamIds.map(encodeURIComponent).join(",")}` : "";
  return `${provider}:${providerLeagueId}:week-${week}:matchup-${matchupId}${teamSegment}`;
}

export function parseProviderMatchupId(value?: string | null): ProviderMatchupParts | null {
  if (!value) return null;
  const match = value.match(/^(espn|sleeper):([^:]+):week-(\d+):matchup-([^:]+)(?::teams-(.+))?$/);
  if (!match) return null;
  const providerTeamIds = match[5]?.split(",").map((id) => decodeURIComponent(id)).filter(Boolean);
  return {
    provider: match[1] as PlatformProvider,
    providerLeagueId: match[2],
    week: Number(match[3]),
    matchupId: match[4],
    providerTeamIds: providerTeamIds?.length === 2 ? normalizedProviderTeamIds(providerTeamIds) : undefined,
  };
}

export function providerMatchupIdWithTeams(value: string | null | undefined, homeProviderId?: string | null, awayProviderId?: string | null) {
  const parts = parseProviderMatchupId(value);
  if (!parts) return value;
  return providerMatchupId(parts.provider, parts.providerLeagueId, parts.week, parts.matchupId, [homeProviderId, awayProviderId]);
}

export function buildProviderGameLink(game: Pick<ScheduledGame, "homeTeamId" | "awayTeamId" | "providerMatchupId">, seasonYear: number, teams?: Array<{ id: string; providerId?: string | null }>): ProviderGameLink | null {
  const parts = parseProviderMatchupId(game.providerMatchupId);
  if (!parts || !Number.isFinite(parts.week)) return null;
  if (teams?.length) {
    if (!parts.providerTeamIds) return null;
    const teamById = new Map((teams ?? []).map((team) => [team.id, team]));
    const gameProviderTeamIds = normalizedProviderTeamIds([
      teamById.get(game.homeTeamId)?.providerId,
      teamById.get(game.awayTeamId)?.providerId,
    ]);
    if (!gameProviderTeamIds || gameProviderTeamIds.join("|") !== parts.providerTeamIds.join("|")) return null;
  }
  if (parts.provider === "sleeper") {
    return {
      provider: "sleeper",
      label: "Open in Sleeper",
      href: `https://sleeper.com/leagues/${encodeURIComponent(parts.providerLeagueId)}/matchup/${parts.week}?matchup_id=${encodeURIComponent(parts.matchupId)}`,
    };
  }
  const params = new URLSearchParams({
    leagueId: parts.providerLeagueId,
    seasonId: String(seasonYear),
    matchupPeriodId: String(parts.week),
    scoringPeriodId: String(parts.week),
    matchupId: parts.matchupId,
  });
  return {
    provider: "espn",
    label: "Open in ESPN",
    href: `https://fantasy.espn.com/football/boxscore?${params.toString()}`,
  };
}
