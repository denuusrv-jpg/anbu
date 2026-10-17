import { NextResponse } from "next/server";
import { rateLimited } from "@/lib/botGuard";
import { resolvePlace, resolvePostal, validPostal, type PostalCountry } from "@/lib/geoAi";

export const dynamic = "force-dynamic";

// Ort aus dem Onboarding-Chat: liefert den erkannten Ort samt Hub zur Bestätigung. Öffentlich (auch für Gäste), daher mit Mengenbegrenzung.
export async function POST(request: Request) {
  if (rateLimited(request, "geo", 30)) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte warte kurz." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (city.length < 2 || city.length > 60) return NextResponse.json({ error: "Bitte gib einen Ort an." }, { status: 400 });
  // Postleitzahl mit Land (DE 5 Ziffern, AT/CH 4 Ziffern) oder Ortsname
  if (/^\d+$/.test(city)) {
    const country: PostalCountry = body.country === "AT" || body.country === "CH" ? body.country : "DE";
    if (!validPostal(city, country)) return NextResponse.json({ place: null });
    return NextResponse.json({ place: await resolvePostal(city, country) });
  }
  const place = await resolvePlace(city);
  return NextResponse.json({ place });
}
