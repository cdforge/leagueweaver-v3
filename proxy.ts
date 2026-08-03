import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const pickemsEnabled = process.env.NEXT_PUBLIC_PICKEMS_ENABLED === "true" || process.env.PICKEMS_ENABLED === "true";
  const path = request.nextUrl.pathname;
  if (!pickemsEnabled && (path.startsWith("/pickem") || path.startsWith("/api/pickem") || path.startsWith("/api/cron/pickem"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pickemLegacy = request.nextUrl.pathname.match(/^\/pickem\/([^/]+)$/);
  if (pickemLegacy && !["new", "join", "pool"].includes(pickemLegacy[1])) {
    const url = request.nextUrl.clone();
    url.pathname = `/pickem/join/${pickemLegacy[1]}`;
    return NextResponse.redirect(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|txt|xml)$).*)"],
};
