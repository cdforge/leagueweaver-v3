import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

const draftSchema = z.object({
  poolId: z.string().uuid(),
  picks: z.array(z.object({
    pick: z.number().int().min(1).max(14),
    round: z.number().int().min(1).max(14),
    seed: z.number().int().min(1).max(14),
    participantId: z.string().uuid().optional(),
    nflTeamAbbr: z.string().trim().min(2).max(4).optional(),
    isSuperBowlWinner: z.boolean().optional(),
  })).max(14),
});

export async function PUT(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = draftSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Draft board is incomplete." }, { status: 400 });
  const { data: pool } = await auth.supabase
    .from("pickem_pools")
    .select("id,user_id")
    .eq("id", parsed.data.poolId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!pool) return NextResponse.json({ error: "Pick'em pool could not be found." }, { status: 404 });

  const teams = parsed.data.picks.map((pick) => pick.nflTeamAbbr).filter(Boolean);
  if (new Set(teams).size !== teams.length) return NextResponse.json({ error: "Each NFL playoff team can only be drafted once." }, { status: 409 });

  await auth.supabase.from("pickem_playoff_draft").delete().eq("pool_id", pool.id);
  const rows = parsed.data.picks.map((pick) => ({
    pool_id: pool.id,
    participant_id: pick.participantId ?? null,
    seed: pick.seed,
    pick_number: pick.pick,
    round_number: pick.round,
    nfl_team_abbr: pick.nflTeamAbbr || null,
    is_super_bowl_winner: Boolean(pick.isSuperBowlWinner),
  }));
  if (rows.length) {
    const { error } = await auth.supabase.from("pickem_playoff_draft").insert(rows);
    if (error) return NextResponse.json({ error: "Playoff draft could not be saved." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, saved: rows.length });
}
