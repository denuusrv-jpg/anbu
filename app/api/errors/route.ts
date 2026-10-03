import { NextResponse } from "next/server";
import { logError } from "@/lib/errorLog";
import { rateLimited } from "@/lib/botGuard";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 20000;

// Fehler aus dem Browser entgegennehmen. Jeder darf melden (auch nicht angemeldete Besucher),
// deshalb: Größenlimit, Rate-Limit pro Absender und erneute Bereinigung auf dem Server.
export async function POST(request: Request) {
  if (rateLimited(request, "client-errors", 30)) {
    return NextResponse.json({ ok: true }); // still verwerfen
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ ok: true });

  let body: { message?: unknown; stack?: unknown; path?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (typeof body.message !== "string" || body.message.length === 0) return NextResponse.json({ ok: true });

  const error = new Error(body.message.slice(0, 2000));
  error.stack = typeof body.stack === "string" ? body.stack.slice(0, 20000) : undefined;
  await logError(error, `Browser: ${typeof body.path === "string" ? body.path : "unbekannt"}`);
  return NextResponse.json({ ok: true });
}
