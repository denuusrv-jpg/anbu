import { NextResponse } from "next/server";
import { softDeleteAccount } from "@/lib/accountLifecycle";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Nutzer löscht das eigene Konto: Soft-Delete, 30 Tage Aufbewahrung, danach endgültige Löschung.
export async function POST() {
  if (!isSupabaseConfigured || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Noch nicht eingerichtet." }, { status: 503 });
  }
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Bitte melde dich zuerst an." }, { status: 401 });
  }
  if (!(await softDeleteAccount(getServiceClient(), data.user.id))) {
    return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  }
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
