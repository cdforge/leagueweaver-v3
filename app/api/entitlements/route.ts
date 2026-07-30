import { NextResponse } from "next/server";
import { getAuthenticatedClient, getEntitlements } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ signedIn: false, plan: "free", features: [] });
  const scheduleId = new URL(request.url).searchParams.get("scheduleId") || undefined;
  const entitlements = await getEntitlements(auth.userId, auth.supabase, scheduleId);
  return NextResponse.json({ signedIn: true, email: auth.email, displayName: auth.displayName, avatarUrl: auth.avatarUrl, ...entitlements });
}
