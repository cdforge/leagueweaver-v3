import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { FantasyDashboard } from "@/components/fantasy/FantasyDashboard";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "My Schedules",
  description: "Open saved fantasy football schedules in League Weaver.",
  alternates: { canonical: absoluteUrl("/fantasy/schedules") },
};

export default function FantasySchedulesPage() {
  return <main className="product-page">
    <AppHeader />
    <FantasyDashboard view="schedules" />
  </main>;
}
