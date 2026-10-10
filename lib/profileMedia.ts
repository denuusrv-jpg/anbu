import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Profilbild und Beiträge (Instagram-Stil). Die Dateien liegen im privaten Bucket "profile-photos":
//   <Nutzer-ID>/avatar.jpg   <Nutzer-ID>/posts/<Beitrags-ID>/<n>.jpg
// Angezeigt werden sie über kurzlebige, signierte Links, die der Server nur für berechtigte Personen erzeugt.

export const BUCKET = "profile-photos";
export const MAX_POSTS = 6;
export const MAX_SLIDES = 6;
export const CAPTION_MAX = 200;
const URL_SECONDS = 3600;

export type PostView = { id: string; caption: string | null; slides: string[]; createdAt: string };

export async function avatarUrl(db: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await db.storage.from(BUCKET).createSignedUrl(`${userId}/avatar.jpg`, URL_SECONDS);
  return data?.signedUrl ?? null;
}

export async function loadPosts(db: SupabaseClient, userId: string): Promise<PostView[]> {
  const { data } = await db.from("profile_posts").select("id, caption, slides, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(MAX_POSTS);
  const rows = (data ?? []) as { id: string; caption: string | null; slides: number; created_at: string }[];
  const posts: PostView[] = [];
  for (const row of rows) {
    const paths = Array.from({ length: row.slides }, (_, i) => `${userId}/posts/${row.id}/${i + 1}.jpg`);
    const { data: signed } = await db.storage.from(BUCKET).createSignedUrls(paths, URL_SECONDS);
    const slides = (signed ?? []).map((s: { signedUrl: string | null }) => s.signedUrl).filter((u): u is string => Boolean(u));
    if (slides.length > 0) posts.push({ id: row.id, caption: row.caption, slides, createdAt: row.created_at });
  }
  return posts;
}

/** Dateien eines Beitrags löschen. */
export async function removePostFiles(db: SupabaseClient, userId: string, postId: string, slides: number): Promise<void> {
  const paths = Array.from({ length: Math.max(slides, MAX_SLIDES) }, (_, i) => `${userId}/posts/${postId}/${i + 1}.jpg`);
  await db.storage.from(BUCKET).remove(paths);
}

/** Alle Bilder einer Person löschen (Konto endgültig löschen): Profilbild, alte Fotos und alle Beiträge. */
export async function removeUserMedia(db: SupabaseClient, userId: string): Promise<void> {
  const top = await db.storage.from(BUCKET).list(userId);
  const files = (top.data ?? []).filter((f: { id: string | null }) => f.id).map((f: { name: string }) => `${userId}/${f.name}`);
  if (files.length > 0) await db.storage.from(BUCKET).remove(files);
  const posts = await db.storage.from(BUCKET).list(`${userId}/posts`);
  for (const folder of posts.data ?? []) {
    const inner = await db.storage.from(BUCKET).list(`${userId}/posts/${folder.name}`);
    const paths = (inner.data ?? []).map((f: { name: string }) => `${userId}/posts/${folder.name}/${f.name}`);
    if (paths.length > 0) await db.storage.from(BUCKET).remove(paths);
  }
}

/** Gibt es die Slides 1..n eines Beitrags im Speicher? (Prüfung vor dem Veröffentlichen) */
export async function slidesExist(db: SupabaseClient, userId: string, postId: string, slides: number): Promise<boolean> {
  const { data } = await db.storage.from(BUCKET).list(`${userId}/posts/${postId}`);
  const names = new Set((data ?? []).map((f: { name: string }) => f.name));
  for (let i = 1; i <= slides; i++) if (!names.has(`${i}.jpg`)) return false;
  return true;
}
