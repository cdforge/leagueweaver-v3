"use client";

import { CalendarX2, RotateCcw } from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";

export default function ShareError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="not-found-page">
      <header className="not-found-topbar">
        <BrandLockup />
      </header>
      <section className="not-found-content" aria-labelledby="share-error-title">
        <div className="not-found-mark" aria-hidden="true">
          <CalendarX2 />
          <strong>Oops</strong>
        </div>
        <div className="not-found-copy">
          <span>Schedule unavailable</span>
          <h1 id="share-error-title">This schedule couldn’t be loaded.</h1>
          <p>Something went wrong displaying this shared schedule. It may still be getting built — try again in a moment.</p>
          <button type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
