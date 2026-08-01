import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { StartBuildingButton } from "@/components/welcome/StartBuildingButton";
import { SchedulePreview } from "@/components/welcome/SchedulePreview";
import { CalendarDays, Trophy, Users } from "lucide-react";

const OG_DESCRIPTION = "Ditch the boring round-robin. Build a real NFL-style schedule — seeded off last season, with rivalry weeks and marquee games.";

export const metadata: Metadata = {
  title: "Fantasy Football Schedule Generator | League Weaver",
  description: "Build an NFL-style fantasy football schedule — seeded off last season, with rivalry weeks and marquee games — then run the whole season from one workspace.",
  openGraph: {
    title: "League Weaver — NFL-style fantasy football schedules",
    description: OG_DESCRIPTION,
    type: "website",
    images: [{ url: "/branding/og-image.jpg", width: 1200, height: 630, alt: "Rival football helmets face off with a schedule and trophy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "League Weaver — NFL-style fantasy football schedules",
    description: OG_DESCRIPTION,
    images: ["/branding/og-image.jpg"],
  },
};

const CAPABILITIES = [
  { image: "/branding/cap-round-robin.jpg", title: "No more round-robin", copy: "Seeded off last season's standings — so who you play, and when, actually means something." },
  { image: "/branding/cap-marquee.jpg", title: "Marquee moments built in", copy: "A Game of the Week, a Thanksgiving spotlight, and a title-race finish — not a flat rotation." },
  { image: "/branding/cap-rivalries.jpg", title: "Divisions become rivalries", copy: "Every divisional foe twice, framed on real NFL week windows." },
  { image: "/branding/cap-run.jpg", title: "Bring your league & run it", copy: "Import from ESPN or Sleeper, then track scores, standings, and exports in one place." },
];

const STEPS = [
  { icon: Users, title: "Set up your league", copy: "Teams, divisions, and last season's finish." },
  { icon: CalendarDays, title: "Generate the schedule", copy: "A complete season built and validated in seconds." },
  { icon: Trophy, title: "Share & manage", copy: "Publish it and keep the season moving." },
];

export default function HomePage() {
  return (
    <main>
      <AppHeader />
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="page-width">
          <div className="welcome-hero-inner">
          <p className="eyebrow">Fantasy Football Commissioner Studio</p>
          <h1 id="welcome-title">Welcome to League Weaver.</h1>
          <p className="welcome-lede">
            Ditch the same boring round-robin every season. League Weaver builds a real NFL-style schedule &mdash;
            seeded off last year&rsquo;s finish, with rivalry weeks and marquee games that actually mean something.
          </p>
          <div className="welcome-actions">
            <StartBuildingButton label="Start building" />
            <small>Free to start &middot; No account needed &middot; about 5 minutes.</small>
          </div>
          </div>
        </div>
      </section>

      <section className="welcome-platforms" aria-label="Works with your platform">
        <div className="page-width welcome-platforms-inner">
          <span className="welcome-platform-chip"><img src="/providers/espn.png" alt="ESPN" /></span>
          <p>Import your league from ESPN or Sleeper to build your schedule faster.</p>
          <span className="welcome-platform-chip"><img src="/providers/sleeper.png" alt="Sleeper" /></span>
        </div>
      </section>

      <section className="welcome-showcase" aria-labelledby="welcome-showcase-title">
        <div className="page-width">
          <p className="eyebrow">The finished season</p>
          <h2 id="welcome-showcase-title">Marquee weeks, real standings, one workspace.</h2>
          <p className="welcome-showcase-lede">Generate the schedule and League Weaver becomes your season HQ &mdash; weekly matchups, Game of the Week, standings, and one-click exports.</p>
          <SchedulePreview />
        </div>
      </section>

      <section className="welcome-capabilities" aria-label="What you can do here">
        <div className="page-width welcome-capability-grid">
          {CAPABILITIES.map(({ image, title, copy }) => (
            <div className="welcome-capability" key={title}>
              <span className="welcome-capability-media"><img src={image} alt="" /></span>
              <strong>{title}</strong>
              <small>{copy}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="welcome-steps" aria-labelledby="welcome-steps-title">
        <div className="page-width">
          <p className="eyebrow">How it works</p>
          <h2 id="welcome-steps-title">Three steps to a finished season.</h2>
          <ol className="welcome-step-row">
            {STEPS.map(({ icon: Icon, title, copy }, index) => (
              <li key={title}>
                <span className="welcome-step-index">{index + 1}</span>
                <span className="welcome-step-icon"><Icon aria-hidden="true" /></span>
                <strong>{title}</strong>
                <small>{copy}</small>
              </li>
            ))}
          </ol>
          <div className="welcome-actions welcome-actions--end">
            <StartBuildingButton label="Start building" />
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-width footer-row">
          <span>&copy; 2026 League Weaver</span>
          <nav aria-label="Legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
