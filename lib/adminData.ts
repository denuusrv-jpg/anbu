import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Choice, OnboardingAnswers, ProfileData } from "@/lib/onboarding";

export type AdminProfile = {
  user_id: string;
  email: string;
  last_sign_in_at: string | null;
  region: string;
  city: string | null;
  mode: string;
  status: string;
  created_at: string;
  deleted_at: string | null;
  interests: Choice;
  vibes: Choice;
  profile: ProfileData | null;
  extras: OnboardingAnswers["extras"] | null;
};
export type AdminWish = { id: string; user_id: string; wish: string; created_at: string; email: string; name: string };
export type AdminWaitlist = { id: string; email: string; status: string; created_at: string };
export type AdminDraft = { email: string; created_at: string; answers: OnboardingAnswers };

export type AdminData = {
  profiles: AdminProfile[]; // inklusive gelöschter (deleted_at gesetzt)
  wishes: AdminWish[];
  waitlist: AdminWaitlist[];
  drafts: AdminDraft[];
};

export type Kpis = {
  activeUsers: number;
  registrationsToday: number;
  loginsToday: number;
  softDeleted: number;
  waitlist: number;
  wishes: number;
};

/** Beginn des heutigen Tages in Berlin (als UTC-Zeitpunkt), damit "heute" aus Sicht der Community stimmt. */
export function startOfTodayBerlin(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const sinceMidnight = ((get("hour") * 60 + get("minute")) * 60 + get("second")) * 1000;
  return new Date(now.getTime() - sinceMidnight - now.getMilliseconds());
}

export async function loadAdminData(db: SupabaseClient): Promise<AdminData> {
  const [pr, users, wl, dr, ws] = await Promise.all([
    db
      .from("user_profiles")
      .select("user_id, region, city, mode, status, created_at, deleted_at, interests, vibes, profile, extras")
      .order("created_at", { ascending: false })
      .limit(2000),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db
      .from("waitlist")
      .select("id, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    db
      .from("onboarding_drafts")
      .select("email, answers, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    db
      .from("user_wishes")
      .select("id, user_id, wish, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  if (pr.error || wl.error || dr.error || ws.error) throw new Error("query failed");

  const byId = new Map((users.data?.users ?? []).map((u) => [u.id, u]));
  const profiles = (pr.data ?? []).map((p) => {
    const u = byId.get(p.user_id as string);
    return {
      ...(p as Omit<AdminProfile, "email" | "last_sign_in_at">),
      email: u?.email ?? "",
      last_sign_in_at: u?.last_sign_in_at ?? null,
    } as AdminProfile;
  });
  const profileById = new Map(profiles.map((p) => [p.user_id, p]));
  const wishes = (ws.data ?? []).map((w) => {
    const owner = profileById.get(w.user_id as string);
    return {
      ...(w as Omit<AdminWish, "email" | "name">),
      email: owner?.email ?? byId.get(w.user_id as string)?.email ?? "",
      name: owner?.profile?.displayName ?? "",
      // Wünsche gelöschter Konten bleiben aus der Community-Ansicht heraus (Recht auf Vergessenwerden)
      _deleted: Boolean(owner?.deleted_at),
    };
  });

  return {
    profiles,
    wishes: wishes.filter((w) => !w._deleted).map(({ _deleted, ...w }) => (void _deleted, w)),
    waitlist: (wl.data ?? []) as AdminWaitlist[],
    drafts: (dr.data ?? []) as AdminDraft[],
  };
}

export function computeKpis(data: AdminData, now = new Date()): Kpis {
  const start = startOfTodayBerlin(now).getTime();
  const active = data.profiles.filter((p) => !p.deleted_at);
  return {
    activeUsers: active.length,
    registrationsToday: active.filter((p) => new Date(p.created_at).getTime() >= start).length,
    loginsToday: active.filter((p) => p.last_sign_in_at && new Date(p.last_sign_in_at).getTime() >= start).length,
    softDeleted: data.profiles.length - active.length,
    waitlist: data.waitlist.length,
    wishes: data.wishes.length,
  };
}
