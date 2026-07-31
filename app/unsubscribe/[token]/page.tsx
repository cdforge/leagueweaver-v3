import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";
import { UnsubscribeManager } from "@/components/notifications/UnsubscribeManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSubscriptionUnsubscribed } from "./actions";

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  if (!admin) {
    return <main className="simple-state"><BrandLockup /><AlertCircle aria-hidden="true" /><h1>Updates aren’t available right now.</h1><p>Email preferences can’t be loaded at the moment. Please try again later.</p><Link href="/" className="button-primary">Open League Weaver</Link></main>;
  }

  // Read-only lookup — never mutate on render, so link prefetchers and email
  // scanners can't silently unsubscribe. The change happens only via the
  // explicit action in UnsubscribeManager.
  const { data } = await admin
    .from("public_schedule_subscriptions")
    .select("id, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!data) {
    return <main className="simple-state"><BrandLockup /><AlertCircle aria-hidden="true" /><h1>This link is no longer active.</h1><p>This subscription may already have been removed, or the link is incomplete.</p><Link href="/" className="button-primary">Open League Weaver</Link></main>;
  }

  return <UnsubscribeManager token={token} initialUnsubscribed={Boolean(data.unsubscribed_at)} onChange={setSubscriptionUnsubscribed} />;
}
