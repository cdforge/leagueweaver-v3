"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";
import { TeamScheduleView } from "@/components/season/TeamSchedulePage";
import { RouteBaseProvider } from "@/components/season/routeBase";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import type { GeneratedSchedule } from "@/lib/types";

function PublicLeagueBand({ schedule }: { schedule: GeneratedSchedule }) {
  return (
    <section className="public-league-band" style={{ borderColor: schedule.setup.color }}>
      <EntityLogo
        size={58}
        color={schedule.setup.color}
        logoUrl={schedule.setup.logoUrl}
        monogram={resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name))}
      />
      <div>
        <p>{schedule.setup.seasonYear} FANTASY SEASON</p>
        <h1>{schedule.setup.name}</h1>
        <span>{schedule.setup.description}</span>
      </div>
    </section>
  );
}

export function PublicTeamScheduleView({ schedule, slug, teamId }: { schedule: GeneratedSchedule; slug: string; teamId: string }) {
  const router = useRouter();
  const base = `/share/${slug}`;

  return (
    <RouteBaseProvider base={base}>
      <main className="public-page public-team-page">
        <header className="public-topbar">
          <BrandLockup />
          <span><ShieldCheck />Published by the commissioner</span>
        </header>
        <PublicLeagueBand schedule={schedule} />
        <div className="public-team-nav">
          <Link href={`${base}?view=standings`}><ArrowLeft />League standings</Link>
        </div>
        <div className="public-panel public-team-panel">
          <TeamScheduleView
            schedule={schedule}
            teamId={teamId}
            readOnly
            onSelectTeam={(nextTeamId) => {
              if (nextTeamId) router.push(`${base}/team/${nextTeamId}`);
              else router.push(`${base}?view=standings`);
            }}
            onSelectWeek={(week) => router.push(`${base}?view=week&week=${week}`)}
          />
        </div>
        <footer className="public-footer">Powered by <a href="/">League Weaver</a></footer>
      </main>
    </RouteBaseProvider>
  );
}
