import { NextResponse } from "next/server";
import { z } from "zod";

const commitSchema = z.object({
  provider: z.enum(["sleeper", "espn", "csv", "paste", "screenshot"]),
  providerLeagueId: z.string().optional(),
  teams: z.array(z.object({ name: z.string().trim().min(1) })).min(8).max(16),
  requiresConfirmation: z.literal(true),
});

export async function POST(request: Request) {
  const parsed = commitSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.teams.length % 2 !== 0) return NextResponse.json({ error: "Confirm an even roster of 8–16 named teams before importing." }, { status: 400 });
  return NextResponse.json({ accepted: true, teamCount: parsed.data.teams.length, provider: parsed.data.provider });
}
