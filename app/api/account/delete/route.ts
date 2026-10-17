import { NextResponse } from "next/server";
import { verifyDeleteToken } from "@/lib/accountDelete";
import { softDeleteAccount } from "@/lib/accountLifecycle";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Schritt 2 zum Löschen: nur mit dem Token aus der Bestätigungs-Mail und nur für das angemeldete Konto selbst.
// Soft-Delete: 30 Tage Aufbewahrung, danach endgültige Löschung.
export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const tokenUser = verifyDeleteToken(typeof body?.token === "string" ? body.token : null);
  if (!tokenUser || tokenUser !== data.user.id) {
    return NextResponse.json({ error: "Der Bestätigungslink ist ungültig oder abgelaufen. Bitte fordere einen neuen an." }, { status: 403 });
  }
  if (!(await softDeleteAccount(getServiceClient(), data.user.id))) {
    return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  }
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
