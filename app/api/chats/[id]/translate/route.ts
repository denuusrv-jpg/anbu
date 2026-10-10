import { NextResponse } from "next/server";
import { rateLimited } from "@/lib/botGuard";
import { isUuid, withChatUser } from "@/lib/chatApi";
import { translateMessage, translateSteckbrief, type Lang } from "@/lib/chatTranslate";

export const dynamic = "force-dynamic";

// Übersetzen einer Nachricht (messageId) oder des Match-Steckbriefs (steckbrief: true) in die Sprache der Person
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  if (rateLimited(request, "translate", 200)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte einen Moment." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const target = body.target;
  if (target !== "de" && target !== "en" && target !== "ta") return NextResponse.json({ error: "Ungültige Sprache." }, { status: 400 });
  const lang = target as Lang;
  if (body.steckbrief === true) return withChatUser(({ db, userId }) => translateSteckbrief(db, userId, id, lang));
  if (typeof body.messageId !== "string" || !isUuid(body.messageId)) return NextResponse.json({ error: "Nachricht nicht gefunden." }, { status: 404 });
  const messageId = body.messageId;
  return withChatUser(({ db, userId }) => translateMessage(db, userId, id, messageId, lang));
}
