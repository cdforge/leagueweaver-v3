import Link from "next/link";
import { CalendarDays, Check, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

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
    <section className="pricing-intro page-width"><p className="eyebrow">MVP release access</p><h1>League Weaver is free for the MVP release.</h1><p>Pro is paused while the base product launches. Build schedules, save seasons, enter scores, and track standings without choosing a plan.</p></section>
    <section className="pricing-layout page-width" aria-label="MVP access">
      <article className="plan-panel plan-pro">
        <div className="plan-recommended"><ShieldCheck />MVP ACCESS</div>
        <div><span>BASE MVP</span><h2>$0</h2><p>The release version is focused on schedule creation and regular-season management.</p></div>
        <Link className="button-primary" href="/build"><CalendarDays />Open the builder</Link>
      </article>
      <article className="plan-panel"><div><span>LATER</span><h2>Pro</h2><p>Playoffs, simulator, and deeper automation can return after the MVP is live and stable.</p></div></article>
    </section>
    <section className="pricing-compare page-width"><div className="pricing-table-head"><strong>Included now</strong><strong>MVP</strong><strong>Later</strong></div>{included.map((label) => <div className="pricing-table-row" key={label}><strong>{label}</strong><span className="pricing-yes"><Check />Included</span><span>Included</span></div>)}</section>
  </main>;
}
