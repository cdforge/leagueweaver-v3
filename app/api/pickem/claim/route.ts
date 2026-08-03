import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const claimSchema = z.object({
  slug: z.string().min(3),
  teamId: z.string().min(1),
  claimToken: z.string().min(8),
  name: z.string().min(1).max(80),
  email: z.string().email().optional(),
});

function unavailable(message = "That Pick'em team has already been claimed.") {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Pick'em sharing is not configured yet." }, { status: 503 });
  const parsed = claimSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose your team before making picks." }, { status: 400 });

  const { data: pool } = await admin
    .from("pickem_pools")
    .select("id,status,access_mode")
    .eq("public_slug", parsed.data.slug)
    .maybeSingle();
  if (!pool || pool.status !== "active") return NextResponse.json({ error: "This Pick'em pool is not open." }, { status: 404 });
  if (pool.access_mode !== "public") return NextResponse.json({ error: "This Pick'em pool is private." }, { status: 403 });

  const { data: participant } = await admin
    .from("pickem_participants")
    .select("id,claimed_at")
    .eq("pool_id", pool.id)
    .eq("team_id", parsed.data.teamId)
    .eq("claim_token", parsed.data.claimToken)
    .eq("is_active", true)
    .maybeSingle();
  if (!participant) return NextResponse.json({ error: "This invite link does not match an active team." }, { status: 404 });
  if (participant.claimed_at) return unavailable();

  const { data: claimed, error } = await admin
    .from("pickem_participants")
    .update({
      claimed_at: new Date().toISOString(),
      claimed_by_name: parsed.data.name,
      claimed_by_email: parsed.data.email ?? null,
    })
    .eq("id", participant.id)
    .is("claimed_at", null)
    .select("id,display_name")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 503 });
  if (!claimed) return unavailable();
  return NextResponse.json({ participant: claimed });
}
