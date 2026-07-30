import { NextResponse } from "next/server";
import { z } from "zod";
import { parseEspnLeagueId, scanEspnHistory } from "@/lib/platform/espn";
import { resolveSleeperLeagueId, scanSleeperHistory } from "@/lib/platform/sleeper";

const schema = z.object({
  provider: z.enum(["espn", "sleeper"]),
  identifier: z.string().trim().min(1),
  seasonYear: z.number().int().min(2017).max(2200),
  swid: z.string().trim().optional(),
  espnS2: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a provider, league, and season." }, { status: 400 });
  try {
    if (parsed.data.provider === "espn") {
      const leagueId = parseEspnLeagueId(parsed.data.identifier);
      if (!leagueId) return NextResponse.json({ error: "Enter an ESPN league URL or ID." }, { status: 400 });
      const auth = parsed.data.swid && parsed.data.espnS2 ? { swid: parsed.data.swid, espnS2: parsed.data.espnS2 } : undefined;
      return NextResponse.json(await scanEspnHistory(leagueId, parsed.data.seasonYear, auth));
    }
    const { leagueId } = await resolveSleeperLeagueId(parsed.data.identifier, parsed.data.seasonYear);
    return NextResponse.json(await scanSleeperHistory(leagueId));
  } catch {
    return NextResponse.json({ error: "History could not be scanned for this league." }, { status: 400 });
  }
}
