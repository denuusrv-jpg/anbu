import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendMail } from "@/lib/notify";

// Konto löschen braucht eine zweite Bestätigung per E-Mail: Der Link enthält ein signiertes, kurz gültiges Token
// (Nutzer-ID + Ablaufzeit, mit dem Service-Key signiert). Ohne Klick auf den Link wird nichts gelöscht.

const TTL_MS = 60 * 60 * 1000;
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dspora.de").replace(/\/$/, "");

function sign(payload: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Kein Schlüssel zum Signieren konfiguriert.");
  return createHmac("sha256", `delete-account:${secret}`).update(payload).digest("base64url");
}

export function makeDeleteToken(userId: string, now = Date.now()): string {
  const payload = `${userId}.${now + TTL_MS}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** Gibt die Nutzer-ID zurück, wenn das Token echt und noch gültig ist, sonst null. */
export function verifyDeleteToken(token: string | null | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [userId, exp] = payload.split(".");
  if (!userId || !exp || Number(exp) < now) return null;
  return userId;
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const TEXTS = {
  de: {
    subject: "Konto bei DSpora löschen? Bitte bestätigen",
    title: "Konto löschen bestätigen",
    intro: "du hast angefragt, dein DSpora-Konto zu löschen. Zur Sicherheit löschen wir es erst, wenn du hier bestätigst:",
    button: "Löschen bestätigen",
    note: "Der Link ist eine Stunde gültig. Danach bleiben deine Daten noch 30 Tage gespeichert und werden dann endgültig gelöscht. Hast du das nicht angefragt, ignoriere diese Mail, es passiert nichts.",
  },
  en: {
    subject: "Delete your DSpora account? Please confirm",
    title: "Confirm account deletion",
    intro: "you asked to delete your DSpora account. For your safety we only delete it once you confirm here:",
    button: "Confirm deletion",
    note: "The link is valid for one hour. Afterwards your data is kept for another 30 days and then permanently deleted. If you did not ask for this, ignore this email and nothing will happen.",
  },
  ta: {
    subject: "DSpora கணக்கை நீக்கவா? தயவுசெய்து உறுதிப்படுத்தவும்",
    title: "கணக்கு நீக்குவதை உறுதிப்படுத்தவும்",
    intro: "உங்கள் DSpora கணக்கை நீக்கக் கோரினீர்கள். உங்கள் பாதுகாப்புக்காக, நீங்கள் இங்கே உறுதிப்படுத்திய பின்னரே அதை நீக்குவோம்:",
    button: "நீக்குவதை உறுதிப்படுத்து",
    note: "இந்த இணைப்பு ஒரு மணி நேரம் செல்லுபடியாகும். அதன் பிறகும் உங்கள் தரவு 30 நாட்கள் சேமிக்கப்பட்டு பின்னர் நிரந்தரமாக நீக்கப்படும். நீங்கள் இதைக் கோரவில்லை என்றால் இந்த மின்னஞ்சலைப் புறக்கணிக்கவும், எதுவும் நடக்காது.",
  },
} as const;

/** Schickt den Bestätigungslink. Gibt false zurück, wenn kein Mail-Versand eingerichtet ist. */
export async function sendDeleteMail(email: string, userId: string, language: string | null | undefined): Promise<boolean> {
  const t = TEXTS[language === "en" || language === "ta" ? language : "de"];
  const link = `${SITE}/konto-loeschen?token=${encodeURIComponent(makeDeleteToken(userId))}`;
  const text = `${t.title}\n\n${t.intro}\n${link}\n\n${t.note}`;
  const html = `<!doctype html><html><body style="margin:0;background:#0b0b0d;font-family:Inter,Arial,sans-serif;color:#e4e4e7"><div style="max-width:480px;margin:0 auto;padding:32px 24px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#f2a65a;margin:0 0 16px">DSpora</p><h1 style="font-size:22px;color:#fafafa;margin:0 0 16px">${esc(t.title)}</h1><p style="line-height:1.6;margin:0 0 24px">${esc(t.intro)}</p><p style="margin:0 0 28px"><a href="${link}" style="background:#f43f5e;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;display:inline-block">${esc(t.button)}</a></p><p style="font-size:13px;line-height:1.6;color:#a1a1aa;margin:0">${esc(t.note)}</p></div></body></html>`;
  return sendMail(email, t.subject, text, html);
}
