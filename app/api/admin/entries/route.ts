import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/adminAuth";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Wartelisten-Einträge und Entwürfe löschen (nur mit gültigem Admin-Cookie).
// Konten laufen über /api/admin/accounts (Soft-Delete).
export async function DELETE(request: Request) {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });
  }

  let body: { kind?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const db = getServiceClient();

  // Entwürfe sind über die E-Mail-Adresse gekennzeichnet
  if (body.kind === "draft") {
    if (typeof body.id !== "string" || body.id.length > 254 || !body.id.includes("@")) {
      return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
    }
    const { error } = await db.from("onboarding_drafts").delete().eq("email", body.id.toLowerCase());
    if (error) return NextResponse.json({ error: "Löschen hat nicht geklappt." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id !== "string" || !UUID.test(body.id)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  if (body.kind === "waitlist") {
    const { error } = await db.from("waitlist").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: "Löschen hat nicht geklappt." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unbekannter Typ." }, { status: 400 });
}
