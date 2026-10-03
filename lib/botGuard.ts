import "server-only";

// Gemeinsamer Bot- und Spam-Schutz für Warteliste und Login.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 1500; // schneller kann kein Mensch ein Formular ausfüllen
const WINDOW_MS = 10 * 60 * 1000;

export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

/** Honeypot gefüllt oder Formular unmenschlich schnell abgeschickt -> vermutlich ein Bot. */
export function looksLikeBot(body: Record<string, unknown>): boolean {
  if (typeof body.website === "string" && body.website.length > 0) return true;
  if (typeof body.elapsed !== "number" || body.elapsed < MIN_FILL_MS) return true;
  return false;
}

// Begrenzung pro Absender (im Speicher der jeweiligen Server-Instanz)
const buckets = new Map<string, { count: number; resetAt: number }>();

/** true, wenn der Absender das Limit überschritten hat. */
export function rateLimited(request: Request, scope: string, max = 5): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (entry && entry.resetAt > now) {
    if (entry.count >= max) return true;
    entry.count += 1;
    return false;
  }
  buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  return false;
}
