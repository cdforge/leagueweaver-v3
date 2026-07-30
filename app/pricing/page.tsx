import { Check, Minus, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PricingActions } from "@/components/billing/PricingActions";

const rows = [
  ["Complete schedule generation", true, true],
  ["Saved editable seasons", "1", "Unlimited"],
  ["League presets and setup imports", true, true],
  ["PDF and CSV exports", true, true],
  ["Basic fairness report", true, true],
  ["Scores, standings, and playoffs", false, true],
  ["Season simulator", false, true],
  ["Ongoing Sleeper refresh", false, true],
  ["Public sharing and email updates", false, true],
  ["Ads", "Quiet ads", "None"],
] as const;

function Value({ value }: { value: boolean | string }) {
  if (value === true) return <span className="pricing-yes"><Check />Included</span>;
  if (value === false) return <span className="pricing-no"><Minus />Not included</span>;
  return <span>{value}</span>;
}

export default function PricingPage() {
  return <main className="pricing-page">
    <AppHeader />
    <section className="pricing-intro page-width"><p className="eyebrow">Simple commissioner pricing</p><h1>Build for free. Run the season with Pro.</h1><p>Every Free schedule is complete and mathematically valid. Pro adds the tools that keep the league moving after Week 1.</p></section>
    <section className="pricing-layout page-width" aria-label="Plans">
      <article className="plan-panel"><div><span>FREE</span><h2>$0</h2><p>For building, exporting, and keeping one editable season.</p></div><a className="button-secondary" href="/">Open the builder</a></article>
      <article className="plan-panel plan-pro"><div className="plan-recommended"><ShieldCheck />BEST VALUE</div><div><span>PRO</span><h2>$30 <small>/ year</small></h2><p>Or $5 monthly. For commissioners managing the full season.</p></div><PricingActions /></article>
    </section>
    <section className="pricing-compare page-width"><div className="pricing-table-head"><strong>Feature</strong><strong>Free</strong><strong>Pro</strong></div>{rows.map(([label, free, pro]) => <div className="pricing-table-row" key={label}><strong>{label}</strong><Value value={free} /><Value value={pro} /></div>)}</section>
    <p className="pricing-footnote page-width">Cancel anytime. After a downgrade, choose one season to keep editable; the rest remain viewable and exportable.</p>
  </main>;
}
