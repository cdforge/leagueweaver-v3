"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { ProBadge } from "@/components/ui/ProBadge";
import { createClient } from "@/lib/supabase/client";

export type AccountIdentityData = {
  signedIn: boolean;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
};

function metadataValue(metadata: Record<string, unknown>, keys: string[]) {
  return keys.map((key) => metadata[key]).find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function friendlyEmailName(email?: string) {
  const local = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Commissioner";
}

function accountInitials(name: string) {
  const words = name.match(/[A-Za-z0-9]+/g) ?? [];
  const first = words[0] ?? "";
  const second = words[1] ?? "";
  return (second ? `${first[0] ?? ""}${second[0] ?? ""}` : first.slice(0, 2) || "LW").toUpperCase();
}

function identityFromUser(user: { email?: string; user_metadata?: Record<string, unknown> } | null): AccountIdentityData {
  if (!user) return { signedIn: false };
  const metadata = user.user_metadata ?? {};
  return {
    signedIn: true,
    email: user.email,
    displayName: metadataValue(metadata, ["full_name", "name", "display_name"]),
    avatarUrl: metadataValue(metadata, ["avatar_url", "picture"]),
  };
}

export function AccountIdentity({ identity, plan }: { identity?: AccountIdentityData; plan?: "free" | "pro" }) {
  const [resolved, setResolved] = useState<AccountIdentityData>(identity ?? { signedIn: false });
  const [resolvedPlan, setResolvedPlan] = useState<"free" | "pro">(plan ?? "free");
  const [loading, setLoading] = useState(identity === undefined);

  useEffect(() => {
    if (identity !== undefined) {
      setResolved(identity);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setResolved(identityFromUser(data.user));
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setResolved(identityFromUser(session?.user ?? null));
        setLoading(false);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [identity]);

  useEffect(() => {
    if (plan) {
      setResolvedPlan(plan);
      return;
    }
    if (!resolved.signedIn) {
      setResolvedPlan("free");
      return;
    }
    let active = true;
    fetch("/api/entitlements")
      .then((response) => response.json())
      .then((data: { plan?: "free" | "pro" }) => {
        if (active) setResolvedPlan(data.plan === "pro" ? "pro" : "free");
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [plan, resolved.signedIn]);

  if (!resolved.signedIn) return <Link href="/account" className={`account-link account-identity${loading ? " loading" : ""}`} aria-label="Sign in to League Weaver"><CircleUserRound aria-hidden="true" /><span><strong>{loading ? "Account" : "Sign in"}</strong></span></Link>;

  const name = resolved.displayName || friendlyEmailName(resolved.email);
  return <Link href="/account" className="account-link account-identity" aria-label={`Open account for ${name}`} title={resolved.email}>
    <span className={`account-avatar${resolved.avatarUrl ? " has-image" : ""}`} aria-hidden="true">{resolved.avatarUrl ? <img src={resolved.avatarUrl} alt="" /> : accountInitials(name)}</span>
    <span className="account-identity-copy"><strong>{name}</strong><small><span>My Account</span>{resolvedPlan === "pro" && <ProBadge compact />}</small></span>
  </Link>;
}
