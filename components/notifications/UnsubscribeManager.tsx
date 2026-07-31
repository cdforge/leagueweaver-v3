"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BellOff, BellRing, LoaderCircle } from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";

export function UnsubscribeManager({
  token,
  initialUnsubscribed,
  onChange,
}: {
  token: string;
  initialUnsubscribed: boolean;
  onChange: (token: string, unsubscribed: boolean) => Promise<{ ok: boolean; configured: boolean }>;
}) {
  const [unsubscribed, setUnsubscribed] = useState(initialUnsubscribed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = (next: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await onChange(token, next);
      if (result.ok) setUnsubscribed(next);
      else setError(result.configured ? "That subscription could not be updated — the link may have expired." : "Email updates can’t be changed right now. Please try again in a moment.");
    });
  };

  return (
    <main className="simple-state">
      <BrandLockup />
      {unsubscribed ? <BellOff aria-hidden="true" /> : <BellRing aria-hidden="true" />}
      <h1>{unsubscribed ? "Email updates are off." : "Manage your email updates"}</h1>
      <p>{unsubscribed
        ? "You won’t receive more updates for this public schedule. Changed your mind?"
        : "You’re currently receiving an email whenever the commissioner publishes a change to this schedule."}</p>
      {error && <p className="simple-state-error" role="alert">{error}</p>}
      <div className="simple-state-actions">
        {unsubscribed
          ? <button type="button" className="button-primary" disabled={pending} onClick={() => apply(false)}>{pending ? <LoaderCircle className="spin" /> : <BellRing />}Resubscribe</button>
          : <button type="button" className="button-danger" disabled={pending} onClick={() => apply(true)}>{pending ? <LoaderCircle className="spin" /> : <BellOff />}Unsubscribe from updates</button>}
        <Link href="/" className="button-secondary visible">Open League Weaver</Link>
      </div>
    </main>
  );
}
