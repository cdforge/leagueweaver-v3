import Image from "next/image";
import Link from "next/link";
import { AccountIdentity } from "@/components/account/AccountIdentity";

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-lockup" href="/" aria-label="League Weaver home">
      <Image src="/branding/leagueweaver-mark.svg" alt="" width={40} height={40} priority />
      {!compact && (
        <span>
          <strong>LEAGUE WEAVER</strong>
          <small>COMMISSIONER STUDIO</small>
        </span>
      )}
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="topbar">
      <div className="page-width topbar-row">
        <BrandLockup />
        <nav className="topnav" aria-label="Primary navigation">
          <AccountIdentity />
        </nav>
      </div>
    </header>
  );
}
