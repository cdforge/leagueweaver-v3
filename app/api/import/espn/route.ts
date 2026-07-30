import { NextResponse } from "next/server";
import type { ImportPreview } from "@/lib/types";

interface EspnMember { id: string; displayName?: string; firstName?: string; lastName?: string }
interface EspnTeam { id: number; name?: string; location?: string; nickname?: string; abbrev?: string; logo?: string; primaryOwner?: string; owners?: string[]; divisionId?: number }
interface EspnLeague {
  id: number;
  seasonId?: number;
  members?: EspnMember[];
  teams?: EspnTeam[];
  settings?: { name?: string; scheduleSettings?: { divisions?: Array<{ id: number; name?: string }> } };
}

function parseLeagueId(identifier: string) {
  if (/^\d{4,}$/.test(identifier)) return identifier;
  try {
    const url = new URL(identifier);
    return url.searchParams.get("leagueId") || url.pathname.match(/leagueId\/(\d+)/i)?.[1] || "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string; seasonYear?: number };
    const identifier = body.identifier?.trim() ?? "";
    const seasonYear = Number(body.seasonYear);
    const leagueId = parseLeagueId(identifier);
    if (!leagueId || !Number.isInteger(seasonYear)) return NextResponse.json({ error: "Paste a public ESPN league URL or league ID and choose a season." }, { status: 400 });
    const endpoint = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonYear}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster&view=mSettings`;
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "That ESPN league is private. League Weaver only supports public ESPN data and never asks for cookies or passwords."
        : "We couldn't load that ESPN league. Check the URL, league ID, and season.";
      return NextResponse.json({ error: message }, { status: response.status === 404 ? 404 : 400 });
    }
    const league = await response.json() as EspnLeague;
    const members = new Map((league.members ?? []).map((member) => [member.id, member]));
    const divisions = new Map((league.settings?.scheduleSettings?.divisions ?? []).map((division) => [division.id, division.name || `Division ${division.id}`]));
    const teams = (league.teams ?? []).map((team, index) => {
      const ownerId = team.primaryOwner || team.owners?.[0];
      const owner = ownerId ? members.get(ownerId) : undefined;
      const manager = owner?.displayName || [owner?.firstName, owner?.lastName].filter(Boolean).join(" ");
      return {
        providerId: `espn-${leagueId}-${team.id}`,
        city: team.location || "",
        name: team.nickname || team.name || team.abbrev || `Team ${index + 1}`,
        manager,
        division: team.divisionId ? divisions.get(team.divisionId) || `Division ${team.divisionId}` : "",
        rank: index + 1,
        logoUrl: team.logo || undefined,
      };
    });
    const preview: ImportPreview = {
      provider: "espn",
      providerLeagueId: String(league.id || leagueId),
      leagueName: league.settings?.name || "ESPN league",
      seasonYear: league.seasonId || seasonYear,
      teams,
      warnings: ["ESPN Public Import is in beta. Confirm every team name and division before continuing."],
      requiresConfirmation: true,
    };
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "That ESPN league could not be imported. Check the public URL and try again." }, { status: 400 });
  }
}
