import { canonicalProviderPlayerId, espnSlotKey, mapEspnPlayerWeekStats, sleeperSlotKey, type EspnMatchupPayload, type LineupStatus, type SlotKey } from "@/lib/playerData";
import type { PastChampion, PlatformProvider } from "@/lib/types";
import type { EspnLeague } from "./espn";
import type { SleeperLeague, SleeperMatchup, SleeperRoster, SleeperUser } from "./sleeper";

export interface LeagueSeasonHistoryRow {
  schedule_id: string;
  provider: PlatformProvider;
  provider_league_id: string;
  previous_provider_league_id: string | null;
  season: number;
  league_name: string;
  scoring_type: string | null;
  roster_positions: string[];
  playoff_settings: Record<string, unknown>;
  regular_season_week_count: number | null;
  team_count: number;
}

export interface LeagueTeamHistoryDraftRow {
  providerLeagueId: string;
  season: number;
  league_team_id: string;
  provider_roster_or_team_id: string;
  team_name: string;
  manager_name: string | null;
  division_id: string | null;
  conference_id: string | null;
  final_standing: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  points_for: number | null;
  points_against: number | null;
}

export interface LeagueScheduleHistoryDraftRow {
  providerLeagueId: string;
  season: number;
  week: number;
  provider_matchup_id: string;
  home_league_team_id: string;
  away_league_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "final" | "provisional" | "unknown";
  final_lock_at: string | null;
}

export interface PlayerCatalogDraftRow {
  id: string;
  canonical_name: string;
  normalized_name: string;
  position: string;
  nfl_team: string | null;
  sleeper_id: string | null;
  espn_id: string | null;
  status: "unknown";
}

export interface PlayerOwnershipHistoryDraftRow {
  providerLeagueId: string;
  season: number;
  week: number;
  canonical_player_id: string;
  league_team_id: string;
  provider_player_id: string;
  nfl_team_at_time: string | null;
  position_at_time: string;
  roster_status: LineupStatus;
  lineup_slot: string;
  fantasy_points: number;
}

export interface LeagueHistoryDraft {
  leagueSeasons: LeagueSeasonHistoryRow[];
  teamHistory: LeagueTeamHistoryDraftRow[];
  scheduleHistory: LeagueScheduleHistoryDraftRow[];
  playerCatalog: PlayerCatalogDraftRow[];
  ownershipHistory: PlayerOwnershipHistoryDraftRow[];
  champions: PastChampion[];
  warnings: string[];
}

export interface SleeperHistorySeasonPayload {
  league: SleeperLeague;
  rosters: SleeperRoster[];
  users: SleeperUser[];
  matchupsByWeek: Record<number, SleeperMatchup[]>;
}

export interface EspnHistorySeasonPayload {
  league: EspnLeague;
  playerWeeks?: EspnLeague[];
}

export function espnPublicUnreliableHistoryYears(seasonYear: number, lookback = 8) {
  const startYear = Math.max(2017, seasonYear - lookback);
  return Array.from({ length: seasonYear - startYear + 1 }, (_, index) => startYear + index).filter((year) => year < 2018);
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveNumberValue(value: unknown) {
  const parsed = numberValue(value);
  return parsed && parsed > 0 ? parsed : null;
}

function wholePlusDecimal(whole: unknown, decimal: unknown) {
  const base = numberValue(whole);
  if (base == null) return null;
  const cents = numberValue(decimal) ?? 0;
  return Number((base + cents / 100).toFixed(2));
}

function boundedWeek(value: unknown) {
  const parsed = numberValue(value);
  return parsed && parsed >= 1 && parsed <= 18 ? parsed : null;
}

function sleeperLeagueTeamId(providerLeagueId: string, rosterId: string | number) {
  return `sleeper-${providerLeagueId}-${rosterId}`;
}

function espnLeagueTeamId(providerLeagueId: string, teamId: string | number) {
  return `espn-${providerLeagueId}-${teamId}`;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function sleeperStandings(rosters: SleeperRoster[]) {
  return [...rosters].sort((left, right) => {
    const leftWins = numberValue(left.settings?.wins) ?? 0;
    const rightWins = numberValue(right.settings?.wins) ?? 0;
    const leftLosses = numberValue(left.settings?.losses) ?? 0;
    const rightLosses = numberValue(right.settings?.losses) ?? 0;
    const leftPoints = wholePlusDecimal(left.settings?.fpts, left.settings?.fpts_decimal) ?? 0;
    const rightPoints = wholePlusDecimal(right.settings?.fpts, right.settings?.fpts_decimal) ?? 0;
    return rightWins - leftWins || rightPoints - leftPoints || leftLosses - rightLosses || left.roster_id - right.roster_id;
  }).map((roster, index) => [roster.roster_id, index + 1] as const);
}

function sleeperTeamName(roster: SleeperRoster, user?: SleeperUser) {
  return roster.metadata?.team_name || user?.metadata?.team_name || user?.display_name || `Roster ${roster.roster_id}`;
}

function espnTeamName(team: NonNullable<EspnLeague["teams"]>[number]) {
  return [team.location, team.nickname].filter(Boolean).join(" ").trim() || team.name || `Team ${team.id}`;
}

function espnRecordValue(record: unknown, key: "wins" | "losses" | "ties" | "pointsFor" | "pointsAgainst") {
  const root = record && typeof record === "object" ? record as Record<string, unknown> : {};
  const overall = root.overall && typeof root.overall === "object" ? root.overall as Record<string, unknown> : root;
  return numberValue(overall[key]);
}

function matchupStatus(left?: SleeperMatchup, right?: SleeperMatchup): LeagueScheduleHistoryDraftRow["status"] {
  if (!left || !right) return "unknown";
  return typeof left.points === "number" && typeof right.points === "number" ? "final" : "scheduled";
}

function ownershipStatus(playerId: string, matchup: SleeperMatchup): LineupStatus {
  if (matchup.starters?.includes(playerId)) return "starter";
  if (matchup.players?.includes(playerId) || playerId in (matchup.players_points ?? {})) return "bench";
  return "unknown";
}

function ownershipSlot(playerId: string, matchup: SleeperMatchup, rosterPositions: string[]) {
  const starterIndex = matchup.starters?.indexOf(playerId) ?? -1;
  const rawSlot = starterIndex >= 0 ? rosterPositions[starterIndex] : "BN";
  const slot: SlotKey = starterIndex >= 0 ? sleeperSlotKey(String(rawSlot)) : "BENCH";
  return { rawSlot: String(rawSlot), slot };
}

export function buildSleeperLeagueHistoryDraft(scheduleId: string, seasons: SleeperHistorySeasonPayload[]): LeagueHistoryDraft {
  const leagueSeasons: LeagueSeasonHistoryRow[] = [];
  const teamHistory: LeagueTeamHistoryDraftRow[] = [];
  const scheduleHistory: LeagueScheduleHistoryDraftRow[] = [];
  const ownershipHistory: PlayerOwnershipHistoryDraftRow[] = [];
  const catalog = new Map<string, PlayerCatalogDraftRow>();
  const champions: PastChampion[] = [];
  const warnings: string[] = [];

  for (const seasonPayload of seasons) {
    const { league, rosters, users, matchupsByWeek } = seasonPayload;
    const season = Number(league.season);
    if (!Number.isInteger(season)) {
      warnings.push(`Sleeper league ${league.league_id} did not include a valid season.`);
      continue;
    }
    const userById = new Map(users.map((user) => [user.user_id, user]));
    const rankByRoster = new Map(sleeperStandings(rosters));
    const teamCount = numberValue(league.settings?.num_teams) ?? rosters.length;
    const regularWeeks = boundedWeek(league.settings?.last_scored_leg ?? league.settings?.leg);
    leagueSeasons.push({
      schedule_id: scheduleId,
      provider: "sleeper",
      provider_league_id: league.league_id,
      previous_provider_league_id: league.previous_league_id ?? null,
      season,
      league_name: league.name || `Sleeper ${season}`,
      scoring_type: league.settings?.best_ball ? "best_ball" : "head_to_head",
      roster_positions: league.roster_positions ?? [],
      playoff_settings: {
        playoff_teams: league.settings?.playoff_teams ?? null,
        playoff_week_start: league.settings?.playoff_week_start ?? null,
        playoff_type: league.settings?.playoff_type ?? null,
      },
      regular_season_week_count: regularWeeks,
      team_count: teamCount,
    });

    for (const roster of rosters) {
      const user = roster.owner_id ? userById.get(roster.owner_id) : undefined;
      const teamName = sleeperTeamName(roster, user);
      const pointsFor = wholePlusDecimal(roster.settings?.fpts, roster.settings?.fpts_decimal);
      const pointsAgainst = wholePlusDecimal(roster.settings?.fpts_against, roster.settings?.fpts_against_decimal);
      const finalStanding = rankByRoster.get(roster.roster_id) ?? null;
      teamHistory.push({
        providerLeagueId: league.league_id,
        season,
        league_team_id: sleeperLeagueTeamId(league.league_id, roster.roster_id),
        provider_roster_or_team_id: String(roster.roster_id),
        team_name: teamName,
        manager_name: user?.display_name ?? null,
        division_id: roster.settings?.division == null ? null : String(roster.settings.division),
        conference_id: null,
        final_standing: finalStanding,
        wins: numberValue(roster.settings?.wins),
        losses: numberValue(roster.settings?.losses),
        ties: numberValue(roster.settings?.ties),
        points_for: pointsFor,
        points_against: pointsAgainst,
      });
      if (finalStanding === 1) {
        champions.push({
          season,
          provider: "sleeper",
          providerLeagueId: league.league_id,
          leagueName: league.name || `Sleeper ${season}`,
          teamName,
          managerName: user?.display_name,
          wins: numberValue(roster.settings?.wins) ?? undefined,
          losses: numberValue(roster.settings?.losses) ?? undefined,
          ties: numberValue(roster.settings?.ties) ?? undefined,
          pointsFor: pointsFor ?? undefined,
        });
      }
    }

    for (const [weekKey, weekMatchups] of Object.entries(matchupsByWeek)) {
      const week = Number(weekKey);
      if (!Number.isInteger(week) || week < 1 || week > 18) continue;
      const grouped = new Map<string, SleeperMatchup[]>();
      for (const matchup of weekMatchups) {
        if (matchup.matchup_id == null) continue;
        const key = String(matchup.matchup_id);
        grouped.set(key, [...(grouped.get(key) ?? []), matchup]);
        const playerIds = new Set([...(matchup.players ?? []), ...(matchup.starters ?? []), ...Object.keys(matchup.players_points ?? {})]);
        for (const providerPlayerId of playerIds) {
          const canonicalId = canonicalProviderPlayerId("sleeper", providerPlayerId);
          const slot = ownershipSlot(providerPlayerId, matchup, league.roster_positions ?? []);
          catalog.set(canonicalId, {
            id: canonicalId,
            canonical_name: providerPlayerId,
            normalized_name: normalizeName(providerPlayerId),
            position: slot.slot,
            nfl_team: null,
            sleeper_id: providerPlayerId,
            espn_id: null,
            status: "unknown",
          });
          ownershipHistory.push({
            providerLeagueId: league.league_id,
            season,
            week,
            canonical_player_id: canonicalId,
            league_team_id: sleeperLeagueTeamId(league.league_id, matchup.roster_id),
            provider_player_id: providerPlayerId,
            nfl_team_at_time: null,
            position_at_time: slot.slot,
            roster_status: ownershipStatus(providerPlayerId, matchup),
            lineup_slot: slot.rawSlot,
            fantasy_points: numberValue(matchup.players_points?.[providerPlayerId]) ?? 0,
          });
        }
      }
      for (const [matchupId, sides] of grouped) {
        const [away, home] = [...sides].sort((left, right) => left.roster_id - right.roster_id);
        if (!away || !home) continue;
        scheduleHistory.push({
          providerLeagueId: league.league_id,
          season,
          week,
          provider_matchup_id: `sleeper:${league.league_id}:week-${week}:matchup-${matchupId}`,
          home_league_team_id: sleeperLeagueTeamId(league.league_id, home.roster_id),
          away_league_team_id: sleeperLeagueTeamId(league.league_id, away.roster_id),
          home_score: numberValue(home.points),
          away_score: numberValue(away.points),
          status: matchupStatus(away, home),
          final_lock_at: matchupStatus(away, home) === "final" ? new Date().toISOString() : null,
        });
      }
    }
  }

  champions.sort((left, right) => right.season - left.season);
  return { leagueSeasons, teamHistory, scheduleHistory, playerCatalog: [...catalog.values()], ownershipHistory, champions, warnings };
}

function espnMatchupStatus(left?: { totalPoints?: number }, right?: { totalPoints?: number }): LeagueScheduleHistoryDraftRow["status"] {
  if (!left || !right) return "unknown";
  return typeof left.totalPoints === "number" && typeof right.totalPoints === "number" ? "final" : "scheduled";
}

function espnMemberName(league: EspnLeague, team: NonNullable<EspnLeague["teams"]>[number]) {
  const ownerId = team.primaryOwner ?? team.owners?.[0];
  const member = ownerId ? league.members?.find((item) => item.id === ownerId) : undefined;
  return member?.displayName || [member?.firstName, member?.lastName].filter(Boolean).join(" ").trim() || null;
}

function espnRegularSeasonWeeks(league: EspnLeague) {
  const setting = league.settings?.scheduleSettings?.matchupPeriodCount;
  return boundedWeek(setting) ?? Math.max(0, ...(league.schedule ?? []).map((matchup) => matchup.matchupPeriodId).filter((week) => week >= 1 && week <= 18));
}

function espnPlayoffSettings(league: EspnLeague) {
  const settings = league.settings?.scheduleSettings;
  const regularWeeks = espnRegularSeasonWeeks(league);
  const maxWeek = Math.max(0, ...(league.schedule ?? []).map((matchup) => matchup.matchupPeriodId).filter((week) => week >= 1 && week <= 18));
  const playoffWeekStart = regularWeeks ? regularWeeks + 1 : null;
  return {
    playoff_teams: numberValue(settings?.playoffTeamCount),
    playoff_week_start: playoffWeekStart && playoffWeekStart <= 18 ? playoffWeekStart : null,
    playoff_weeks: regularWeeks && maxWeek > regularWeeks ? maxWeek - regularWeeks : null,
    playoff_matchup_period_length: numberValue(settings?.playoffMatchupPeriodLength),
    playoff_reseed: settings?.playoffReseed ?? null,
    playoff_seeding_rule: settings?.playoffSeedingRule ?? null,
    playoff_seeding_rule_by: numberValue(settings?.playoffSeedingRuleBy),
    matchup_period_length: numberValue(settings?.matchupPeriodLength),
    variable_playoff_matchup_period_length: settings?.variablePlayoffMatchupPeriodLength ?? null,
    divisions: (settings?.divisions ?? []).map((division) => ({
      id: division.id,
      name: division.name ?? null,
      size: numberValue(division.size),
    })),
  };
}

export function buildEspnLeagueHistoryDraft(scheduleId: string, seasons: EspnHistorySeasonPayload[]): LeagueHistoryDraft {
  const leagueSeasons: LeagueSeasonHistoryRow[] = [];
  const teamHistory: LeagueTeamHistoryDraftRow[] = [];
  const scheduleHistory: LeagueScheduleHistoryDraftRow[] = [];
  const ownershipHistory: PlayerOwnershipHistoryDraftRow[] = [];
  const catalog = new Map<string, PlayerCatalogDraftRow>();
  const champions: PastChampion[] = [];
  const warnings: string[] = [];

  for (const seasonPayload of seasons) {
    const { league } = seasonPayload;
    const providerLeagueId = String(league.id);
    const season = Number(league.seasonId);
    if (!Number.isInteger(season)) {
      warnings.push(`ESPN league ${providerLeagueId} did not include a valid season.`);
      continue;
    }
    const teams = league.teams ?? [];
    const regularWeeks = espnRegularSeasonWeeks(league);
    leagueSeasons.push({
      schedule_id: scheduleId,
      provider: "espn",
      provider_league_id: providerLeagueId,
      previous_provider_league_id: null,
      season,
      league_name: league.settings?.name || `ESPN ${season}`,
      scoring_type: "head_to_head",
      roster_positions: Object.entries(league.settings?.rosterSettings?.lineupSlotCounts ?? {}).flatMap(([slot, count]) => Array.from({ length: Number(count) || 0 }, () => slot)),
      playoff_settings: espnPlayoffSettings(league),
      regular_season_week_count: regularWeeks || null,
      team_count: teams.length,
    });

    for (const team of teams) {
      const teamName = espnTeamName(team);
      const finalStanding = positiveNumberValue(team.rankCalculatedFinal);
      const wins = espnRecordValue(team.record, "wins");
      const losses = espnRecordValue(team.record, "losses");
      const ties = espnRecordValue(team.record, "ties");
      const pointsFor = espnRecordValue(team.record, "pointsFor");
      teamHistory.push({
        providerLeagueId,
        season,
        league_team_id: espnLeagueTeamId(providerLeagueId, team.id),
        provider_roster_or_team_id: String(team.id),
        team_name: teamName,
        manager_name: espnMemberName(league, team),
        division_id: team.divisionId == null ? null : String(team.divisionId),
        conference_id: null,
        final_standing: finalStanding,
        wins,
        losses,
        ties,
        points_for: pointsFor,
        points_against: espnRecordValue(team.record, "pointsAgainst"),
      });
      if (finalStanding === 1) {
        champions.push({
          season,
          provider: "espn",
          providerLeagueId,
          leagueName: league.settings?.name || `ESPN ${season}`,
          teamName,
          managerName: espnMemberName(league, team) ?? undefined,
          wins: wins ?? undefined,
          losses: losses ?? undefined,
          ties: ties ?? undefined,
          pointsFor: pointsFor ?? undefined,
        });
      }
    }

    const virtualTeams = teams.map((team) => ({
      id: espnLeagueTeamId(providerLeagueId, team.id),
      city: "",
      name: espnTeamName(team),
      shortName: team.abbrev || espnTeamName(team).slice(0, 12),
      manager: espnMemberName(league, team) ?? "",
      color: "#117a45",
      divisionId: team.divisionId == null ? "0" : String(team.divisionId),
      overallRank: positiveNumberValue(team.rankCalculatedFinal) ?? team.id,
      stadium: "",
      providerId: espnLeagueTeamId(providerLeagueId, team.id),
    }));
    const playerPayloads = seasonPayload.playerWeeks?.length ? seasonPayload.playerWeeks : [league];
    const playerRows = playerPayloads.flatMap((payload) => mapEspnPlayerWeekStats({
      scheduleId,
      providerLeagueId,
      season,
      teams: virtualTeams,
      schedule: (payload.schedule ?? []) as EspnMatchupPayload[],
    }));
    for (const row of playerRows) {
      ownershipHistory.push({
        providerLeagueId,
        season,
        week: row.week,
        canonical_player_id: row.canonicalPlayerId,
        league_team_id: row.teamId,
        provider_player_id: row.providerPlayerId,
        nfl_team_at_time: null,
        position_at_time: row.inferredSlot,
        roster_status: row.lineupStatus,
        lineup_slot: String(row.rawSlot ?? row.inferredSlot),
        fantasy_points: row.points,
      });
    }
    for (const payload of playerPayloads) {
        for (const playerMatchup of payload.schedule ?? []) {
          for (const side of [playerMatchup.home, playerMatchup.away]) {
            for (const entry of side?.rosterForCurrentScoringPeriod?.entries ?? []) {
              const providerPlayerId = String(entry.playerId ?? entry.playerPoolEntry?.player?.id ?? "");
              if (!providerPlayerId) continue;
              const player = entry.playerPoolEntry?.player;
              const canonicalId = canonicalProviderPlayerId("espn", providerPlayerId);
              const position = espnSlotKey(entry.lineupSlotId ?? -1);
              const name = player?.fullName || [player?.firstName, player?.lastName].filter(Boolean).join(" ").trim() || providerPlayerId;
              catalog.set(canonicalId, {
                id: canonicalId,
                canonical_name: name,
                normalized_name: normalizeName(name),
                position,
                nfl_team: player?.proTeamId == null ? null : String(player.proTeamId),
                sleeper_id: null,
                espn_id: providerPlayerId,
                status: "unknown",
              });
            }
          }
        }
      }

    for (const matchup of league.schedule ?? []) {
      if (!matchup.home?.teamId || !matchup.away?.teamId) continue;
      const status = espnMatchupStatus(matchup.away, matchup.home);
      scheduleHistory.push({
        providerLeagueId,
        season,
        week: matchup.matchupPeriodId,
        provider_matchup_id: `espn:${providerLeagueId}:week-${matchup.matchupPeriodId}:matchup-${matchup.id}`,
        home_league_team_id: espnLeagueTeamId(providerLeagueId, matchup.home.teamId),
        away_league_team_id: espnLeagueTeamId(providerLeagueId, matchup.away.teamId),
        home_score: numberValue(matchup.home.totalPoints),
        away_score: numberValue(matchup.away.totalPoints),
        status,
        final_lock_at: status === "final" ? new Date(season, 11, 31).toISOString() : null,
      });
    }
  }

  champions.sort((left, right) => right.season - left.season);
  return { leagueSeasons, teamHistory, scheduleHistory, playerCatalog: [...catalog.values()], ownershipHistory, champions, warnings };
}
