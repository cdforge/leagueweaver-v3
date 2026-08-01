import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicScheduleView } from "@/components/share/PublicScheduleView";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GeneratedSchedule } from "@/lib/types";

const SHARE_DESCRIPTION = "A season schedule woven with LeagueWeaver.";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  let title = "League schedule";
  if (admin) {
    const { data } = await admin.from("published_schedules").select("schedule_json").eq("slug", slug).eq("is_active", true).maybeSingle();
    const schedule = data?.schedule_json as GeneratedSchedule | undefined;
    if (schedule?.setup?.name) title = `${schedule.setup.name}${schedule.setup.seasonYear ? ` — ${schedule.setup.seasonYear} schedule` : " schedule"}`;
  }
  const image = `/api/share-image?slug=${encodeURIComponent(slug)}`;
  return {
    title,
    description: SHARE_DESCRIPTION,
    openGraph: { title, description: SHARE_DESCRIPTION, images: [{ url: image, width: 1200, height: 630 }], type: "website" },
    twitter: { card: "summary_large_image", title, description: SHARE_DESCRIPTION, images: [image] },
  };
}

export default async function SharedSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  if (!admin) notFound();
  const { data } = await admin.from("published_schedules").select("schedule_json").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data?.schedule_json) notFound();
  return <PublicScheduleView schedule={data.schedule_json as GeneratedSchedule} slug={slug} />;
}
