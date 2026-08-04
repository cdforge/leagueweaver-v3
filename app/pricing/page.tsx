import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Check, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing",
  description: "League Weaver is free for the MVP release, including schedule generation, saved schedules, manual score entry, standings, CSV and PDF exports, and public sharing.",
  alternates: { canonical: absoluteUrl("/pricing") },
};

const included = [
  "Unlimited schedule generation",
  "Saved schedules and revision history",
  "Manual score entry",
  "Standings",
  "CSV and PDF exports",
  "Public sharing and email updates",
];

export default function PricingPage() {
  return <main className="pricing-page">
    <AppHeader />
    <section className="pricing-intro page-width"><p className="eyebrow">MVP release access</p><h1>League Weaver is free for the MVP release.</h1><p>Build schedules, save seasons, enter scores, and track standings without choosing a plan.</p></section>
    <section className="pricing-layout page-width" aria-label="MVP access">
      <article className="plan-panel plan-pro">
        <div className="plan-recommended"><ShieldCheck />MVP ACCESS</div>
        <div><span>BASE MVP</span><h2>$0</h2><p>The release version is focused on schedule creation and regular-season management.</p></div>
        <Link className="button-primary" href="/build"><CalendarDays />Open the builder</Link>
      </article>
      <article className="plan-panel"><div><span>Included</span><h2>MVP tools</h2><p>Everything listed here is available during the MVP release so commissioners can run the core season flow.</p></div></article>
    </section>
    <section className="pricing-compare page-width"><div className="pricing-table-head"><strong>Included now</strong><strong>MVP</strong><strong>Status</strong></div>{included.map((label) => <div className="pricing-table-row" key={label}><strong>{label}</strong><span className="pricing-yes"><Check />Included</span><span>Available</span></div>)}</section>
  </main>;
}
