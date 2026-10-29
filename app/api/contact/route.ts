import { NextResponse } from "next/server";
import { cleanEmail, looksLikeBot, rateLimited } from "@/lib/botGuard";
import { logError } from "@/lib/errorLog";
import { sendMail } from "@/lib/notify";

export const dynamic = "force-dynamic";

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const TOPICS: Record<string, string> = {
  allgemein: "Allgemeine Frage",
  events: "Event beantragen",
  presse: "Presse & Partnerschaften",
  sicherheit: "Sicherheit & Support",
};

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Kontaktformular: Nachricht (optional mit PDF-Anhang) geht als E-Mail an das Postfach aus CONTACT_EMAIL (Standard info@dspora.de).
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const get = (key: string) => (typeof form.get(key) === "string" ? (form.get(key) as string) : "");
  const bot = { website: get("website"), elapsed: Number(get("elapsed")) };
  const email = cleanEmail(get("email"));
  const message = get("message").trim().slice(0, 4000);
  const name = get("name").trim().slice(0, 80);
  const topic = TOPICS[get("topic")] ?? TOPICS.allgemein;
  if (!email) return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Bitte schreib uns eine Nachricht." }, { status: 400 });

  // Bot-Schutz: Honeypot und Zeit-Check -> stille "Erfolg"-Antwort ohne Versand
  if (looksLikeBot(bot)) return NextResponse.json({ ok: true });
  if (rateLimited(request, "contact", 5)) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte warte einen Moment." }, { status: 429 });
  }

  // Optionaler PDF-Anhang: nur echte PDF-Dateien bis 5 MB
  let attachment: { filename: string; content: string } | undefined;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PDF_BYTES) return NextResponse.json({ error: "Die PDF-Datei ist größer als 5 MB." }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return NextResponse.json({ error: "Bitte lade eine PDF-Datei hoch." }, { status: 400 });
    }
    const safeName = file.name.replace(new RegExp("[^\\p{L}\\p{N}._ -]", "gu"), "").slice(0, 80) || "anhang";
    attachment = { filename: safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`, content: bytes.toString("base64") };
  }

  const to = process.env.CONTACT_EMAIL || "info@dspora.de";
  const text = `Neue Nachricht über das Kontaktformular\n\nThema: ${topic}\nName: ${name || "(nicht angegeben)"}\nE-Mail: ${email}\nAnhang: ${attachment ? attachment.filename : "keiner"}\n\n${message}`;
  const html = `<!doctype html><html lang="de"><body style="font-family:Arial,sans-serif;color:#18181b"><h2 style="margin:0 0 12px">Neue Nachricht über das Kontaktformular</h2><p style="margin:0 0 4px"><b>Thema:</b> ${esc(topic)}</p><p style="margin:0 0 4px"><b>Name:</b> ${esc(name) || "(nicht angegeben)"}</p><p style="margin:0 0 4px"><b>E-Mail:</b> ${esc(email)}</p><p style="margin:0 0 16px"><b>Anhang:</b> ${attachment ? esc(attachment.filename) : "keiner"}</p><div style="white-space:pre-wrap;line-height:1.6;border-left:3px solid #f2a65a;padding-left:12px">${esc(message)}</div></body></html>`;

  try {
    const sent = await sendMail(to, `Kontaktformular: ${topic}`, text, html, {
      replyTo: email,
      attachments: attachment ? [attachment] : undefined,
    });
    if (!sent) return NextResponse.json({ error: "Das Senden ist gerade nicht möglich. Bitte schreib uns an info@dspora.de." }, { status: 503 });
  } catch (error) {
    await logError(error, "API /api/contact (Versand)");
    return NextResponse.json({ error: "Das hat leider nicht geklappt. Bitte versuch es noch einmal." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
