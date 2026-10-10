"use client";

import { useTx } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toJpeg } from "@/components/profile/imageTools";
import { Chip, ChipRow, fieldClass } from "@/components/onboarding/ui";
import { getBrowserClient } from "@/lib/supabase/client";
import { CUSTOM_PATTERN, MAX_HOBBIES, NAME_PATTERN } from "@/lib/onboarding";
import type { PostView } from "@/lib/profileMedia";

const MAX_POSTS = 6;
const MAX_SLIDES = 6;
const BUCKET = "profile-photos";

type Info = { displayName: string; firstName: string; lastName: string; bio: string; hobbies: string[] };

// Deine Profilseite (Instagram-Stil): Öffentlich/Privat, Profilbild (eckig), Spitzname, Name, Text, Hobbys und bis zu 6 Beiträge mit je bis zu 6 Slides.
// Private Profile zeigen anderen nur Profilbild und Spitzname.
export default function ProfileEditor({
  userId,
  visibility,
  track,
  info,
  avatar,
  posts,
  onVisibility,
  preview = false,
}: {
  userId: string;
  visibility: "public" | "business" | "stealth";
  track: "community" | "business";
  info: Info;
  avatar: string | null;
  posts: PostView[];
  onVisibility: (next: "public" | "business" | "stealth") => void;
  preview?: boolean;
}) {
  const router = useRouter();
  const tx = useTx();
  const [form, setForm] = useState<Info>(info);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [caption, setCaption] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const postInput = useRef<HTMLInputElement>(null);

  async function patch(update: Record<string, unknown>): Promise<boolean> {
    if (preview) return true;
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(update) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage(tx(data?.error ?? "Speichern hat nicht geklappt."));
        return false;
      }
      return true;
    } catch {
      setMessage(tx("Keine Verbindung. Bitte versuch es noch einmal."));
      return false;
    }
  }

  async function saveInfo() {
    setMessage("");
    if (!NAME_PATTERN.test(form.displayName.trim())) {
      setMessage(tx("Spitzname: 2 bis 24 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen."));
      return;
    }
    setBusy("info");
    const ok = await patch({
      profileInfo: { displayName: form.displayName.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), bio: form.bio.trim(), hobbies: form.hobbies },
    });
    setBusy("");
    if (ok) {
      setMessage(tx("Gespeichert."));
      if (!preview) router.refresh();
    }
  }

  function addHobby() {
    const word = hobbyDraft.trim();
    if (!word) return;
    if (!CUSTOM_PATTERN.test(word)) {
      setMessage(tx("Hobby: 2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen."));
      return;
    }
    if (form.hobbies.length >= MAX_HOBBIES) {
      setMessage(tx("Höchstens {n} Hobbys.", { n: MAX_HOBBIES }));
      return;
    }
    if (form.hobbies.some((h) => h.toLowerCase() === word.toLowerCase())) {
      setHobbyDraft("");
      return;
    }
    setMessage("");
    setForm((f) => ({ ...f, hobbies: [...f.hobbies, word] }));
    setHobbyDraft("");
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setMessage("");
    if (preview) return;
    setBusy("avatar");
    try {
      const blob = await toJpeg(file, { square: true, max: 640 });
      const { error } = await getBrowserClient().storage.from(BUCKET).upload(`${userId}/avatar.jpg`, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      if (await patch({ avatar: true })) router.refresh();
    } catch {
      setMessage(tx("Das Profilbild konnte nicht hochgeladen werden."));
    } finally {
      setBusy("");
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  async function removeAvatar() {
    setMessage("");
    if (preview) return;
    setBusy("avatar");
    try {
      await getBrowserClient().storage.from(BUCKET).remove([`${userId}/avatar.jpg`]);
      if (await patch({ avatar: false })) router.refresh();
    } finally {
      setBusy("");
    }
  }

  function pickSlides(list: FileList | null) {
    if (!list) return;
    setMessage("");
    const incoming = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const room = MAX_SLIDES - files.length;
    if (incoming.length > room) setMessage(tx("Höchstens {n} Bilder pro Beitrag.", { n: MAX_SLIDES }));
    setFiles((prev) => [...prev, ...incoming.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    if (postInput.current) postInput.current.value = "";
  }

  async function publish() {
    if (files.length === 0 || preview) return;
    setMessage("");
    setBusy("post");
    const id = crypto.randomUUID();
    try {
      const storage = getBrowserClient().storage.from(BUCKET);
      for (let i = 0; i < files.length; i++) {
        const blob = await toJpeg(files[i].file, { max: 1080 });
        const { error } = await storage.upload(`${userId}/posts/${id}/${i + 1}.jpg`, blob, { contentType: "image/jpeg", upsert: true });
        if (error) throw error;
      }
      const res = await fetch("/api/profile/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, slides: files.length, caption }) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // Hochgeladene Bilder wieder entfernen, wenn der Beitrag nicht angelegt werden konnte
        await storage.remove(files.map((_, i) => `${userId}/posts/${id}/${i + 1}.jpg`));
        throw new Error(tx(data?.error ?? "Der Beitrag konnte nicht veröffentlicht werden."));
      }
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);
      setCaption("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : tx("Der Beitrag konnte nicht veröffentlicht werden."));
    } finally {
      setBusy("");
    }
  }

  async function removePost(id: string) {
    if (preview) return;
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/profile/posts/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setMessage(tx("Der Beitrag konnte nicht gelöscht werden."));
    } finally {
      setBusy("");
    }
  }

  const pill = "rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-200 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-50";

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-6 backdrop-blur-md sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">{tx("Deine Profilseite")}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{tx("So sehen dich andere. Beiträge zeigst du mit Bildern, die du wischen kannst.")}</p>
        </div>
        {!preview && (
          <Link href={`/profil/${userId}`} className="shrink-0 text-xs text-gold hover:underline">
            {tx("Ansehen")}
          </Link>
        )}
      </div>

      {/* Öffentlich / Privat */}
      <div className="mt-5" role="radiogroup" aria-label={tx("Sichtbarkeit der Profilseite")}>
        <ChipRow>
          <Chip selected={visibility === "public"} onClick={() => onVisibility("public")}>
            {tx("Öffentlich")}
          </Chip>
          {track === "business" && (
            <Chip selected={visibility === "business"} onClick={() => onVisibility("business")}>
              {tx("Nur Business")}
            </Chip>
          )}
          <Chip selected={visibility === "stealth"} onClick={() => onVisibility("stealth")}>
            {tx("Privat")}
          </Chip>
        </ChipRow>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          {visibility === "public"
            ? tx("Alle angemeldeten Mitglieder sehen Name, Alter, Text, Hobbys und Beiträge.")
            : visibility === "business"
              ? tx("Business-Mitglieder sehen alles, alle anderen nur Profilbild und Spitzname.")
              : tx("Nur Profilbild und Spitzname sind sichtbar, und nur für Leute, mit denen du in einem Chat bist.")}
        </p>
      </div>

      {/* Profilbild */}
      <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={tx("Dein Profilbild")} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gold/80">{(form.displayName || "?").slice(0, 1).toUpperCase()}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} aria-label={tx("Profilbild auswählen")} />
          <button type="button" disabled={busy === "avatar"} onClick={() => avatarInput.current?.click()} className={pill}>
            {busy === "avatar" ? tx("Lade hoch …") : avatar ? tx("Bild ändern") : tx("Profilbild hinzufügen")}
          </button>
          {avatar && (
            <button type="button" disabled={busy === "avatar"} onClick={removeAvatar} className={pill}>
              {tx("Entfernen")}
            </button>
          )}
        </div>
      </div>

      {/* Angaben */}
      <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
        <div>
          <label className="text-xs font-medium text-zinc-300" htmlFor="pf-nick">
            {tx("Spitzname oder Künstlername")}
          </label>
          <input id="pf-nick" value={form.displayName} maxLength={24} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={`${fieldClass} mt-1.5`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-300" htmlFor="pf-first">
              {tx("Vorname (optional)")}
            </label>
            <input id="pf-first" value={form.firstName} maxLength={24} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={`${fieldClass} mt-1.5`} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-300" htmlFor="pf-last">
              {tx("Nachname (optional)")}
            </label>
            <input id="pf-last" value={form.lastName} maxLength={24} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={`${fieldClass} mt-1.5`} />
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">{tx("Name und Nachname siehst nur du, solange dein Profil privat ist.")}</p>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-medium text-zinc-300" htmlFor="pf-bio">
              {tx("Über mich")}
            </label>
            <span className="text-[11px] text-zinc-500">{form.bio.length}/300</span>
          </div>
          <textarea id="pf-bio" value={form.bio} rows={3} onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 300) })} placeholder={tx("Ein paar Sätze über dich …")} className={`${fieldClass} mt-1.5 resize-none`} />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-300">{tx("Hobbys")}</p>
          <div className="mt-1.5 flex gap-2">
            <input
              value={hobbyDraft}
              maxLength={30}
              onChange={(e) => setHobbyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHobby();
                }
              }}
              placeholder={tx("Hobby eintippen, Enter")}
              aria-label={tx("Hobby hinzufügen")}
              className={fieldClass}
            />
            <button type="button" onClick={addHobby} className={pill}>
              {tx("Hinzufügen")}
            </button>
          </div>
          {form.hobbies.length > 0 && (
            <div className="mt-2">
              <ChipRow>
                {form.hobbies.map((h) => (
                  <Chip key={h} selected removable onClick={() => setForm((f) => ({ ...f, hobbies: f.hobbies.filter((x) => x !== h) }))}>
                    {h}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          )}
        </div>
        <button type="button" disabled={busy === "info"} onClick={saveInfo} className="rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">
          {busy === "info" ? tx("Speichere …") : tx("Speichern")}
        </button>
      </div>

      {/* Beiträge */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-zinc-100">{tx("Beiträge")}</p>
          <span className="text-[11px] text-zinc-500">
            {tx("{n} von {max}", { n: posts.length, max: MAX_POSTS })}
          </span>
        </div>
        {posts.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {posts.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.slides[0]} alt={p.caption ?? "Beitrag"} className="h-full w-full object-cover" />
                {p.slides.length > 1 && <span className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">1/{p.slides.length}</span>}
                <button
                  type="button"
                  disabled={busy === `del-${p.id}`}
                  onClick={() => removePost(p.id)}
                  aria-label={tx("Beitrag löschen")}
                  className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-black/70 py-1 text-[11px] text-white opacity-100 transition-opacity hover:bg-rose/80 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  {tx("Löschen")}
                </button>
              </div>
            ))}
          </div>
        )}

        {posts.length < MAX_POSTS && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-medium text-zinc-300">{tx("Neuer Beitrag (bis zu {max} Bilder zum Wischen)", { max: MAX_SLIDES })}</p>
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {files.map((f, i) => (
                  <div key={f.url} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={`Bild ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(f.url);
                        setFiles((prev) => prev.filter((x) => x !== f));
                      }}
                      aria-label={`Bild ${i + 1} entfernen`}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input ref={postInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pickSlides(e.target.files)} aria-label={tx("Bilder für den Beitrag auswählen")} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={files.length >= MAX_SLIDES} onClick={() => postInput.current?.click()} className={pill}>
                {files.length === 0 ? tx("Bilder auswählen") : tx("Weitere Bilder")}
              </button>
              {files.length > 0 && <span className="text-[11px] text-zinc-500">{tx("{n} von {max}", { n: files.length, max: MAX_SLIDES })}</span>}
            </div>
            {files.length > 0 && (
              <>
                <input value={caption} maxLength={200} onChange={(e) => setCaption(e.target.value)} placeholder={tx("Bildunterschrift (optional)")} aria-label={tx("Bildunterschrift")} className={`${fieldClass} mt-3`} />
                <button type="button" disabled={busy === "post"} onClick={publish} className="mt-3 rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">
                  {busy === "post" ? tx("Veröffentliche …") : tx("Beitrag veröffentlichen")}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {message && (
        <p role="status" className="mt-4 text-xs leading-relaxed text-zinc-300">
          {message}
        </p>
      )}
    </section>
  );
}
