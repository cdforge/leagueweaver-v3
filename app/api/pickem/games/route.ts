import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient } from "@/lib/supabase/auth";

const overrideSchema = z.object({
  poolId: z.string().uuid(),
  gameId: z.string().uuid(),
  favorite: z.enum(["away", "home"]).optional(),
  spread: z.number().min(0).max(99).optional(),
  winner: z.enum(["away", "home"]).nullable().optional(),
  status: z.enum(["open", "locked", "final"]).optional(),
});

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = overrideSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Game override is incomplete." }, { status: 400 });

  const { data: pool } = await auth.supabase
    .from("pickem_pools")
    .select("id,user_id")
    .eq("id", parsed.data.poolId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!pool) return NextResponse.json({ error: "Pick'em pool could not be found." }, { status: 404 });

  const update: Record<string, unknown> = {
    override_json: {
      favorite: parsed.data.favorite,
      spread: parsed.data.spread,
      winner: parsed.data.winner,
      status: parsed.data.status,
      updatedAt: new Date().toISOString(),
    },
  };
  if (parsed.data.favorite) update.favorite_side = parsed.data.favorite;
  if (typeof parsed.data.spread === "number") update.spread = parsed.data.spread;
  if (parsed.data.winner !== undefined) update.final_winner_side = parsed.data.winner;
  if (parsed.data.status) update.status = parsed.data.status;

  const { data: game, error } = await auth.supabase
    .from("pickem_games")
    .update(update)
    .eq("id", parsed.data.gameId)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Game override could not be saved." }, { status: 503 });
  if (!game) return NextResponse.json({ error: "Game could not be found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
