import { NextResponse } from "next/server";
import { isUuid, withChatUser } from "@/lib/chatApi";
import { getRoom, sendMessage } from "@/lib/chatRooms";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Raum öffnen (Nachrichten ab "after", für das regelmäßige Nachladen)
export async function GET(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  const after = new URL(request.url).searchParams.get("after") ?? undefined;
  return withChatUser(({ db, userId }) => getRoom(db, userId, id, after && !Number.isNaN(Date.parse(after)) ? after : undefined));
}

// Nachricht senden
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  let body: { body?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (typeof body.body !== "string") return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  const text = body.body;
  return withChatUser(async ({ db, userId }) => ({ message: await sendMessage(db, userId, id, text) }));
}
