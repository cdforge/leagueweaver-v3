import { notFound } from "next/navigation";
import { PublicScheduleView } from "@/components/share/PublicScheduleView";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedSchedule } from "@/lib/types";

export default async function SharedSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  if (!admin) notFound();
  const { data } = await admin.from("published_schedules").select("schedule_json").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data?.schedule_json) notFound();
  return <PublicScheduleView schedule={data.schedule_json as GeneratedSchedule} slug={slug} />;
}
