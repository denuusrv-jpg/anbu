import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createSessionToken,
  isAdminConfigured,
  passwordMatches,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Einfache Bremse gegen Durchprobieren (pro Server-Instanz, im Speicher)
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin-Zugang ist nicht eingerichtet." },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte später erneut probieren." },
      { status: 429 },
    );
  }

  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 200 ||
    !passwordMatches(password)
  ) {
    const current = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, { count: current.count + 1, resetAt: current.resetAt });
    // kleine Verzögerung bremst automatisierte Versuche zusätzlich
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // bewusst kein maxAge: Sitzungs-Cookie, endet beim Schließen des Browsers
  });
  return response;
}
