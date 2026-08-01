"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { AccountIdentity } from "@/components/account/AccountIdentity";
import { ResumeLatestButton } from "@/components/ResumeLatestButton";
import { ConfirmDialog } from "@/components/ui/Modal";

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
  return (
    <header className="topbar">
      <div className="page-width topbar-row">
        <BrandLockup />
        <nav className="topnav" aria-label="Primary navigation">
          <ResumeLatestButton />
          <AccountIdentity />
        </nav>
      </div>
    </header>
  );
}
