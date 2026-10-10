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
import { getBrowserClient } from "@/lib/supabase/client";
import {
  ALL_HUBS,
  DUO_WISHES,
  GENDER_CHOICES,
  GROUP_SIZES,
  GROUP_WISHES,
  INTERESTS,
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
};

export type HubStat = { id: string; label: string; count: number };

const EMPTY_BUSINESS: BusinessData = {
  sector: "",
  role: "",
  goals: { ids: [], custom: [] },
  cv: { achievements: [], links: [] },
};

const EASE = [0.16, 1, 0.3, 1] as const;

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const hubLabels = [profile.region, profile.second_region]
    .filter((h): h is string => Boolean(h))
    .map((h) => ALL_HUBS.find((r) => r.id === h)?.label ?? h);
  const [setupBusiness, setSetupBusiness] = useState(false);
  const [editingPlace, setEditingPlace] = useState(false);
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
    track: profile.track,
    business: profile.business,
    extras: profile.extras,
  });
  const lastError = useRef("");
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
        lastError.current = data?.error ?? "Speichern hat nicht geklappt.";
        setMessage(lastError.current);
        return false;
      }
      return true;
    } catch {
      setMessage("Keine Verbindung. Bitte versuch es noch einmal.");
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

  // Wohnort: wird geprüft und dem nächsten Hub zugeordnet, erst nach der Bestätigung gespeichert
  async function checkPlace() {
    const value = placeText.trim();
    if (value.length < 2) {
      setPlaceError("Bitte gib deinen Wohnort an.");
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
      else setPlaceError("Diesen Ort konnte ich nicht zuordnen. Bitte gib die nächstgrößere Stadt an.");
    } catch {
      setPlaceError("Keine Verbindung. Bitte versuch es noch einmal.");
    }
  }

  async function savePlace() {
    if (!placeFound) return;
    if (await patch({ place: placeFound })) {
      setProfile((p) => ({ ...p, city: placeFound.name, region: placeFound.hub }));
      setEditingPlace(false);
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
      setMessage(`Bitte gib Zahlen zwischen ${MIN_AGE} und ${MAX_AGE} an.`);
      return;
    }
    if (min > max) {
      setMessage("Altersspanne: „von“ darf nicht größer sein als „bis“.");
      return;
    }
    if (await patch({ age, ageMin: min, ageMax: max })) setProfile((p) => ({ ...p, age, age_min: min, age_max: max }));
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
    return lastError.current || "Speichern hat nicht geklappt.";
  }

  async function switchTrack(next: HubProfile["track"]) {
    if (next === profile.track) return;
    setMessage("");
    if (next === "community") {
      if (await patch({ track: "community" })) {
        setProfile((p) => ({ ...p, track: "community", visibility: p.visibility === "business" ? "stealth" : p.visibility }));
        setSetupBusiness(false);
      }
      return;
    }
    if (!hasProfile) {
      setMessage("Für den Business-Modus brauchst du ein Profil mit Namen. Lege es zuerst an.");
      return;
    }
    if (!profile.business) {
      setSetupBusiness(true);
      return;
    }
    if (await patch({ track: "business" })) setProfile((p) => ({ ...p, track: "business", mode: "profile" }));
  }

  async function activateBusiness(next: BusinessData): Promise<string | null> {
    const ok = await patch({ track: "business", business: next });
    if (!ok) return lastError.current || "Speichern hat nicht geklappt.";
    setProfile((p) => ({ ...p, track: "business", mode: "profile", business: next }));
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
      setWishMessage("Vorschau: nichts wurde gespeichert.");
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
        setWishMessage(data?.error ?? "Das hat nicht geklappt.");
        return;
      }
      setWishes((list) => [{ id: String(Date.now()), wish: text, created_at: new Date().toISOString() }, ...list]);
      setWishText("");
      setWishMessage("Danke! Deine Idee ist angekommen.");
    } catch {
      setWishMessage("Keine Verbindung. Bitte versuch es noch einmal.");
    } finally {
      setWishBusy(false);
    }
  }

  async function deleteAccount() {
    if (preview) {
      setConfirmDelete(false);
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("Das Konto konnte nicht gelöscht werden. Bitte versuch es noch einmal.");
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
        setPasskeyMessage("Der Passkey konnte nicht angelegt werden.");
        return;
      }
      const { data } = await getBrowserClient().auth.passkey.list();
      setPasskeys(data ?? []);
      setPasskeyMessage("Passkey hinzugefügt. Ab jetzt kannst du dich mit Face ID oder Touch ID anmelden.");
    } catch {
      setPasskeyMessage("Der Passkey konnte nicht angelegt werden.");
    }
  }

  async function removePasskey(id: string) {
    if (preview) return;
    const { error } = await getBrowserClient().auth.passkey.delete({ passkeyId: id });
    if (!error) setPasskeys((list) => (list ?? []).filter((p) => p.id !== id));
  }

  const active = profile.track;
  const intentions = [
    {
      id: "community" as const,
      label: "Privat",
      text:
        active === "community"
          ? matchCount > 0
            ? `${matchCount} aktive${matchCount === 1 ? "r Chat" : " Chats"} (höchstens 4)`
            : "Dein Hub bereitet passende Verbindungen vor"
          : "Pausiert. Wechsle oben auf „Friends-Community“, um sie zu aktivieren.",
    },
    {
      id: "business" as const,
      label: "Business",
      text:
        active === "business"
          ? matchCount > 0
            ? `${matchCount} aktive${matchCount === 1 ? "r Chat" : " Chats"} (höchstens 4)`
            : "Dein Hub bereitet passende Business-Verbindungen vor"
          : "Nicht aktiv. Wechsle oben auf „Business-Community“, um sie zu aktivieren.",
    },
  ];

  const card = "rounded-3xl border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-md sm:p-7";

  return (
    <main className="relative isolate min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <FlowingWaveBackground pulses={false} fixed />
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Kopf */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">DSpora Profil</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">
              {name ? `Hey ${name}` : "Willkommen"}
            </h1>
            <p className="mt-0.5 text-xs text-white/70">{email}</p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold shadow-[0_0_24px_-8px_rgba(242,166,90,0.6)] backdrop-blur-md transition-colors hover:bg-gold/20"
              >
                Admin Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold"
            >
              Abmelden
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
            className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-gold/25 blur-3xl"
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
                {matchCount > 0 ? "Deine Matches warten" : "Dein Hub bereitet Matches vor"}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Wir prüfen die Anmeldungen und öffnen deinen Hub, sobald genug passende Leute dabei sind. Jedes Match
              schauen wir uns vorher an. Du musst nichts weiter tun.
            </p>

            {/* Getrennt nach Intention */}
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {intentions.map((i) => (
                <div
                  key={i.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    active === i.id ? "border-gold/40 bg-gold/[0.07]" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <p className={`text-xs font-semibold tracking-wide uppercase ${active === i.id ? "text-gold" : "text-zinc-500"}`}>
                    {i.label}
                  </p>
                  <p className={`mt-1 text-sm leading-snug ${active === i.id ? "text-zinc-100" : "text-zinc-500"}`}>
                    {i.text}
                  </p>
                </div>
              ))}
            </div>

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-zinc-200">
                <CheckIcon className="h-4 w-4 text-gold" /> Profil und Antworten sind gespeichert
              </li>
              <li className="text-zinc-200">
                <div className="flex items-center gap-2.5">
                  <CheckIcon className="h-4 w-4 text-gold" />
                  {hubLabels.length > 1 ? "Hubs" : "Hub"} {hubLabels.join(" + ")}
                  {profile.city ? ` · ${profile.city}` : ""}
                </div>
                {hubs?.map((h) => (
                  <p key={h.id} className="mt-1.5 pl-[26px] text-xs text-zinc-500">
                    {h.count} {h.count === 1 ? "Anmeldung" : "Anmeldungen"} im Hub {h.label}
                  </p>
                ))}
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400">
                <span className="h-4 w-4 rounded-full border border-dashed border-zinc-600" /> Matching: in Vorbereitung
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Profilseite (Instagram-Stil) */}
        {userId && (
          <ProfileEditor
            userId={userId}
            visibility={profile.visibility}
            track={profile.track}
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
          <h2 className="text-lg font-semibold text-zinc-50">Dein Profil</h2>

          {/* Modus-Switch */}
          <div className="mt-5">
            <p className="text-sm font-medium text-zinc-100">Modus</p>
            <div
              role="radiogroup"
              aria-label="Modus"
              className="relative mt-2.5 grid grid-cols-2 rounded-full border border-white/10 bg-zinc-950/60 p-1"
            >
              {(
                [
                  { id: "community", label: "Friends-Community" },
                  { id: "business", label: "Business-Community" },
                ] as const
              ).map((m) => {
                const on = (setupBusiness ? "business" : profile.track) === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={saving}
                    onClick={() => switchTrack(m.id)}
                    className={`relative z-10 rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-300 sm:text-sm ${
                      on ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="mode-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-gold-light to-gold shadow-[0_0_24px_-6px_rgba(242,166,90,0.7)]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    {m.label}
                  </button>
                );
              })}
            </div>
            {setupBusiness && (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/[0.05] p-4">
                <p className="text-xs leading-relaxed text-zinc-400">
                  Für den Business-Modus brauchen wir noch ein paar Angaben und dein Light-CV.
                </p>
                <BusinessEditor
                  business={EMPTY_BUSINESS}
                  onSave={activateBusiness}
                  startEditing
                  onCancel={() => setSetupBusiness(false)}
                  title="Business-Profil einrichten"
                />
              </div>
            )}
          </div>

          {/* Wohnort, Hub und Entfernung */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-100">Art der Freundschaft und Wohnort</p>
            </div>
            <div className="mt-3" role="radiogroup" aria-label="Art der Freundschaft">
              <ChipRow>
                {MEET_MODES.map((m) => (
                  <Chip key={m.id} selected={profile.meet_mode === m.id} onClick={() => changeMeetMode(m.id as "online" | "activities")}>
                    {m.label}
                  </Chip>
                ))}
              </ChipRow>
            </div>
            {profile.meet_mode !== "online" && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    {profile.city ? `${profile.city} · ` : ""}Hub {hubLabels.join(" + ") || "–"}
                  </p>
                  {!editingPlace && (
                    <button type="button" onClick={() => { setEditingPlace(true); setMessage(""); }} className="text-xs text-zinc-400 transition-colors hover:text-gold">
                      Ort ändern
                    </button>
                  )}
                </div>
                {editingPlace && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={placeText}
                        onChange={(e) => { setPlaceText(e.target.value); setPlaceFound(null); setPlaceError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); checkPlace(); } }}
                        placeholder="Dein Wohnort"
                        aria-label="Dein Wohnort"
                        className={fieldClass}
                      />
                      <button type="button" onClick={checkPlace} className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-zinc-200 hover:border-gold/50 hover:text-gold">
                        Prüfen
                      </button>
                    </div>
                    {placeError && <p role="alert" className="text-xs text-rose">{placeError}</p>}
                    {placeFound && (
                      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-3.5 py-2.5 text-xs text-zinc-200">
                        <span>„{placeFound.name}“ gehört zum Hub {placeFound.hubLabel}.</span>
                        <button type="button" onClick={savePlace} className="rounded-full bg-gold px-3 py-1 font-semibold text-zinc-950">
                          {saving ? "Speichere …" : "Übernehmen"}
                        </button>
                      </div>
                    )}
                    <button type="button" onClick={() => setEditingPlace(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
                      Abbrechen
                    </button>
                  </div>
                )}
                <p className="mt-4 text-xs text-zinc-400">Wie weit darf jemand maximal entfernt wohnen? (Fahrzeit mit dem Auto)</p>
                <div className="mt-2" role="radiogroup" aria-label="Maximale Entfernung">
                  <ChipRow>
                    {TRAVEL_OPTIONS.map((o) => (
                      <Chip key={o.minutes} selected={(profile.travel_minutes ?? 0) === o.minutes} onClick={() => changeTravel(o.minutes)}>
                        {o.label}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
                <p className="mt-4 text-xs text-zinc-400">Wie oft würdest du dich realistisch treffen?</p>
                <div className="mt-2" role="radiogroup" aria-label="Treffhäufigkeit">
                  <ChipRow>
                    {MEET_FREQUENCIES.map((f) => (
                      <Chip key={f.id} selected={profile.meet_frequency === f.id} onClick={() => changeFrequency(f.id)}>
                        {f.label}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
              </div>
            )}
          </div>

          {/* Alter */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-medium text-zinc-100">Alter und gesuchte Altersspanne</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={ageDraft.age || (profile.age ? String(profile.age) : "")}
                onChange={(e) => setAgeDraft((d) => ({ ...d, age: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                inputMode="numeric"
                aria-label="Dein Alter"
                placeholder="Alter"
                className="w-20 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-center text-sm text-white focus:border-gold/60 focus:outline-none"
              />
              <span className="text-xs text-zinc-500">Gesucht von</span>
              <input
                value={ageDraft.min || (profile.age_min ? String(profile.age_min) : "")}
                onChange={(e) => setAgeDraft((d) => ({ ...d, min: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                inputMode="numeric"
                aria-label="Gesucht ab"
                placeholder="von"
                className="w-16 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-center text-sm text-white focus:border-gold/60 focus:outline-none"
              />
              <span className="text-xs text-zinc-500">bis</span>
              <input
                value={ageDraft.max || (profile.age_max ? String(profile.age_max) : "")}
                onChange={(e) => setAgeDraft((d) => ({ ...d, max: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                inputMode="numeric"
                aria-label="Gesucht bis"
                placeholder="bis"
                className="w-16 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-center text-sm text-white focus:border-gold/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setAgeDraft((d) => ({ age: d.age || String(profile.age ?? ""), min: d.min || String(profile.age_min ?? ""), max: d.max || String(profile.age_max ?? "") }));
                  saveAges();
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-200 hover:border-gold/50 hover:text-gold"
              >
                {saving ? "Speichere …" : "Speichern"}
              </button>
            </div>
          </div>

          {/* Sprachen und Lebensphase */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-100">Sprachen</p>
              {!editingLanguages && (
                <button type="button" onClick={() => { setLangDraft(profile.languages ?? { ids: [], custom: [] }); setEditingLanguages(true); setMessage(""); }} className="text-xs text-zinc-400 transition-colors hover:text-gold">
                  Bearbeiten
                </button>
              )}
            </div>
            {editingLanguages ? (
              <div className="mt-3">
                <ChoiceSelect
                  options={LANGUAGES}
                  value={langDraft}
                  onChange={setLangDraft}
                  onConfirm={saveLanguages}
                  maxTotal={5}
                  customPlaceholder="Eine andere Sprache? Eigene hinzufügen"
                  confirmLabel={saving ? "Speichere …" : "Speichern"}
                  extra={<button type="button" onClick={() => setEditingLanguages(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Abbrechen</button>}
                />
              </div>
            ) : (
              <div className="mt-3">
                <ChipRow>
                  {choiceLabels(profile.languages ?? { ids: [], custom: [] }, LANGUAGES).map((label) => (
                    <span key={label} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-zinc-200">{label}</span>
                  ))}
                </ChipRow>
              </div>
            )}
            {profile.track !== "business" && (
              <>
                <p className="mt-5 text-sm font-medium text-zinc-100">Lebensphase</p>
                <div className="mt-3" role="radiogroup" aria-label="Lebensphase">
                  <ChipRow>
                    {PHASES.map((ph) => (
                      <Chip key={ph.id} selected={profile.life_phase === ph.id} onClick={() => changePhase(ph.id)}>
                        {ph.label}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
              </>
            )}
          </div>

          {/* Geschlecht und Wunsch */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-medium text-zinc-100">Geschlecht</p>
            <p className="mt-0.5 text-xs text-zinc-500">Es zählt, wie du dich selbst identifizierst.</p>
            <div className="mt-3" role="radiogroup" aria-label="Geschlecht">
              <ChipRow>
                {GENDER_CHOICES.map((g) => (
                  <Chip key={g.id} selected={profile.gender === g.id} onClick={() => changeGender(g.id)}>
                    {g.label}
                  </Chip>
                ))}
                {profile.gender && !GENDER_CHOICES.some((g) => g.id === profile.gender) && (
                  <Chip selected onClick={() => {}}>
                    {profile.gender === "nonbinary" ? "Nicht-binär / divers" : profile.gender === "na" ? "Keine Angabe" : profile.gender}
                  </Chip>
                )}
              </ChipRow>
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-100">Mit wem möchtest du dich verbinden?</p>
            <div className="mt-3" role="radiogroup" aria-label="Verbinden mit">
              <ChipRow>
                {(profile.group_size === "duo" ? DUO_WISHES : GROUP_WISHES).map((g) => (
                  <Chip key={g.id} selected={profile.match_gender === g.id} onClick={() => changeMatchGender(g.id)}>
                    {g.label}
                  </Chip>
                ))}
                {profile.match_gender === "other" && (
                  <Chip selected onClick={() => {}}>
                    Anderes
                  </Chip>
                )}
              </ChipRow>
            </div>
          </div>

          {/* Gruppengröße */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-medium text-zinc-100">Gewünschte Gruppengröße</p>
            <div className="mt-3" role="radiogroup" aria-label="Gruppengröße">
              <ChipRow>
                {GROUP_SIZES.map((g) => (
                  <Chip
                    key={g.id}
                    selected={profile.group_size === g.id}
                    onClick={() => changeGroupSize(g.id)}
                  >
                    {g.label}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          </div>

          {profile.track === "business" && profile.business && (
            <BusinessEditor business={profile.business} onSave={saveBusiness} />
          )}

          {/* Interessen & Vibes */}
          {(
            [
              { key: "interests", title: "Interessen", options: INTERESTS },
              { key: "vibes", title: "Vibe", options: VIBES },
            ] as const
          ).map(({ key, title, options }) => (
            <div key={key} className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-100">{title}</p>
                {editing !== key && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(profile[key]);
                      setEditing(key);
                      setMessage("");
                    }}
                    className="text-xs text-zinc-400 transition-colors hover:text-gold"
                  >
                    Bearbeiten
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {editing === key ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3"
                  >
                    <ChoiceSelect
                      options={options}
                      value={draft}
                      onChange={setDraft}
                      onConfirm={saveEdit}
                      customPlaceholder={key === "interests" ? "Eigenes hinzufügen" : "Eigenen Vibe hinzufügen"}
                      maxTotal={key === "interests" ? MAX_INTERESTS : MAX_VIBES}
                      minTotal={key === "interests" ? MIN_INTERESTS : 1}
                      confirmLabel={saving ? "Speichere …" : "Speichern"}
                      extra={
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                        >
                          Abbrechen
                        </button>
                      }
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3"
                  >
                    <ChipRow>
                      {choiceLabels(profile[key], options).map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-zinc-200"
                        >
                          {label}
                        </span>
                      ))}
                    </ChipRow>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {message && (
            <p role="alert" className="mt-4 text-xs text-rose">
              {message}
            </p>
          )}
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
              <h2 className="text-lg font-semibold text-zinc-50">Deine Chats</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                Du kannst höchstens vier Chats gleichzeitig führen, damit jedes Gespräch echten Fokus bekommt. Verlässt du einen
                Chat, wird ein Platz für ein neues Match frei.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex justify-end gap-1" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-2 w-5 rounded-full ${i < matchCount ? "bg-gold" : "bg-white/10"}`} />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">{matchCount} von 4</p>
            </div>
          </div>
          <Link
            href={preview ? "#" : "/dashboard/chats"}
            className="cta-premium mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Zu den Chats
            {unreadCount > 0 && (
              <span className="rounded-full bg-zinc-950/80 px-2 py-0.5 text-[11px] text-gold">{unreadCount} neu</span>
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
          <h2 className="text-lg font-semibold text-zinc-50">Dein Steckbrief</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Das weiß DSpora aktuell über dich. So kann die KI dich immer auf dem neuesten Stand ansprechen. Erzähl ihr
            jederzeit Neues, oder entferne Angaben, die nicht mehr stimmen. Gefragt wird sie auch im Gespräch
            („Zeig mir meinen Steckbrief“).
          </p>

          {steckbrief.lines.length > 0 && (
            <dl className="mt-4 space-y-1.5 text-sm">
              {steckbrief.lines.map((l) => (
                <div key={l.label} className="flex gap-3">
                  <dt className="w-40 shrink-0 text-zinc-500">{l.label}</dt>
                  <dd className="min-w-0 text-zinc-200">{l.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-zinc-100">Das hast du erzählt</p>
            {steckbrief.facts.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">Noch nichts. Im Gespräch lernt die KI dich besser kennen.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {steckbrief.facts.map((f) => (
                    <motion.li
                      key={`${f.kind}-${f.question}-${f.answer}`}
                      layout="position"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5"
                    >
                      <div className="min-w-0 flex-1 text-sm">
                        {f.kind === "follow" && <p className="text-xs text-zinc-500">{f.question}</p>}
                        <p className="break-words text-zinc-200">{f.answer}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFact(f)}
                        disabled={saving}
                        aria-label="Diese Angabe entfernen"
                        title="Entfernen"
                        className="shrink-0 text-lg leading-none text-zinc-500 transition-colors hover:text-rose disabled:opacity-50"
                      >
                        ×
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <Link
            href={preview ? "#" : "/onboarding?talk=1"}
            className="cta-premium mt-5 inline-flex items-center rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Mit der KI sprechen
          </Link>
        </motion.section>

        {/* Ideen für DSpora (Co-Creation) */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
          className={card}
        >
          <h2 className="text-lg font-semibold text-zinc-50">Deine Ideen für DSpora</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
            Was wünschst du dir? Welche Features sollten wir unbedingt einbauen? Wir lesen jede Idee.
          </p>
          <form onSubmit={submitWish} className="mt-4 space-y-2.5">
            <textarea
              value={wishText}
              onChange={(e) => setWishText(e.target.value.slice(0, 1500))}
              rows={3}
              placeholder="Meine Idee …"
              aria-label="Idee für DSpora"
              className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/40 focus:border-gold/60 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">{wishMessage}</span>
              <button
                type="submit"
                disabled={wishBusy || wishText.trim().length < 3}
                className="cta-premium rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
              >
                {wishBusy ? "Sende …" : "Idee senden"}
              </button>
            </div>
          </form>
          {wishes.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
              {wishes.map((w) => (
                <li key={w.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">{w.wish}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {new Date(w.created_at).toLocaleDateString("de-DE", { dateStyle: "medium" })}
                  </p>
                </li>
              ))}
            </ul>
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
            <h2 className="text-lg font-semibold text-zinc-50">Schneller anmelden</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              Mit einem Passkey meldest du dich per Face ID, Touch ID oder Schlüsselbund an. Ein Passwort gibt es bei
              DSpora nicht.
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
                      <span className="ml-2 text-xs text-zinc-500">
                        {new Date(p.created_at).toLocaleDateString("de-DE")}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removePasskey(p.id)}
                      className="text-xs text-zinc-500 transition-colors hover:text-rose"
                    >
                      Entfernen
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Chip onClick={addPasskey}>Passkey hinzufügen</Chip>
            </div>
            {passkeyMessage && (
              <p role="status" className="mt-3 text-xs text-zinc-400">
                {passkeyMessage}
              </p>
            )}
          </motion.section>
        )}

        {/* Benachrichtigungen */}
        <section className={card}>
          <h2 className="text-sm font-semibold text-zinc-100">Benachrichtigungen</h2>
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={profile.notify_matches !== false}
              onChange={(e) => changeNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#f2a65a]"
            />
            <span>
              E-Mail, wenn ein neuer Chat auf dich wartet
              <span className="mt-0.5 block text-xs text-zinc-500">Die Mail enthält keine Angaben zu deinem Match, nur einen Link in dein Profil.</span>
            </span>
          </label>
        </section>

        {/* Konto löschen (Soft-Delete, 30 Tage) */}
        <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-md sm:p-7">
          <h2 className="text-sm font-semibold text-zinc-300">Konto löschen</h2>
          {!confirmDelete ? (
            <>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                Dein Konto wird sofort gesperrt. Deine Daten bleiben noch 30 Tage gespeichert, falls du es dir anders
                überlegst oder Hilfe brauchst. Danach werden sie endgültig gelöscht.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-4 rounded-full border border-white/10 px-4 py-1.5 text-xs text-zinc-400 transition-colors hover:border-rose/50 hover:text-rose"
              >
                Konto löschen …
              </button>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm leading-relaxed text-zinc-300">Möchtest du dein Konto wirklich löschen?</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="rounded-full bg-rose/90 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? "Lösche …" : "Ja, Konto löschen"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  Abbrechen
                </button>
              </div>
              {deleteError && (
                <p role="alert" className="text-xs text-rose">
                  {deleteError}
                </p>
              )}
            </div>
          )}
        </section>

        <footer className="flex items-center justify-between px-1 pt-2 text-xs text-white/70">
          <Link href="/onboarding" className="transition-colors hover:text-white">
            Chat erneut durchspielen
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            Zur Startseite
          </Link>
        </footer>
      </div>
    </main>
  );
}
