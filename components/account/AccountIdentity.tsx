"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleUserRound, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthModal } from "@/components/account/AuthModalProvider";

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
  const [loading, setLoading] = useState(identity === undefined);
  const avatarRef = useRef<HTMLImageElement | null>(null);
  const [loadedAvatarUrl, setLoadedAvatarUrl] = useState<string | null>(null);
  const [avatarLoadingUrl, setAvatarLoadingUrl] = useState<string | null>(identity?.avatarUrl ?? null);
  const { openSignIn } = useAuthModal();

  useEffect(() => {
    if (identity !== undefined) {
      queueMicrotask(() => {
        setResolved(identity);
        setLoading(false);
      });
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
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
    if (!resolved.avatarUrl) {
      setLoadedAvatarUrl(null);
      setAvatarLoadingUrl(null);
      return;
    }
    const image = avatarRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoadedAvatarUrl(resolved.avatarUrl);
      setAvatarLoadingUrl(null);
      return;
    }
    setAvatarLoadingUrl(resolved.avatarUrl);
  }, [resolved.avatarUrl]);

  if (!resolved.signedIn) return <button type="button" onClick={() => openSignIn()} className={`account-link account-identity${loading ? " loading" : ""}`} aria-label="Sign in to League Weaver"><CircleUserRound aria-hidden="true" /><span><strong>{loading ? "Account" : "Sign in"}</strong></span></button>;

  const name = resolved.displayName || friendlyEmailName(resolved.email);
  const avatarLoading = Boolean(resolved.avatarUrl && avatarLoadingUrl === resolved.avatarUrl && loadedAvatarUrl !== resolved.avatarUrl);
  const markAvatarLoaded = () => {
    if (!resolved.avatarUrl) return;
    setLoadedAvatarUrl(resolved.avatarUrl);
    setAvatarLoadingUrl((current) => current === resolved.avatarUrl ? null : current);
  };
  return <Link href="/account" className="account-link account-identity" aria-label={`Open account for ${name}`} title={resolved.email}>
    <span className={`account-avatar${resolved.avatarUrl ? " has-image" : ""} ${avatarLoading ? "is-loading" : ""}`} aria-hidden="true">{resolved.avatarUrl ? <><img ref={avatarRef} src={resolved.avatarUrl} alt="" onLoad={markAvatarLoaded} onError={() => { setLoadedAvatarUrl(null); setAvatarLoadingUrl(null); }} />{avatarLoading && <LoaderCircle className="avatar-image-spinner spin" />}</> : accountInitials(name)}</span>
    <span className="account-identity-copy"><strong>{name}</strong><small><span>My Account</span></small></span>
  </Link>;
}
