import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/requireAdmin";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Behobene Fehler aus dem Fehler-Tracking entfernen (nur mit gültigem Admin-Cookie):
//  delete -> einen Eintrag löschen | clear -> alle Einträge löschen
export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });

  let body: { action?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const db = getServiceClient();
  if (body.action === "clear") {
    const { error } = await db.from("system_errors").delete().not("id", "is", null);
    return error ? NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 }) : NextResponse.json({ ok: true });
  }
  if (body.action === "delete") {
    if (typeof body.id !== "string" || !UUID.test(body.id)) {
      return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
    }
    const { error } = await db.from("system_errors").delete().eq("id", body.id);
    return error ? NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 }) : NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
}
