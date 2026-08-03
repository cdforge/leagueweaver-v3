import Link from "next/link";
import { BrandLockup } from "@/components/AppHeader";
import { PublicPickemClient } from "@/components/pickem/PublicPickemClient";
import { createAdminClient } from "@/lib/supabase/admin";

type PublicPickemPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ team?: string; claim?: string }>;
};

export default async function PublicPickemJoinPage({ params, searchParams }: PublicPickemPageProps) {
  const { slug } = await params;
  const invite = await searchParams;
  const admin = createAdminClient();
  const { data: pool } = admin
    ? await admin.from("pickem_pools").select("id,name,public_slug,settings_json,status,access_mode").eq("public_slug", slug).maybeSingle()
    : { data: null };
  const { data: participants } = admin && pool
    ? await admin.from("pickem_participants").select("team_id,display_name,color,is_active,claimed_at").eq("pool_id", pool.id).eq("is_active", true)
    : { data: [] };
  const currentWeek = Number((pool?.settings_json as { currentWeek?: number } | null)?.currentWeek ?? 1);
  const { data: week } = admin && pool
    ? await admin.from("pickem_weeks").select("id,week").eq("pool_id", pool.id).eq("week", currentWeek).maybeSingle()
    : { data: null };
  const { data: games } = admin && week
    ? await admin.from("pickem_games").select("id,kickoff_at,away_abbr,home_abbr,favorite_side,spread,status").eq("week_id", week.id).order("kickoff_at")
    : { data: [] };

  return <main className="public-pickem-page">
    <header><BrandLockup /></header>
    <section className="public-pickem-hero">
      <span>LeagueWeaver Pick'em</span>
      <h1>{pool?.name ?? "Pick'em pool not available yet"}</h1>
      <p>{pool ? pool.access_mode === "private" ? "This is a private LW Pick'ems pool. Sign in with LeagueWeaver before claiming your spot or submitting picks." : "Claim your team, make your weekly picks, track the board, and follow the standings from one shareable link." : "This Pick'em link is waiting for cloud setup. Ask the commissioner to save and publish the pool."}</p>
      {pool && <div className="public-pickem-actions"><Link href="#standings">View standings</Link><Link href="#picks">Open weekly board</Link></div>}
    </section>
    {pool && <PublicPickemClient
      slug={slug}
      accessMode={pool.access_mode === "private" ? "private" : "public"}
      invitedTeamId={invite?.team}
      claimToken={invite?.claim}
      participants={(participants ?? []).map((participant) => ({
        teamId: participant.team_id,
        name: participant.display_name,
        color: participant.color || "#16bf6f",
        claimed: Boolean(participant.claimed_at),
      }))}
      games={(games ?? []).map((game) => ({
        id: game.id,
        kickoffAt: game.kickoff_at,
        away: game.away_abbr,
        home: game.home_abbr,
        favorite: game.favorite_side || "home",
        spread: Number(game.spread ?? 0),
        status: game.status,
      }))}
    />}
    {pool && <section className="public-pickem-board" id="standings">
      <header><strong>Participants</strong><small>{participants?.length ?? 0} active</small></header>
      <div className="public-pickem-participants">{(participants ?? []).map((participant) => <span key={participant.display_name}><i style={{ background: participant.color || "#16bf6f" }} />{participant.display_name}</span>)}</div>
    </section>}
  </main>;
}
