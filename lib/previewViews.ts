// Ansichten der Admin-Vorschau (Admin > Werkzeuge > Profil-Vorschau).
// Jede Ansicht rendert die echten Komponenten mit Beispieldaten, damit man sofort sieht,
// wie der jeweilige Bereich nach der Anmeldung aktuell aussieht.

import type { HubProfile, HubStat, HubWish } from "@/components/HubDashboard";

export type PreviewView = {
  id: string;
  label: string;
  description: string;
};

export const PREVIEW_VIEWS: PreviewView[] = [
  {
    id: "dashboard-privat",
    label: "Dashboard: Private Community",
    description: "Das Dashboard einer Person im Modus „Private Community“ (Beispiel-Profil Mira).",
  },
  {
    id: "dashboard-business",
    label: "Dashboard: Business & Co-Founding",
    description: "Dasselbe Dashboard im Business-Modus, mit Light-CV und Business-Sichtbarkeit.",
  },
  {
    id: "dashboard-admin",
    label: "Dashboard mit Admin-Zugang",
    description: "So sieht das Dashboard aus, wenn eine aktive Admin-Session besteht (Admin-Button oben rechts).",
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
    description: "Erscheint, wenn jemand das Gespräch aus dem Dashboard fortgesetzt und gespeichert hat.",
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
