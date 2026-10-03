"use client";

import { useState } from "react";
import {
  ACHIEVEMENT_MAX,
  EXPERTISE_MAX,
  MAX_ACHIEVEMENTS,
  MAX_LINKS,
  type LightCv,
} from "@/lib/onboarding";
import { Field, GoldButton, fieldClass } from "@/components/onboarding/ui";

export const EMPTY_CV: LightCv = { expertise: "", achievements: [], links: [] };

const linkLooksValid = (value: string) =>
  /^(https?:\/\/)?[^\s/$.?#][^\s]*\.[^\s]{2,}$/i.test(value.trim());

// Felder des Light-CV: Expertise, Top-3-Erfolge, optionale Links (Chat und Hub teilen sie)
export function LightCvFields({
  value,
  onChange,
}: {
  value: LightCv;
  onChange: (next: LightCv) => void;
}) {
  const achievement = (i: number) => value.achievements[i] ?? "";
  const link = (i: number) => value.links[i] ?? "";

  function setAt(list: string[], index: number, text: string, count: number) {
    const next = Array.from({ length: count }, (_, i) => list[i] ?? "");
    next[index] = text;
    return next;
  }

  return (
    <div className="space-y-4">
      <Field label="Expertise" hint={`${(value.expertise ?? "").length}/${EXPERTISE_MAX}`}>
        <input
          value={value.expertise ?? ""}
          onChange={(e) => onChange({ ...value, expertise: e.target.value.slice(0, EXPERTISE_MAX) })}
          placeholder="Worin bist du richtig gut? z. B. Produktstrategie, Fullstack, Vertrieb"
          className={fieldClass}
        />
      </Field>

      <Field label="Deine Top-3-Erfolge" hint="kurz, optional">
        <div className="space-y-2">
          {Array.from({ length: MAX_ACHIEVEMENTS }, (_, i) => (
            <input
              key={i}
              value={achievement(i)}
              onChange={(e) =>
                onChange({
                  ...value,
                  achievements: setAt(value.achievements, i, e.target.value.slice(0, ACHIEVEMENT_MAX), MAX_ACHIEVEMENTS),
                })
              }
              placeholder={
                ["Erfolg oder Meilenstein 1", "Erfolg oder Meilenstein 2", "Erfolg oder Meilenstein 3"][i]
              }
              aria-label={`Erfolg ${i + 1}`}
              className={fieldClass}
            />
          ))}
        </div>
      </Field>

      <Field label="Links" hint="Portfolio, GitHub, Website, optional">
        <div className="space-y-2">
          {Array.from({ length: MAX_LINKS }, (_, i) => (
            <input
              key={i}
              value={link(i)}
              onChange={(e) =>
                onChange({ ...value, links: setAt(value.links, i, e.target.value.slice(0, 200), MAX_LINKS) })
              }
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={["Link einfügen (z. B. LinkedIn)", "Weiterer Link", "Weiterer Link"][i]}
              aria-label={`Link ${i + 1}`}
              className={fieldClass}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

/** Bereinigt die Eingaben (leere Zeilen weg) und prüft die Links. Gibt null + Fehlertext zurück. */
export function cleanCv(cv: LightCv): { cv: LightCv; error?: string } {
  const achievements = cv.achievements.map((a) => a.trim()).filter(Boolean);
  const links = cv.links.map((l) => l.trim()).filter(Boolean);
  if (links.some((l) => !linkLooksValid(l))) {
    return { cv, error: "Mindestens ein Link sieht nicht richtig aus (z. B. github.com/name)." };
  }
  return { cv: { expertise: cv.expertise?.trim() || undefined, achievements, links } };
}

// Light-CV als Schritt im Chat
export function LightCvForm({ onSubmit }: { onSubmit: (cv: LightCv) => void }) {
  const [cv, setCv] = useState<LightCv>(EMPTY_CV);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const result = cleanCv(cv);
        if (result.error) {
          setError(result.error);
          return;
        }
        onSubmit(result.cv);
      }}
      className="space-y-4"
    >
      <LightCvFields
        value={cv}
        onChange={(next) => {
          setCv(next);
          setError("");
        }}
      />
      {error && (
        <p role="alert" className="text-xs text-rose">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <GoldButton type="submit">Weiter</GoldButton>
      </div>
    </form>
  );
}
