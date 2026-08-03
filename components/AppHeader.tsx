"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, TriangleAlert, X } from "lucide-react";
import { AccountIdentity } from "@/components/account/AccountIdentity";
import { ResumeLatestButton } from "@/components/ResumeLatestButton";
import { ConfirmDialog } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { listLocalSeasons } from "@/lib/storage";

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // The builder route holds in-progress setup that leaving could discard.
  const guarded = pathname === "/build";

  const handleClick = (event: React.MouseEvent) => {
    if (!guarded) return;
    event.preventDefault();
    setConfirmOpen(true);
  };
  const leaveToWelcome = () => {
    setConfirmOpen(false);
    router.push("/");
  };

  return (
    <>
      <Link className="brand-lockup" href="/" aria-label="League Weaver home" onClick={handleClick}>
        <Image src="/branding/leagueweaver-mark.svg" alt="" width={40} height={40} priority />
        {!compact && (
          <span>
            <strong>LEAGUE WEAVER</strong>
            <small>FANTASY FOOTBALL STUDIO</small>
          </span>
        )}
      </Link>
      {confirmOpen && (
        <ConfirmDialog
          tone="gold"
          icon={<TriangleAlert />}
          kicker="LEAVE SETUP"
          title="Leave the builder?"
          labelId="leave-builder-title"
          descriptionId="leave-builder-description"
          closeLabel="Stay in the builder"
          onClose={() => setConfirmOpen(false)}
          actions={[
            { label: "Stay here", onClick: () => setConfirmOpen(false), variant: "secondary", autoFocus: true },
            { label: <>Leave to welcome<ArrowRight /></>, onClick: leaveToWelcome, variant: "danger" },
          ]}
        >
          <p id="leave-builder-description">You&rsquo;ll go back to the welcome page. Your current league setup could be lost if you start a new league from there.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scheduleHref, setScheduleHref] = useState("/account?next=/fantasy/schedules");
  const [scheduleLabel, setScheduleLabel] = useState("Sign in for schedules");
  const schedulesActive = pathname.startsWith("/fantasy/schedules") || pathname.startsWith("/season") || pathname.startsWith("/build");
  const leaguesActive = pathname.startsWith("/fantasy/leagues");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const hasLocalSchedules = listLocalSeasons().length > 0;
      let signedIn = false;
      try {
        const { data } = await createClient()?.auth.getUser() ?? { data: { user: null } };
        signedIn = Boolean(data.user);
      } catch {
        signedIn = false;
      }
      if (!active) return;
      if (signedIn || hasLocalSchedules) {
        setScheduleHref("/fantasy/schedules");
        setScheduleLabel("My Schedules");
      } else {
        setScheduleHref("/account?next=/fantasy/schedules");
        setScheduleLabel("Sign in for schedules");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="topbar">
      <div className="page-width topbar-row">
        <BrandLockup />
        <nav className="topnav" aria-label="Primary navigation">
          <ResumeLatestButton />
          <Link href={scheduleHref} className={schedulesActive ? "active" : ""} aria-current={schedulesActive ? "page" : undefined}>{scheduleLabel}</Link>
          <Link href="/fantasy/leagues" className={leaguesActive ? "active" : ""} aria-current={leaguesActive ? "page" : undefined}>Saved Leagues</Link>
          <AccountIdentity />
        </nav>
        <button type="button" className="mobile-menu-button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-site-menu" onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {mobileMenuOpen && <>
        <button type="button" className="mobile-menu-backdrop" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
        <aside className="mobile-menu-panel" id="mobile-site-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <header>
            <AccountIdentity />
            <button type="button" className="mobile-menu-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}><X aria-hidden="true" /></button>
          </header>
          <nav className="mobile-menu-links" aria-label="Primary mobile navigation">
            <ResumeLatestButton />
            <Link href={scheduleHref} className={schedulesActive ? "active" : ""} aria-current={schedulesActive ? "page" : undefined}>{scheduleLabel}</Link>
            <Link href="/fantasy/leagues" className={leaguesActive ? "active" : ""} aria-current={leaguesActive ? "page" : undefined}>Saved Leagues</Link>
          </nav>
          <nav className="mobile-menu-legal" aria-label="Legal">
            <span>More</span>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </aside>
      </>}
    </header>
  );
}
