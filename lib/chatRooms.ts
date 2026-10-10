import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getModel, isAiConfigured, takeAiBudget } from "@/lib/ai";
import { logError } from "@/lib/errorLog";
import { notifyNewRoom } from "@/lib/notify";
import { aiIcebreaker, ruleIcebreaker, type IcebreakerContext } from "@/lib/icebreaker";
import { MAX_ACTIVE_CHATS, matchSummary, pairKey, type Proposal } from "@/lib/matching";

// Chat-Räume zwischen Matches. Alle Schreibvorgänge laufen hier über den Service-Client, nachdem die Mitgliedschaft
// geprüft wurde. Für die Qualitätsmetriken werden nur Metadaten gelesen (View room_message_meta), nie Nachrichtentexte.

type Db = SupabaseClient;

export class ChatError extends Error {
  constructor(
    public code: "limit" | "not_found" | "closed" | "invalid" | "slow",
    message: string,
  ) {
    super(message);
  }
}

export const MESSAGE_MAX = 2000;
const DISSOLVED_KEEP_DAYS = 7;

export type MemberLabel = { label: string; isMe: boolean };
export type RoomMessage = {
  id: string;
  kind: "user" | "icebreaker" | "system";
  body: string;
  createdAt: string;
  mine: boolean;
  sender: string | null;
};
export type RoomSummary = {
  id: string;
  kind: "duo" | "group";
  track: "community" | "business";
  dissolved: boolean;
  members: MemberLabel[];
  unread: number;
  last: { body: string; createdAt: string; kind: string } | null;
};
export type RoomDetail = {
  room: { id: string; kind: "duo" | "group"; track: "community" | "business"; dissolved: boolean };
  steckbrief: string | null;
  members: MemberLabel[];
  messages: RoomMessage[];
  myFeedback: string | null;
};

// ——— Hilfen ———

async function labelsFor(db: Db, memberIds: string[], meId: string): Promise<{ list: MemberLabel[]; byId: Map<string, string> }> {
  const { data } = await db.from("user_profiles").select("user_id, mode, profile").in("user_id", memberIds);
  const info = new Map<string, { mode: string; name?: string }>();
  for (const row of (data ?? []) as { user_id: string; mode: string; profile: { displayName?: string } | null }[]) {
    info.set(row.user_id, { mode: row.mode, name: row.profile?.displayName });
  }
  let anon = 0;
  const byId = new Map<string, string>();
  const list: MemberLabel[] = [];
  for (const id of memberIds) {
    const entry = info.get(id);
    let label: string;
    if (id === meId) label = "Du";
    else if (entry?.mode === "profile" && entry.name) label = entry.name;
    else label = `Anonym ${++anon}`;
    byId.set(id, label);
    list.push({ label, isMe: id === meId });
  }
  return { list, byId };
}

async function activeMemberIds(db: Db, roomId: string): Promise<string[]> {
  const { data } = await db
    .from("chat_room_members")
    .select("user_id, joined_at")
    .eq("room_id", roomId)
    .is("left_at", null)
    .order("joined_at", { ascending: true });
  return ((data ?? []) as { user_id: string }[]).map((m) => m.user_id);
}

async function requireMembership(db: Db, userId: string, roomId: string) {
  const { data: member } = await db
    .from("chat_room_members")
    .select("room_id, last_read_at, feedback")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();
  if (!member) throw new ChatError("not_found", "Chat nicht gefunden.");
  const { data: room } = await db.from("chat_rooms").select("id, kind, track, status, created_at").eq("id", roomId).maybeSingle();
  if (!room) throw new ChatError("not_found", "Chat nicht gefunden.");
  return { member: member as { last_read_at: string; feedback: string | null }, room: room as { id: string; kind: "duo" | "group"; track: "community" | "business"; status: string; created_at: string } };
}

type Shared = { interests?: string[]; vibes?: string[]; hub?: string; track?: "community" | "business"; size?: number };

// Nächster Eisbrecher: KI, wenn verfügbar, sonst regelbasiert
async function nextIcebreaker(ctx: IcebreakerContext): Promise<string> {
  if (isAiConfigured() && takeAiBudget()) {
    try {
      const q = await aiIcebreaker(getModel(), ctx);
      if (q) return q;
    } catch (error) {
      await logError(error, "chatRooms (KI-Eisbrecher)");
    }
  }
  return ruleIcebreaker(ctx);
}

async function logEvent(db: Db, kind: "room_created" | "icebreaker" | "feedback" | "room_ended", value: string | null, meta: Record<string, unknown> = {}) {
  const { error } = await db.from("room_events").insert({ kind, value, meta });
  if (error) await logError(error, "chatRooms (room_events)");
}

// ——— Raum anlegen ———

export type CreateResult = { ok: true; roomId: string } | { ok: false; reason: "limit" | "invalid"; userId?: string };

export async function createRoom(
  db: Db,
  input: { memberIds: string[]; track: "community" | "business"; hub: string; shared: Proposal["shared"] },
): Promise<CreateResult> {
  const ids = Array.from(new Set(input.memberIds));
  if (ids.length < 2 || ids.length > 8) return { ok: false, reason: "invalid" };

  const { data: room, error } = await db
    .from("chat_rooms")
    .insert({ kind: ids.length === 2 ? "duo" : "group", track: input.track })
    .select("id")
    .single();
  if (error || !room) {
    await logError(error ?? new Error("room insert failed"), "chatRooms.createRoom");
    return { ok: false, reason: "invalid" };
  }
  const roomId = (room as { id: string }).id;

  // Mitglieder einzeln eintragen: die Datenbank erzwingt das Limit von 4 aktiven Chats pro Person
  for (const userId of ids) {
    const { error: memberError } = await db.from("chat_room_members").insert({ room_id: roomId, user_id: userId });
    if (memberError) {
      await db.from("chat_rooms").delete().eq("id", roomId);
      if (memberError.message.indexOf("chat_limit_reached") >= 0) return { ok: false, reason: "limit", userId };
      await logError(memberError, "chatRooms.createRoom (Mitglied)");
      return { ok: false, reason: "invalid" };
    }
  }

  const summary = matchSummary({ hub: input.hub, track: input.track, shared: input.shared, size: ids.length });
  await db.from("room_steckbriefe").insert({
    room_id: roomId,
    summary,
    shared: { ...input.shared, hub: input.hub, track: input.track, size: ids.length },
  });

  // Das Match gilt für die Sichtbarkeit "nur nach gegenseitigem Match" (Datenbank-Regel discoverable_profiles)
  const pairs: { user_a: string; user_b: string }[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = pairKey(ids[i], ids[j]).split("|");
      pairs.push({ user_a: a, user_b: b });
    }
  }
  await db.from("matches").upsert(pairs, { onConflict: "user_a,user_b", ignoreDuplicates: true });

  // Willkommens-Eisbrecher
  const body = await nextIcebreaker({
    interests: input.shared.interests,
    vibes: input.shared.vibes,
    hub: input.hub,
    track: input.track,
    size: ids.length,
    used: [],
  });
  await db.from("room_messages").insert({ room_id: roomId, user_id: null, kind: "icebreaker", body });
  await logEvent(db, "room_created", input.track, { size: ids.length });
  await notifyNewRoom(db, ids);
  return { ok: true, roomId };
}

// ——— Lesen ———

export async function listRooms(db: Db, userId: string): Promise<{ rooms: RoomSummary[]; slotsUsed: number; limit: number }> {
  const { data } = await db
    .from("chat_room_members")
    .select("room_id, last_read_at, chat_rooms!inner(id, kind, track, status, created_at)")
    .eq("user_id", userId)
    .is("left_at", null);
  const rows = (data ?? []) as unknown as {
    room_id: string;
    last_read_at: string;
    chat_rooms: { id: string; kind: "duo" | "group"; track: "community" | "business"; status: string; created_at: string };
  }[];

  const rooms: RoomSummary[] = [];
  for (const row of rows) {
    const memberIds = await activeMemberIds(db, row.room_id);
    const { list } = await labelsFor(db, memberIds, userId);
    const { data: last } = await db
      .from("room_messages")
      .select("body, created_at, kind")
      .eq("room_id", row.room_id)
      .order("created_at", { ascending: false })
      .limit(1);
    const { count } = await db
      .from("room_messages")
      .select("id", { count: "exact", head: true })
      .eq("room_id", row.room_id)
      .gt("created_at", row.last_read_at)
      .or(`user_id.is.null,user_id.neq.${userId}`);
    const lastRow = (last ?? [])[0] as { body: string; created_at: string; kind: string } | undefined;
    rooms.push({
      id: row.room_id,
      kind: row.chat_rooms.kind,
      track: row.chat_rooms.track,
      dissolved: row.chat_rooms.status === "dissolved",
      members: list,
      unread: count ?? 0,
      last: lastRow ? { body: lastRow.body, createdAt: lastRow.created_at, kind: lastRow.kind } : null,
    });
  }
  rooms.sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
  return { rooms, slotsUsed: rooms.filter((r) => !r.dissolved).length, limit: MAX_ACTIVE_CHATS };
}

export async function getRoom(db: Db, userId: string, roomId: string, after?: string): Promise<RoomDetail> {
  const { member, room } = await requireMembership(db, userId, roomId);
  const memberIds = await activeMemberIds(db, roomId);
  const { list, byId } = await labelsFor(db, memberIds, userId);

  let query = db
    .from("room_messages")
    .select("id, user_id, kind, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(300);
  if (after) query = query.gt("created_at", after);
  const { data: messages } = await query;

  // Namen auch für Personen, die den Chat inzwischen verlassen haben
  const senderIds = Array.from(new Set(((messages ?? []) as { user_id: string | null }[]).map((m) => m.user_id).filter((x): x is string => Boolean(x) && memberIds.indexOf(x as string) < 0)));
  if (senderIds.length > 0) {
    const { byId: extra } = await labelsFor(db, senderIds, userId);
    extra.forEach((label, id) => byId.set(id, label.replace(/^Anonym \d+$/, "Ehemaliges Mitglied")));
  }

  const { data: steckbrief } = await db.from("room_steckbriefe").select("summary").eq("room_id", roomId).maybeSingle();

  await db.from("chat_room_members").update({ last_read_at: new Date().toISOString() }).eq("room_id", roomId).eq("user_id", userId);

  return {
    room: { id: roomId, kind: room.kind, track: room.track, dissolved: room.status === "dissolved" },
    steckbrief: (steckbrief as { summary: string } | null)?.summary ?? null,
    members: list,
    myFeedback: member.feedback,
    messages: ((messages ?? []) as { id: string; user_id: string | null; kind: "user" | "icebreaker" | "system"; body: string; created_at: string }[]).map((m) => ({
      id: m.id,
      kind: m.kind,
      body: m.body,
      createdAt: m.created_at,
      mine: m.user_id === userId,
      sender: m.user_id ? (m.user_id === userId ? "Du" : byId.get(m.user_id) ?? "Mitglied") : null,
    })),
  };
}

// ——— Schreiben ———

const recent = new Map<string, number[]>();
function tooFast(userId: string): boolean {
  const now = Date.now();
  const list = (recent.get(userId) ?? []).filter((t) => now - t < 30000);
  if (list.length >= 20) {
    recent.set(userId, list);
    return true;
  }
  list.push(now);
  recent.set(userId, list);
  return false;
}

export async function sendMessage(db: Db, userId: string, roomId: string, raw: string): Promise<RoomMessage> {
  const body = raw.trim();
  if (body.length < 1 || body.length > MESSAGE_MAX) throw new ChatError("invalid", `Nachricht: 1 bis ${MESSAGE_MAX} Zeichen.`);
  const { room } = await requireMembership(db, userId, roomId);
  if (room.status !== "active") throw new ChatError("closed", "Dieser Chat ist beendet.");
  if (tooFast(userId)) throw new ChatError("slow", "Nicht so schnell, bitte kurz warten.");

  const { data, error } = await db
    .from("room_messages")
    .insert({ room_id: roomId, user_id: userId, kind: "user", body })
    .select("id, created_at")
    .single();
  if (error || !data) {
    await logError(error ?? new Error("message insert failed"), "chatRooms.sendMessage");
    throw new ChatError("invalid", "Senden hat nicht geklappt.");
  }
  const row = data as { id: string; created_at: string };
  return { id: row.id, kind: "user", body, createdAt: row.created_at, mine: true, sender: "Du" };
}

export async function requestIcebreaker(db: Db, userId: string, roomId: string): Promise<RoomMessage> {
  const { room } = await requireMembership(db, userId, roomId);
  if (room.status !== "active") throw new ChatError("closed", "Dieser Chat ist beendet.");

  const { data: used } = await db
    .from("room_messages")
    .select("body, created_at")
    .eq("room_id", roomId)
    .eq("kind", "icebreaker")
    .order("created_at", { ascending: false })
    .limit(20);
  const usedRows = (used ?? []) as { body: string; created_at: string }[];
  if (usedRows[0] && Date.now() - new Date(usedRows[0].created_at).getTime() < 8000) {
    throw new ChatError("slow", "Der letzte Impuls ist gerade erst da. Gib dem Chat einen Moment.");
  }

  const { data: sb } = await db.from("room_steckbriefe").select("shared").eq("room_id", roomId).maybeSingle();
  const shared = ((sb as { shared: Shared } | null)?.shared ?? {}) as Shared;
  const body = await nextIcebreaker({
    interests: shared.interests ?? [],
    vibes: shared.vibes ?? [],
    hub: shared.hub ?? "",
    track: shared.track ?? room.track,
    size: shared.size ?? 2,
    used: usedRows.map((r) => r.body),
  });
  const { data, error } = await db
    .from("room_messages")
    .insert({ room_id: roomId, user_id: null, kind: "icebreaker", body })
    .select("id, created_at")
    .single();
  if (error || !data) {
    await logError(error ?? new Error("icebreaker insert failed"), "chatRooms.requestIcebreaker");
    throw new ChatError("invalid", "Der Impuls konnte nicht gesendet werden.");
  }
  await logEvent(db, "icebreaker", null);
  const row = data as { id: string; created_at: string };
  return { id: row.id, kind: "icebreaker", body, createdAt: row.created_at, mine: false, sender: null };
}

export async function setFeedback(db: Db, userId: string, roomId: string, value: string): Promise<void> {
  if (value !== "good" && value !== "ok" && value !== "bad") throw new ChatError("invalid", "Ungültiges Feedback.");
  const { member } = await requireMembership(db, userId, roomId);
  if (member.feedback) return; // nur einmal pro Person und Chat
  await db.from("chat_room_members").update({ feedback: value }).eq("room_id", roomId).eq("user_id", userId);
  await logEvent(db, "feedback", value);
}

// ——— Verlassen und Auflösen ———

// Nur Zahlen, nie Texte: wie aktiv war der Chat?
async function roomStats(db: Db, roomId: string, createdAt: string) {
  const { data } = await db.from("room_message_meta").select("user_id, kind").eq("room_id", roomId).eq("kind", "user");
  const rows = (data ?? []) as { user_id: string | null }[];
  const senders = new Set(rows.map((r) => r.user_id));
  return {
    messages: rows.length,
    replied: senders.size >= 2,
    hours: Math.round((Date.now() - new Date(createdAt).getTime()) / 36e5),
  };
}

async function deleteRoom(db: Db, roomId: string) {
  // Räume löschen heißt: Nachrichten, Mitgliedschaften und der Match-Steckbrief verschwinden mit (ON DELETE CASCADE)
  await db.from("chat_rooms").delete().eq("id", roomId);
}

export async function leaveRoom(db: Db, userId: string, roomId: string): Promise<void> {
  const { room } = await requireMembership(db, userId, roomId);
  const { error } = await db
    .from("chat_room_members")
    .update({ left_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", userId);
  if (error) {
    await logError(error, "chatRooms.leaveRoom");
    throw new ChatError("invalid", "Verlassen hat nicht geklappt.");
  }

  const remaining = (await activeMemberIds(db, roomId)).length;
  if (remaining === 0) {
    if (room.status === "active") await logEvent(db, "room_ended", "left", await roomStats(db, roomId, room.created_at));
    await deleteRoom(db, roomId);
    return;
  }
  if (room.status !== "active") return;

  if (remaining === 1) {
    // Kein Gespräch mehr möglich: Chat auflösen. Der Match-Steckbrief wird sofort gelöscht, der Rest bleibt
    // für die verbleibende Person lesbar, bis sie den Chat entfernt (spätestens nach 7 Tagen automatisch).
    const stats = await roomStats(db, roomId, room.created_at);
    await db.from("chat_rooms").update({ status: "dissolved", dissolved_at: new Date().toISOString() }).eq("id", roomId);
    await db.from("room_steckbriefe").delete().eq("room_id", roomId);
    await db.from("room_messages").insert({ room_id: roomId, user_id: null, kind: "system", body: "Dein Match hat den Chat verlassen. Dieser Chat ist beendet." });
    await logEvent(db, "room_ended", "dissolved", stats);
  } else {
    await db.from("room_messages").insert({ room_id: roomId, user_id: null, kind: "system", body: "Eine Person hat den Chat verlassen." });
  }
}

export async function leaveAllRooms(db: Db, userId: string): Promise<void> {
  const { data } = await db.from("chat_room_members").select("room_id").eq("user_id", userId).is("left_at", null);
  for (const row of (data ?? []) as { room_id: string }[]) {
    await leaveRoom(db, userId, row.room_id).catch(() => undefined);
  }
}

/** Aufgelöste Chats nach einer Frist endgültig löschen (Täglicher Job). */
export async function purgeDissolvedRooms(db: Db, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - DISSOLVED_KEEP_DAYS * 864e5).toISOString();
  const { data } = await db.from("chat_rooms").select("id").eq("status", "dissolved").lt("dissolved_at", cutoff);
  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
  for (const id of ids) await deleteRoom(db, id);
  return ids.length;
}

// ——— Anonyme Qualitätsmetriken (nur Zahlen) ———

export type ChatMetrics = {
  roomsActive: number;
  roomsDissolved: number;
  createdLast30: number;
  usersWithChats: number;
  usersAtLimit: number;
  slotHistogram: { slots: number; users: number }[];
  activeRoomsReplyRate: number | null; // Anteil aktiver Chats, in denen mindestens zwei Personen geschrieben haben
  activeRoomsSilent: number; // aktive Chats ohne eine einzige Nachricht von Personen
  avgMessagesPerActiveRoom: number | null;
  icebreakerClicks30: number;
  feedback30: { good: number; ok: number; bad: number };
  ended30: number;
  endedReplyRate: number | null;
  earlyLeaveRate: number | null; // Anteil beendeter Chats, die in den ersten 48 Stunden endeten
};

export async function loadChatMetrics(db: Db, now = new Date()): Promise<ChatMetrics> {
  const since = new Date(now.getTime() - 30 * 864e5).toISOString();

  const { data: rooms } = await db.from("chat_rooms").select("id, status, created_at");
  const roomRows = (rooms ?? []) as { id: string; status: string; created_at: string }[];
  const activeIds = roomRows.filter((r) => r.status === "active").map((r) => r.id);

  // Metadaten der Nachrichten (Absender und Art), nie der Text
  const { data: meta } = await db.from("room_message_meta").select("room_id, user_id, kind").eq("kind", "user").limit(50000);
  const perRoom = new Map<string, { count: number; senders: Set<string | null> }>();
  for (const m of (meta ?? []) as { room_id: string; user_id: string | null }[]) {
    const entry = perRoom.get(m.room_id) ?? { count: 0, senders: new Set<string | null>() };
    entry.count += 1;
    entry.senders.add(m.user_id);
    perRoom.set(m.room_id, entry);
  }
  const activeStats = activeIds.map((id) => perRoom.get(id) ?? { count: 0, senders: new Set<string | null>() });

  const { data: members } = await db.from("chat_room_members").select("user_id, room_id, chat_rooms!inner(status)").is("left_at", null);
  const perUser = new Map<string, number>();
  for (const m of (members ?? []) as unknown as { user_id: string; chat_rooms: { status: string } }[]) {
    if (m.chat_rooms.status !== "active") continue;
    perUser.set(m.user_id, (perUser.get(m.user_id) ?? 0) + 1);
  }
  const histogram: { slots: number; users: number }[] = [];
  for (let s = 1; s <= MAX_ACTIVE_CHATS; s++) {
    histogram.push({ slots: s, users: Array.from(perUser.values()).filter((n) => n === s).length });
  }

  const { data: events } = await db.from("room_events").select("kind, value, meta").gte("created_at", since);
  const ev = (events ?? []) as { kind: string; value: string | null; meta: { messages?: number; replied?: boolean; hours?: number } }[];
  const ended = ev.filter((e) => e.kind === "room_ended");
  const feedback = { good: 0, ok: 0, bad: 0 };
  for (const e of ev) if (e.kind === "feedback" && (e.value === "good" || e.value === "ok" || e.value === "bad")) feedback[e.value] += 1;

  const ratio = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) / 100 : null);
  return {
    roomsActive: activeIds.length,
    roomsDissolved: roomRows.length - activeIds.length,
    createdLast30: ev.filter((e) => e.kind === "room_created").length,
    usersWithChats: perUser.size,
    usersAtLimit: Array.from(perUser.values()).filter((n) => n >= MAX_ACTIVE_CHATS).length,
    slotHistogram: histogram,
    activeRoomsReplyRate: ratio(activeStats.filter((s) => s.senders.size >= 2).length, activeStats.length),
    activeRoomsSilent: activeStats.filter((s) => s.count === 0).length,
    avgMessagesPerActiveRoom: activeStats.length ? Math.round((activeStats.reduce((sum, s) => sum + s.count, 0) / activeStats.length) * 10) / 10 : null,
    icebreakerClicks30: ev.filter((e) => e.kind === "icebreaker").length,
    feedback30: feedback,
    ended30: ended.length,
    endedReplyRate: ratio(ended.filter((e) => e.meta.replied).length, ended.length),
    earlyLeaveRate: ratio(ended.filter((e) => (e.meta.hours ?? 999) < 48).length, ended.length),
  };
}
