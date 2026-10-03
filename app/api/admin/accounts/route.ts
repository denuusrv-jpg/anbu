import { NextResponse } from "next/server";
import { purgeAccount, restoreAccount, softDeleteAccount } from "@/lib/accountLifecycle";
import { isAdminRequest } from "@/lib/requireAdmin";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Konten verwalten (nur mit gültigem Admin-Cookie):
//  delete  -> Soft-Delete (30 Tage Aufbewahrung)
//  restore -> innerhalb der Frist wiederherstellen
//  purge   -> sofort endgültig löschen
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });
  }

  let body: { action?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (typeof body.id !== "string" || !UUID.test(body.id)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }

  const db = getServiceClient();
  const done =
    body.action === "delete"
      ? await softDeleteAccount(db, body.id)
      : body.action === "restore"
        ? await restoreAccount(db, body.id)
        : body.action === "purge"
          ? await purgeAccount(db, body.id)
          : null;

  if (done === null) return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  if (!done) return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
