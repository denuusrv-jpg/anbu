import { NextResponse } from "next/server";
import { isUuid, withChatUser } from "@/lib/chatApi";
import { leaveRoom } from "@/lib/chatRooms";

export const dynamic = "force-dynamic";

// Chat verlassen: gibt den Platz (von höchstens 4) für ein neues Match frei
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  return withChatUser(async ({ db, userId }) => {
    await leaveRoom(db, userId, id);
    return { ok: true };
  });
}
