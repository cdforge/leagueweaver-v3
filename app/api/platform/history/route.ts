import { NextResponse } from "next/server";
import { z } from "zod";
import { parseEspnLeagueId, scanEspnHistory } from "@/lib/platform/espn";
import { resolveSleeperLeagueId, scanSleeperHistory } from "@/lib/platform/sleeper";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import type { ImportHistoryEvent } from "@/lib/types";

const schema = z.object({
  provider: z.enum(["espn", "sleeper"]),
  identifier: z.string().trim().min(1),
  seasonYear: z.number().int().min(2017).max(2200),
  swid: z.string().trim().optional(),
  espnS2: z.string().trim().optional(),
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readSummary(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function eventMessage(summary: Record<string, unknown>, fallback?: string | null) {
  return typeof summary.message === "string" ? summary.message : fallback || undefined;
}

function revisionAction(source?: string | null) {
  if (source === "home_generate") return "Generated season";
  if (source === "manual_save") return "Saved revision";
  if (source === "restore") return "Restored revision";
  return "Saved revision";
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ events: [] }, { status: 401 });
  const scheduleId = new URL(request.url).searchParams.get("scheduleId") || "";
  if (!UUID.test(scheduleId)) return NextResponse.json({ error: "Choose a saved season." }, { status: 400 });

  const events: ImportHistoryEvent[] = [];

  const { data: imports } = await auth.supabase
    .from("import_runs")
    .select("id,provider,status,sanitized_error,summary_json,created_at,committed_at")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false })
    .limit(8);

  for (const item of imports ?? []) {
    const summary = readSummary(item.summary_json);
    events.push({
      id: item.id,
      provider: item.provider,
      action: typeof summary.action === "string" ? summary.action : "Imported data",
      status: item.status,
      createdAt: item.committed_at || item.created_at,
      week: typeof summary.week === "number" ? summary.week : undefined,
      seasonYear: typeof summary.seasonYear === "number" ? summary.seasonYear : undefined,
      message: eventMessage(summary, item.sanitized_error),
      revisionId: typeof summary.revisionId === "string" ? summary.revisionId : undefined,
    });
  }

  const { data: links } = await auth.supabase
    .from("external_league_links")
    .select("id,provider,provider_league_id,sync_status,last_sync_at,sanitized_error,metadata_json,created_at")
    .eq("schedule_id", scheduleId);

  for (const link of links ?? []) {
    const metadata = readSummary(link.metadata_json);
    events.push({
      id: `sync-${link.id}`,
      provider: link.provider,
      action: "Platform score sync",
      status: link.sync_status,
      createdAt: link.last_sync_at || link.created_at,
      seasonYear: typeof metadata.seasonYear === "number" ? metadata.seasonYear : undefined,
      message: link.sanitized_error || `League ${link.provider_league_id}`,
    });
  }

  const { data: revisions } = await auth.supabase
    .from("schedule_revisions")
    .select("id,source,revision_number,summary_json,created_at")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: false })
    .limit(5);

  for (const revision of revisions ?? []) {
    const summary = readSummary(revision.summary_json);
    events.push({
      id: `revision-${revision.id}`,
      provider: "leagueweaver",
      action: revisionAction(revision.source),
      status: "saved",
      createdAt: revision.created_at,
      message: `Revision ${revision.revision_number}`,
      revisionId: revision.id,
      seasonYear: typeof summary.seasonYear === "number" ? summary.seasonYear : undefined,
    });
  }

  events.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return NextResponse.json({ events: events.slice(0, 10) });
}

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
