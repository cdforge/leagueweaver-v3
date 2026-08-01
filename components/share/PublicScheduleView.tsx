"use client";

import { useState } from "react";
import { Bell, CalendarDays, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";
import { AdUnit } from "@/components/ads/AdUnit";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { EntityLogo } from "@/components/ui/EntityLogo";
import { leagueAcronym, resolveInitials } from "@/lib/monograms";
import { teamDisplayName, teamInitials } from "@/lib/teamIdentity";
import type { GeneratedSchedule } from "@/lib/types";

export function PublicScheduleView({ schedule, slug }: { schedule: GeneratedSchedule; slug: string }) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("__all__");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const week = schedule.weeks.find((item) => item.weekNumber === weekNumber) || schedule.weeks[0];
  const teamById = new Map(schedule.setup.teams.map((team) => [team.id, team]));
  const display = schedule.setup.display ?? { cityNames: true, managers: true, venues: true };
  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true); setMessage(null);
    try {
      const response = await fetch("/api/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, email, teamId: teamId === "__all__" ? undefined : teamId }) });
      const payload = await response.json().catch(() => ({})) as { error?: string; duplicate?: boolean };
      setMessage(response.ok ? payload.duplicate ? "You’re already subscribed." : "Email updates are on." : payload.error || "Updates could not be enabled.");
      if (response.ok) setEmail("");
    } catch {
      setMessage("We couldn’t reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!week) {
    return <main className="public-page">
      <header className="public-topbar"><BrandLockup /><span><ShieldCheck />Published by the commissioner</span></header>
      <section className="public-league-band" style={{ borderColor: schedule.setup.color }}><EntityLogo size={58} color={schedule.setup.color} logoUrl={schedule.setup.logoUrl} monogram={resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name))} /><div><p>{schedule.setup.seasonYear} FANTASY SEASON</p><h1>{schedule.setup.name}</h1><span>{schedule.setup.description}</span></div></section>
      <div className="public-shell">
        <section className="public-schedule"><div className="rating-filter-empty" style={{ borderRadius: "var(--radius)", minHeight: 200 }}><CalendarDays /><strong>This schedule hasn’t been built yet.</strong></div></section>
      </div>
      <footer className="public-footer">Powered by <a href="/">League Weaver</a></footer>
    </main>;
  }
  return <main className="public-page">
    <header className="public-topbar"><BrandLockup /><span><ShieldCheck />Published by the commissioner</span></header>
    <section className="public-league-band" style={{ borderColor: schedule.setup.color }}><EntityLogo size={58} color={schedule.setup.color} logoUrl={schedule.setup.logoUrl} monogram={resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name))} /><div><p>{schedule.setup.seasonYear} FANTASY SEASON</p><h1>{schedule.setup.name}</h1><span>{schedule.setup.description}</span></div><div className="public-fairness"><strong>{schedule.fairness.score}</strong><span>Fairness score</span></div></section>
    <div className="public-shell">
      <section className="public-schedule"><div className="public-section-head"><div><CalendarDays /><span><strong>Week {week.weekNumber}</strong><small>{week.dateLabel}</small></span></div><CustomSelect label="Public schedule week" value={String(weekNumber)} onChange={(value) => setWeekNumber(Number(value))} options={schedule.weeks.map((item) => ({ value: String(item.weekNumber), label: `Week ${item.weekNumber}`, description: item.dateLabel }))} /></div>
        <div className="public-matchups">{week.games.map((game) => { const away = teamById.get(game.awayTeamId); const home = teamById.get(game.homeTeamId); if (!away || !home) return null; return <article key={game.id}><span className="public-team away"><span>{display.cityNames && away.city && <small className="team-city">{away.city}</small>}<strong>{away.name}</strong>{display.managers && <small>{away.manager || "Away"}</small>}</span><EntityLogo className="public-team-mark" size={40} color={away.color} logoUrl={away.logoUrl} monogram={teamInitials(away)} /></span><b>AT</b><span className="public-team"><EntityLogo className="public-team-mark" size={40} color={home.color} logoUrl={home.logoUrl} monogram={teamInitials(home)} /><span>{display.cityNames && home.city && <small className="team-city">{home.city}</small>}<strong>{home.name}</strong>{display.managers && <small>{home.manager || "Home"}</small>}</span></span>{display.venues && <span className="public-venue">{game.stadium}</span>}</article>; })}</div>
      </section>
      <aside className="public-subscribe"><Bell /><h2>Follow schedule updates</h2><p>Get an email when the commissioner publishes a change.</p><form onSubmit={subscribe}><label><span>Email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label><span>Updates for</span><CustomSelect label="Notification team" value={teamId} onChange={setTeamId} options={[{ value: "__all__", label: "Entire league", description: "Every published update", swatch: schedule.setup.color, monogram: resolveInitials(schedule.setup.initials, leagueAcronym(schedule.setup.name)) }, ...schedule.setup.teams.map((team) => ({ value: team.id, label: teamDisplayName(team, display.cityNames), description: display.managers ? team.manager || "Team updates" : "Team updates", swatch: team.color, logoUrl: team.logoUrl, monogram: teamInitials(team) }))]} /></label><button className="button-primary" disabled={submitting}>{submitting ? <LoaderCircle className="spin" /> : <Bell />}Enable email updates</button><p className="public-subscribe-consent">You’ll only get emails when the commissioner publishes a schedule change. Unsubscribe anytime from the link in every email. See our <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</p>{message && <span className="public-subscribe-message" role="status"><Check />{message}</span>}</form></aside>
    </div>
    <AdUnit placement="public" />
    <footer className="public-footer">Powered by <a href="/">League Weaver</a></footer>
  </main>;
}
