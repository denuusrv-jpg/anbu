import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { avatarUrl, loadPosts, type PostView } from "@/lib/profileMedia";
import type { Choice } from "@/lib/onboarding";

// Wer sieht was auf einer Profilseite?
//  - die Person selbst: alles
//  - "Öffentlich": alle angemeldeten Mitglieder sehen alles (Name, Alter, Hobbys, Text, Beiträge)
//  - "Nur Business": alle Business-Mitglieder sehen alles, andere nur Profilbild und Spitzname
//  - "Privat": nur Profilbild und Spitzname, und nur für Personen, die mit ihr in einem Chat sind oder gematcht wurden
export type ProfilePageData = {
  state: "self" | "full" | "limited";
  userId: string;
  displayName: string;
  avatar: string | null;
  realName?: string;
  age?: number | null;
  city?: string | null;
  bio?: string;
  hobbies: string[];
  interests?: Choice;
  posts: PostView[];
};

type Row = {
  user_id: string;
  deleted_at: string | null;
  visibility: "public" | "business" | "stealth";
  track: "community" | "business";
  has_avatar: boolean;
  age: number | null;
  city: string | null;
  interests: Choice;
  profile: { displayName?: string; firstName?: string; lastName?: string; bio?: string; hobbies?: string[] } | null;
};

const COLUMNS = "user_id, deleted_at, visibility, track, has_avatar, age, city, interests, profile";

async function related(db: SupabaseClient, a: string, b: string): Promise<boolean> {
  const [x, y] = a < b ? [a, b] : [b, a];
  const { data: pair } = await db.from("matches").select("user_a").eq("user_a", x).eq("user_b", y).maybeSingle();
  if (pair) return true;
  const { data: mine } = await db.from("chat_room_members").select("room_id").eq("user_id", a).is("left_at", null);
  const rooms = ((mine ?? []) as { room_id: string }[]).map((r) => r.room_id);
  if (rooms.length === 0) return false;
  const { data: shared } = await db.from("chat_room_members").select("room_id").eq("user_id", b).is("left_at", null).in("room_id", rooms).limit(1);
  return (shared ?? []).length > 0;
}

/** Profilseite laden. null, wenn es sie nicht gibt oder die Person sie nicht sehen darf. */
export async function loadProfilePage(db: SupabaseClient, viewerId: string, targetId: string): Promise<ProfilePageData | null> {
  const { data } = await db.from("user_profiles").select(COLUMNS).eq("user_id", targetId).maybeSingle();
  const row = data as Row | null;
  if (!row || row.deleted_at) return null;

  const base = {
    userId: row.user_id,
    displayName: row.profile?.displayName?.trim() || "Mitglied",
    avatar: row.has_avatar ? await avatarUrl(db, row.user_id) : null,
  };
  const limited: ProfilePageData = { ...base, state: "limited", hobbies: [], posts: [] };
  const full = async (state: "self" | "full"): Promise<ProfilePageData> => ({
    ...base,
    state,
    realName: [row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(" ") || undefined,
    age: row.age,
    city: row.city,
    bio: row.profile?.bio,
    hobbies: row.profile?.hobbies ?? [],
    interests: row.interests,
    posts: await loadPosts(db, row.user_id),
  });

  if (viewerId === targetId) return full("self");

  const { data: me } = await db.from("user_profiles").select("track, deleted_at").eq("user_id", viewerId).maybeSingle();
  const viewer = me as { track: string; deleted_at: string | null } | null;
  if (!viewer || viewer.deleted_at) return null;

  if (row.visibility === "public") return full("full");
  if (row.visibility === "business") return viewer.track === "business" ? full("full") : (await related(db, viewerId, targetId)) ? limited : null;
  // Privat: nur mit Verbindung (Chat oder Match), und dann nur Profilbild und Spitzname
  return (await related(db, viewerId, targetId)) ? limited : null;
}
