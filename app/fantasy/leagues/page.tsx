import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { FantasyDashboard } from "@/components/fantasy/FantasyDashboard";

export const metadata: Metadata = {
  title: "Saved Leagues | League Weaver",
  description: "Reuse saved fantasy football league details in League Weaver.",
};

export default function FantasyLeaguesPage() {
  return <main className="product-page">
    <AppHeader />
    <FantasyDashboard view="leagues" />
  </main>;
}
