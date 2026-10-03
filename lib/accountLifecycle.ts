import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/errorLog";

// Soft-Delete nach DSGVO: Ein gelöschtes Konto wird gesperrt und bleibt 30 Tage für den Support
// sichtbar. Danach wird es endgültig entfernt (Konto, Profil, Antworten, Wünsche, Fotos).

export const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// Sperre knapp über die Aufbewahrungsfrist; endgültig gelöscht wird ohnehin vorher.
const BAN_DURATION = `${(RETENTION_DAYS + 1) * 24}h`;

export function daysLeft(deletedAt: string, now = Date.now()): number {
  const end = new Date(deletedAt).getTime() + RETENTION_DAYS * DAY_MS;
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
}

/** Konto sperren und als gelöscht markieren (bleibt 30 Tage erhalten). */
export async function softDeleteAccount(db: SupabaseClient, userId: string): Promise<boolean> {
  const { error } = await db
    .from("user_profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) return false;
  // Gesperrt: neue Anmeldungen und das Erneuern bestehender Sitzungen sind nicht mehr möglich
  await db.auth.admin.updateUserById(userId, { ban_duration: BAN_DURATION });
  return true;
}

/** Innerhalb der Frist wiederherstellen. */
export async function restoreAccount(db: SupabaseClient, userId: string): Promise<boolean> {
  const { error } = await db.from("user_profiles").update({ deleted_at: null }).eq("user_id", userId);
  if (error) return false;
  await db.auth.admin.updateUserById(userId, { ban_duration: "none" });
  return true;
}

/** Endgültig löschen: Fotos, Konto und (per Kaskade) Profil und Wünsche. */
export async function purgeAccount(db: SupabaseClient, userId: string): Promise<boolean> {
  const files = await db.storage.from("profile-photos").list(userId);
  if (files.data && files.data.length > 0) {
    await db.storage
      .from("profile-photos")
      .remove(files.data.map((f: { name: string }) => `${userId}/${f.name}`));
  }
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) await logError(error, "accountLifecycle (Konto endgültig löschen)");
  return !error;
}

/** Räumt alle Konten auf, deren 30-Tage-Frist abgelaufen ist. Gibt die Anzahl zurück. */
export async function purgeExpired(db: SupabaseClient): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString();
  const { data } = await db
    .from("user_profiles")
    .select("user_id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff);
  let purged = 0;
  for (const row of data ?? []) {
    if (await purgeAccount(db, row.user_id as string)) purged += 1;
  }
  return purged;
}
