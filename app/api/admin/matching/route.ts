import { NextResponse } from "next/server";
import { createRoom } from "@/lib/chatRooms";
import { logError } from "@/lib/errorLog";
import { commonHub, matchSummary, sharedOf } from "@/lib/matching";
import { HUB_OPEN_THRESHOLD, loadCandidates, runMatching } from "@/lib/matchingRun";
import { INTERESTS, REGIONS, VIBES, labelOf } from "@/lib/onboarding";
import { isAdminRequest } from "@/lib/requireAdmin";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Matching im Admin (nur mit gültigem Admin-Cookie):
//  preview -> berechnen, was ein Lauf anlegen würde | apply -> Räume wirklich anlegen
//  manual  -> eine Gruppe aus E-Mail-Adressen von Hand zusammenstellen (z. B. für den Start oder zum Testen)
export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });

  let body: { action?: unknown; force?: unknown; emails?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const db = getServiceClient();

  try {
    if (body.action === "preview" || body.action === "apply") {
      const result = await runMatching(db, { apply: body.action === "apply", force: body.force === true });
      // Admins sehen Namen und E-Mail-Adressen (wie überall im Admin-Bereich)
      const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emailOf = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
      const { data: names } = await db.from("user_profiles").select("user_id, profile").in("user_id", result.proposals.flatMap((p) => p.members.map((m) => m.userId)));
      const nameOf = new Map(((names ?? []) as { user_id: string; profile: { displayName?: string } | null }[]).map((r) => [r.user_id, r.profile?.displayName ?? "Anonym"]));
      return NextResponse.json({
        applied: body.action === "apply",
        created: result.created,
        skipped: result.skipped.length,
        threshold: HUB_OPEN_THRESHOLD,
        openHubs: result.openHubs.map((h) => labelOf(h, REGIONS)),
        proposals: result.proposals.map((p) => ({
          hub: labelOf(p.hub, REGIONS),
          track: p.track,
          members: p.members.map((m) => `${nameOf.get(m.userId) ?? "Anonym"} (${emailOf.get(m.userId) ?? "?"})`),
          interests: p.shared.interests.map((i) => labelOf(i, INTERESTS)),
          vibes: p.shared.vibes.map((v) => labelOf(v, VIBES)),
        })),
      });
    }

    if (body.action === "manual") {
      const emails = Array.isArray(body.emails)
        ? Array.from(new Set((body.emails as unknown[]).filter((e): e is string => typeof e === "string").map((e) => e.trim().toLowerCase()).filter(Boolean)))
        : [];
      if (emails.length < 2 || emails.length > 8) {
        return NextResponse.json({ error: "Bitte 2 bis 8 verschiedene E-Mail-Adressen angeben." }, { status: 400 });
      }
      const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const idByEmail = new Map((users?.users ?? []).map((u) => [(u.email ?? "").toLowerCase(), u.id]));
      const ids = emails.map((e) => idByEmail.get(e));
      const missing = emails.filter((_, i) => !ids[i]);
      if (missing.length > 0) return NextResponse.json({ error: `Nicht gefunden: ${missing.join(", ")}` }, { status: 400 });

      const { candidates } = await loadCandidates(db);
      const members = ids.map((id) => candidates.find((c) => c.userId === id));
      if (members.some((m) => !m)) return NextResponse.json({ error: "Mindestens eine Person hat noch kein Profil." }, { status: 400 });
      const list = members as NonNullable<(typeof members)[number]>[];
      const hub = commonHub(list) ?? list[0].hubs[0];
      const track = list.every((m) => m.track === "business") ? "business" : "community";
      const shared = sharedOf(list);
      const created = await createRoom(db, { memberIds: list.map((m) => m.userId), track, hub, shared });
      if (!created.ok) {
        return NextResponse.json(
          { error: created.reason === "limit" ? "Mindestens eine Person hat schon 4 aktive Chats." : "Der Chat konnte nicht angelegt werden." },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: true, summary: matchSummary({ hub, track, shared, size: list.length }) });
    }
    return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  } catch (error) {
    await logError(error, "API /api/admin/matching");
    return NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
  }
}
