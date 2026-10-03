import "server-only";
import { daysLeft } from "@/lib/accountLifecycle";
import { computeKpis, startOfTodayBerlin, type AdminData, type AdminProfile } from "@/lib/adminData";
import { GOALS, INTERESTS, LANGUAGES, REGIONS, SECTORS, VIBES, VISIBILITIES, choiceLabels, labelOf, type Choice, type Option } from "@/lib/onboarding";

// Admin-Copilot: beantwortet Fragen zu den Nutzerdaten in natürlicher Sprache.
// Regelbasiert (Stichwörter), ohne externe KI. Die Funktion lässt sich später durch einen
// KI-Aufruf ersetzen, ohne dass sich die Oberfläche ändert.

export type CopilotAnswer = {
  answer: string;
  items?: { label: string; value?: string }[];
};

const fmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});
const when = (iso: string) => fmt.format(new Date(iso));
const who = (p: { email: string; profile?: { displayName?: string } | null }) =>
  `${p.profile?.displayName ?? "Anonym"}${p.email ? ` (${p.email})` : ""}`;

function top(counts: Map<string, number>, limit = 8) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value: `${value}×` }));
}

function tally(profiles: AdminProfile[], pick: (p: AdminProfile) => string[]) {
  const counts = new Map<string, number>();
  for (const p of profiles) for (const label of pick(p)) counts.set(label, (counts.get(label) ?? 0) + 1);
  return counts;
}

const choiceOf = (c: Choice | undefined, options: Option[]) => (c ? choiceLabels(c, options) : []);

export function answerQuestion(question: string, data: AdminData, now = new Date()): CopilotAnswer {
  const q = question.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const active = data.profiles.filter((p) => !p.deleted_at);
  const startToday = startOfTodayBerlin(now).getTime();
  const weekStart = startToday - 6 * 24 * 60 * 60 * 1000;

  if (!q) return { answer: "Stell mir eine Frage zu deinen Nutzerdaten, zum Beispiel „Wer hat sich heute eingeloggt?“." };

  // Soft-Delete
  if (has("gelöscht", "geloescht", "soft", "vergessen", "löschung", "loeschung")) {
    const gone = data.profiles.filter((p) => p.deleted_at);
    return {
      answer: gone.length
        ? `${gone.length} Account${gone.length === 1 ? "" : "s"} im Soft-Delete (30 Tage Aufbewahrung):`
        : "Aktuell ist kein Account im Soft-Delete.",
      items: gone.map((p) => ({
        label: who(p),
        value: `gelöscht ${when(p.deleted_at as string)}, noch ${daysLeft(p.deleted_at as string, now.getTime())} Tage`,
      })),
    };
  }

  // Wünsche / Ideen
  if (has("wunsch", "wünsch", "wuensch", "idee", "feature", "feedback", "vorschlag", "wish")) {
    if (has("wie viele", "anzahl")) {
      const today = data.wishes.filter((w) => new Date(w.created_at).getTime() >= startToday).length;
      return { answer: `${data.wishes.length} Wünsche und Ideen insgesamt, davon ${today} heute.` };
    }
    const topic = q.match(/\b(?:zu|über|ueber|mit|für|fuer|zum)\s+([a-zäöüß-]{3,}(?: [a-zäöüß-]{3,})?)/)?.[1];
    const hits = topic ? data.wishes.filter((w) => w.wish.toLowerCase().includes(topic.split(" ")[0])) : data.wishes;
    const list = hits.slice(0, 8);
    return {
      answer: topic
        ? hits.length
          ? `${hits.length} Wunsch/Wünsche zum Thema „${topic}“:`
          : `Keine Wünsche zum Thema „${topic}“ gefunden.`
        : list.length
          ? `Die neuesten ${list.length} Wünsche und Ideen:`
          : "Es gibt noch keine Wünsche.",
      items: list.map((w) => ({ label: `${w.name || "Anonym"}${w.email ? ` (${w.email})` : ""}`, value: `${w.wish}  ·  ${when(w.created_at)}` })),
    };
  }

  // Business-Profile
  const business = active.filter((p) => p.track === "business" && p.business);
  const bizWords = has("business", "branche", "sektor", "co-founder", "cofounder", "co founder", "gründ", "gruend", "investor", "light-cv", "lightcv", "portfolio", "github", "rolle", "berufl", "kollabor");
  if (bizWords) {
    if (has("branche", "sektor")) {
      const counts = tally(business, (p) => (p.business ? [labelOf(p.business.sector, SECTORS)] : []));
      return counts.size
        ? { answer: "Branchen der Business-Profile, stärkste zuerst:", items: top(counts, 10) }
        : { answer: "Es gibt noch keine Business-Profile mit Branchenangabe." };
    }
    if (has("co-founder", "cofounder", "co founder", "gründ", "gruend", "investor", "ziel", "kollabor")) {
      const wanted = has("investor") ? "investors" : has("kollabor") ? "collab" : has("ziel") ? "" : "cofounder";
      if (wanted) {
        const hits = business.filter((p) => p.business?.goals.ids.includes(wanted));
        const goal = labelOf(wanted, GOALS);
        return {
          answer: hits.length ? `${hits.length} Business-Profil(e) mit dem Ziel „${goal}“:` : `Niemand hat „${goal}“ als Ziel angegeben.`,
          items: hits.slice(0, 15).map((p) => ({ label: who(p), value: `${labelOf(p.business!.sector, SECTORS)} · ${p.business!.role}` })),
        };
      }
      const counts = tally(business, (p) => (p.business ? choiceLabels(p.business.goals, GOALS) : []));
      return counts.size ? { answer: "Ziele der Business-Profile:", items: top(counts) } : { answer: "Noch keine Ziele vorhanden." };
    }
    if (has("rolle", "berufl")) {
      const counts = tally(business, (p) => (p.business ? [p.business.role] : []));
      return counts.size ? { answer: "Berufliche Rollen:", items: top(counts, 10) } : { answer: "Noch keine Rollen vorhanden." };
    }
    if (has("link", "portfolio", "github", "light-cv", "lightcv")) {
      const withLinks = business.filter((p) => p.business && p.business.cv.links.length > 0);
      const withCv = business.filter((p) => p.business && (p.business.cv.expertise || p.business.cv.achievements.length > 0));
      return {
        answer: `${withCv.length} von ${business.length} Business-Profilen haben ein Light-CV ausgefüllt, ${withLinks.length} haben Links hinterlegt.`,
        items: withLinks.slice(0, 10).map((p) => ({ label: who(p), value: p.business!.cv.links.join(", ") })),
      };
    }
    return {
      answer: business.length
        ? `${business.length} Business-Profil${business.length === 1 ? "" : "e"} (von ${active.length} aktiven Nutzern):`
        : "Es gibt noch keine Business-Profile.",
      items: business.slice(0, 15).map((p) => ({ label: who(p), value: `${labelOf(p.business!.sector, SECTORS)} · ${p.business!.role}` })),
    };
  }

  // Sichtbarkeit / Privatsphäre
  if (has("sichtbar", "stealth", "öffentlich", "oeffentlich", "privatsphäre", "privatsphaere")) {
    const counts = tally(active, (p) => [labelOf(p.visibility, VISIBILITIES)]);
    return counts.size
      ? { answer: "Verteilung der Sichtbarkeits-Einstellungen:", items: top(counts) }
      : { answer: "Noch keine Profile vorhanden." };
  }

  if (has("interess", "leidenschaft", "hobby", "hobbys")) {
    const counts = tally(active, (p) => choiceOf(p.interests, INTERESTS));
    return counts.size
      ? { answer: "Top-Interessen der aktiven Nutzer:", items: top(counts, 10) }
      : { answer: "Noch keine Interessen vorhanden." };
  }

  if (has("vibe")) {
    const counts = tally(active, (p) => choiceOf(p.vibes, VIBES));
    return counts.size ? { answer: "Beliebteste Vibes:", items: top(counts) } : { answer: "Noch keine Vibes vorhanden." };
  }

  if (has("sprache")) {
    const counts = tally(active, (p) => (p.profile?.languages ? choiceLabels(p.profile.languages, LANGUAGES) : []));
    return counts.size
      ? { answer: "Gesprochene Sprachen (aus den Profilen):", items: top(counts) }
      : { answer: "Noch keine Sprachangaben vorhanden." };
  }

  if (has("alter", "jahre alt", "durchschnittsalter")) {
    const ages = active.map((p) => p.profile?.age).filter((a): a is number => typeof a === "number");
    if (!ages.length) return { answer: "Noch keine Altersangaben vorhanden." };
    const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
    return { answer: `Durchschnittsalter ${avg.toFixed(1)} Jahre (${ages.length} Angaben), jüngste:r ${Math.min(...ages)}, älteste:r ${Math.max(...ages)}.` };
  }

  // Wer kommt aus <Region>?
  const regionHit = REGIONS.find((r) => q.includes(r.label.toLowerCase()) || q.includes(r.id));
  if (has("wer", "welche nutzer", "zeige") && regionHit) {
    const hits = active.filter((p) => p.region === regionHit.id);
    return {
      answer: hits.length ? `${hits.length} Nutzer:in(nen) aus ${regionHit.label}:` : `Niemand aus ${regionHit.label}.`,
      items: hits.slice(0, 15).map((p) => ({ label: who(p), value: p.city ?? undefined })),
    };
  }

  if (has("region", "stadt", "städte", "staedte", "bundesland", "woher")) {
    const regions = tally(active, (p) => [labelOf(p.region, REGIONS)]);
    const cities = tally(active, (p) => (p.city ? [p.city] : []));
    return {
      answer: regions.size ? "Nutzer nach Region:" : "Noch keine Regionen vorhanden.",
      items: [...top(regions), ...(cities.size ? [{ label: "Top-Städte" }, ...top(cities, 5)] : [])],
    };
  }

  if (has("anonym", "modus", "wie viele wählen")) {
    const anon = active.filter((p) => p.mode === "anonymous").length;
    return { answer: `${anon} anonym, ${active.length - anon} mit Profil (von ${active.length} aktiven Nutzern).` };
  }

  // Logins
  if (has("eingeloggt", "login", "einlog", "angemeldet", "aktiv", "online")) {
    const since = has("woche") ? weekStart : startToday;
    const label = has("woche") ? "in den letzten 7 Tagen" : "heute";
    const hits = active
      .filter((p) => p.last_sign_in_at && new Date(p.last_sign_in_at).getTime() >= since)
      .sort((a, b) => (b.last_sign_in_at as string).localeCompare(a.last_sign_in_at as string));
    return {
      answer: hits.length ? `${hits.length} Nutzer:in(nen) ${label} eingeloggt:` : `Niemand hat sich ${label} eingeloggt.`,
      items: hits.slice(0, 15).map((p) => ({ label: who(p), value: when(p.last_sign_in_at as string) })),
    };
  }

  // Registrierungen
  if (has("registr", "neu", "beigetreten", "dazugekommen")) {
    const since = has("woche") ? weekStart : startToday;
    const label = has("woche") ? "in den letzten 7 Tagen" : "heute";
    const hits = active.filter((p) => new Date(p.created_at).getTime() >= since);
    return {
      answer: `${hits.length} Registrierung${hits.length === 1 ? "" : "en"} ${label}.`,
      items: hits.slice(0, 15).map((p) => ({ label: who(p), value: when(p.created_at) })),
    };
  }

  if (has("warteliste", "wartend")) {
    const today = data.waitlist.filter((w) => new Date(w.created_at).getTime() >= startToday).length;
    const done = data.waitlist.filter((w) => w.status === "onboarded").length;
    return { answer: `${data.waitlist.length} Einträge auf der Warteliste, ${today} heute neu, ${done} haben das Onboarding abgeschlossen.` };
  }

  if (has("entwurf", "entwürfe", "entwuerfe", "offen", "unbestätigt")) {
    return {
      answer: data.drafts.length
        ? `${data.drafts.length} fertig ausgefüllte Chat${data.drafts.length === 1 ? "" : "s"}, deren Link noch nicht angeklickt wurde:`
        : "Keine offenen Entwürfe.",
      items: data.drafts.slice(0, 10).map((d) => ({ label: d.email, value: when(d.created_at) })),
    };
  }

  if (has("wie viele", "nutzer", "user", "accounts", "kpi", "überblick", "ueberblick", "zusammenfassung", "status")) {
    const k = computeKpis(data, now);
    return {
      answer: "Überblick:",
      items: [
        { label: "Aktive User", value: String(k.activeUsers) },
        { label: "davon Business-Profile", value: String(k.businessUsers) },
        { label: "Registrierungen heute", value: String(k.registrationsToday) },
        { label: "Heute eingeloggt", value: String(k.loginsToday) },
        { label: "Im Soft-Delete", value: String(k.softDeleted) },
        { label: "Warteliste", value: String(k.waitlist) },
        { label: "Wünsche & Ideen", value: String(k.wishes) },
      ],
    };
  }

  return {
    answer:
      "Das habe ich nicht verstanden. Ich kann zum Beispiel Auskunft geben zu Logins, Registrierungen, Top-Interessen, Regionen, Vibes, Sprachen, Wünschen, Soft-Delete und zur Warteliste.",
  };
}

// Beispiele, die in der Oberfläche rotieren
export const COPILOT_EXAMPLES = [
  "Wer hat sich heute eingeloggt?",
  "Zeige Top-Interessen",
  "Wie viele Registrierungen gab es diese Woche?",
  "Welche Regionen sind am stärksten?",
  "Zeige die neuesten Wünsche",
  "Wie viele Accounts sind im Soft-Delete?",
  "Was ist das Durchschnittsalter?",
  "Welche Vibes sind beliebt?",
  "Wie viele wählen anonym?",
  "Welche Sprachen sprechen die Nutzer?",
  "Gibt es Wünsche zu Events?",
  "Wie viele stehen auf der Warteliste?",
  "Gib mir einen Überblick",
  "Welche Branchen sind bei uns am stärksten vertreten?",
  "Wer sucht einen Co-Founder?",
  "Wie viele Business-Profile gibt es?",
  "Wie ist die Sichtbarkeit verteilt?",
];
