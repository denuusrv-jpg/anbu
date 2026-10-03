import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/adminCopilot";
import { loadAdminData } from "@/lib/adminData";
import { isAdminRequest } from "@/lib/requireAdmin";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

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
    return NextResponse.json(answerQuestion(body.question, data));
  } catch {
    return NextResponse.json({ error: "Die Daten konnten nicht geladen werden." }, { status: 500 });
  }
}
