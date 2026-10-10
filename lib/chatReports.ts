import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChatError, leaveRoom } from "@/lib/chatRooms";

// Meldung aus einem Chat: Grund und optionaler Hinweis (kein Nachrichteninhalt). Die meldende Person verlässt den Chat.
// Die Paare bleiben in der Match-Tabelle und werden daher nie wieder zusammengebracht (damit ist die andere Person auch blockiert).

export const REPORT_REASONS = [
  { id: "unangenehm", label: "Unangenehm oder respektlos" },
  { id: "belaestigung", label: "Belästigung" },
  { id: "spam", label: "Spam oder Werbung" },
  { id: "fake", label: "Fake-Profil" },
  { id: "sonstiges", label: "Etwas anderes" },
] as const;

type Reason = (typeof REPORT_REASONS)[number]["id"];

export function isReason(value: unknown): value is Reason {
  return typeof value === "string" && REPORT_REASONS.some((r) => r.id === value);
}

export async function reportRoom(db: SupabaseClient, userId: string, roomId: string, reason: Reason, note: string | null): Promise<void> {
  const { data: members } = await db.from("chat_room_members").select("user_id, left_at").eq("room_id", roomId);
  const list = (members ?? []) as { user_id: string; left_at: string | null }[];
  const me = list.find((m) => m.user_id === userId);
  if (!me) throw new ChatError("not_found", "Chat nicht gefunden.");
  const others = list.filter((m) => m.user_id !== userId).map((m) => m.user_id);

  const { error } = await db.from("chat_reports").insert({
    room_id: roomId,
    reporter: userId,
    others,
    reason,
    note: note ? note.slice(0, 300) : null,
  });
  if (error) throw new ChatError("invalid", "Die Meldung konnte nicht gespeichert werden.");

  // Chat verlassen (falls noch aktiv): gibt den Platz frei
  if (!me.left_at) await leaveRoom(db, userId, roomId);
}
