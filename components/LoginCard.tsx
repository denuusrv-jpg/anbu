"use client";

import Link from "next/link";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useTx } from "@/lib/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, ShieldIcon } from "@/components/Icons";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, safeNextPath } from "@/lib/supabase/config";

type Status = "idle" | "sending" | "sent";

const EASE = [0.16, 1, 0.3, 1] as const;
const RESEND_SECONDS = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Passwortlose Anmeldung: Magic-Link per E-Mail oder Passkey (Face ID / Touch ID / Schlüsselbund).
export default function LoginCard({
  next = "/dashboard",
  notice,
}: {
  next?: string;
  notice?: string;
}) {
  const tx = useTx();
  const router = useRouter();
  const target = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState(notice ?? "");
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Bot-Schutz: unsichtbares Honeypot-Feld und Zeit seit dem Anzeigen des Formulars
  const honeypot = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  // Passkey-Autofill: Der Browser bietet gespeicherte Passkeys direkt im E-Mail-Feld an
  useEffect(() => {
    if (!isSupabaseConfigured || typeof window === "undefined" || !window.PublicKeyCredential) return;
    setPasskeySupported(true);

    const controller = new AbortController();
    (async () => {
      try {
        const available = await PublicKeyCredential.isConditionalMediationAvailable?.();
        if (!available) return;
        const { data } = await getBrowserClient().auth.signInWithPasskey({
          options: { mediation: "conditional", signal: controller.signal },
        });
        if (data?.session) router.push(target);
      } catch {
        // Autofill nicht verfügbar oder abgebrochen - der Magic-Link bleibt als Weg
      }
    })();
    return () => controller.abort();
  }, [router, target]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    if (!isSupabaseConfigured || status === "sending") return;
    const value = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value)) {
      setError(tx("Bitte gib eine gültige E-Mail-Adresse ein."));
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          next: target,
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - shownAt.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus("idle");
        setError(data?.error ?? tx("Das hat leider nicht geklappt. Bitte versuch es noch einmal."));
        return;
      }
      setStatus("sent");
      setCooldown(RESEND_SECONDS);
    } catch {
      setStatus("idle");
      setError(tx("Keine Verbindung. Bitte versuch es noch einmal."));
    }
  }

  async function signInWithPasskey() {
    setError("");
    setPasskeyBusy(true);
    try {
      const { data, error: err } = await getBrowserClient().auth.signInWithPasskey();
      if (err || !data?.session) {
        setError(tx("Mit dem Passkey hat es nicht geklappt. Du kannst dir stattdessen einen Link per E-Mail schicken lassen."));
        return;
      }
      router.push(target);
    } finally {
      setPasskeyBusy(false);
    }
  }

  return (
    <>
    <LanguageSwitch className="mb-5" />
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <ShieldIcon />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-zinc-50">{tx("Willkommen zurück")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          {tx("Ohne Passwort: Wir schicken dir einen Link oder du nutzt deinen Passkey.")}
        </p>

        {!isSupabaseConfigured ? (
          <p
            role="status"
            className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300"
          >
            {tx("Die Anmeldung wird gerade eingerichtet und ist bald verfügbar.")}
          </p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {status === "sent" ? (
              <motion.div
                key="sent"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="mt-6 space-y-3"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <p className="text-sm leading-relaxed text-zinc-200">
                  {tx("Check dein Postfach: Wir haben dir einen Link an {email} geschickt.", { email: email.trim() })}
                </p>
                <p className="text-xs text-zinc-500">{tx("Schau auch im Spam-Ordner nach.")}</p>
                <button
                  type="button"
                  onClick={() => sendLink()}
                  disabled={cooldown > 0}
                  className="text-xs text-zinc-400 transition-colors hover:text-gold disabled:opacity-50"
                >
                  {cooldown > 0 ? tx("Erneut senden in {n} s", { n: cooldown }) : tx("Link erneut senden")}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={sendLink}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="mt-6 space-y-3 text-left"
              >
                <label htmlFor="login-email" className="sr-only">
                  {tx("E-Mail-Adresse")}
                </label>
                <input
                  ref={honeypot}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email webauthn"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder={tx("deine@mail.com")}
                  aria-invalid={error ? true : undefined}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-center text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "sending" || !email.trim()}
                  className="cta-premium w-full rounded-full bg-gradient-to-b from-gold-light to-gold px-6 py-3 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-50"
                >
                  {status === "sending" ? "Sende …" : "Link per E-Mail senden"}
                </button>

                {passkeySupported && (
                  <>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <span className="h-px flex-1 bg-white/10" />
                      {tx("oder")}
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <button
                      type="button"
                      onClick={signInWithPasskey}
                      disabled={passkeyBusy}
                      className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-50"
                    >
                      {passkeyBusy ? "Warte auf dein Gerät …" : "Mit Passkey anmelden"}
                    </button>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs leading-relaxed text-rose">
            {tx(error)}
          </p>
        )}
      </div>
    </div>
    <Link href="/" className="mt-8 text-sm text-zinc-500 hover:text-zinc-300">
      {tx("← Zurück zur Startseite")}
    </Link>
    </>
  );
}
