import { NextResponse } from "next/server";
import type { ImportPreview, PriorSeasonFinishEntry } from "@/lib/types";
import { fetchSleeperPriorFinish, resolveSleeperLeagueId, scanSleeperHistory, sleeperAvatarUrl, sleeperFetch, type SleeperLeague, type SleeperRoster, type SleeperUser } from "@/lib/platform/sleeper";
import { applyPriorFinish } from "@/lib/platform/priorFinish";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string; seasonYear?: number };
    const identifier = body.identifier?.trim() ?? "";
    const seasonYear = Number(body.seasonYear);
    if (!identifier || !Number.isInteger(seasonYear)) return NextResponse.json({ error: "Enter a Sleeper league ID or username and season." }, { status: 400 });

    const { leagueId, warnings } = await resolveSleeperLeagueId(identifier, seasonYear);

    const [league, users, rosters] = await Promise.all([
      sleeperFetch<SleeperLeague>(`/league/${encodeURIComponent(leagueId)}`),
      sleeperFetch<SleeperUser[]>(`/league/${encodeURIComponent(leagueId)}/users`),
      sleeperFetch<SleeperRoster[]>(`/league/${encodeURIComponent(leagueId)}/rosters`),
    ]);
    const usersById = new Map(users.map((user) => [user.user_id, user]));
    // Last season's finish, matched by owner id (roster ids change between seasons).
    // Never block the import if the history walk fails.
    const priorFinish: PriorSeasonFinishEntry[] = await fetchSleeperPriorFinish(league.league_id).catch(() => []);
    const finish = applyPriorFinish(rosters.map((roster) => ({ ownerId: roster.owner_id ?? undefined, providerTeamId: String(roster.roster_id) })), priorFinish);
    const teams = rosters.map((roster, index) => {
      const owner = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
      const seed = finish.perTeam[index];
      return {
        providerId: `sleeper-${league.league_id}-${roster.roster_id}`,
        name: owner?.metadata?.team_name?.trim() || owner?.display_name?.trim() || `Roster ${roster.roster_id}`,
        manager: owner?.display_name?.trim() || "",
        division: roster.settings?.division ? `Division ${roster.settings.division}` : "",
        rank: seed?.rank ?? index + 1,
        regularSeasonRank: seed?.regularSeasonRank,
        playoffRank: seed?.playoffRank,
        isNewManager: seed?.isNewManager,
        logoUrl: sleeperAvatarUrl(owner?.avatar),
      };
    });
    const dataFound = await scanSleeperHistory(league.league_id).catch(() => ({ availableHistoryYears: [Number(league.season) || seasonYear], blockedHistoryYears: [], hasDraftData: true, hasRosterData: false, hasPlayerData: false, hasScoreSync: true }));

    const preview: ImportPreview = {
      provider: "sleeper",
      providerLeagueId: league.league_id,
      leagueName: league.name || "Sleeper league",
      leagueLogoUrl: sleeperAvatarUrl(league.avatar),
      seasonYear: Number(league.season) || seasonYear,
      teams,
      dataFound,
      authType: "public",
      syncMode: "manual",
      hasPriorSeasonRanks: finish.hasData,
      warnings: [
        "Sleeper uses a read-only public API. League Weaver cannot edit your Sleeper league.",
        ...warnings,
        ...(finish.hasData ? [`Seeded from the ${(Number(league.season) || seasonYear) - 1} regular-season finish. Switch to playoff finish in the Seeding step.`] : []),
        ...(finish.newbieCount ? [`${finish.newbieCount} new manager${finish.newbieCount === 1 ? "" : "s"} had no last-season finish, so they're seeded last — adjust anytime in Seeding.`] : []),
      ],
      requiresConfirmation: true,
    };
    return NextResponse.json(preview);
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const looksTechnical = !raw || /fetch|json|token|undefined|network|econn|timeout|failed to|cannot read|is not |\bat \b/i.test(raw);
    const message = looksTechnical ? "That Sleeper league could not be imported. Check the league ID or username and try again." : raw;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
