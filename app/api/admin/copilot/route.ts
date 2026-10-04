import { NextResponse } from "next/server";
import { NOT_UNDERSTOOD, tryAnswer } from "@/lib/adminCopilot";
import { askAdminAi } from "@/lib/adminAi";
import { getModel, isAiConfigured, takeAiBudget } from "@/lib/ai";
import { loadAdminData } from "@/lib/adminData";
import { isAdminRequest } from "@/lib/requireAdmin";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { logError } from "@/lib/errorLog";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });
  }

  let body: { question?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  if (typeof body.question !== "string" || body.question.trim().length === 0 || body.question.length > 300) {
    return NextResponse.json({ error: "Bitte stell eine kurze Frage." }, { status: 400 });
  }

  try {
    const data = await loadAdminData(getServiceClient());

    // Mit KI (gpt-4o-mini), wenn ein Schlüssel hinterlegt ist. Bei Fehlern antwortet die Regel-Logik wie bisher.
    if (isAiConfigured() && takeAiBudget()) {
      try {
        const answer = await askAdminAi(getModel(), body.question, data);
        return NextResponse.json({ ...answer, source: "ai" });
      } catch (error) {
        await logError(error, "API /api/admin/copilot (KI)");
      }
    }
    return NextResponse.json({ ...(tryAnswer(body.question, data) ?? NOT_UNDERSTOOD), source: "rules" });
  } catch (error) {
    await logError(error, "API /api/admin/copilot");
    return NextResponse.json({ error: "Die Daten konnten nicht geladen werden." }, { status: 500 });
  }
}
