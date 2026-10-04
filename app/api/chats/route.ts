import { withChatUser } from "@/lib/chatApi";
import { listRooms } from "@/lib/chatRooms";

export const dynamic = "force-dynamic";

// Meine aktiven Chats samt belegten Plätzen (höchstens 4)
export async function GET() {
  return withChatUser(({ db, userId }) => listRooms(db, userId));
}
