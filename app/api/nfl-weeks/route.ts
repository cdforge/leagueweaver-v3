import { NextResponse } from "next/server";
import { getNflWeeks } from "@/lib/schedule";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const season = Number(url.searchParams.get("season")) || new Date().getFullYear();
  const weeks = Number(url.searchParams.get("weeks")) === 13 ? 13 : 14;
  return NextResponse.json({ season, source: "local-fallback", weeks: getNflWeeks(season, weeks) });
}
