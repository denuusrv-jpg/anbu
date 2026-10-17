import { NextResponse } from "next/server";
import { getModel, isAiConfigured, takeAiBudget } from "@/lib/ai";
import { talk, type TalkTurn } from "@/lib/chatTalk";
import { rateLimited } from "@/lib/botGuard";
import { logError } from "@/lib/errorLog";
import { sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 30000;

function strings(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .slice(-maxItems)
    .map((v) => sanitizeText(v.trim()).slice(0, maxLength))
    .filter(Boolean);
}

function turns(value: unknown): TalkTurn[] {
  if (!Array.isArray(value)) return [];
  const out: TalkTurn[] = [];
  for (const item of value.slice(-14)) {
    if (!item || typeof item !== "object") continue;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof text !== "string") continue;
    const clean = sanitizeText(text.trim()).slice(0, 900);
    if (clean) out.push({ role, text: clean });
  }
  return out;
}

// Nächste Nachricht im Gespräch (Phase 2). Gibt { fallback: true } zurück, wenn keine KI verfügbar ist oder etwas schiefgeht,
// dann antwortet der Chat mit seinen Regeln.
export async function POST(request: Request) {
  const fallback = NextResponse.json({ fallback: true });
  if (!isAiConfigured()) return fallback;
  if (rateLimited(request, "ai-talk", 80)) return fallback;

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
    const result = await talk(getModel(), {
      mode: body.mode === "ask" ? "ask" : "free",
      turns: turns(body.turns),
      hints: strings(body.hints, 12, 120),
      asked: strings(body.asked, 40, 300),
      track: body.track === "business" ? "business" : "community",
      language: body.language === "ta" || body.language === "en" ? body.language : "de",
      skips: typeof body.skips === "number" ? Math.max(0, Math.min(5, Math.floor(body.skips))) : 0,
      opening: body.opening === true,
      allowQuestion: body.allowQuestion === true,
    });
    return result ? NextResponse.json(result) : fallback;
  } catch (error) {
    await logError(error, "API /api/chat/talk (KI-Gespräch)");
    return fallback;
  }
}
