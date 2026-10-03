"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, ShieldIcon } from "@/components/Icons";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, safeNextPath } from "@/lib/supabase/config";

type Status = "idle" | "sending" | "sent";

const EASE = [0.16, 1, 0.3, 1] as const;
const RESEND_SECONDS = 30;

function friendlyError(message: string, code?: string): string {
  if (code === "over_email_send_rate_limit" || /rate limit/i.test(message)) {
    return "Zu viele Anfragen. Bitte warte kurz und versuch es dann erneut.";
  }
  if (code === "validation_failed" || /invalid/i.test(message)) {
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  }
  return "Das hat leider nicht geklappt. Bitte versuch es noch einmal.";
}

// Passwortlose Anmeldung: Magic-Link per E-Mail oder Passkey (Face ID / Touch ID / Schlüsselbund).
export default function LoginCard({
  next = "/hub",
  notice,
}: {
  next?: string;
  notice?: string;
}) {
  const router = useRouter();
  const target = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState(notice ?? "");
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    setError("");
    setStatus("sending");
    const { error: err } = await getBrowserClient().auth.signInWithOtp({
      email: value,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(target)}`,
      },
    });
    if (err) {
      setStatus("idle");
      setError(friendlyError(err.message, err.code));
      return;
    }
    setStatus("sent");
    setCooldown(RESEND_SECONDS);
  }

  async function signInWithPasskey() {
    setError("");
    setPasskeyBusy(true);
    try {
      const { data, error: err } = await getBrowserClient().auth.signInWithPasskey();
      if (err || !data?.session) {
        setError("Mit dem Passkey hat es nicht geklappt. Du kannst dir stattdessen einen Link per E-Mail schicken lassen.");
        return;
      }
      router.push(target);
    } finally {
      setPasskeyBusy(false);
    }
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          <ShieldIcon />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-zinc-50">Willkommen zurück</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Ohne Passwort: Wir schicken dir einen Link oder du nutzt deinen Passkey.
        </p>

        {!isSupabaseConfigured ? (
          <p
            role="status"
            className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300"
          >
            Die Anmeldung wird gerade eingerichtet und ist bald verfügbar.
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
                  Check dein Postfach: Wir haben dir einen Link an <strong>{email.trim()}</strong> geschickt.
                </p>
                <p className="text-xs text-zinc-500">Schau auch im Spam-Ordner nach.</p>
                <button
                  type="button"
                  onClick={() => sendLink()}
                  disabled={cooldown > 0}
                  className="text-xs text-zinc-400 transition-colors hover:text-gold disabled:opacity-50"
                >
                  {cooldown > 0 ? `Erneut senden in ${cooldown} s` : "Link erneut senden"}
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
                  E-Mail-Adresse
                </label>
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
                  placeholder="deine@mail.com"
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
                      oder
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
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
