// Ansichten der Admin-Vorschau (Admin > Werkzeuge > Profil-Vorschau).
// Jede Ansicht rendert die echten Komponenten mit Beispieldaten, damit man sofort sieht,
// wie der jeweilige Bereich nach der Anmeldung aktuell aussieht.

import type { HubProfile, HubStat, HubWish } from "@/components/HubDashboard";
import type { RoomDetail, RoomSummary } from "@/lib/chatRooms";

export type PreviewView = {
  id: string;
  label: string;
  description: string;
};

export const PREVIEW_VIEWS: PreviewView[] = [
  {
    id: "dashboard-privat",
    label: "Profil: Private Community",
    description: "Das Profil einer Person im Modus „Private Community“ (Beispiel-Profil Mira).",
  },
  {
    id: "dashboard-business",
    label: "Profil: Business & Co-Founding",
    description: "Dasselbe Profil im Business-Modus, mit Light-CV und Business-Sichtbarkeit.",
  },
  {
    id: "dashboard-anonym",
    label: "Profil: Anonym",
    description: "Eine Person, die anonym gestartet ist und noch kein Profil mit Namen angelegt hat.",
  },
  {
    id: "chat-liste",
    label: "Chats: Übersicht",
    description: "Die Liste der Chats mit den belegten Plätzen (höchstens 4), ungelesenen Nachrichten und einem beendeten Chat.",
  },
  {
    id: "chat-raum",
    label: "Chat: Raum mit Eisbrecher",
    description: "Ein Chat mit fixiertem Match-Steckbrief, Willkommens-Eisbrecher, Eisbrecher-Button und Feedback-Frage. Alles darin ist nur Vorschau.",
  },
  {
    id: "chat-beendet",
    label: "Chat: aufgelöst",
    description: "So sieht ein Chat aus, den der andere verlassen hat: ohne Steckbrief, nur lesbar, mit Knopf zum Entfernen.",
  },
  {
    id: "dashboard-admin",
    label: "Profil mit Admin-Zugang",
    description: "So sieht das Profil aus, wenn eine aktive Admin-Session besteht (Admin-Button oben rechts).",
  },
  {
    id: "startklar-gast",
    label: "Startklar-Fenster: nach dem Link",
    description: "Erscheint am Ende des Chats, nachdem der Anmelde-Link verschickt wurde. Bleibt stehen.",
  },
  {
    id: "startklar-mitglied",
    label: "Startklar-Fenster: Profil angelegt",
    description: "Erscheint, wenn eine angemeldete Person das Profil im Chat angelegt hat.",
  },
  {
    id: "startklar-fortsetzen",
    label: "Startklar-Fenster: Gespräch fortgesetzt",
    description: "Erscheint, wenn jemand das Gespräch aus dem Profil fortgesetzt und gespeichert hat.",
  },
  {
    id: "fertig",
    label: "Seite „Du bist startklar“",
    description: "Die Seite, auf der man nach dem Klick auf den Anmelde-Link landet.",
  },
];

const wishes: HubWish[] = [
  { id: "w1", wish: "Eine Event-Übersicht für meine Region wäre toll.", created_at: "2026-10-01T10:00:00Z" },
];

export const SAMPLE_PRIVATE: HubProfile = {
  region: "nrw",
  second_region: "hamburg-nord",
  city: "Köln",
  interests: { ids: ["gym", "musik", "reisen"], custom: ["Bouldern"] },
  vibes: { ids: ["entspannt", "humorvoll"], custom: [] },
  mode: "profile",
  profile: { displayName: "Mira" },
  status: "preparing",
  track: "community",
  business: null,
  visibility: "public",
  group_size: "crew",
  gender: "female",
  match_gender: "any",
  extras: {
    freeText: "Ich liebe Bouldern am Wochenende und suche Leute, mit denen man auch mal tiefer ins Gespräch kommt.",
    followUps: [
      { question: "Trainierst du lieber allein oder mit anderen?", answer: "Am liebsten mit einer Freundin, das motiviert mich." },
      { question: "Wie verbringst du am liebsten einen ruhigen Abend?", answer: "Mit Serien und Tee." },
    ],
    meetFrequency: "weekend",
  },
};

export const SAMPLE_ANONYMOUS: HubProfile = {
  ...SAMPLE_PRIVATE,
  second_region: null,
  mode: "anonymous",
  profile: null,
  visibility: "stealth",
  group_size: "duo",
  extras: null,
};

export const SAMPLE_BUSINESS: HubProfile = {
  ...SAMPLE_PRIVATE,
  track: "business",
  visibility: "business",
  group_size: "duo",
  business: {
    sector: "tech",
    role: "Co-Founderin & CTO",
    goals: { ids: ["cofounder", "investors"], custom: ["Skalierung"] },
    cv: {
      expertise: "Produktstrategie, Cloud-Architektur",
      achievements: ["Startup 2021 gegründet und skaliert", "Team von 3 auf 25 Personen aufgebaut"],
      links: ["https://linkedin.com/in/beispiel", "https://beispiel.de"],
    },
  },
};

export const SAMPLE_HUBS: HubStat[] = [
  { id: "nrw", label: "NRW", count: 42 },
  { id: "hamburg-nord", label: "Hamburg & Nord", count: 17 },
];

export const SAMPLE_WISHES = wishes;

const t = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60000).toISOString();

export const SAMPLE_ROOMS: { rooms: RoomSummary[]; slotsUsed: number; limit: number } = {
  slotsUsed: 3,
  limit: 4,
  rooms: [
    {
      id: "r1",
      kind: "duo",
      track: "community",
      dissolved: false,
      members: [{ label: "Du", isMe: true }, { label: "Anika", isMe: false }],
      unread: 2,
      last: { body: "Klar, Samstag passt bei mir!", createdAt: t(4), kind: "user" },
    },
    {
      id: "r2",
      kind: "group",
      track: "community",
      dissolved: false,
      members: [{ label: "Du", isMe: true }, { label: "Anonym 1", isMe: false }, { label: "Kavin", isMe: false }, { label: "Anonym 2", isMe: false }],
      unread: 0,
      last: { body: "Welcher Song läuft bei euch gerade rauf und runter?", createdAt: t(60 * 20), kind: "icebreaker" },
    },
    {
      id: "r3",
      kind: "duo",
      track: "business",
      dissolved: false,
      members: [{ label: "Du", isMe: true }, { label: "Priya", isMe: false }],
      unread: 0,
      last: { body: "Gern, schick mir gern dein Konzept vorab.", createdAt: t(60 * 30), kind: "user" },
    },
    {
      id: "r4",
      kind: "duo",
      track: "community",
      dissolved: true,
      members: [{ label: "Du", isMe: true }],
      unread: 0,
      last: { body: "Dein Match hat den Chat verlassen. Dieser Chat ist beendet.", createdAt: t(60 * 50), kind: "system" },
    },
  ],
};

const base = {
  members: [{ label: "Du", isMe: true }, { label: "Anika", isMe: false }],
  myFeedback: null,
};

export const SAMPLE_ROOM: RoomDetail = {
  ...base,
  room: { id: "r1", kind: "duo", track: "community", dissolved: false },
  steckbrief: "Ihr zwei seid im Hub NRW und wolltet beide in einer 2er-Gruppe Leute treffen. Das verbindet euch: Gym, Musik. Ähnlicher Vibe: Entspannt.",
  messages: [
    { id: "m1", kind: "icebreaker", body: "Was ist dein Lieblingssong, den du beim Workout hörst, um motiviert zu bleiben?", createdAt: t(40), mine: false, sender: null },
    { id: "m2", kind: "user", body: "Haha, ganz klar etwas mit viel Bass. Und bei dir?", createdAt: t(38), mine: true, sender: "Du" },
    { id: "m3", kind: "user", body: "Bei mir läuft zuletzt viel Tamil Rap, das pusht mich total!", createdAt: t(36), mine: false, sender: "Anika" },
    { id: "m4", kind: "user", body: "Cool! Hast du Lust, mal zusammen zu trainieren?", createdAt: t(30), mine: true, sender: "Du" },
    { id: "m5", kind: "user", body: "Sehr gern, am Wochenende passt es mir am besten.", createdAt: t(20), mine: false, sender: "Anika" },
    { id: "m6", kind: "user", body: "Klar, Samstag passt bei mir!", createdAt: t(4), mine: true, sender: "Du" },
  ],
};

export const SAMPLE_ROOM_ENDED: RoomDetail = {
  ...base,
  members: [{ label: "Du", isMe: true }],
  room: { id: "r4", kind: "duo", track: "community", dissolved: true },
  steckbrief: null,
  messages: [
    { id: "e1", kind: "user", body: "Hey, schön dich kennenzulernen!", createdAt: t(300), mine: true, sender: "Du" },
    { id: "e2", kind: "system", body: "Dein Match hat den Chat verlassen. Dieser Chat ist beendet.", createdAt: t(120), mine: false, sender: null },
  ],
};
