// Supabase-Konfiguration. Die NEXT_PUBLIC_-Werte müssen als wörtliche
// process.env-Zugriffe stehen, damit Next.js sie in den Browser-Code einsetzt.
// Der Anon-Key ist öffentlich gedacht (der Schutz kommt von den RLS-Regeln in der Datenbank).

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Nur auf Pfade innerhalb der eigenen Seite weiterleiten (kein Open Redirect). */
export function safeNextPath(value: string | null | undefined, fallback = "/hub"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
