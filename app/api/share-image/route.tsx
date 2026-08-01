import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedSchedule } from "@/lib/types";

// Server-rendered season card (1200×630) for a published schedule. Used both as the
// Open Graph preview image for /share/<slug> links and as the file the finale's
// Share button attaches to the native share sheet, so a season shares as a picture.
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim() || "";

  let schedule: GeneratedSchedule | null = null;
  const admin = createAdminClient();
  if (admin && slug) {
    const { data } = await admin
      .from("published_schedules")
      .select("schedule_json")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    schedule = (data?.schedule_json as GeneratedSchedule | undefined) ?? null;
  }

  const name = schedule?.setup?.name?.trim() || "Your league";
  const year = schedule?.setup?.seasonYear ?? "";
  const teams = schedule?.setup?.teams?.length ?? 0;
  const divisions = schedule?.setup?.divisions?.length ?? 0;
  const weeks = schedule?.setup?.weeks ?? schedule?.weeks?.length ?? 0;
  const matchups = schedule?.weeks?.reduce((sum, week) => sum + (week.games?.length ?? 0), 0) ?? 0;
  const stats: { value: number; label: string }[] = [
    { value: teams, label: "TEAMS" },
    { value: divisions, label: "DIVISIONS" },
    { value: weeks, label: "WEEKS" },
    { value: matchups, label: "MATCHUPS" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#06251b",
          backgroundImage: "radial-gradient(1200px 600px at 50% -10%, #0d3626 0%, #06251b 55%, #041510 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "70px",
          border: "10px solid #0e3325",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: "#e3b940", fontWeight: 800, marginBottom: 26 }}>
          {year ? `${year} SEASON` : "SCHEDULE"}
        </div>
        <div style={{ display: "flex", textAlign: "center", fontSize: 78, fontWeight: 800, lineHeight: 1.04, maxWidth: 1000, marginBottom: 50 }}>
          {name}
        </div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 30px" }}>
              <div style={{ display: "flex", fontSize: 68, fontWeight: 800, color: "#e3b940", lineHeight: 1 }}>{String(stat.value)}</div>
              <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.62)", marginTop: 10, letterSpacing: 3 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 58, fontSize: 26, color: "rgba(255,255,255,0.72)", letterSpacing: 4, fontWeight: 700 }}>
          WOVEN WITH LEAGUEWEAVER
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    },
  );
}
