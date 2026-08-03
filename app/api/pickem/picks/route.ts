import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const submitSchema = z.object({
  slug: z.string().min(3),
  teamId: z.string().min(1),
  claimToken: z.string().min(8),
  name: z.string().min(1).max(80),
  email: z.string().email().optional(),
  picks: z.array(z.object({
    gameId: z.string().uuid(),
    choice: z.enum(["away", "home"]),
  })).default([]),
});

function locked(kickoffAt: string, status: string) {
  return status !== "open" || new Date(kickoffAt).getTime() <= Date.now();
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Pick'em sharing is not configured yet." }, { status: 503 });
  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Pick'em submission is incomplete." }, { status: 400 });

  const { data: pool } = await admin
    .from("pickem_pools")
    .select("id,status,access_mode,settings_json")
    .eq("public_slug", parsed.data.slug)
    .maybeSingle();
  if (!pool || pool.status !== "active") return NextResponse.json({ error: "This Pick'em pool is not open." }, { status: 404 });
  if (pool.access_mode !== "public") return NextResponse.json({ error: "This Pick'em pool is private." }, { status: 403 });
  const currentWeek = Number((pool.settings_json as { currentWeek?: number } | null)?.currentWeek ?? 1);

  const { data: participant } = await admin
    .from("pickem_participants")
    .select("id,display_name,claimed_at")
    .eq("pool_id", pool.id)
    .eq("team_id", parsed.data.teamId)
    .eq("claim_token", parsed.data.claimToken)
    .eq("is_active", true)
    .maybeSingle();
  if (!participant) return NextResponse.json({ error: "This invite link does not match an active team." }, { status: 404 });

  if (!participant.claimed_at) {
    const { data: claimed } = await admin
      .from("pickem_participants")
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_name: parsed.data.name,
        claimed_by_email: parsed.data.email ?? null,
      })
      .eq("id", participant.id)
      .is("claimed_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return NextResponse.json({ error: "That Pick'em team has already been claimed." }, { status: 409 });
  }

  const { data: week } = await admin
    .from("pickem_weeks")
    .select("id,week")
    .eq("pool_id", pool.id)
    .eq("week", currentWeek)
    .maybeSingle();
  if (!week) return NextResponse.json({ error: "This Pick'em week is not open yet." }, { status: 404 });

  const { data: games } = await admin
    .from("pickem_games")
    .select("id,kickoff_at,status")
    .eq("week_id", week.id)
    .order("kickoff_at");
  if (!games?.length) return NextResponse.json({ error: "The weekly board has not been published yet." }, { status: 404 });

  const { data: existing } = await admin
    .from("pickem_picks")
    .select("id")
    .eq("pool_id", pool.id)
    .eq("participant_id", participant.id)
    .in("game_id", games.map((game) => game.id))
    .limit(1);
  if (existing?.length) return NextResponse.json({ error: "Picks are already submitted for this team this week." }, { status: 409 });

  const choices = new Map(parsed.data.picks.map((pick) => [pick.gameId, pick.choice]));
  const submittedAt = new Date().toISOString();
  const rows = games.map((game) => ({
    pool_id: pool.id,
    participant_id: participant.id,
    game_id: game.id,
    choice_side: locked(game.kickoff_at, game.status) ? "missed" : choices.get(game.id) ?? "missed",
    submitted_at: submittedAt,
    locked_at: locked(game.kickoff_at, game.status) ? submittedAt : null,
  }));
  const { error } = await admin.from("pickem_picks").insert(rows);
  if (error) return NextResponse.json({ error: "Picks could not be submitted." }, { status: 503 });

  return NextResponse.json({ ok: true, submitted: rows.length, participant: { id: participant.id, name: participant.display_name } });
}
