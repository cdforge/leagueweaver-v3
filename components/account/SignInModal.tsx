"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { SignupProfileFields, type SignupProfile } from "@/components/account/SignupProfileFields";
import { friendlyAuthMessage } from "@/lib/apiErrors";
import { createClient } from "@/lib/supabase/client";

export function SignInModal({ initialMode = "signin", onClose }: {
  initialMode?: "signin" | "signup";
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<SignupProfile>({ leagueName: "", avatarUrl: null, busy: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return setMessage("Supabase is not configured for this environment yet.");
    setLoading(true);
    setMessage(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage(friendlyAuthMessage(error.message));
      onClose();
      router.refresh();
      return;
    }
    const leagueName = profile.leagueName.trim();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        data: {
          full_name: leagueName,
          display_name: leagueName,
          ...(profile.avatarUrl ? { avatar_url: profile.avatarUrl } : {}),
        },
      },
    });
    setLoading(false);
    setMessage(error ? friendlyAuthMessage(error.message) : "Check your email to finish setting up your account.");
  };

  const isSignup = mode === "signup";

  return (
    <Modal onClose={onClose} className="account-card auth-modal-card" labelledBy="auth-modal-title">
        <button type="button" className="icon-button auth-modal-close" aria-label="Close sign in" onClick={onClose}><X /></button>
        <p className="eyebrow">Commissioner account</p>
        <h1 id="auth-modal-title">{isSignup ? "Save your league once." : "Welcome back."}</h1>
        <p>{isSignup ? "Next season, skip league, team, and division setup." : "Pick up saved leagues and seasons on any device."}</p>
        <div className="account-tabs" role="tablist"><button type="button" className={!isSignup ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button type="button" className={isSignup ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div>
        <form onSubmit={submit}>
          {isSignup && <SignupProfileFields onChange={setProfile} />}
          <label><span>Email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label><span>Password</span><div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><Tooltip label={showPassword ? "Hide password" : "Show password"}><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff /> : <Eye />}</button></Tooltip></div></label>
          {message && <div className="account-message" role="status">{message}</div>}
          <button className="button-primary account-submit" disabled={loading || profile.busy}>{loading && <LoaderCircle className="spin" />}{isSignup ? "Create free account" : "Sign in"}</button>
        </form>
        <small className="account-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</small>
    </Modal>
  );
}
