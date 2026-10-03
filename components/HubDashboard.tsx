"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ChoiceSelect from "@/components/onboarding/ChoiceSelect";
import { Chip, ChipRow } from "@/components/onboarding/ui";
import { CheckIcon } from "@/components/Icons";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  INTERESTS,
  REGIONS,
  VIBES,
  choiceLabels,
  type Choice,
} from "@/lib/onboarding";

export type HubProfile = {
  region: string;
  city: string | null;
  interests: Choice;
  vibes: Choice;
  mode: "anonymous" | "profile";
  profile: { displayName?: string } | null;
  status: "preparing" | "matched";
};

const EASE = [0.16, 1, 0.3, 1] as const;
const HUB_TARGET = 100;

type Passkey = { id: string; friendly_name?: string | null; created_at: string };

export default function HubDashboard({
  email,
  profile: initial,
  regionCount,
}: {
  email: string;
  profile: HubProfile;
  regionCount: number | null;
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

  const regionLabel = REGIONS.find((r) => r.id === profile.region)?.label ?? profile.region;
  const hasProfile = Boolean(profile.profile);
  const anonymous = profile.mode === "anonymous";
  const name = profile.profile?.displayName;

  useEffect(() => {
    if (!window.PublicKeyCredential) return;
    setPasskeySupported(true);
    getBrowserClient()
      .auth.passkey.list()
      .then(({ data }: { data: Passkey[] | null }) => setPasskeys(data ?? []))
      .catch(() => setPasskeys([]));
  }, []);

  async function patch(update: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(data?.error ?? "Speichern hat nicht geklappt.");
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

  async function saveEdit() {
    if (!editing) return;
    if (await patch({ [editing]: draft })) {
      setProfile((p) => ({ ...p, [editing]: draft }));
      setEditing(null);
    }
  }

  async function toggleAnonymous() {
    const next = anonymous ? "profile" : "anonymous";
    if (await patch({ mode: next })) setProfile((p) => ({ ...p, mode: next }));
  }

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function addPasskey() {
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
    const { error } = await getBrowserClient().auth.passkey.delete({ passkeyId: id });
    if (!error) setPasskeys((list) => (list ?? []).filter((p) => p.id !== id));
  }

  const count = regionCount ?? 0;
  const progress = Math.min(count / HUB_TARGET, 1);

  const card = "rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7";

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Kopf */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold uppercase">DSpora Hub</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-50 sm:text-3xl">
              {name ? `Hey ${name}` : "Willkommen"}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">{email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md transition-colors hover:border-gold/50 hover:text-gold"
          >
            Abmelden
          </button>
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
                {profile.status === "matched" ? "Dein Match ist da" : "Dein Hub bereitet Matches vor"}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Sobald sich genug Leute in deiner Region eintragen, öffnet sich dein Hub und wir verbinden dich mit
              passenden Menschen. Du musst nichts weiter tun.
            </p>

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-zinc-200">
                <CheckIcon className="h-4 w-4 text-gold" /> Profil und Antworten sind gespeichert
              </li>
              <li className="text-zinc-200">
                <div className="flex items-center gap-2.5">
                  <CheckIcon className="h-4 w-4 text-gold" />
                  Region {regionLabel}
                  {profile.city ? ` · ${profile.city}` : ""}
                </div>
                {regionCount !== null && (
                  <div className="mt-2 pl-[26px]">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(progress * 100, 4)}%` }}
                        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      {count} von {HUB_TARGET} Anmeldungen in deiner Region
                    </p>
                  </div>
                )}
              </li>
              <li className="flex items-center gap-2.5 text-zinc-400">
                <span className="h-4 w-4 rounded-full border border-dashed border-zinc-600" /> Matching: in Vorbereitung
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Profil verwalten */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
          className={card}
        >
          <h2 className="text-lg font-semibold text-zinc-50">Dein Profil</h2>

          {/* Anonymität */}
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-100">Anonym bleiben</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {anonymous
                  ? "Andere sehen nur deine Interessen, nie deinen Namen oder deine Fotos."
                  : "Dein Profil mit Anzeigename ist für die gewählte Gruppe sichtbar."}
              </p>
              {!hasProfile && (
                <p className="mt-1.5 text-xs text-zinc-400">
                  Du hast noch kein Profil angelegt.{" "}
                  <Link href="/onboarding" className="text-gold hover:underline">
                    Profil anlegen
                  </Link>
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={anonymous}
              aria-label="Anonym bleiben"
              disabled={saving || (!hasProfile && anonymous)}
              onClick={toggleAnonymous}
              className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors duration-300 disabled:opacity-40 ${
                anonymous ? "border-gold/60 bg-gold/30" : "border-white/15 bg-white/10"
              }`}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow"
                animate={{ x: anonymous ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            </button>
          </div>

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

        <footer className="flex items-center justify-between px-1 pt-2 text-xs text-zinc-500">
          <Link href="/onboarding" className="transition-colors hover:text-zinc-300">
            Chat erneut durchspielen
          </Link>
          <Link href="/" className="transition-colors hover:text-zinc-300">
            Zur Startseite
          </Link>
        </footer>
      </div>
    </main>
  );
}
