import { CalendarX2, House } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/AppHeader";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <header className="not-found-topbar">
        <BrandLockup />
      </header>
      <section className="not-found-content" aria-labelledby="not-found-title">
        <div className="not-found-mark" aria-hidden="true">
          <CalendarX2 />
          <strong>404</strong>
        </div>
        <div className="not-found-copy">
          <span>404 · Unscheduled</span>
          <h1 id="not-found-title">This page is on a bye.</h1>
          <p>We checked the full slate. This URL never made the schedule.</p>
          <Link href="/">
            <House aria-hidden="true" />
            Back to the schedule builder
          </Link>
        </div>
      </section>
    </main>
  );
}
