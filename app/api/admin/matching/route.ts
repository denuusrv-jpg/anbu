import { NextResponse } from "next/server";
import { createRoom } from "@/lib/chatRooms";
import { logError } from "@/lib/errorLog";
import { buildHubReport } from "@/lib/hubReport";
import { commonHub, matchSummary, sharedOf, SCORE_GOOD, SCORE_MID } from "@/lib/matching";
import { approveProposal, computeProposals, loadCandidates, rejectProposal, savePending, setHubApproval, type StoredBreakdown } from "@/lib/matchingRun";
import { ALL_HUBS, labelOf } from "@/lib/onboarding";
import { isAdminRequest } from "@/lib/requireAdmin";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Matching im Admin (nur mit gültigem Admin-Cookie). Nichts wird ohne Freigabe zum Chat:
//  overview -> Hubs mit Anmeldezahlen und die offenen Vorschläge
//  compute  -> Vorschläge neu berechnen (Chats entstehen dabei NICHT)
//  approve / reject -> einen Vorschlag freigeben (legt den Chat an) oder ablehnen
//  hub      -> einen Hub freigeben oder schließen | report -> Anmeldeliste und Auffälligkeiten eines Hubs
//  manual   -> eine Gruppe aus E-Mail-Adressen von Hand zusammenstellen (Test)
type Body = { action?: unknown; id?: unknown; hub?: unknown; approved?: unknown; includeMedium?: unknown; emails?: unknown };

const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 403 });
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "Supabase ist nicht verbunden." }, { status: 503 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const db = getServiceClient();

  try {
    if (body.action === "overview" || body.action === "compute") {
      let computed: { found: number; saved: number; incomplete: number } | null = null;
      if (body.action === "compute") {
        const result = await computeProposals(db, { includeMedium: body.includeMedium === true });
        const saved = await savePending(db, result.proposals);
        computed = { found: result.proposals.length, saved, incomplete: result.incomplete };
      }
      return NextResponse.json({ ok: true, computed, ...(await overview(db)) });
    }

    if (body.action === "approve" || body.action === "reject") {
      if (!isUuid(body.id)) return NextResponse.json({ error: "Ungültiger Vorschlag." }, { status: 400 });
      if (body.action === "reject") {
        const ok = await rejectProposal(db, body.id);
        return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
      }
      const result = await approveProposal(db, body.id);
      return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.error }, { status: 409 });
    }

    if (body.action === "hub") {
      if (typeof body.hub !== "string" || !ALL_HUBS.some((h) => h.id === body.hub)) return NextResponse.json({ error: "Unbekannter Hub." }, { status: 400 });
      const ok = await setHubApproval(db, body.hub, body.approved === true);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Das hat nicht geklappt." }, { status: 500 });
    }

    if (body.action === "report") {
      if (typeof body.hub !== "string" || !ALL_HUBS.some((h) => h.id === body.hub)) return NextResponse.json({ error: "Unbekannter Hub." }, { status: 400 });
      return NextResponse.json({ ok: true, report: await buildHubReport(db, body.hub) });
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
      const hub = commonHub(list);
      const track = list.every((m) => m.track === "business") ? "business" : "community";
      const shared = sharedOf(list, []);
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

type Db = ReturnType<typeof getServiceClient>;

async function overview(db: Db) {
  const { hubStats } = await loadCandidates(db);
  const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailOf = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  const { data: rows } = await db
    .from("match_proposals")
    .select("id, hub, track, members, score, breakdown, summary, created_at")
    .eq("status", "pending")
    .order("score", { ascending: false })
    .limit(200);
  const proposals = (rows ?? []) as { id: string; hub: string; track: string; members: string[]; score: number; breakdown: StoredBreakdown; summary: string; created_at: string }[];

  const ids = Array.from(new Set(proposals.flatMap((p) => p.members)));
  const { data: names } = ids.length ? await db.from("user_profiles").select("user_id, profile").in("user_id", ids) : { data: [] };
  const nameOf = new Map(((names ?? []) as { user_id: string; profile: { displayName?: string } | null }[]).map((r) => [r.user_id, r.profile?.displayName ?? "–"]));
  const who = (id: string) => `${nameOf.get(id) ?? "–"} (${emailOf.get(id) ?? "?"})`;

  const { count: approvedCount } = await db.from("match_proposals").select("id", { count: "exact", head: true }).eq("status", "approved");
  const { count: rejectedCount } = await db.from("match_proposals").select("id", { count: "exact", head: true }).eq("status", "rejected");

  return {
    thresholds: { good: SCORE_GOOD, mid: SCORE_MID },
    hubs: hubStats.map((h) => ({ ...h, label: labelOf(h.hub, ALL_HUBS) })),
    proposals: proposals.map((p) => ({
      id: p.id,
      hub: labelOf(p.hub, ALL_HUBS),
      track: p.track,
      score: Number(p.score),
      quality: p.breakdown?.quality ?? "good",
      summary: p.summary,
      members: p.members.map(who),
      pairs: (p.breakdown?.pairs ?? []).map((x) => ({ a: who(x.a), b: who(x.b), total: x.total, text: x.text, minutes: x.minutes })),
    })),
    decided: { approved: approvedCount ?? 0, rejected: rejectedCount ?? 0 },
  };
}
