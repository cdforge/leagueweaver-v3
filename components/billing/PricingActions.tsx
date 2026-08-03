"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

// NOTE: Checkout is intentionally shelved for the MVP (the pricing page is
// static and does not render this component). Kept ready for re-enable — do not
// wire it back into /pricing without re-introducing a paid-plan product decision.
export function PricingActions() {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const checkout = async (interval: "monthly" | "annual") => {
    setLoading(interval);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interval }) });
      const payload = await response.json() as { url?: string; error?: string };
      if (response.status === 401) return window.location.assign(`/account?next=${encodeURIComponent("/pricing")}`);
      if (!response.ok || !payload.url) throw new Error(payload.error || "Checkout could not start.");
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout could not start.");
      setLoading(null);
    }
  };
  return <div className="pricing-actions">
    <button type="button" className="button-primary" disabled={Boolean(loading)} onClick={() => checkout("annual")}>{loading === "annual" && <LoaderCircle className="spin" />}Choose annual · $30/year</button>
    <button type="button" className="button-secondary" disabled={Boolean(loading)} onClick={() => checkout("monthly")}>{loading === "monthly" && <LoaderCircle className="spin" />}Choose monthly · $5/month</button>
    {message && <p role="alert">{message}</p>}
  </div>;
}
