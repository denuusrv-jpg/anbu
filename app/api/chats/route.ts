import { withChatUser } from "@/lib/chatApi";
import { listRooms } from "@/lib/chatRooms";

export const dynamic = "force-dynamic";

// Meine aktiven Chats samt belegten Plätzen (höchstens 4) und dem Stand der Suche (Friends / Business)
export async function GET() {
  return withChatUser(async ({ db, userId }) => {
    const list = await listRooms(db, userId);
    const { data } = await db.from("user_profiles").select("track, friends_active, business_active, business").eq("user_id", userId).maybeSingle();
    const row = data as { track: string; friends_active: boolean | null; business_active: boolean | null; business: unknown } | null;
    const search = {
      friends: row ? (row.friends_active ?? row.track === "community") : false,
      business: row ? (row.business_active ?? row.track === "business") : false,
      canBusiness: Boolean(row?.business),
    };
    return { ...list, search };
  });
}
