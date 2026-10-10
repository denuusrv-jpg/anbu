import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/errorLog";

// Benachrichtigung per E-Mail, wenn ein neuer Chat angelegt wurde (über Resend, Absender info@dspora.de).
// Die Mail enthält bewusst keine Angaben zum Match: keine Namen, keine Gemeinsamkeiten, nur den Hinweis und einen Link.
// Wer sie nicht möchte, schaltet sie im Profil aus (notify_matches). Ohne RESEND_API_KEY passiert nichts.

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dspora.de").replace(/\/$/, "");

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function content(name: string) {
  const link = `${SITE}/dashboard/chats`;
  const text = `Hey ${name},\n\nwir haben jemanden gefunden, der gut zu dir passt. Dein neuer Chat wartet in deinem Profil:\n${link}\n\nViel Spaß beim Kennenlernen!\nDein DSpora-Team\n\nDiese Mail bekommst du, weil in deinem Profil die Benachrichtigungen an sind. Du kannst sie dort jederzeit ausschalten.`;
  const html = `<!doctype html><html lang="de"><body style="margin:0;background:#0b0b0d;font-family:Inter,Arial,sans-serif;color:#e4e4e7"><div style="max-width:480px;margin:0 auto;padding:32px 24px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#f2a65a;margin:0 0 16px">DSpora</p><h1 style="font-size:22px;color:#fafafa;margin:0 0 16px">Dein neuer Chat wartet</h1><p style="line-height:1.6;margin:0 0 24px">Hey ${esc(name)}, wir haben jemanden gefunden, der gut zu dir passt. Im Chat siehst du, was euch verbindet.</p><p style="margin:0 0 28px"><a href="${link}" style="background:#f2a65a;color:#18181b;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;display:inline-block">Zum Chat</a></p><p style="font-size:12px;line-height:1.6;color:#71717a;margin:0">Diese Mail bekommst du, weil in deinem Profil die Benachrichtigungen an sind. Du kannst sie dort jederzeit ausschalten.</p></div></body></html>`;
  return { text, html };
}

async function send(to: string, name: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const { text, html } = content(name);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "DSpora <info@dspora.de>", to: [to], subject: "Dein neuer Chat auf DSpora wartet", text, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

/** Alle Mitglieder eines neuen Chats benachrichtigen (Fehler werden nur protokolliert und blockieren nichts). */
export async function notifyNewRoom(db: SupabaseClient, memberIds: string[]): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const { data } = await db.from("user_profiles").select("user_id, notify_matches, profile").in("user_id", memberIds);
  const rows = (data ?? []) as { user_id: string; notify_matches: boolean | null; profile: { displayName?: string } | null }[];
  for (const row of rows) {
    if (row.notify_matches === false) continue;
    try {
      const { data: auth } = await db.auth.admin.getUserById(row.user_id);
      const email = auth.user?.email;
      if (email) await send(email, row.profile?.displayName?.trim() || "du");
    } catch (error) {
      await logError(error, "notify.notifyNewRoom");
    }
  }
}
