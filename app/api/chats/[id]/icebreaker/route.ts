import { NextResponse } from "next/server";
import { isUuid, withChatUser } from "@/lib/chatApi";
import { requestIcebreaker } from "@/lib/chatRooms";

export const dynamic = "force-dynamic";

// Eisbrecher-Button: eine weitere thematische Impulsfrage in den Chat holen
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Chat nicht gefunden." }, { status: 404 });
  return withChatUser(async ({ db, userId }) => ({ message: await requestIcebreaker(db, userId, id) }));
}
