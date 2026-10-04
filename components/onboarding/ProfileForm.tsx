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
  type Choice,
  type ProfileData,
} from "@/lib/onboarding";
import { Chip, ChipRow, Field, GoldButton, fieldClass } from "@/components/onboarding/ui";
import { ChoiceChips, CustomEntry, INVALID_ENTRY, flushDraft } from "@/components/onboarding/ChoiceSelect";
import SingleChoice from "@/components/onboarding/SingleChoice";

export type ProfileResult = { profile: ProfileData; photos: Blob[] };

type Photo = { blob: Blob; url: string };

export default function ProfileForm({
  onSubmit,
  track = "community",
}: {
  onSubmit: (result: ProfileResult) => void;
  track?: "community" | "business";
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [languages, setLanguages] = useState<Choice>({ ids: [], custom: [] });
  const [languageDraft, setLanguageDraft] = useState("");
  const [phaseDraft, setPhaseDraft] = useState("");
  const [phase, setPhase] = useState<string | undefined>();
  const [funFact, setFunFact] = useState("");
  const [askMe, setAskMe] = useState("");
  const [visibility, setVisibility] = useState("stealth");
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

  // Gibt eine Fehlermeldung zurück oder null, wenn das Hobby übernommen wurde
  function addHobby(text: string): string | null {
    if (!CUSTOM_PATTERN.test(text)) return INVALID_ENTRY;
    if (hobbies.length >= MAX_HOBBIES) return `Maximal ${MAX_HOBBIES} Hobbys.`;
    if (!hobbies.some((h) => h.toLowerCase() === text.toLowerCase())) {
      setHobbies((h) => [...h, text]);
    }
    return null;
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

    // Noch nicht mit Enter bestätigte Eingaben automatisch übernehmen
    let finalHobbies = hobbies;
    const hobbyText = hobbyDraft.trim();
    if (hobbyText) {
      const known = hobbies.some((h) => h.toLowerCase() === hobbyText.toLowerCase());
      if (!CUSTOM_PATTERN.test(hobbyText)) next.hobby = INVALID_ENTRY;
      else if (!known && hobbies.length >= MAX_HOBBIES) next.hobby = `Maximal ${MAX_HOBBIES} Hobbys.`;
      else if (!known) finalHobbies = [...hobbies, hobbyText];
    }
    const flushed = flushDraft(languages, languageDraft, LANGUAGES);
    if (flushed.error) next.language = flushed.error;
    let finalPhase = phase;
    const phaseText = phaseDraft.trim();
    if (phaseText) {
      if (!CUSTOM_PATTERN.test(phaseText)) next.phase = INVALID_ENTRY;
      else finalPhase = PHASES.find((p) => p.label.toLowerCase() === phaseText.toLowerCase())?.id ?? phaseText;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      profile: {
        displayName: trimmedName,
        age: ageNumber,
        hobbies: finalHobbies,
        languages: flushed.value,
        phase: finalPhase,
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

      <Field label="Hobbys" hint={`${hobbies.length}/${MAX_HOBBIES}`}>
        <CustomEntry
          placeholder="z. B. Bouldern, Fotografie …"
          onAdd={addHobby}
          draft={hobbyDraft}
          onDraftChange={(v) => {
            setHobbyDraft(v);
            setErrors((x) => ({ ...x, hobby: "" }));
          }}
          hint="Mit Enter oder Komma hinzufügen, so kannst du mehrere nacheinander eintragen."
        />
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
        <ChoiceChips
          options={LANGUAGES}
          value={languages}
          onChange={setLanguages}
          customPlaceholder="Andere Sprache hinzufügen"
          draft={languageDraft}
          onDraftChange={(v) => {
            setLanguageDraft(v);
            setErrors((x) => ({ ...x, language: "" }));
          }}
        />
        {errors.language && <p role="alert" className="text-xs text-rose">{errors.language}</p>}
      </Field>

      <Field label="Wo stehst du gerade?">
        <SingleChoice
          options={PHASES}
          value={phase}
          onSelect={(v) => setPhase(v || undefined)}
          customPlaceholder="Etwas anderes? Eigene Angabe"
          draft={phaseDraft}
          onDraftChange={(v) => {
            setPhaseDraft(v);
            setErrors((x) => ({ ...x, phase: "" }));
          }}
        />
        {errors.phase && <p role="alert" className="text-xs text-rose">{errors.phase}</p>}
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
        <div className="space-y-2" role="radiogroup" aria-label="Sichtbarkeit">
          {VISIBILITIES.filter((v) => v.id !== "business" || track === "business").map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={visibility === v.id}
              onClick={() => setVisibility(v.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                visibility === v.id
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-white/10 bg-white/5 text-zinc-200 hover:border-gold/40"
              }`}
            >
              <span
                className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                  visibility === v.id ? "border-gold bg-gold" : "border-white/30"
                }`}
              />
              {v.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="sticky bottom-0 -mx-1 flex justify-end bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent px-1 pt-4 pb-1">
        <GoldButton type="submit">Profil speichern</GoldButton>
      </div>
    </form>
  );
}
