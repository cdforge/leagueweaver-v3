import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandLockup } from "@/components/AppHeader";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data } = admin ? await admin.from("public_schedule_subscriptions").update({ unsubscribed_at: new Date().toISOString() }).eq("unsubscribe_token", token).select("id").maybeSingle() : { data: null };
  return <main className="simple-state"><BrandLockup /><CheckCircle2 /><h1>{data ? "Email updates stopped." : "This link is no longer active."}</h1><p>{data ? "You will not receive more updates for that public schedule." : "The subscription may already be removed."}</p><Link href="/" className="button-primary">Open League Weaver</Link></main>;
}
