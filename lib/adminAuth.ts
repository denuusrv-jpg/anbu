import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Admin-Zugang: Das Passwort steht nur als Umgebungsvariable ADMIN_SECRET_KEY
// auf dem Server. Nach dem Login bekommt der Browser ein signiertes,
// httpOnly-Cookie (Sitzungs-Cookie, verschwindet beim Schließen des Browsers).

export const ADMIN_COOKIE = "dspora_admin";
const SESSION_HOURS = 12;

function secret(): string {
  return process.env.ADMIN_SECRET_KEY ?? "";
}

export function isAdminConfigured(): boolean {
  return secret().length > 0;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function passwordMatches(input: string): boolean {
  if (!isAdminConfigured()) return false;
  // Hashes gleicher Länge, damit timingSafeEqual vergleichen kann
  return timingSafeEqual(sha256(input), sha256(secret()));
}

function sign(expires: number): string {
  return createHmac("sha256", secret())
    .update(`admin-session:${expires}`)
    .digest("hex");
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return `${expires}.${sign(expires)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !isAdminConfigured()) return false;
  const [expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) {
    return false;
  }
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
