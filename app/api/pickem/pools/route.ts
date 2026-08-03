import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import type { PickemAccessMode, PickemGame, PickemParticipant, PickemParticipantSource, PickemPick, PickemPlayoffDraftPick, PickemPool, PickemPoolSource, PickemSettings } from "@/lib/pickem";

const createSchema = z.object({
  scheduleId: z.string().min(1).optional(),
  source: z.enum(["blank", "saved-league", "fantasy-season"]).optional(),
  sourceId: z.string().min(1).optional(),
  savedLeagueId: z.string().min(1).optional(),
  fantasyConnectionId: z.string().min(1).optional(),
  seasonYear: z.number().int().min(2000).max(2100).optional(),
  accessMode: z.enum(["private", "public"]).default("private"),
  name: z.string().min(2).max(120),
  brandColor: z.string().max(24).optional(),
  logoUrl: z.string().max(2000).optional(),
  coverImageUrl: z.string().max(2000).optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  participants: z.array(z.record(z.string(), z.unknown())).default([]),
});

const updateSchema = z.object({
  poolId: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  accessMode: z.enum(["private", "public"]).optional(),
  brandColor: z.string().max(24).optional(),
  logoUrl: z.string().max(2000).nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

function cleanError(message: string) {
  return message.toLowerCase().includes("pickem_") ? "Pick'em tables are not ready yet. Apply the Pick'em Supabase SQL first." : message;
}

type DbPool = {
  id: string;
  schedule_id: string | null;
  source_type: PickemPoolSource | null;
  source_id: string | null;
  saved_league_id: string | null;
  fantasy_connection_id: string | null;
  access_mode: PickemAccessMode | null;
  brand_color: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  name: string;
  season_year: number;
  public_slug: string;
  settings_json: PickemSettings & { currentWeek?: number; startedWeek?: number };
  created_at: string;
};

type DbParticipant = {
  id: string;
  team_id: string | null;
  source_type: PickemParticipantSource | null;
  source_team_id: string | null;
  display_name: string;
  manager_name: string | null;
  color: string | null;
  logo_url?: string | null;
  claim_token: string;
  claimed_at: string | null;
  claimed_by_name: string | null;
  claimed_by_email: string | null;
  email: string | null;
  phone: string | null;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  is_active: boolean;
};

type DbWeek = { id: string; week: number };
type DbGame = {
  id: string;
  week_id: string;
  kickoff_at: string;
  away_abbr: string;
  home_abbr: string;
  favorite_side: "away" | "home" | null;
  spread: number | null;
  final_winner_side: "away" | "home" | null;
  status: "open" | "locked" | "final";
};
type DbPick = { participant_id: string; game_id: string; choice_side: "away" | "home" | "missed"; submitted_at: string };
type DbReminder = { id: string; week: number; created_at: string; channel: "email" | "sms"; sent_count: number };
type DbDraftPick = { pick_number: number; round_number: number; seed: number; participant_id: string | null; nfl_team_abbr: string | null; is_super_bowl_winner: boolean };

function participantSource(value: unknown): PickemParticipantSource {
  return value === "saved-league-team" || value === "fantasy-team" ? value : "manual";
}

async function loadFullPool(supabase: SupabaseClient, pool: DbPool): Promise<PickemPool> {
  const currentWeek = Number(pool.settings_json?.currentWeek ?? 1);
  const [{ data: participants }, { data: weeks }, { data: reminders }, { data: playoffDraft }] = await Promise.all([
    supabase.from("pickem_participants").select("id,team_id,source_type,source_team_id,display_name,manager_name,color,logo_url,claim_token,claimed_at,claimed_by_name,claimed_by_email,email,phone,email_opt_in,sms_opt_in,is_active").eq("pool_id", pool.id).order("created_at"),
    supabase.from("pickem_weeks").select("id,week").eq("pool_id", pool.id).eq("week", currentWeek).maybeSingle(),
    supabase.from("pickem_reminders").select("id,week,created_at,channel,sent_count").eq("pool_id", pool.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("pickem_playoff_draft").select("pick_number,round_number,seed,participant_id,nfl_team_abbr,is_super_bowl_winner").eq("pool_id", pool.id).order("pick_number"),
  ]);
  const week = weeks as DbWeek | null;
  const [{ data: games }, { data: picks }] = week ? await Promise.all([
    supabase.from("pickem_games").select("id,week_id,kickoff_at,away_abbr,home_abbr,favorite_side,spread,final_winner_side,status").eq("week_id", week.id).order("kickoff_at"),
    supabase.from("pickem_picks").select("participant_id,game_id,choice_side,submitted_at").eq("pool_id", pool.id),
  ]) : [{ data: [] }, { data: [] }];
  return {
    id: pool.id,
    scheduleId: pool.schedule_id ?? undefined,
    source: pool.source_type ?? "blank",
    sourceId: pool.source_id ?? undefined,
    savedLeagueId: pool.saved_league_id ?? undefined,
    fantasyConnectionId: pool.fantasy_connection_id ?? undefined,
    accessMode: pool.access_mode ?? "private",
    brandColor: pool.brand_color ?? undefined,
    logoUrl: pool.logo_url ?? undefined,
    coverImageUrl: pool.cover_image_url ?? undefined,
    name: pool.name,
    seasonYear: pool.season_year,
    currentWeek,
    startedWeek: Number(pool.settings_json?.startedWeek ?? 1),
    publicSlug: pool.public_slug,
    launchedAt: pool.created_at,
    settings: pool.settings_json,
    participants: ((participants ?? []) as DbParticipant[]).map((participant): PickemParticipant => ({
      id: participant.id,
      teamId: participant.team_id ?? undefined,
      source: participant.source_type ?? "manual",
      sourceTeamId: participant.source_team_id ?? undefined,
      name: participant.display_name,
      manager: participant.manager_name || participant.display_name,
      color: participant.color || "#117a45",
      logoUrl: participant.logo_url ?? undefined,
      active: participant.is_active,
      claimToken: participant.claim_token,
      claimedAt: participant.claimed_at ?? undefined,
      claimedByName: participant.claimed_by_name ?? undefined,
      claimedByEmail: participant.claimed_by_email ?? undefined,
      email: participant.email ?? undefined,
      phone: participant.phone ?? undefined,
      emailOptIn: participant.email_opt_in,
      smsOptIn: participant.sms_opt_in,
    })),
    games: ((games ?? []) as DbGame[]).map((game): PickemGame => ({
      id: game.id,
      week: currentWeek,
      kickoffAt: game.kickoff_at,
      away: game.away_abbr,
      home: game.home_abbr,
      favorite: game.favorite_side ?? "home",
      spread: Number(game.spread ?? 0),
      finalWinner: game.final_winner_side ?? undefined,
      status: game.status,
    })),
    picks: ((picks ?? []) as DbPick[]).map((pick): PickemPick => ({
      participantId: pick.participant_id,
      gameId: pick.game_id,
      choice: pick.choice_side,
      submittedAt: pick.submitted_at,
    })),
    playoffDraft: ((playoffDraft ?? []) as DbDraftPick[]).map((pick): PickemPlayoffDraftPick => ({
      pick: pick.pick_number,
      round: pick.round_number,
      seed: pick.seed,
      participantId: pick.participant_id ?? undefined,
      nflTeamAbbr: pick.nfl_team_abbr ?? undefined,
      isSuperBowlWinner: pick.is_super_bowl_winner,
    })),
    reminderLog: ((reminders ?? []) as DbReminder[]).map((reminder) => ({
      id: reminder.id,
      week: reminder.week,
      sentAt: reminder.created_at,
      channel: reminder.channel,
      count: reminder.sent_count,
    })),
  };
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ pool: null });
  const params = new URL(request.url).searchParams;
  const poolId = params.get("poolId");
  const scheduleId = params.get("scheduleId");
  const source = params.get("source");
  const sourceId = params.get("sourceId");
  const savedLeagueId = params.get("savedLeagueId");
  const fantasyConnectionId = params.get("fantasyConnectionId");
  const seasonYear = params.get("seasonYear");

  let query = auth.supabase
    .from("pickem_pools")
    .select("id,schedule_id,source_type,source_id,saved_league_id,fantasy_connection_id,access_mode,brand_color,logo_url,cover_image_url,name,season_year,status,public_slug,settings_json,created_at")
    .eq("user_id", auth.userId);
  if (poolId) query = query.eq("id", poolId);
  if (scheduleId) query = query.eq("schedule_id", scheduleId);
  if (source) query = query.eq("source_type", source);
  if (sourceId) query = query.eq("source_id", sourceId);
  if (savedLeagueId) query = query.eq("saved_league_id", savedLeagueId);
  if (fantasyConnectionId) query = query.eq("fantasy_connection_id", fantasyConnectionId);
  if (seasonYear) query = query.eq("season_year", Number(seasonYear));

  const { data, error } = await query.order("created_at", { ascending: false }).limit(poolId ? 1 : 50);
  if (error) return NextResponse.json({ error: cleanError(error.message) }, { status: 503 });
  const pools = await Promise.all(((data ?? []) as DbPool[]).map((pool) => loadFullPool(auth.supabase, pool)));
  return NextResponse.json({ pool: pools[0] ?? null, pools });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in before creating a shareable Pick'em." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Pick'em setup is incomplete." }, { status: 400 });

  let seasonYear = parsed.data.seasonYear ?? new Date().getFullYear();
  if (parsed.data.scheduleId) {
    const { data: schedule } = await auth.supabase.from("schedules").select("id,time_frame").eq("id", parsed.data.scheduleId).maybeSingle();
    if (!schedule) return NextResponse.json({ error: "Save this season before launching a cloud Pick'em." }, { status: 404 });
    seasonYear = typeof schedule.time_frame === "object" && schedule.time_frame && "seasonYear" in schedule.time_frame ? Number(schedule.time_frame.seasonYear) : seasonYear;
  }
  if (parsed.data.savedLeagueId) {
    const { data: savedLeague } = await auth.supabase.from("saved_leagues").select("id").eq("id", parsed.data.savedLeagueId).maybeSingle();
    if (!savedLeague) return NextResponse.json({ error: "Choose a saved league you own." }, { status: 404 });
  }
  if (parsed.data.fantasyConnectionId) {
    const { data: fantasyConnection } = await auth.supabase.from("external_league_links").select("id").eq("id", parsed.data.fantasyConnectionId).maybeSingle();
    if (!fantasyConnection) return NextResponse.json({ error: "Choose a connected fantasy season you own." }, { status: 404 });
  }

  const source = parsed.data.source ?? (parsed.data.fantasyConnectionId ? "fantasy-season" : parsed.data.savedLeagueId || parsed.data.scheduleId ? "saved-league" : "blank");
  const sourceId = parsed.data.sourceId ?? parsed.data.fantasyConnectionId ?? parsed.data.savedLeagueId ?? parsed.data.scheduleId ?? null;
  const slug = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "pickem"}-${randomUUID().slice(0, 6)}`;
  const { data: pool, error } = await auth.supabase.from("pickem_pools").insert({
    user_id: auth.userId,
    schedule_id: parsed.data.scheduleId ?? null,
    source_type: source,
    source_id: sourceId,
    saved_league_id: parsed.data.savedLeagueId ?? null,
    fantasy_connection_id: parsed.data.fantasyConnectionId ?? null,
    access_mode: parsed.data.accessMode,
    brand_color: parsed.data.brandColor ?? null,
    logo_url: parsed.data.logoUrl ?? null,
    cover_image_url: parsed.data.coverImageUrl ?? null,
    name: parsed.data.name,
    season_year: seasonYear,
    status: "active",
    public_slug: slug,
    settings_json: { ...parsed.data.settings, currentWeek: 1, startedWeek: 1 },
  }).select("id,schedule_id,source_type,source_id,saved_league_id,fantasy_connection_id,access_mode,brand_color,logo_url,cover_image_url,name,season_year,status,public_slug,settings_json,created_at").single();
  if (error || !pool) return NextResponse.json({ error: cleanError(error?.message ?? "Pick'em could not be created.") }, { status: 503 });
  const rows = parsed.data.participants.map((participant) => ({
    pool_id: pool.id,
    team_id: String(participant.teamId ?? participant.id ?? randomUUID()),
    source_type: participantSource(participant.source ?? (participant.teamId ? "saved-league-team" : "manual")),
    source_team_id: typeof participant.sourceTeamId === "string" ? participant.sourceTeamId : null,
    display_name: String(participant.name ?? "Participant").slice(0, 80),
    manager_name: String(participant.manager ?? "").slice(0, 80),
    color: String(participant.color ?? "#117a45").slice(0, 20),
    logo_url: typeof participant.logoUrl === "string" ? participant.logoUrl : null,
    claim_token: typeof participant.claimToken === "string" ? participant.claimToken : undefined,
    is_active: participant.active !== false,
    email: typeof participant.email === "string" ? participant.email : null,
    phone: typeof participant.phone === "string" ? participant.phone : null,
    email_opt_in: Boolean(participant.emailOptIn),
    sms_opt_in: Boolean(participant.smsOptIn),
  }));
  if (rows.length) {
    const { error: participantError } = await auth.supabase.from("pickem_participants").insert(rows);
    if (participantError) return NextResponse.json({ error: cleanError(participantError.message) }, { status: 503 });
  }
  await auth.supabase.from("pickem_weeks").upsert({
    pool_id: pool.id,
    week: 1,
    status: "open",
  }, { onConflict: "pool_id,week" });
  const { data: fullPool } = await auth.supabase.from("pickem_pools").select("id,schedule_id,source_type,source_id,saved_league_id,fantasy_connection_id,access_mode,brand_color,logo_url,cover_image_url,name,season_year,status,public_slug,settings_json,created_at").eq("id", pool.id).single();
  return NextResponse.json({ pool: fullPool ? await loadFullPool(auth.supabase, fullPool as DbPool) : pool });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in before updating Pick'em." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Pick'em update is incomplete." }, { status: 400 });

  const { data: existing, error: existingError } = await auth.supabase
    .from("pickem_pools")
    .select("id,settings_json")
    .eq("id", parsed.data.poolId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: cleanError(existingError.message) }, { status: 503 });
  if (!existing) return NextResponse.json({ error: "Pick'em pool could not be found." }, { status: 404 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.name) update.name = parsed.data.name;
  if (parsed.data.accessMode) update.access_mode = parsed.data.accessMode;
  if (parsed.data.brandColor) update.brand_color = parsed.data.brandColor;
  if (parsed.data.logoUrl !== undefined) update.logo_url = parsed.data.logoUrl;
  if (parsed.data.settings) update.settings_json = { ...(existing.settings_json as Record<string, unknown> ?? {}), ...parsed.data.settings };

  const { error: poolError } = await auth.supabase.from("pickem_pools").update(update).eq("id", parsed.data.poolId).eq("user_id", auth.userId);
  if (poolError) return NextResponse.json({ error: cleanError(poolError.message) }, { status: 503 });

  const { data: fullPool } = await auth.supabase.from("pickem_pools").select("id,schedule_id,source_type,source_id,saved_league_id,fantasy_connection_id,access_mode,brand_color,logo_url,cover_image_url,name,season_year,status,public_slug,settings_json,created_at").eq("id", parsed.data.poolId).single();
  return NextResponse.json({ pool: fullPool ? await loadFullPool(auth.supabase, fullPool as DbPool) : null });
}
