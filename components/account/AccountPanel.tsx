"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, CreditCard, Eye, EyeOff, FolderHeart, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Tooltip } from "@/components/ui/Tooltip";
import { createClient } from "@/lib/supabase/client";

export function AccountPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [seasons, setSeasons] = useState<Array<{ id: string; title: string; editable: boolean; updated_at: string }>>([]);
  const [savedLeagueCount, setSavedLeagueCount] = useState(0);
  const [freeSeasonId, setFreeSeasonId] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null));
  }, [supabase]);
  useEffect(() => {
    if (!signedInEmail) return;
    Promise.all([
      fetch("/api/seasons").then((response) => response.json()),
      fetch("/api/saved-leagues").then((response) => response.json()),
      fetch("/api/entitlements").then((response) => response.json()),
    ]).then(([seasonPayload, leaguePayload, entitlementPayload]) => {
      const nextSeasons = seasonPayload.seasons ?? [];
      setSeasons(nextSeasons);
      setFreeSeasonId(nextSeasons.find((season: { editable?: boolean }) => season.editable)?.id || nextSeasons[0]?.id || "");
      setSavedLeagueCount(leaguePayload.presets?.length ?? 0);
      setPlan(entitlementPayload.plan || "free");
    }).catch(() => setMessage("Account details are temporarily unavailable."));
  }, [signedInEmail]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return setMessage("Supabase is not configured for this environment yet.");
    setLoading(true);
    setMessage(null);
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage(error.message);
      setSignedInEmail(data.user.email ?? email);
      window.location.assign(next.startsWith("/") ? next : "/");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    setMessage(error ? error.message : "Check your email to confirm your account, then your saved leagues will be ready.");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setSignedInEmail(null);
  };

  const openBilling = async () => {
    setLoading(true);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const payload = await response.json() as { url?: string; error?: string };
    setLoading(false);
    if (payload.url) window.location.assign(payload.url);
    else setMessage(payload.error || "Billing could not be opened.");
  };

  const chooseFreeSeason = async () => {
    if (!freeSeasonId) return;
    setLoading(true);
    const response = await fetch("/api/account/free-season", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleId: freeSeasonId }) });
    const payload = await response.json() as { error?: string };
    setLoading(false);
    setMessage(response.ok ? "Your editable Free season is updated." : payload.error || "The season choice could not be saved.");
    if (response.ok) setSeasons((current) => current.map((season) => ({ ...season, editable: season.id === freeSeasonId })));
  };

  if (signedInEmail) return <div className="account-dashboard">
    <header><div><p className="eyebrow">Commissioner account</p><h1>Your league office.</h1><p>{signedInEmail}</p></div><span className={`account-plan ${plan}`}><ShieldCheck />{plan === "pro" ? "PRO PLAN" : "FREE PLAN"}</span></header>
    <div className="account-stat-row"><div><CalendarDays /><span><strong>{seasons.length}</strong><small>Saved seasons</small></span></div><div><FolderHeart /><span><strong>{savedLeagueCount}</strong><small>Saved leagues</small></span></div><div><CreditCard /><span><strong>{plan === "pro" ? "Unlimited" : "1"}</strong><small>Editable seasons</small></span></div></div>
    <section className="account-season-list"><div className="account-section-head"><span><strong>Seasons</strong><small>Open, view, or export any saved season.</small></span><Link href="/" className="button-primary">New schedule</Link></div>{seasons.length ? seasons.map((season) => <Link href={`/season/${season.id}`} key={season.id}><span><strong>{season.title}</strong><small>Updated {new Date(season.updated_at).toLocaleDateString()}</small></span><em className={season.editable ? "editable" : "view-only"}>{season.editable ? "EDITABLE" : "VIEW ONLY"}</em></Link>) : <div className="account-empty"><CalendarDays /><span><strong>No cloud seasons yet.</strong><small>Generate a schedule, then choose Save in the workspace.</small></span></div>}</section>
    {plan === "free" && seasons.length > 1 && <section className="account-free-choice"><div><strong>Choose your editable Free season</strong><small>Other seasons stay viewable and exportable.</small></div><CustomSelect label="Editable Free season" value={freeSeasonId} onChange={setFreeSeasonId} options={seasons.map((season) => ({ value: season.id, label: season.title, description: season.editable ? "Currently editable" : "View only" }))} /><button type="button" className="button-secondary" onClick={chooseFreeSeason} disabled={loading}>Save choice</button></section>}
    {message && <div className="account-message" role="status">{message}</div>}
    <footer>{plan === "pro" ? <button type="button" className="button-secondary" onClick={openBilling} disabled={loading}><CreditCard />Manage billing</button> : <Link href="/pricing" className="button-primary"><ShieldCheck />Upgrade to Pro</Link>}<button type="button" className="account-signout" onClick={signOut}><LogOut />Sign out</button></footer>
  </div>;

  return (
    <div className="account-card">
      <Link className="account-back" href="/"><ArrowLeft />Builder</Link>
      <p className="eyebrow">Commissioner account</p>
      <h1>{mode === "signin" ? "Welcome back." : "Save your league once."}</h1>
      <p>{mode === "signin" ? "Pick up saved leagues and seasons on any device." : "Next season, skip league, team, and division setup."}</p>
      <div className="account-tabs" role="tablist"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
      <form onSubmit={submit}>
        <label><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label><span>Password</span><div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><Tooltip label={showPassword ? "Hide password" : "Show password"}><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff /> : <Eye />}</button></Tooltip></div></label>
        {message && <div className="account-message" role="status">{message}</div>}
        <button className="button-primary account-submit" disabled={loading}>{loading && <LoaderCircle className="spin" />}{mode === "signin" ? "Sign in" : "Create free account"}</button>
      </form>
      <small className="account-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</small>
    </div>
  );
}
