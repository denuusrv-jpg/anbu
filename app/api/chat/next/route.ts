import { NextResponse } from "next/server";
import { getModel, isAiConfigured, takeAiBudget } from "@/lib/ai";
import { suggestFollowUp } from "@/lib/chatAi";
import { rateLimited } from "@/lib/botGuard";
import { logError } from "@/lib/errorLog";
import { sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 20000;

function strings(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .slice(-maxItems)
    .map((v) => sanitizeText(v.trim()).slice(0, maxLength))
    .filter(Boolean);
}

// Nächste Frage für das längere Gespräch im Onboarding-Chat (KI). Gibt { fallback: true } zurück, wenn keine KI
// verfügbar ist oder etwas schiefgeht, dann nimmt der Chat die regelbasierte Frage.
export async function POST(request: Request) {
  const fallback = NextResponse.json({ fallback: true });

  if (!isAiConfigured()) return fallback;
  if (rateLimited(request, "ai-chat", 60)) return fallback;

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return fallback;
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return fallback;
  }

  if (!takeAiBudget()) return fallback;

  try {
    const question = await suggestFollowUp(getModel(), {
      lastAnswer: typeof body.lastAnswer === "string" ? sanitizeText(body.lastAnswer.trim()).slice(0, 1500) : "",
      recent: strings(body.recent, 6, 600),
      asked: strings(body.asked, 40, 300),
      hints: strings(body.hints, 12, 120),
      track: body.track === "business" ? "business" : "community",
      language: body.language === "ta" || body.language === "en" ? body.language : "de",
    });
    return question ? NextResponse.json({ question }) : fallback;
  } catch (error) {
    await logError(error, "API /api/chat/next (KI-Folgefrage)");
    return fallback;
  }
}
