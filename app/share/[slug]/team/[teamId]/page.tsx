import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicTeamScheduleView } from "@/components/share/PublicTeamScheduleView";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamDisplayName } from "@/lib/teamIdentity";
import type { GeneratedSchedule } from "@/lib/types";

async function loadPublishedSchedule(slug: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("published_schedules")
    .select("schedule_json")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data?.schedule_json as GeneratedSchedule | undefined) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; teamId: string }> }): Promise<Metadata> {
  const { slug, teamId } = await params;
  const schedule = await loadPublishedSchedule(slug);
  const team = schedule?.setup.teams.find((item) => item.id === teamId);
  if (!schedule || !team) return { title: "Team schedule" };
  return {
    title: `${teamDisplayName(team, schedule.setup.display?.cityNames !== false)} - ${schedule.setup.name}`,
    description: `Public team dashboard for ${schedule.setup.name}.`,
  };
}

export default async function SharedTeamSchedulePage({ params }: { params: Promise<{ slug: string; teamId: string }> }) {
  const { slug, teamId } = await params;
  const schedule = await loadPublishedSchedule(slug);
  if (!schedule || !schedule.setup.teams.some((team) => team.id === teamId)) notFound();
  return <PublicTeamScheduleView schedule={schedule} slug={slug} teamId={teamId} />;
}
