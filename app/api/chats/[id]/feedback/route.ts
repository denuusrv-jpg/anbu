import { NextResponse } from "next/server";
import { isUuid, withChatUser } from "@/lib/chatApi";
import { setFeedback } from "@/lib/chatRooms";

export const dynamic = "force-dynamic";

// Kurzes Feedback zum Chat (gut / geht so / schlecht), nur als Zahl in den anonymen Metriken sichtbar
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  let body: { value?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const value = typeof body.value === "string" ? body.value : "";
  return withChatUser(async ({ db, userId }) => {
    await setFeedback(db, userId, id, value);
    return { ok: true };
  });
}
