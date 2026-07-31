import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently delete the signed-in user's account. Uses the service-role admin client, which
// removes the auth user; owned rows (saved leagues, seasons) cascade via their user_id foreign
// keys. There is no undo, so the UI gates this behind an explicit confirmation.
export async function DELETE() {
  const auth = await getAuthenticatedClient();
  if (!auth) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Account deletion is unavailable right now." }, { status: 500 });
  const { error } = await admin.auth.admin.deleteUser(auth.userId);
  if (error) return NextResponse.json({ error: "Your account could not be deleted. Try again in a moment." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
