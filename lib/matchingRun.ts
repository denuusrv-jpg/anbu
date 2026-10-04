import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRoom } from "@/lib/chatRooms";
import { logError } from "@/lib/errorLog";
import { MAX_ACTIVE_CHATS, formGroups, pairKey, type Candidate, type Proposal } from "@/lib/matching";
import type { BusinessData, Choice } from "@/lib/onboarding";

// Matching-Lauf: Kandidaten aus der Datenbank laden, Gruppen bilden, Chat-Räume anlegen.
// Ein Hub gilt als geöffnet, sobald genug Personen eingetragen sind (Standard 100, per HUB_OPEN_THRESHOLD änderbar).

export const HUB_OPEN_THRESHOLD = Number(process.env.HUB_OPEN_THRESHOLD ?? 100);

type ProfileRow = {
  user_id: string;
  created_at: string;
  region: string;
  second_region: string | null;
  city: string | null;
  group_size: string | null;
  track: "community" | "business";
  gender: string | null;
  match_gender: string | null;
  interests: Choice;
  vibes: Choice;
  business: BusinessData | null;
};

export async function loadCandidates(db: SupabaseClient): Promise<{ candidates: Candidate[]; existingPairs: Set<string>; hubSizes: Map<string, number> }> {
  const { data: rows } = await db
    .from("user_profiles")
    .select("user_id, created_at, region, second_region, city, group_size, track, gender, match_gender, interests, vibes, business")
    .is("deleted_at", null)
    .limit(5000);
  const profiles = (rows ?? []) as ProfileRow[];

  const { data: members } = await db
    .from("chat_room_members")
    .select("user_id, chat_rooms!inner(status)")
    .is("left_at", null);
  const active = new Map<string, number>();
  for (const m of (members ?? []) as unknown as { user_id: string; chat_rooms: { status: string } }[]) {
    if (m.chat_rooms.status === "active") active.set(m.user_id, (active.get(m.user_id) ?? 0) + 1);
  }

  const { data: matches } = await db.from("matches").select("user_a, user_b").limit(50000);
  const existingPairs = new Set<string>(((matches ?? []) as { user_a: string; user_b: string }[]).map((m) => pairKey(m.user_a, m.user_b)));

  const hubSizes = new Map<string, number>();
  const candidates: Candidate[] = profiles.map((p) => {
    const hubs = [p.region, p.second_region].filter((h): h is string => Boolean(h));
    for (const h of hubs) hubSizes.set(h.toLowerCase(), (hubSizes.get(h.toLowerCase()) ?? 0) + 1);
    return {
      userId: p.user_id,
      createdAt: p.created_at,
      hubs,
      city: p.city,
      groupSize: p.group_size,
      track: p.track,
      gender: p.gender,
      matchGender: p.match_gender,
      interests: p.interests,
      vibes: p.vibes,
      business: p.business,
      activeChats: active.get(p.user_id) ?? 0,
    };
  });
  return { candidates, existingPairs, hubSizes };
}

export type RunResult = {
  proposals: Proposal[];
  created: number;
  skipped: { reason: string; members: string[] }[];
  openHubs: string[];
};

/**
 * force=false (täglicher Job): nur Hubs, die die Schwelle erreicht haben.
 * force=true (Admin): alle Hubs, zum Testen und für den Anfang mit wenigen Personen.
 * apply=false: nur berechnen (Vorschau), nichts anlegen.
 */
export async function runMatching(db: SupabaseClient, opts: { apply: boolean; force: boolean }): Promise<RunResult> {
  const { candidates, existingPairs, hubSizes } = await loadCandidates(db);
  const openHubs = Array.from(hubSizes.entries()).filter(([, n]) => opts.force || n >= HUB_OPEN_THRESHOLD).map(([h]) => h);

  // Nur geöffnete Hubs zählen als gemeinsamer Hub
  const pool = candidates
    .map((c) => ({ ...c, hubs: c.hubs.filter((h) => openHubs.indexOf(h.toLowerCase()) >= 0) }))
    .filter((c) => c.hubs.length > 0);

  const proposals = formGroups(pool, existingPairs);
  const result: RunResult = { proposals, created: 0, skipped: [], openHubs };
  if (!opts.apply) return result;

  for (const p of proposals) {
    const ids = p.members.map((m) => m.userId);
    const created = await createRoom(db, { memberIds: ids, track: p.track, hub: p.hub, shared: p.shared });
    if (created.ok) result.created += 1;
    else {
      result.skipped.push({ reason: created.reason === "limit" ? `Chat-Limit (${MAX_ACTIVE_CHATS}) erreicht` : "ungültig", members: ids });
      if (created.reason !== "limit") await logError(new Error("Match konnte nicht angelegt werden"), "matchingRun");
    }
  }
  return result;
}
