import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { FantasyDashboard } from "@/components/fantasy/FantasyDashboard";

export const metadata: Metadata = {
  title: "My Schedules | League Weaver",
  description: "Open saved fantasy football schedules in League Weaver.",
};

export default function FantasySchedulesPage() {
  return <main className="product-page">
    <AppHeader />
    <FantasyDashboard view="schedules" />
  </main>;
}
