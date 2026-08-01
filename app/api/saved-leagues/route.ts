import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const savedLeagueSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  data: z.object({
    version: z.literal(3),
    league: z.object({
      name: z.string().max(80), abbreviation: z.string().max(6), initials: z.string().max(4).optional(), description: z.string().max(220), color: z.string(), logoUrl: z.string().optional(),
    }),
    divisions: z.array(z.unknown()).min(2).max(8),
    teams: z.array(z.unknown()).min(8).max(32),
    display: z.object({ cityNames: z.boolean(), managers: z.boolean(), venues: z.boolean() }),
    priorSeason: z.unknown().optional(),
    platformConnection: z.unknown().optional(),
    playoffs: z.object({
      name: z.string().max(80),
      color: z.string(),
      theme: z.enum(["gold", "silver", "bronze", "custom"]),
      logoUrl: z.string().optional(),
      roundNames: z.array(z.string().max(40)).optional(),
      roundLogoUrls: z.array(z.string()).optional(),
      gameNames: z.record(z.string(), z.string().max(60)).optional(),
      gameLogoUrls: z.record(z.string(), z.string()).optional(),
    }).optional(),
  }),
});

async function authenticatedClient() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return !error && userId ? { supabase, userId } : null;
}

export async function GET() {
  const auth = await authenticatedClient();
  if (!auth) return NextResponse.json({ presets: [] }, { status: 200 });
  const { data, error } = await auth.supabase.from("saved_leagues").select("id,name,data,updated_at").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Saved leagues could not be loaded." }, { status: 500 });
  return NextResponse.json({ presets: data });
}

export async function POST(request: Request) {
  const auth = await authenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in to save this league for next season." }, { status: 401 });
  const parsed = savedLeagueSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Check the league, divisions, and team entries before saving." }, { status: 400 });
  const payload = { user_id: auth.userId, name: parsed.data.name, data: parsed.data.data };
  const query = parsed.data.id
    ? auth.supabase.from("saved_leagues").update(payload).eq("id", parsed.data.id).select("id,name,data,updated_at").single()
    : auth.supabase.from("saved_leagues").insert(payload).select("id,name,data,updated_at").single();
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "This league could not be saved." }, { status: 500 });
  return NextResponse.json({ preset: data });
}

export async function DELETE(request: Request) {
  const auth = await authenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Choose a saved league." }, { status: 400 });
  const { error } = await auth.supabase.from("saved_leagues").delete().eq("id", id);
  return error ? NextResponse.json({ error: "That saved league could not be removed." }, { status: 500 }) : NextResponse.json({ removed: true });
}
