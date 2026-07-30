import { NextResponse } from "next/server";
import type { ImportPreview } from "@/lib/types";

const SLEEPER_API = "https://api.sleeper.app/v1";

interface SleeperLeague {
  league_id: string;
  name?: string;
  season?: string;
  avatar?: string | null;
}

interface SleeperUser {
  user_id: string;
  display_name?: string;
  avatar?: string | null;
  metadata?: { team_name?: string };
}

interface SleeperRoster {
  roster_id: number;
  owner_id?: string | null;
  settings?: { division?: number };
}

async function sleeperFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${SLEEPER_API}${path}`, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 404 ? "We couldn't find that Sleeper league or account." : "Sleeper is unavailable right now. Try again in a moment.");
  return response.json() as Promise<T>;
}

function avatarUrl(value?: string | null) {
  return value ? `https://sleepercdn.com/avatars/thumbs/${value}` : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string; seasonYear?: number };
    const identifier = body.identifier?.trim() ?? "";
    const seasonYear = Number(body.seasonYear);
    if (!identifier || !Number.isInteger(seasonYear)) return NextResponse.json({ error: "Enter a Sleeper league ID or username and season." }, { status: 400 });

    let leagueId = identifier;
    const warnings: string[] = [];
    if (!/^\d{5,}$/.test(identifier)) {
      const account = await sleeperFetch<{ user_id?: string }>(`/user/${encodeURIComponent(identifier)}`);
      if (!account.user_id) throw new Error("We couldn't find that Sleeper username.");
      const leagues = await sleeperFetch<SleeperLeague[]>(`/user/${account.user_id}/leagues/nfl/${seasonYear}`);
      if (!leagues.length) throw new Error(`No Sleeper leagues were found for ${seasonYear}.`);
      leagueId = leagues[0].league_id;
      if (leagues.length > 1) warnings.push(`This account has ${leagues.length} leagues. We previewed ${leagues[0].name || "the first one"}; use a league ID to choose another.`);
    }

    const [league, users, rosters] = await Promise.all([
      sleeperFetch<SleeperLeague>(`/league/${encodeURIComponent(leagueId)}`),
      sleeperFetch<SleeperUser[]>(`/league/${encodeURIComponent(leagueId)}/users`),
      sleeperFetch<SleeperRoster[]>(`/league/${encodeURIComponent(leagueId)}/rosters`),
    ]);
    const usersById = new Map(users.map((user) => [user.user_id, user]));
    const teams = rosters.map((roster, index) => {
      const owner = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
      return {
        providerId: `sleeper-${league.league_id}-${roster.roster_id}`,
        name: owner?.metadata?.team_name?.trim() || owner?.display_name?.trim() || `Roster ${roster.roster_id}`,
        manager: owner?.display_name?.trim() || "",
        division: roster.settings?.division ? `Division ${roster.settings.division}` : "",
        rank: index + 1,
        logoUrl: avatarUrl(owner?.avatar),
      };
    });

    const preview: ImportPreview = {
      provider: "sleeper",
      providerLeagueId: league.league_id,
      leagueName: league.name || "Sleeper league",
      leagueLogoUrl: avatarUrl(league.avatar),
      seasonYear: Number(league.season) || seasonYear,
      teams,
      warnings,
      requiresConfirmation: true,
    };
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The Sleeper import failed." }, { status: 400 });
  }
}
