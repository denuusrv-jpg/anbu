import { NextResponse } from "next/server";
import { isUuid, withChatUser } from "@/lib/chatApi";
import { isReason, reportRoom } from "@/lib/chatReports";

export const dynamic = "force-dynamic";

// Person im Chat melden: Grund (Pflicht) und kurzer Hinweis (optional). Die meldende Person verlässt den Chat.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (!isReason(body.reason)) return NextResponse.json({ error: "Bitte wähle einen Grund." }, { status: 400 });
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
  return withChatUser(async ({ db, userId }) => {
    await reportRoom(db, userId, id, body.reason as never, note || null);
    return { ok: true };
  });
}
