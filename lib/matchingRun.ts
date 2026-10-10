import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createRoom } from "@/lib/chatRooms";
import { conceptsOfChoice } from "@/lib/concepts";
import { logError } from "@/lib/errorLog";
import {
  MAX_ACTIVE_CHATS,
  describeBreakdown,
  formGroups,
  matchSummary,
  missingFields,
  pairKey,
  type AiProfile,
  type Breakdown,
  type Candidate,
  type Proposal,
  type Shared,
} from "@/lib/matching";
import type { BusinessData, Choice } from "@/lib/onboarding";

// Matching-Lauf: Kandidaten aus der Datenbank laden, Vorschläge berechnen und als "offen" speichern.
// Chat-Räume entstehen erst, wenn der Admin einen Vorschlag freigibt. Ein Hub nimmt am Matching nur teil, wenn er freigegeben ist.

type ProfileRow = {
  user_id: string;
  created_at: string;
  region: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  group_size: string | null;
  track: "community" | "business";
  gender: string | null;
  match_gender: string | null;
  age: number | null;
  age_min: number | null;
  age_max: number | null;
  meet_mode: "online" | "activities" | null;
  travel_minutes: number | null;
  languages: Choice | null;
  life_phase: string | null;
  meet_frequency: string | null;
  interests: Choice;
  vibes: Choice;
  interest_concepts: string[] | null;
  vibe_concepts: string[] | null;
  business: BusinessData | null;
  ai_profile: AiProfile | null;
  extras: { meetFrequency?: string } | null;
};

const COLUMNS =
  "user_id, created_at, region, city, lat, lng, group_size, track, gender, match_gender, age, age_min, age_max, meet_mode, travel_minutes, languages, life_phase, meet_frequency, interests, vibes, interest_concepts, vibe_concepts, business, ai_profile, extras";

export type HubStat = { hub: string; total: number; complete: number; approved: boolean };

const DAY = 864e5;
const norm = (t: string) => t.trim().toLowerCase();

export async function loadCandidates(db: SupabaseClient): Promise<{
  candidates: Candidate[];
  existingPairs: Set<string>;
  approvedHubs: Set<string>;
  hubStats: HubStat[];
}> {
  const { data: rows } = await db.from("user_profiles").select(COLUMNS).is("deleted_at", null).limit(5000);
  const profiles = (rows ?? []) as unknown as ProfileRow[];

  const { data: members } = await db.from("chat_room_members").select("user_id, chat_rooms!inner(status)").is("left_at", null);
  const active = new Map<string, number>();
  for (const m of (members ?? []) as unknown as { user_id: string; chat_rooms: { status: string } }[]) {
    if (m.chat_rooms.status === "active") active.set(m.user_id, (active.get(m.user_id) ?? 0) + 1);
  }

  const { data: matches } = await db.from("matches").select("user_a, user_b").limit(50000);
  const existingPairs = new Set<string>(((matches ?? []) as { user_a: string; user_b: string }[]).map((m) => pairKey(m.user_a, m.user_b)));

  // Vom Admin abgelehnte Paare nicht wieder vorschlagen
  const { data: rejected } = await db.from("match_proposals").select("members").eq("status", "rejected").limit(5000);
  for (const r of (rejected ?? []) as { members: string[] }[]) {
    for (let i = 0; i < r.members.length; i++) for (let j = i + 1; j < r.members.length; j++) existingPairs.add(pairKey(r.members[i], r.members[j]));
  }

  const { data: approvals } = await db.from("hub_approvals").select("hub, status");
  const approvedHubs = new Set<string>(((approvals ?? []) as { hub: string; status: string }[]).filter((a) => a.status === "approved").map((a) => a.hub));

  const now = Date.now();
  const candidates: Candidate[] = profiles.map((p) => ({
    userId: p.user_id,
    createdAt: p.created_at,
    hub: p.region,
    city: p.city,
    lat: p.lat === null ? null : Number(p.lat),
    lng: p.lng === null ? null : Number(p.lng),
    groupSize: (p.group_size as Candidate["groupSize"]) ?? null,
    track: p.track,
    gender: p.gender,
    matchGender: p.match_gender,
    age: p.age,
    ageMin: p.age_min,
    ageMax: p.age_max,
    meetMode: p.meet_mode,
    travelMinutes: p.travel_minutes,
    languages: p.languages ? [...p.languages.ids, ...p.languages.custom].map(norm) : [],
    lifePhase: p.life_phase,
    frequency: p.meet_frequency ?? p.extras?.meetFrequency ?? null,
    interests: p.interest_concepts ?? conceptsOfChoice(p.interests, "interest"),
    vibes: p.vibe_concepts ?? conceptsOfChoice(p.vibes, "vibe"),
    business: p.business,
    ai: p.ai_profile,
    activeChats: active.get(p.user_id) ?? 0,
    waitingDays: Math.max(0, Math.floor((now - new Date(p.created_at).getTime()) / DAY)),
  }));

  const stats = new Map<string, HubStat>();
  for (const c of candidates) {
    const s = stats.get(c.hub) ?? { hub: c.hub, total: 0, complete: 0, approved: approvedHubs.has(c.hub) };
    s.total += 1;
    if (missingFields(c).length === 0) s.complete += 1;
    stats.set(c.hub, s);
  }
  // Freigegebene Hubs ohne Anmeldungen bleiben in der Liste sichtbar
  approvedHubs.forEach((h) => {
    if (!stats.has(h)) stats.set(h, { hub: h, total: 0, complete: 0, approved: true });
  });
  const hubStats = Array.from(stats.values()).sort((a, b) => b.total - a.total);
  return { candidates, existingPairs, approvedHubs, hubStats };
}

export type RunResult = {
  proposals: Proposal[];
  hubStats: HubStat[];
  incomplete: number;
};

/** Vorschläge berechnen (nichts wird gespeichert). Nur Personen in freigegebenen Hubs nehmen teil. */
export async function computeProposals(db: SupabaseClient, opts: { includeMedium?: boolean } = {}): Promise<RunResult> {
  const { candidates, existingPairs, approvedHubs, hubStats } = await loadCandidates(db);
  const inApprovedHubs = candidates.filter((c) => approvedHubs.has(c.hub));
  const proposals = formGroups(inApprovedHubs, existingPairs, { includeMedium: opts.includeMedium });
  return { proposals, hubStats, incomplete: inApprovedHubs.filter((c) => missingFields(c).length > 0).length };
}

export type StoredBreakdown = {
  shared: Shared;
  quality: "good" | "mid";
  pairs: { a: string; b: string; total: number; text: string; minutes: number | null }[];
};

/** Berechnete Vorschläge als "offen" speichern. Bereits offene Vorschläge werden ersetzt, entschiedene bleiben. */
export async function savePending(db: SupabaseClient, proposals: Proposal[]): Promise<number> {
  await db.from("match_proposals").delete().eq("status", "pending");
  if (proposals.length === 0) return 0;
  const rows = proposals.map((p) => {
    const stored: StoredBreakdown = {
      shared: p.shared,
      quality: p.quality,
      pairs: p.pairs.map((x: { a: string; b: string; breakdown: Breakdown }) => ({
        a: x.a,
        b: x.b,
        total: x.breakdown.total,
        text: describeBreakdown(x.breakdown),
        minutes: x.breakdown.minutes,
      })),
    };
    return {
      status: "pending",
      hub: p.hub,
      track: p.track,
      members: p.members.map((m) => m.userId),
      score: p.score,
      breakdown: stored,
      summary: matchSummary({ hub: p.hub, track: p.track, shared: p.shared, size: p.members.length }),
    };
  });
  const { error } = await db.from("match_proposals").insert(rows);
  if (error) {
    await logError(error, "matchingRun.savePending");
    return 0;
  }
  return rows.length;
}

export type ApproveResult = { ok: true; roomId: string } | { ok: false; error: string };

/** Freigabe: aus dem Vorschlag wird ein Chat-Raum. */
export async function approveProposal(db: SupabaseClient, id: string): Promise<ApproveResult> {
  const { data } = await db.from("match_proposals").select("id, status, hub, track, members, breakdown").eq("id", id).maybeSingle();
  const row = data as { id: string; status: string; hub: string; track: "community" | "business"; members: string[]; breakdown: StoredBreakdown } | null;
  if (!row) return { ok: false, error: "Vorschlag nicht gefunden." };
  if (row.status !== "pending") return { ok: false, error: "Dieser Vorschlag wurde schon entschieden." };

  const created = await createRoom(db, { memberIds: row.members, track: row.track, hub: row.hub, shared: row.breakdown.shared });
  if (!created.ok) {
    return { ok: false, error: created.reason === "limit" ? `Mindestens eine Person hat schon ${MAX_ACTIVE_CHATS} aktive Chats.` : "Der Chat konnte nicht angelegt werden." };
  }
  await db.from("match_proposals").update({ status: "approved", room_id: created.roomId, decided_at: new Date().toISOString() }).eq("id", id);
  return { ok: true, roomId: created.roomId };
}

export async function rejectProposal(db: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await db
    .from("match_proposals")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  return !error;
}

export async function setHubApproval(db: SupabaseClient, hub: string, approved: boolean): Promise<boolean> {
  const { error } = await db.from("hub_approvals").upsert({ hub, status: approved ? "approved" : "closed", decided_at: new Date().toISOString() }, { onConflict: "hub" });
  return !error;
}

