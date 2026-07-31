import { AppHeader } from "@/components/AppHeader";
import { LeagueBuilder } from "@/components/builder/LeagueBuilder";
import { WelcomeGate } from "@/components/WelcomeGate";
import { AdUnit } from "@/components/ads/AdUnit";
import { CheckCircle2, FileDown, RefreshCw, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <main>
      <WelcomeGate />
      <AppHeader />
      <LeagueBuilder />
      <section className="proof-band" aria-labelledby="why-league-weaver">
        <div className="page-width proof-grid">
          <div className="proof-intro">
            <p className="eyebrow">Built for commissioners</p>
            <h2 id="why-league-weaver">The schedule is only the start.</h2>
            <p>Generate it here, then keep scores, standings, sharing, and every export together.</p>
          </div>
          <div className="proof-points">
            <div><Trophy aria-hidden="true" /><span><strong>Marquee by design</strong><small>Rivalry weeks and highlight games, not a flat round-robin.</small></span></div>
            <div><RefreshCw aria-hidden="true" /><span><strong>Ready for every week</strong><small>Import scores and follow the season from one workspace.</small></span></div>
            <div><FileDown aria-hidden="true" /><span><strong>Clean handoff</strong><small>Download a polished PDF or CSV for the whole league.</small></span></div>
            <div><CheckCircle2 aria-hidden="true" /><span><strong>Your platform stays</strong><small>League Weaver works beside Sleeper and ESPN.</small></span></div>
          </div>
        </div>
      </section>
      <AdUnit placement="home" />
      <footer className="site-footer">
        <div className="page-width footer-row">
          <span>© 2026 League Weaver</span>
          <nav aria-label="Legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
