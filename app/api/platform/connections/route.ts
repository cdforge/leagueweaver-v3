import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedClient, getEntitlements } from "@/lib/supabase/auth";
import { encryptSecret } from "@/lib/platform/crypto";
import { collectAndPersistConnectionHistory, type HistoryPersistenceResult } from "@/lib/platform/historyPersistence";

const connectionSchema = z.object({
  scheduleId: z.string().uuid(),
  provider: z.enum(["espn", "sleeper"]),
  providerLeagueId: z.string().trim().min(1).max(120),
  syncMode: z.enum(["manual", "assisted", "auto"]).default("manual"),
  seasonYear: z.number().int().min(2017).max(2200),
  swid: z.string().trim().optional(),
  espnS2: z.string().trim().optional(),
});

const deleteSchema = z.object({
  scheduleId: z.string().uuid(),
  provider: z.enum(["espn", "sleeper"]),
});

function cleanError(message: string) {
  return message.replace(/espn_s2=[^;\s]+/gi, "espn_s2=[redacted]").replace(/SWID=[^;\s]+/gi, "SWID=[redacted]").slice(0, 500);
}

async function autoCaptureHistory(args: {
  scheduleId: string;
  provider: "espn" | "sleeper";
  providerLeagueId: string;
  seasonYear: number;
  swid?: string;
  espnS2?: string;
}): Promise<HistoryPersistenceResult | { rowsWritten: 0; warnings: string[] }> {
  try {
    return await collectAndPersistConnectionHistory({
      scheduleId: args.scheduleId,
      provider: args.provider,
      providerLeagueId: args.providerLeagueId,
      seasonYear: args.seasonYear,
      espnAuth: args.swid && args.espnS2 ? { swid: args.swid, espnS2: args.espnS2 } : undefined,
    });
  } catch (caught) {
    return { rowsWritten: 0, warnings: [cleanError(caught instanceof Error ? caught.message : "Historical data could not be saved automatically.")] };
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in before saving a platform connection." }, { status: 401 });
  const parsed = connectionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Connection details are incomplete." }, { status: 400 });
  const entitlements = await getEntitlements(auth.userId, auth.supabase, parsed.data.scheduleId);
  const proSync = entitlements.plan === "pro" || entitlements.features.includes("platform_sync");
  const hasPrivateEspn = parsed.data.provider === "espn" && parsed.data.swid && parsed.data.espnS2;
  if ((hasPrivateEspn || parsed.data.syncMode !== "manual") && !proSync) return NextResponse.json({ error: "Deep platform sync is included with Pro." }, { status: 403 });

  const { data: schedule } = await auth.supabase.from("schedules").select("id").eq("id", parsed.data.scheduleId).maybeSingle();
  if (!schedule) return NextResponse.json({ error: "Save this season before connecting platform sync." }, { status: 404 });

  const metadata = {
    seasonYear: parsed.data.seasonYear,
    authType: hasPrivateEspn ? "private-cookie" : "public",
  };
  const { data: link, error } = await auth.supabase.from("external_league_links").upsert({
    user_id: auth.userId,
    schedule_id: parsed.data.scheduleId,
    provider: parsed.data.provider,
    provider_league_id: parsed.data.providerLeagueId,
    sync_enabled: parsed.data.syncMode !== "manual",
    sync_status: "ready",
    sanitized_error: null,
    metadata_json: metadata,
  }, { onConflict: "user_id,provider,provider_league_id" }).select("id").single();
  if (error || !link) return NextResponse.json({ error: "The platform connection could not be saved." }, { status: 500 });

  if (hasPrivateEspn) {
    try {
      const encryptedJson = {
        swid: encryptSecret(parsed.data.swid!),
        espnS2: encryptSecret(parsed.data.espnS2!),
      };
      const { error: credentialError } = await auth.supabase.from("platform_provider_credentials").upsert({
        user_id: auth.userId,
        external_league_link_id: link.id,
        provider: parsed.data.provider,
        credential_json: encryptedJson,
      }, { onConflict: "external_league_link_id" });
      if (credentialError) throw credentialError;
    } catch (caught) {
      await auth.supabase.from("external_league_links").update({ sync_status: "warning", sanitized_error: cleanError(caught instanceof Error ? caught.message : "Credential storage failed.") }).eq("id", link.id);
      return NextResponse.json({ error: "The connection was saved, but ESPN permission could not be encrypted. Add PLATFORM_CREDENTIAL_ENCRYPTION_KEY and try again." }, { status: 500 });
    }
  }

  const historySync = await autoCaptureHistory({
    scheduleId: parsed.data.scheduleId,
    provider: parsed.data.provider,
    providerLeagueId: parsed.data.providerLeagueId,
    seasonYear: parsed.data.seasonYear,
    swid: parsed.data.swid,
    espnS2: parsed.data.espnS2,
  });

  return NextResponse.json({ connectionId: link.id, saved: true, authType: metadata.authType, historySync });
}

export async function DELETE(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in before deleting a platform connection." }, { status: 401 });
  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Connection details are incomplete." }, { status: 400 });
  const { error } = await auth.supabase
    .from("external_league_links")
    .delete()
    .eq("schedule_id", parsed.data.scheduleId)
    .eq("provider", parsed.data.provider);
  if (error) return NextResponse.json({ error: "The connection could not be deleted." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
