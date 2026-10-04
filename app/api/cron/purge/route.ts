import { NextResponse } from "next/server";
import { purgeExpired } from "@/lib/accountLifecycle";
import { purgeDissolvedRooms } from "@/lib/chatRooms";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Täglicher Job (siehe vercel.json): löscht Konten, deren 30-Tage-Frist nach dem Soft-Delete
// abgelaufen ist, endgültig. Vercel ruft die Adresse mit "Authorization: Bearer <CRON_SECRET>" auf.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET ist nicht gesetzt." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });
  }
  const db = getServiceClient();
  const purged = await purgeExpired(db);
  // Aufgelöste Chats (samt Nachrichten) nach 7 Tagen endgültig löschen
  const rooms = await purgeDissolvedRooms(db);
  return NextResponse.json({ ok: true, purged, rooms });
}
