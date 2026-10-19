"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import FlowingWaveBackground from "@/components/FlowingWaveBackground";
import BusinessEditor from "@/components/BusinessEditor";
import ChoiceSelect from "@/components/onboarding/ChoiceSelect";
import ProfileEditor from "@/components/profile/ProfileEditor";
import type { PostView } from "@/lib/profileMedia";
import { fieldClass } from "@/components/onboarding/ui";
import { Chip, ChipRow } from "@/components/onboarding/ui";
import { CheckIcon } from "@/components/Icons";
import LanguageButton from "@/components/LanguageButton";
import Sheet from "@/components/ui/Sheet";
import Slider from "@/components/ui/Slider";
import MatchingActivity from "@/components/MatchingActivity";
import { CustomEntry } from "@/components/onboarding/ChoiceSelect";
import { useLanguage, useTx } from "@/lib/LanguageContext";
import type { Language } from "@/lib/translations";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  ALL_HUBS,
  DUO_WISHES,
  GENDER_CHOICES,
  GROUP_SIZES,
  GROUP_WISHES,
  INTERESTS,
  CUSTOM_PATTERN,
  LANGUAGES,
  MAX_AGE,
  MAX_INTERESTS,
  MAX_VIBES,
  MEET_FREQUENCIES,
  MEET_MODES,
  MIN_AGE,
  MIN_INTERESTS,
  PHASES,
  TRAVEL_OPTIONS,
  VIBES,
  choiceLabels,
  labelOf,
  type BusinessData,
  type Choice,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import { buildSteckbrief, type SteckbriefFact } from "@/lib/steckbrief";

export type HubProfile = {
  region: string;
  city: string | null;
  interests: Choice;
  vibes: Choice;
  mode: "anonymous" | "profile";
  profile: { displayName?: string; firstName?: string; lastName?: string; bio?: string; hobbies?: string[] } | null;
  status: "preparing" | "matched";
  track: "community" | "business";
  business: BusinessData | null;
  visibility: "public" | "business" | "stealth";
  group_size: string | null;
  second_region: string | null;
  gender: string | null;
  match_gender: string | null;
  extras: OnboardingAnswers["extras"] | null;
  age?: number | null;
  age_min?: number | null;
  age_max?: number | null;
  meet_mode?: "online" | "activities" | null;
  travel_minutes?: number | null;
  languages?: Choice | null;
  life_phase?: string | null;
  meet_frequency?: string | null;
  notify_matches?: boolean | null;
  friends_active?: boolean | null;
  business_active?: boolean | null;
  ui_language?: string | null;
};

export type HubStat = { id: string; label: string; count: number };

const EMPTY_BUSINESS: BusinessData = {
  sector: "",
  role: "",
  goals: { ids: [], custom: [] },
  cv: { achievements: [], links: [] },
};

const EASE = [0.16, 1, 0.3, 1] as const;

// Zeile in der Profil-Liste: zeigt kurz den aktuellen Stand, ein Tippen öffnet ein Pop-up zum Ändern
function SettingRow({ title, summary, onClick }: { title: string; summary: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-4 border-t border-white/10 py-3.5 text-left transition-colors first:border-t-0 hover:text-gold"
    >
      <span className="shrink-0 text-sm font-medium text-zinc-50">{title}</span>
      <span className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
        <span className="min-w-0 truncate">{summary}</span>
        <span aria-hidden className="text-xl leading-none text-zinc-400">
          ›
        </span>
      </span>
    </button>
  );
}

export type HubWish = { id: string; wish: string; created_at: string };

type Passkey = { id: string; friendly_name?: string | null; created_at: string };

export default function HubDashboard({
  email,
  profile: initial,
  hubs,
  matchCount,
  unreadCount = 0,
  isAdmin,
  preview = false,
  wishes: initialWishes,
  userId,
  avatar = null,
  posts = [],
}: {
  userId?: string;
  avatar?: string | null;
  posts?: PostView[];
  email: string;
  profile: HubProfile;
  hubs: HubStat[] | null;
  matchCount: number; // aktive Chats (höchstens 4)
  unreadCount?: number;
  isAdmin: boolean;
  /** Admin-Vorschau: zeigt alles wie live, schreibt aber nichts und ruft nichts auf */
  preview?: boolean;
  wishes: HubWish[];
}) {
  const router = useRouter();
  const tx = useTx();
  const { language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState<"interests" | "vibes" | null>(null);
  const [draft, setDraft] = useState<Choice>({ ids: [], custom: [] });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState("");
  const [wishes, setWishes] = useState(initialWishes);
  const [wishText, setWishText] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [wishBusy, setWishBusy] = useState(false);
  const [sheet, setSheet] = useState<"place" | "age" | "phase" | "gender" | "group" | "facts" | "delete" | "reset" | null>(null);
  const [editingFact, setEditingFact] = useState<SteckbriefFact | null>(null);
  const [factDraft, setFactDraft] = useState("");
  const [deleteStep, setDeleteStep] = useState<"intro" | "sent">("intro");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const hubLabels = [profile.region, profile.second_region]
    .filter((h): h is string => Boolean(h))
    .map((h) => tx(ALL_HUBS.find((r) => r.id === h)?.label ?? h));
  const [setupBusiness, setSetupBusiness] = useState(false);
  const [placeText, setPlaceText] = useState("");
  const [placeFound, setPlaceFound] = useState<{ name: string; lat: number; lng: number; hub: string; hubLabel: string } | null>(null);
  const [placeError, setPlaceError] = useState("");
  const [ageDraft, setAgeDraft] = useState({ age: "", min: "", max: "" });
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [langDraft, setLangDraft] = useState<Choice>({ ids: [], custom: [] });
  const steckbrief = buildSteckbrief({
    gender: profile.gender,
    matchGender: profile.match_gender,
    groupSize: profile.group_size,
    region: profile.region,
    secondRegion: profile.second_region,
    city: profile.city,
    age: profile.age,
    ageMin: profile.age_min,
    ageMax: profile.age_max,
    meetMode: profile.meet_mode,
    travelMinutes: profile.travel_minutes,
    languages: profile.languages,
    lifePhase: profile.life_phase,
    interests: profile.interests,
    vibes: profile.vibes,
    track: profile.business_active ?? profile.track === "business" ? "business" : profile.track,
    business: profile.business,
    extras: profile.extras,
  });
  const lastError = useRef("");

  // Sprache: Wer die Seite auf einem neuen Gerät öffnet, bekommt die im Konto gespeicherte Sprache
  useEffect(() => {
    try {
      if (!localStorage.getItem("dspora-language") && initial.ui_language) setLanguage(initial.ui_language as Language);
    } catch {
      // ohne localStorage bleibt die Standardsprache
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveLanguage(next: Language) {
    if (preview) return;
    try {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: next }) });
    } catch {
      // die Sprache gilt trotzdem auf diesem Gerät
    }
  }
  const hasProfile = Boolean(profile.profile);
  const name = profile.profile?.displayName;

  useEffect(() => {
    if (preview || !window.PublicKeyCredential) return;
    setPasskeySupported(true);
    getBrowserClient()
      .auth.passkey.list()
      .then(({ data }: { data: Passkey[] | null }) => setPasskeys(data ?? []))
      .catch(() => setPasskeys([]));
  }, []);

  async function patch(update: Record<string, unknown>): Promise<boolean> {
    if (preview) return true;
    setSaving(true);
    setMessage("");
    lastError.current = "";
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        lastError.current = tx(data?.error ?? "Speichern hat nicht geklappt.");
        setMessage(lastError.current);
        return false;
      }
      return true;
    } catch {
      setMessage(tx("Keine Verbindung. Bitte versuch es noch einmal."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(chosen: Choice) {
    if (!editing) return;
    if (await patch({ [editing]: chosen })) {
      setProfile((p) => ({ ...p, [editing]: chosen }));
      setEditing(null);
    }
  }

  async function changeVisibility(next: HubProfile["visibility"]) {
    if (next === profile.visibility) return;
    if (await patch({ visibility: next })) setProfile((p) => ({ ...p, visibility: next }));
  }

  async function changeGender(next: string) {
    if (next === profile.gender) return;
    if (await patch({ gender: next })) setProfile((p) => ({ ...p, gender: next }));
  }

  // Eigene Angabe zum Geschlecht (Freitext): gibt eine Fehlermeldung zurück oder null
  function addCustomGender(text: string): string | null {
    if (!CUSTOM_PATTERN.test(text)) return "2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen.";
    const known = GENDER_CHOICES.find((g) => g.label.toLowerCase() === text.toLowerCase());
    void changeGender(known ? known.id : text);
    return null;
  }

  async function changeMatchGender(next: string) {
    if (next === profile.match_gender) return;
    if (await patch({ matchGender: next })) setProfile((p) => ({ ...p, match_gender: next }));
  }

  // Eine Angabe aus dem Steckbrief entfernen: wirklich weg, auch im Admin
  async function removeFact(fact: SteckbriefFact) {
    if (!(await patch({ removeFact: fact }))) return;
    setProfile((p) => {
      const extras = { ...(p.extras ?? {}) };
      if (fact.kind === "free") delete extras.freeText;
      else {
        const list = (extras.followUps ?? []).slice();
        const index = list.findIndex((f) => f.question === fact.question && f.answer === fact.answer);
        if (index >= 0) list.splice(index, 1);
        extras.followUps = list;
      }
      return { ...p, extras };
    });
  }

  // Eine Angabe aus dem Steckbrief ändern: nur der Text, die Frage dazu bleibt
  async function saveFactEdit() {
    const fact = editingFact;
    const next = factDraft.trim();
    if (!fact || next.length < 2) return;
    if (next === fact.answer) {
      setEditingFact(null);
      return;
    }
    if (!(await patch({ editFact: { kind: fact.kind, question: fact.question, answer: fact.answer, newAnswer: next } }))) return;
    setProfile((p) => {
      const extras = { ...(p.extras ?? {}) };
      if (fact.kind === "free") extras.freeText = next;
      else extras.followUps = (extras.followUps ?? []).map((f) => (f.question === fact.question && f.answer === fact.answer ? { ...f, answer: next } : f));
      return { ...p, extras };
    });
    setEditingFact(null);
  }

  // Das Gespräch mit der KI komplett zurücksetzen (Angaben daraus, Verlauf, Auswertung)
  async function resetTalk() {
    if (!(await patch({ resetTalk: true }))) return;
    setProfile((p) => {
      const extras = { ...(p.extras ?? {}) };
      delete extras.followUps;
      delete extras.freeText;
      return { ...p, extras };
    });
    setSheet(null);
  }

  // Zeile im Steckbrief antippen: öffnet das passende Pop-up zum Ändern
  function editLine(label: string) {
    setMessage("");
    const sheets: Record<string, "gender" | "age" | "group" | "place" | "phase"> = {
      Geschlecht: "gender",
      "Verbinden mit": "gender",
      Alter: "age",
      "Gesuchtes Alter": "age",
      Gruppengröße: "group",
      "Art der Freundschaft": "place",
      "Max. Entfernung (Auto)": "place",
      Stadt: "place",
      Lebensphase: "phase",
    };
    if (sheets[label]) {
      if (sheets[label] === "age") setAgeDraft({ age: "", min: "", max: "" });
      setSheet(sheets[label]);
    } else if (label === "Sprachen") {
      setSheet(null);
      setLangDraft(profile.languages ?? { ids: [], custom: [] });
      setEditingLanguages(true);
    } else if (label === "Interessen" || label === "Vibe") {
      const key = label === "Interessen" ? "interests" : "vibes";
      setSheet(null);
      setDraft(profile[key]);
      setEditing(key);
    }
  }
  const editableLine = (label: string) =>
    ["Geschlecht", "Verbinden mit", "Alter", "Gesuchtes Alter", "Gruppengröße", "Art der Freundschaft", "Max. Entfernung (Auto)", "Stadt", "Lebensphase", "Sprachen", "Interessen", "Vibe"].includes(label);

  // Wohnort: wird geprüft und dem nächsten Hub zugeordnet, erst nach der Bestätigung gespeichert
  async function checkPlace() {
    const value = placeText.trim();
    if (value.length < 2) {
      setPlaceError(tx("Bitte gib deinen Wohnort an."));
      return;
    }
    setPlaceError("");
    setPlaceFound(null);
    try {
      const res = await fetch("/api/geo/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: value }),
      });
      const data = await res.json();
      if (data?.place) setPlaceFound(data.place);
      else setPlaceError(tx("Diesen Ort konnte ich nicht zuordnen. Bitte gib die nächstgrößere Stadt an."));
    } catch {
      setPlaceError(tx("Keine Verbindung. Bitte versuch es noch einmal."));
    }
  }

  async function savePlace() {
    if (!placeFound) return;
    if (await patch({ place: placeFound })) {
      setProfile((p) => ({ ...p, city: placeFound.name, region: placeFound.hub }));
      setPlaceFound(null);
      setPlaceText("");
      if (!preview) router.refresh();
    }
  }

  async function changeTravel(minutes: number) {
    const next = minutes === 0 ? null : minutes;
    if (next === (profile.travel_minutes ?? null)) return;
    if (await patch({ travelMinutes: minutes })) setProfile((p) => ({ ...p, travel_minutes: next }));
  }

  async function changeMeetMode(next: "online" | "activities") {
    if (next === profile.meet_mode) return;
    if (await patch({ meetMode: next })) setProfile((p) => ({ ...p, meet_mode: next, ...(next === "online" ? { region: "online", travel_minutes: null } : {}) }));
  }

  async function changeFrequency(next: string) {
    if (next === profile.meet_frequency) return;
    if (await patch({ meetFrequency: next })) setProfile((p) => ({ ...p, meet_frequency: next }));
  }

  async function changeNotify(next: boolean) {
    if (await patch({ notifyMatches: next })) setProfile((p) => ({ ...p, notify_matches: next }));
  }

  async function changePhase(next: string) {
    if (next === profile.life_phase) return;
    if (await patch({ lifePhase: next })) setProfile((p) => ({ ...p, life_phase: next }));
  }

  async function saveAges() {
    const num = (t: string) => (/^\d{1,2}$/.test(t.trim()) ? Number(t.trim()) : NaN);
    const age = num(ageDraft.age);
    const min = num(ageDraft.min);
    const max = num(ageDraft.max);
    if ([age, min, max].some((n) => Number.isNaN(n) || n < MIN_AGE || n > MAX_AGE)) {
      setMessage(tx("Bitte gib Zahlen zwischen {min} und {max} an.", { min: MIN_AGE, max: MAX_AGE }));
      return;
    }
    if (min > max) {
      setMessage(tx("Altersspanne: „von“ darf nicht größer sein als „bis“."));
      return;
    }
    if (await patch({ age, ageMin: min, ageMax: max })) {
      setProfile((p) => ({ ...p, age, age_min: min, age_max: max }));
      setSheet(null);
    }
  }

  async function saveLanguages(chosen: Choice) {
    if (await patch({ languages: chosen })) {
      setProfile((p) => ({ ...p, languages: chosen }));
      setEditingLanguages(false);
    }
  }

  async function changeGroupSize(next: string) {
    if (next === profile.group_size) return;
    if (await patch({ groupSize: next })) setProfile((p) => ({ ...p, group_size: next }));
  }

  async function saveBusiness(next: BusinessData): Promise<string | null> {
    const ok = await patch({ business: next });
    if (ok) {
      setProfile((p) => ({ ...p, business: next }));
      return null;
    }
    return lastError.current || tx("Speichern hat nicht geklappt.");
  }

  // Suche pro Seite an/aus: Friends und Business können gleichzeitig laufen (zusammen höchstens 4 Chats)
  async function setSide(side: "friends" | "business", on: boolean) {
    setMessage("");
    if (side === "business" && on) {
      if (!hasProfile) {
        setMessage(tx("Für die Business-Seite brauchst du ein Profil mit Namen. Lege es zuerst an."));
        return;
      }
      if (!profile.business) {
        setSetupBusiness(true);
        return;
      }
    }
    const payload = side === "friends" ? { friendsActive: on } : { businessActive: on };
    if (!(await patch(payload))) return;
    setProfile((p) => {
      const friends = side === "friends" ? on : p.friends_active ?? p.track === "community";
      const biz = side === "business" ? on : p.business_active ?? p.track === "business";
      return {
        ...p,
        friends_active: friends,
        business_active: biz,
        track: biz && !friends ? "business" : friends ? "community" : p.track,
        mode: biz ? "profile" : p.mode,
        visibility: !biz && p.visibility === "business" ? "stealth" : p.visibility,
      };
    });
    if (side === "business" && !on) setSetupBusiness(false);
  }

  async function activateBusiness(next: BusinessData): Promise<string | null> {
    const ok = await patch({ businessActive: true, business: next });
    if (!ok) return lastError.current || tx("Speichern hat nicht geklappt.");
    setProfile((p) => ({ ...p, business_active: true, mode: "profile", business: next, track: p.friends_active ?? p.track === "community" ? p.track : "business" }));
    setSetupBusiness(false);
    return null;
  }

  async function submitWish(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      const idea = wishText.trim();
      if (idea.length < 3) return;
      setWishes((list) => [{ id: String(Date.now()), wish: idea, created_at: new Date().toISOString() }, ...list]);
      setWishText("");
      setWishMessage(tx("Vorschau: nichts wurde gespeichert."));
      return;
    }
    const text = wishText.trim();
    if (text.length < 3 || wishBusy) return;
    setWishBusy(true);
    setWishMessage("");
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish: text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setWishMessage(tx(data?.error ?? "Das hat nicht geklappt."));
        return;
      }
      setWishes((list) => [{ id: String(Date.now()), wish: text, created_at: new Date().toISOString() }, ...list]);
      setWishText("");
      setWishMessage(tx("Danke! Deine Idee ist angekommen."));
    } catch {
      setWishMessage(tx("Keine Verbindung. Bitte versuch es noch einmal."));
    } finally {
      setWishBusy(false);
    }
  }

  // Konto löschen, Schritt 1: Bestätigungslink per E-Mail anfordern. Gelöscht wird erst nach dem Klick auf den Link.
  async function requestDelete() {
    if (preview) {
      setDeleteStep("sent");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete/request", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "failed");
      setDeleteStep("sent");
    } catch (e) {
      setDeleteError(e instanceof Error && e.message !== "failed" ? tx(e.message) : tx("Die Mail konnte nicht gesendet werden. Bitte versuch es noch einmal."));
    } finally {
      setDeleting(false);
    }
  }

  async function signOut() {
    if (preview) return;
    await getBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function addPasskey() {
    if (preview) return;
    setPasskeyMessage("");
    try {
      const { error } = await getBrowserClient().auth.registerPasskey();
      if (error) {
        setPasskeyMessage(tx("Der Passkey konnte nicht angelegt werden."));
        return;
      }
      const { data } = await getBrowserClient().auth.passkey.list();
      setPasskeys(data ?? []);
      setPasskeyMessage(tx("Passkey hinzugefügt. Ab jetzt kannst du dich mit Face ID oder Touch ID anmelden."));
    } catch {
      setPasskeyMessage(tx("Der Passkey konnte nicht angelegt werden."));
    }
  }

  async function removePasskey(id: string) {
    if (preview) return;
    const { error } = await getBrowserClient().auth.passkey.delete({ passkeyId: id });
    if (!error) setPasskeys((list) => (list ?? []).filter((p) => p.id !== id));
  }

  const friendsOn = profile.friends_active ?? profile.track === "community";
  const businessOn = profile.business_active ?? profile.track === "business";
  const intentions = [
    {
      id: "friends",
      label: tx("Privat"),
      on: friendsOn,
      text: friendsOn ? tx("Suche aktiv") : tx("Suche aus. Unten bei „Wo suchst du?“ einschalten."),
    },
    {
      id: "business",
      label: tx("Business"),
      on: businessOn,
      text: businessOn ? tx("Suche aktiv") : tx("Suche aus. Unten bei „Wo suchst du?“ einschalten."),
    },
  ];

  const card = "rounded-3xl border border-white/10 bg-zinc-950/75 p-5 backdrop-blur-md sm:p-7";

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Kopf */}
        <header className="space-y-4 sm:flex sm:items-start sm:justify-between sm:gap-6 sm:space-y-0">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">{tx("DSpora Profil")}</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">
              {name ? tx("Hey {name}", { name }) : tx("Willkommen")}
            </h1>
            <p className="mt-0.5 truncate text-sm text-zinc-300">{email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            <LanguageButton onChange={saveLanguage} />
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold shadow-[0_0_24px_-8px_rgba(242,166,90,0.6)] backdrop-blur-md transition-colors hover:bg-gold/20"
              >
                {tx("Admin Dashboard")}
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold"
            >
              {tx("Abmelden")}
            </button>
          </div>
        </header>

        {/* Matching-Status */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={`${card} relative overflow-hidden`}
        >
          <motion.div
            className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full glow-gold"
            animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
              </span>
              <h2 className="text-lg font-semibold text-zinc-50">
                {matchCount > 0 ? tx("Deine Matches warten") : tx("Dein Hub bereitet Matches vor")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {tx("Sobald sich 100 Personen in deinem Hub eingetragen haben, öffnet sich dein Hub und die Matches entstehen automatisch. Du musst nichts weiter tun.")}
            </p>

            {/* Ruhige Endlos-Animation: es wird gearbeitet. Bewusst ohne Fortschritt, nichts deutet an, wie weit es ist. */}
            <MatchingActivity label={tx("Wir arbeiten im Hintergrund an passenden Verbindungen für dich.")} />

            {/* Getrennt nach Intention */}
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {intentions.map((i) => (
                <div
                  key={i.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    i.on ? "border-gold/40 bg-gold/[0.07]" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <p className={`text-xs font-semibold tracking-wide uppercase ${i.on ? "text-gold" : "text-zinc-400"}`}>
                    {i.label}
                  </p>
                  <p className={`mt-1 text-sm leading-snug ${i.on ? "text-zinc-100" : "text-zinc-400"}`}>
                    {i.text}
                  </p>
                </div>
              ))}
            </div>

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-zinc-200">
                <CheckIcon className="h-4 w-4 text-gold" /> {tx("Profil und Antworten sind gespeichert")}
              </li>
              <li className="text-zinc-200">
                <div className="flex items-center gap-2.5">
                  <CheckIcon className="h-4 w-4 text-gold" />
                  {hubLabels.length > 1 ? tx("Hubs") : tx("Hub")} {hubLabels.join(" + ")}
                  {profile.city ? ` · ${profile.city}` : ""}
                </div>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Profilseite (Instagram-Stil) */}
        {userId && (
          <ProfileEditor
            userId={userId}
            visibility={profile.visibility}
            track={businessOn ? "business" : "community"}
            avatar={avatar}
            posts={posts}
            preview={preview}
            onVisibility={changeVisibility}
            info={{
              displayName: profile.profile?.displayName ?? "",
              firstName: profile.profile?.firstName ?? "",
              lastName: profile.profile?.lastName ?? "",
              bio: profile.profile?.bio ?? "",
              hobbies: profile.profile?.hobbies ?? [],
            }}
          />
        )}

        {/* Profil verwalten */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
          className={card}
        >
          <h2 className="text-lg font-semibold text-zinc-50">{tx("Dein Profil")}</h2>

          {/* Wo suchst du? Friends und Business gleichzeitig möglich */}
          <div className="mt-5">
            <p className="text-sm font-medium text-zinc-100">{tx("Wo suchst du?")}</p>
            <p className="mt-1 text-sm text-zinc-300">{tx("Beides gleichzeitig ist möglich. Zusammen kannst du höchstens 4 Chats führen. Bestehende Chats bleiben, wenn du die Suche ausschaltest.")}</p>
            <div className="mt-3 grid gap-2.5">
              {(
                [
                  { id: "friends" as const, label: "Friends-Community", hint: "Freundschaften und gemeinsame Aktivitäten", on: friendsOn },
                  { id: "business" as const, label: "Business-Community", hint: "Business-Kontakte, Sparring, Co-Founding", on: businessOn || setupBusiness },
                ]
              ).map((side) => (
                <div key={side.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-zinc-50">{tx(side.label)}</p>
                    <p className="mt-0.5 text-sm text-zinc-300">{tx(side.hint)}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={side.on}
                    aria-label={tx(side.label)}
                    disabled={saving}
                    onClick={() => (side.id === "business" && setupBusiness ? setSetupBusiness(false) : setSide(side.id, !side.on))}
                    className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-60 ${
                      side.on ? "border-gold/60 bg-gold" : "border-white/20 bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${side.on ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
            {setupBusiness && (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/[0.05] p-4">
                <p className="text-sm leading-relaxed text-zinc-200">
                  {tx("Für die Business-Seite brauchen wir noch ein paar Angaben und dein Light-CV.")}
                </p>
                <BusinessEditor
                  business={EMPTY_BUSINESS}
                  onSave={activateBusiness}
                  startEditing
                  onCancel={() => setSetupBusiness(false)}
                  title={tx("Business-Profil einrichten")}
                />
              </div>
            )}
          </div>

          {/* Einstellungen als Liste: Tippen öffnet ein Pop-up */}
          <div className="mt-6">
            <SettingRow
              title={tx("Freundschaft und Wohnort")}
              summary={
                profile.meet_mode === "online"
                  ? tx("Nur online schreiben")
                  : `${profile.city ? `${profile.city} · ` : ""}${hubLabels.join(" + ") || "–"}`
              }
              onClick={() => { setSheet("place"); setMessage(""); }}
            />
            <SettingRow
              title={tx("Alter")}
              summary={profile.age ? `${profile.age} · ${tx("gesucht")} ${profile.age_min ?? "?"}–${profile.age_max ?? "?"}` : "–"}
              onClick={() => { setAgeDraft({ age: "", min: "", max: "" }); setSheet("age"); setMessage(""); }}
            />
            <SettingRow
              title={tx("Sprachen")}
              summary={choiceLabels(profile.languages ?? { ids: [], custom: [] }, LANGUAGES).map((l) => tx(l)).join(", ") || "–"}
              onClick={() => { setLangDraft(profile.languages ?? { ids: [], custom: [] }); setEditingLanguages(true); setMessage(""); }}
            />
            {friendsOn && (
              <SettingRow
                title={tx("Lebensphase")}
                summary={profile.life_phase ? tx(labelOf(profile.life_phase, PHASES)) : "–"}
                onClick={() => { setSheet("phase"); setMessage(""); }}
              />
            )}
            <SettingRow
              title={tx("Geschlecht und Wunsch")}
              summary={
                [
                  profile.gender
                    ? profile.gender === "nonbinary"
                      ? tx("Nicht-binär / divers")
                      : profile.gender === "na"
                        ? tx("Keine Angabe")
                        : tx(labelOf(profile.gender, GENDER_CHOICES))
                    : "",
                  profile.match_gender
                    ? profile.match_gender === "other"
                      ? tx("Anderes")
                      : tx(labelOf(profile.match_gender, [...DUO_WISHES, ...GROUP_WISHES]))
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "–"
              }
              onClick={() => { setSheet("gender"); setMessage(""); }}
            />
            <SettingRow
              title={tx("Gruppengröße")}
              summary={profile.group_size ? tx(labelOf(profile.group_size, GROUP_SIZES)) : "–"}
              onClick={() => { setSheet("group"); setMessage(""); }}
            />
            {(
              [
                { key: "interests", title: "Interessen", options: INTERESTS },
                { key: "vibes", title: "Vibe", options: VIBES },
              ] as const
            ).map(({ key, title, options }) => {
              const labels = choiceLabels(profile[key], options).map((l) => tx(l));
              return (
                <SettingRow
                  key={key}
                  title={tx(title)}
                  summary={labels.length > 2 ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}` : labels.join(", ") || "–"}
                  onClick={() => { setDraft(profile[key]); setEditing(key); setMessage(""); }}
                />
              );
            })}
          </div>

          {businessOn && profile.business && (
            <BusinessEditor business={profile.business} onSave={saveBusiness} />
          )}

          {message && !sheet && !editing && !editingLanguages && (
            <p role="alert" className="mt-4 text-sm text-rose">
              {message}
            </p>
          )}

          {/* Pop-ups zum Ändern */}
          <Sheet open={sheet === "place"} onClose={() => setSheet(null)} title={tx("Freundschaft und Wohnort")}>
            <p className="text-sm text-zinc-300">{tx("Art der Freundschaft")}</p>
            <div className="mt-2.5" role="radiogroup" aria-label={tx("Art der Freundschaft")}>
              <ChipRow>
                {MEET_MODES.map((m) => (
                  <Chip key={m.id} selected={profile.meet_mode === m.id} onClick={() => changeMeetMode(m.id as "online" | "activities")}>
                    {tx(m.label)}
                  </Chip>
                ))}
              </ChipRow>
            </div>
            {profile.meet_mode !== "online" && (
              <>
                <p className="mt-6 text-sm text-zinc-300">
                  {profile.city ? `${profile.city} · ` : ""}{tx("Hub")} {hubLabels.join(" + ") || "–"}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <input
                    value={placeText}
                    onChange={(e) => { setPlaceText(e.target.value); setPlaceFound(null); setPlaceError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); checkPlace(); } }}
                    placeholder={tx("Neuer Wohnort")}
                    aria-label={tx("Dein Wohnort")}
                    className={fieldClass}
                  />
                  <button type="button" onClick={checkPlace} className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-5 text-sm font-medium text-zinc-100 hover:border-gold/50">
                    {tx("Prüfen")}
                  </button>
                </div>
                {placeError && <p role="alert" className="mt-2 text-sm text-rose">{placeError}</p>}
                {placeFound && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-sm text-zinc-100">
                    <span>{tx("„{name}“ gehört zum Hub {hub}.", { name: placeFound.name, hub: tx(placeFound.hubLabel) })}</span>
                    <button type="button" onClick={savePlace} className="rounded-full bg-gold px-4 py-1.5 font-semibold text-zinc-950">
                      {saving ? tx("Speichere …") : tx("Übernehmen")}
                    </button>
                  </div>
                )}
                <p className="mt-6 text-sm text-zinc-300">{tx("Wie weit darf jemand maximal entfernt wohnen? (Fahrzeit mit dem Auto)")}</p>
                <div className="mt-2.5" role="radiogroup" aria-label={tx("Maximale Entfernung")}>
                  <ChipRow>
                    {TRAVEL_OPTIONS.map((o) => (
                      <Chip key={o.minutes} selected={(profile.travel_minutes ?? 0) === o.minutes} onClick={() => changeTravel(o.minutes)}>
                        {tx(o.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
                <p className="mt-6 text-sm text-zinc-300">{tx("Wie oft würdest du dich realistisch treffen?")}</p>
                <div className="mt-2.5" role="radiogroup" aria-label={tx("Treffhäufigkeit")}>
                  <ChipRow>
                    {MEET_FREQUENCIES.map((f) => (
                      <Chip key={f.id} selected={profile.meet_frequency === f.id} onClick={() => changeFrequency(f.id)}>
                        {tx(f.label)}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
              </>
            )}
            {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
          </Sheet>

          <Sheet open={sheet === "age"} onClose={() => setSheet(null)} title={tx("Alter und gesuchte Altersspanne")}>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { key: "age", label: "Dein Alter", value: profile.age },
                  { key: "min", label: "Gesucht ab", value: profile.age_min },
                  { key: "max", label: "Gesucht bis", value: profile.age_max },
                ] as const
              ).map((f) => (
                <label key={f.key} className="block text-sm text-zinc-300">
                  {tx(f.label)}
                  <input
                    value={ageDraft[f.key] || (f.value ? String(f.value) : "")}
                    onChange={(e) => setAgeDraft((d) => ({ ...d, [f.key]: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                    inputMode="numeric"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-3 text-center text-base text-white focus:border-gold/60 focus:outline-none"
                  />
                </label>
              ))}
            </div>
            {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
            <button
              type="button"
              onClick={() => {
                setAgeDraft((d) => ({ age: d.age || String(profile.age ?? ""), min: d.min || String(profile.age_min ?? ""), max: d.max || String(profile.age_max ?? "") }));
                saveAges();
              }}
              className="cta-premium mt-6 w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950"
            >
              {saving ? tx("Speichere …") : tx("Speichern")}
            </button>
          </Sheet>

          <Sheet open={editingLanguages} onClose={() => setEditingLanguages(false)} title={tx("Sprachen")}>
            <ChoiceSelect
              options={LANGUAGES}
              value={langDraft}
              onChange={setLangDraft}
              onConfirm={saveLanguages}
              maxTotal={5}
              customPlaceholder={tx("Andere Sprache + Enter")}
              confirmLabel={saving ? tx("Speichere …") : tx("Speichern")}
            />
            {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
          </Sheet>

          <Sheet open={sheet === "phase"} onClose={() => setSheet(null)} title={tx("Lebensphase")}>
            <div role="radiogroup" aria-label={tx("Lebensphase")}>
              <ChipRow>
                {PHASES.map((ph) => (
                  <Chip key={ph.id} selected={profile.life_phase === ph.id} onClick={() => changePhase(ph.id)}>
                    {tx(ph.label)}
                  </Chip>
                ))}
              </ChipRow>
            </div>
            {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
          </Sheet>

          <Sheet open={sheet === "gender"} onClose={() => setSheet(null)} title={tx("Geschlecht und Wunsch")}>
            <p className="text-sm font-medium text-zinc-100">{tx("Geschlecht")}</p>
            <div className="mt-2.5" role="radiogroup" aria-label={tx("Geschlecht")}>
              <ChipRow>
                {GENDER_CHOICES.map((g) => (
                  <Chip key={g.id} selected={profile.gender === g.id} onClick={() => changeGender(g.id)}>
                    {tx(g.label)}
                  </Chip>
                ))}
                {profile.gender && !GENDER_CHOICES.some((g) => g.id === profile.gender) && (
                  <Chip selected onClick={() => {}}>
                    {profile.gender === "nonbinary" ? tx("Nicht-binär / divers") : profile.gender === "na" ? tx("Keine Angabe") : profile.gender}
                  </Chip>
                )}
              </ChipRow>
            </div>
            <div className="mt-3">
              <CustomEntry placeholder={tx("Eigene Angabe + Enter")} onAdd={addCustomGender} />
            </div>
            <p className="mt-6 text-sm font-medium text-zinc-100">{tx("Mit wem möchtest du dich verbinden?")}</p>
            <div className="mt-2.5" role="radiogroup" aria-label={tx("Verbinden mit")}>
              <ChipRow>
                {(profile.group_size === "duo" ? DUO_WISHES : GROUP_WISHES).map((g) => (
                  <Chip key={g.id} selected={profile.match_gender === g.id} onClick={() => changeMatchGender(g.id)}>
                    {tx(g.label)}
                  </Chip>
                ))}
                {profile.match_gender === "other" && (
                  <Chip selected onClick={() => {}}>
                    {tx("Anderes")}
                  </Chip>
                )}
              </ChipRow>
            </div>
            {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
          </Sheet>

          <Sheet open={sheet === "group"} onClose={() => setSheet(null)} title={tx("Gewünschte Gruppengröße")}>
            <div role="radiogroup" aria-label={tx("Gruppengröße")}>
              <ChipRow>
                {GROUP_SIZES.map((g) => (
                  <Chip key={g.id} selected={profile.group_size === g.id} onClick={() => changeGroupSize(g.id)}>
                    {tx(g.label)}
                  </Chip>
                ))}
              </ChipRow>
            </div>
            {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
          </Sheet>

          {(
            [
              { key: "interests", title: "Interessen", options: INTERESTS },
              { key: "vibes", title: "Vibe", options: VIBES },
            ] as const
          ).map(({ key, title, options }) => (
            <Sheet key={key} open={editing === key} onClose={() => setEditing(null)} title={tx(title)}>
              <ChoiceSelect
                options={options}
                value={draft}
                onChange={setDraft}
                onConfirm={saveEdit}
                customPlaceholder={key === "interests" ? tx("Eigenes + Enter") : tx("Eigenen Vibe + Enter")}
                maxTotal={key === "interests" ? MAX_INTERESTS : MAX_VIBES}
                minTotal={key === "interests" ? MIN_INTERESTS : 1}
                confirmLabel={saving ? tx("Speichere …") : tx("Speichern")}
              />
              {message && <p role="alert" className="mt-4 text-sm text-rose">{message}</p>}
            </Sheet>
          ))}
        </motion.section>

        {/* Chats mit Matches */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.09 }}
          className={card}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">{tx("Deine Chats")}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {tx("Du kannst höchstens vier Chats gleichzeitig führen, damit jedes Gespräch echten Fokus bekommt. Verlässt du einen Chat, wird ein Platz für ein neues Match frei.")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex justify-end gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-2 w-5 rounded-full ${i < matchCount ? "bg-gold" : "bg-white/10"}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{tx("{n} von 4", { n: matchCount })}</p>
            </div>
          </div>
          <Link
            href={preview ? "#" : "/dashboard/chats"}
            className="cta-premium mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Zu den Chats
            {unreadCount > 0 && (
              <span className="rounded-full bg-zinc-950/80 px-2 py-0.5 text-xs text-gold">{tx("{n} neu", { n: unreadCount })}</span>
            )}
          </Link>
        </motion.section>

        {/* Steckbrief: was DSpora über dich weiß, und das Gespräch mit der KI */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className={card}
        >
          <h2 className="text-lg font-semibold text-zinc-50">{tx("Dein Steckbrief")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
            {tx("Das weiß DSpora aktuell über dich. Erzähl der KI jederzeit Neues, oder entferne Angaben, die nicht mehr stimmen.")}
          </p>

          {steckbrief.lines.length > 0 && (
            <>
              <dl className="mt-4 space-y-2 text-sm">
                {steckbrief.lines.slice(0, 4).map((l) => (
                  <div key={l.label} className="flex items-baseline gap-3">
                    <dt className="w-32 shrink-0 text-zinc-300">{tx(l.label)}</dt>
                    <dd className="min-w-0 flex-1 text-zinc-50">{l.value.split(", ").map((v) => tx(v)).join(", ")}</dd>
                    {editableLine(l.label) && (
                      <button type="button" onClick={() => editLine(l.label)} className="shrink-0 py-1 text-sm font-medium text-gold hover:underline">
                        {tx("Ändern")}
                      </button>
                    )}
                  </div>
                ))}
              </dl>
              {steckbrief.lines.length > 4 && (
                <button type="button" onClick={() => setSheet("facts")} className="mt-3 text-sm font-medium text-gold hover:underline">
                  {tx("Alle Angaben ansehen und ändern")}
                </button>
              )}
              <Sheet open={sheet === "facts"} onClose={() => setSheet(null)} title={tx("Dein Steckbrief")}>
                <dl className="space-y-3 text-sm">
                  {steckbrief.lines.map((l) => (
                    <div key={l.label} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <dt className="text-zinc-300">{tx(l.label)}</dt>
                        <dd className="mt-0.5 text-base text-zinc-50">{l.value.split(", ").map((v) => tx(v)).join(", ")}</dd>
                      </div>
                      {editableLine(l.label) && (
                        <button type="button" onClick={() => editLine(l.label)} className="shrink-0 py-1 text-sm font-medium text-gold hover:underline">
                          {tx("Ändern")}
                        </button>
                      )}
                    </div>
                  ))}
                </dl>
              </Sheet>
            </>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-zinc-50">{tx("Das hast du erzählt")}</p>
            {steckbrief.facts.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-300">{tx("Noch nichts. Im Gespräch lernt die KI dich besser kennen.")}</p>
            ) : (
              <div className="mt-3">
                <Slider
                  label={tx("Das hast du erzählt")}
                  slides={steckbrief.facts.map((f) => (
                    <div
                      key={`${f.kind}-${f.question}-${f.answer}`}
                      className="flex min-h-28 items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        {f.kind === "follow" && <p className="text-sm text-zinc-300">{f.question}</p>}
                        <p className="mt-1 text-base leading-relaxed break-words text-zinc-50">{f.answer}</p>
                      </div>
                      <div className="-mt-1 -mr-1 flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => { setEditingFact(f); setFactDraft(f.answer); setMessage(""); }}
                          aria-label={tx("Diese Angabe ändern")}
                          title={tx("Ändern")}
                          className="flex h-10 w-10 items-center justify-center text-zinc-300 transition-colors hover:text-gold"
                        >
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                            <path d="M13.5 6.5l4 4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFact(f)}
                          disabled={saving}
                          aria-label={tx("Diese Angabe entfernen")}
                          title={tx("Entfernen")}
                          className="flex h-10 w-10 items-center justify-center text-2xl leading-none text-zinc-300 transition-colors hover:text-rose disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                />
              </div>
            )}
          </div>

          <Link
            href={preview ? "#" : "/onboarding?talk=1"}
            className="cta-premium mt-5 inline-flex items-center rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-2.5 text-sm font-semibold text-zinc-950"
          >
            {tx("Mit der KI sprechen")}
          </Link>
          {steckbrief.facts.length > 0 && (
            <button type="button" onClick={() => { setMessage(""); setSheet("reset"); }} className="mt-4 block text-sm text-zinc-300 underline-offset-2 transition-colors hover:text-rose hover:underline">
              {tx("Gespräch mit der KI zurücksetzen")}
            </button>
          )}
          <Sheet open={Boolean(editingFact)} onClose={() => setEditingFact(null)} title={tx("Angabe ändern")}>
            {editingFact?.kind === "follow" && <p className="text-sm text-zinc-300">{editingFact.question}</p>}
            <textarea
              value={factDraft}
              onChange={(e) => setFactDraft(e.target.value.slice(0, 600))}
              rows={5}
              aria-label={tx("Angabe ändern")}
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-base leading-relaxed text-white focus:border-gold/60 focus:outline-none"
            />
            <p className="mt-1 text-right text-sm text-zinc-300">{factDraft.length}/600</p>
            {message && <p role="alert" className="mt-2 text-sm text-rose">{message}</p>}
            <button
              type="button"
              onClick={saveFactEdit}
              disabled={saving || factDraft.trim().length < 2}
              className="cta-premium mt-4 w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-40"
            >
              {saving ? tx("Speichere …") : tx("Speichern")}
            </button>
          </Sheet>
          <Sheet open={sheet === "reset"} onClose={() => setSheet(null)} title={tx("Gespräch zurücksetzen?")} tone="danger">
            <p className="text-base leading-relaxed text-zinc-100">
              {tx("Alle Angaben aus deinem Gespräch mit der KI werden gelöscht, dazu der gespeicherte Gesprächsverlauf und die daraus abgeleiteten Merkmale. Deine Profil-Angaben (Alter, Interessen, Vibe …) bleiben.")}
            </p>
            {message && <p role="alert" className="mt-3 text-sm text-rose">{message}</p>}
            <div className="mt-6 grid gap-3">
              <button type="button" onClick={resetTalk} disabled={saving} className="w-full rounded-full bg-rose px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                {saving ? tx("Lösche …") : tx("Ja, alles zurücksetzen")}
              </button>
              <button type="button" onClick={() => setSheet(null)} className="w-full rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-medium text-zinc-100">
                {tx("Abbrechen")}
              </button>
            </div>
          </Sheet>
        </motion.section>

        {/* Ideen für DSpora (Co-Creation) */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
          className={card}
        >
          <h2 className="text-lg font-semibold text-zinc-50">{tx("Deine Ideen für DSpora")}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            {tx("Was wünschst du dir? Welche Features sollten wir unbedingt einbauen? Wir lesen jede Idee.")}
          </p>
          <form onSubmit={submitWish} className="mt-4 space-y-2.5">
            <textarea
              value={wishText}
              onChange={(e) => setWishText(e.target.value.slice(0, 1500))}
              rows={3}
              placeholder={tx("Meine Idee …")}
              aria-label={tx("Idee für DSpora")}
              className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-400">{wishMessage}</span>
              <button
                type="submit"
                disabled={wishBusy || wishText.trim().length < 3}
                className="cta-premium rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
              >
                {wishBusy ? tx("Sende …") : tx("Idee senden")}
              </button>
            </div>
          </form>
          {wishes.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <Slider
                label={tx("Deine Ideen für DSpora")}
                slides={wishes.map((w) => (
                  <div key={w.id} className="min-h-24 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5">
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-zinc-50">{w.wish}</p>
                    <p className="mt-1.5 text-sm text-zinc-300">
                      {new Date(w.created_at).toLocaleDateString(language === "ta" ? "ta-IN" : language === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" })}
                    </p>
                  </div>
                ))}
              />
            </div>
          )}
        </motion.section>

        {/* Sicherheit: Passkeys */}
        {passkeySupported && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.16 }}
            className={card}
          >
            <h2 className="text-lg font-semibold text-zinc-50">{tx("Schneller anmelden")}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              {tx("Mit einem Passkey meldest du dich per Face ID, Touch ID oder Schlüsselbund an. Ein Passwort gibt es bei DSpora nicht.")}
            </p>
            {passkeys && passkeys.length > 0 && (
              <ul className="mt-4 space-y-2">
                {passkeys.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200"
                  >
                    <span>
                      {p.friendly_name || "Passkey"}
                      <span className="ml-2 text-xs text-zinc-400">
                        {new Date(p.created_at).toLocaleDateString(language === "ta" ? "ta-IN" : language === "en" ? "en-GB" : "de-DE")}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removePasskey(p.id)}
                      className="text-xs text-zinc-400 transition-colors hover:text-rose"
                    >
                      {tx("Entfernen")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Chip onClick={addPasskey}>{tx("Passkey hinzufügen")}</Chip>
            </div>
            {passkeyMessage && (
              <p role="status" className="mt-3 text-xs text-zinc-300">
                {passkeyMessage}
              </p>
            )}
          </motion.section>
        )}

        {/* Benachrichtigungen */}
        <section className={card}>
          <h2 className="text-sm font-semibold text-zinc-100">{tx("Benachrichtigungen")}</h2>
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={profile.notify_matches !== false}
              onChange={(e) => changeNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#f2a65a]"
            />
            <span>
              {tx("E-Mail, wenn ein neuer Chat auf dich wartet")}
              <span className="mt-0.5 block text-xs text-zinc-400">{tx("Die Mail enthält keine Angaben zu deinem Match, nur einen Link in dein Profil.")}</span>
            </span>
          </label>
        </section>

        {/* Konto löschen: Pop-up mit Warnung, danach Bestätigung per E-Mail */}
        <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-5 backdrop-blur-md sm:p-7">
          <h2 className="text-sm font-semibold text-zinc-100">{tx("Konto löschen")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
            {tx("Du kannst dein Konto und alle Daten jederzeit löschen. Zur Sicherheit bestätigst du das noch einmal per E-Mail.")}
          </p>
          <button
            type="button"
            onClick={() => { setDeleteStep("intro"); setDeleteError(""); setSheet("delete"); }}
            className="mt-4 rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-200 transition-colors hover:border-rose/60 hover:text-rose"
          >
            {tx("Konto löschen …")}
          </button>
        </section>

        <Sheet open={sheet === "delete"} onClose={() => setSheet(null)} title={tx("Konto wirklich löschen?")} tone="danger">
          {deleteStep === "intro" ? (
            <>
              <p className="text-base leading-relaxed text-zinc-100">{tx("Bist du sicher? Das passiert, wenn du dein Konto löschst:")}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-200">
                <li>{tx("Dein Konto wird gesperrt und du verlässt alle Chats.")}</li>
                <li>{tx("Dein Profil, deine Antworten und deine Fotos sind für andere nicht mehr sichtbar.")}</li>
                <li>{tx("Nach 30 Tagen werden alle deine Daten endgültig gelöscht.")}</li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                {tx("Im nächsten Schritt schicken wir dir einen Bestätigungslink an {email}. Erst wenn du darauf klickst, wird das Konto gelöscht.", { email })}
              </p>
              {deleteError && <p role="alert" className="mt-3 text-sm text-rose">{deleteError}</p>}
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={requestDelete}
                  disabled={deleting}
                  className="w-full rounded-full bg-rose px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? tx("Sende …") : tx("Bestätigungs-E-Mail senden")}
                </button>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  className="w-full rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-medium text-zinc-100"
                >
                  {tx("Nein, Konto behalten")}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-base leading-relaxed text-zinc-100">{tx("Wir haben dir eine E-Mail an {email} geschickt.", { email })}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                {tx("Klicke darin auf „Löschen bestätigen“. Der Link ist eine Stunde gültig. Schau auch im Spam-Ordner nach. Wenn du nicht klickst, bleibt dein Konto unverändert.")}
              </p>
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="mt-6 w-full rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-medium text-zinc-100"
              >
                {tx("Schließen")}
              </button>
            </>
          )}
        </Sheet>

        <footer className="flex items-center justify-between px-1 pt-2 text-xs text-white/70">
          <Link href="/onboarding" className="transition-colors hover:text-white">
            {tx("Chat erneut durchspielen")}
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            {tx("Zur Startseite")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
