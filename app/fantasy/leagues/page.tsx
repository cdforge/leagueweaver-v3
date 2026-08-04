import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { FantasyDashboard } from "@/components/fantasy/FantasyDashboard";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Saved Leagues",
  description: "Reuse saved fantasy football league details in League Weaver.",
  alternates: { canonical: absoluteUrl("/fantasy/leagues") },
};

export default function FantasyLeaguesPage() {
  return <main className="product-page">
    <AppHeader />
    <FantasyDashboard view="leagues" />
  </main>;
}
