"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "@/components/Icons";
import { resizeImage } from "@/lib/imageResize";
import {
  CUSTOM_PATTERN,
  LANGUAGES,
  MAX_AGE,
  MAX_HOBBIES,
  MAX_PHOTOS,
  MIN_AGE,
  NAME_PATTERN,
  PHASES,
  VISIBILITIES,
  type ProfileData,
} from "@/lib/onboarding";
import { Chip, ChipRow, Field, GoldButton, fieldClass } from "@/components/onboarding/ui";

export type ProfileResult = { profile: ProfileData; photos: Blob[] };

type Photo = { blob: Blob; url: string };

export default function ProfileForm({
  onSubmit,
}: {
  onSubmit: (result: ProfileResult) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [phase, setPhase] = useState<string | undefined>();
  const [funFact, setFunFact] = useState("");
  const [askMe, setAskMe] = useState("");
  const [visibility, setVisibility] = useState("matches");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  // Vorschau-URLs freigeben, wenn das Formular verschwindet
  useEffect(
    () => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  );

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotoError("");
    for (const file of Array.from(files)) {
      if (photosRef.current.length >= MAX_PHOTOS) break;
      try {
        const photo = await resizeImage(file);
        setPhotos((current) =>
          current.length >= MAX_PHOTOS ? (URL.revokeObjectURL(photo.url), current) : [...current, photo],
        );
      } catch (error) {
        setPhotoError(error instanceof Error ? error.message : "Das Bild konnte nicht geladen werden.");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  }

  function addHobby() {
    const text = hobbyDraft.trim();
    if (!text) return;
    if (!CUSTOM_PATTERN.test(text)) {
      setErrors((e) => ({ ...e, hobby: "2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen." }));
      return;
    }
    if (hobbies.length >= MAX_HOBBIES) {
      setErrors((e) => ({ ...e, hobby: `Maximal ${MAX_HOBBIES} Hobbys.` }));
      return;
    }
    if (!hobbies.some((h) => h.toLowerCase() === text.toLowerCase())) {
      setHobbies((h) => [...h, text]);
    }
    setHobbyDraft("");
    setErrors((e) => ({ ...e, hobby: "" }));
  }

  function toggleLanguage(id: string) {
    setLanguages((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!NAME_PATTERN.test(trimmedName)) {
      next.name = "2 bis 24 Zeichen: Buchstaben, Zahlen, Leerzeichen, _ . -";
    }
    let ageNumber: number | undefined;
    if (age.trim()) {
      ageNumber = Number(age);
      if (!Number.isInteger(ageNumber) || ageNumber < MIN_AGE || ageNumber > MAX_AGE) {
        next.age = `Bitte ${MIN_AGE} bis ${MAX_AGE}.`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      profile: {
        displayName: trimmedName,
        age: ageNumber,
        bio: bio.trim() || undefined,
        hobbies,
        languages,
        phase,
        funFact: funFact.trim() || undefined,
        askMeAbout: askMe.trim() || undefined,
        visibility,
        photoCount: photos.length,
      },
      photos: photos.map((p) => p.blob),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Fotos */}
      <Field label="Fotos" hint={`bis zu ${MAX_PHOTOS}, optional`}>
        <div className="flex gap-2.5">
          {photos.map((photo, index) => (
            <div key={photo.url} className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                aria-label={`Foto ${index + 1} entfernen`}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Foto hinzufügen"
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-zinc-400 transition-colors hover:border-gold/60 hover:text-gold"
            >
              <CameraIcon />
              <span className="text-[10px]">Hinzufügen</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => addPhotos(e.target.files)}
          />
        </div>
        {photoError && (
          <p role="alert" className="text-xs text-rose">
            {photoError}
          </p>
        )}
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Fotos werden auf deinem Gerät verkleinert, versteckte Daten wie der Standort werden entfernt.
        </p>
      </Field>

      <div className="grid grid-cols-[1fr_88px] gap-3">
        <Field label="Anzeigename">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((x) => ({ ...x, name: "" }));
            }}
            placeholder="Wie sollen dich andere nennen?"
            maxLength={24}
            className={fieldClass}
            aria-invalid={errors.name ? true : undefined}
          />
          {errors.name && <p role="alert" className="text-xs text-rose">{errors.name}</p>}
        </Field>
        <Field label="Alter">
          <input
            value={age}
            onChange={(e) => {
              setAge(e.target.value.replace(/\D/g, "").slice(0, 2));
              setErrors((x) => ({ ...x, age: "" }));
            }}
            inputMode="numeric"
            placeholder="optional"
            className={fieldClass}
            aria-invalid={errors.age ? true : undefined}
          />
          {errors.age && <p role="alert" className="text-xs text-rose">{errors.age}</p>}
        </Field>
      </div>

      <Field label="Über mich" hint={`${bio.length}/280`}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="Ein paar Sätze über dich: Was macht dich aus?"
          className={`${fieldClass} resize-none`}
        />
      </Field>

      <Field label="Hobbys" hint={`${hobbies.length}/${MAX_HOBBIES}`}>
        <div className="flex gap-2">
          <input
            value={hobbyDraft}
            onChange={(e) => {
              setHobbyDraft(e.target.value);
              setErrors((x) => ({ ...x, hobby: "" }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHobby();
              }
            }}
            placeholder="z. B. Bouldern, Fotografie …"
            maxLength={30}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={addHobby}
            disabled={!hobbyDraft.trim()}
            className="shrink-0 rounded-xl bg-white/10 px-3.5 text-sm text-zinc-200 transition hover:bg-gold hover:text-zinc-950 disabled:opacity-40"
          >
            Hinzufügen
          </button>
        </div>
        {errors.hobby && <p role="alert" className="text-xs text-rose">{errors.hobby}</p>}
        {hobbies.length > 0 && (
          <ChipRow>
            {hobbies.map((h) => (
              <Chip key={h} selected removable onClick={() => setHobbies((l) => l.filter((x) => x !== h))}>
                {h}
              </Chip>
            ))}
          </ChipRow>
        )}
      </Field>

      <Field label="Sprachen, die du gern sprichst">
        <ChipRow>
          {LANGUAGES.map((l) => (
            <Chip key={l.id} selected={languages.includes(l.id)} onClick={() => toggleLanguage(l.id)}>
              {l.label}
            </Chip>
          ))}
        </ChipRow>
      </Field>

      <Field label="Wo stehst du gerade?">
        <ChipRow>
          {PHASES.map((p) => (
            <Chip key={p.id} selected={phase === p.id} onClick={() => setPhase(phase === p.id ? undefined : p.id)}>
              {p.label}
            </Chip>
          ))}
        </ChipRow>
      </Field>

      <Field label="Fun Fact über dich" hint={`${funFact.length}/100`}>
        <input
          value={funFact}
          onChange={(e) => setFunFact(e.target.value.slice(0, 100))}
          placeholder="Etwas, das man nicht sofort erwartet"
          className={fieldClass}
        />
      </Field>

      <Field label="Frag mich nach …" hint={`${askMe.length}/60`}>
        <input
          value={askMe}
          onChange={(e) => setAskMe(e.target.value.slice(0, 60))}
          placeholder="Dein Lieblings-Gesprächsstarter"
          className={fieldClass}
        />
      </Field>

      <Field label="Wer darf dein Profil sehen?">
        <ChipRow>
          {VISIBILITIES.map((v) => (
            <Chip key={v.id} selected={visibility === v.id} onClick={() => setVisibility(v.id)}>
              {v.label}
            </Chip>
          ))}
        </ChipRow>
      </Field>

      <div className="flex justify-end pt-1">
        <GoldButton type="submit">Profil speichern</GoldButton>
      </div>
    </form>
  );
}
