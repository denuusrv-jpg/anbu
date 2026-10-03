"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChoiceChips } from "@/components/onboarding/ChoiceSelect";
import SingleChoice from "@/components/onboarding/SingleChoice";
import { LightCvFields, cleanCv } from "@/components/onboarding/BusinessFields";
import { Chip, ChipRow, Field, GoldButton, fieldClass } from "@/components/onboarding/ui";
import { GOALS, ROLE_MAX, SECTORS, choiceLabels, labelOf, type BusinessData } from "@/lib/onboarding";

const safeHref = (link: string) => (/^https?:\/\//i.test(link) ? link : `https://${link}`);

// Business-Profil und Light-CV im Hub ansehen und bearbeiten
export default function BusinessEditor({
  business,
  onSave,
}: {
  business: BusinessData;
  onSave: (next: BusinessData) => Promise<string | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(business);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const result = cleanCv(draft.cv);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (draft.role.trim().length < 2) {
      setError("Bitte gib deine Rolle an.");
      return;
    }
    setSaving(true);
    setError("");
    const message = await onSave({ ...draft, role: draft.role.trim(), cv: result.cv });
    setSaving(false);
    if (message) setError(message);
    else setEditing(false);
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-100">Business &amp; Light-CV</p>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(business);
              setEditing(true);
              setError("");
            }}
            className="text-xs text-zinc-400 transition-colors hover:text-gold"
          >
            Bearbeiten
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 space-y-4"
          >
            <Field label="Branche / Sektor">
              <SingleChoice
                options={SECTORS}
                value={draft.sector}
                onSelect={(v) => v && setDraft({ ...draft, sector: v })}
                customPlaceholder="Andere Branche? Eigene Angabe"
              />
            </Field>
            <Field label="Aktuelle Rolle">
              <input
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value.slice(0, ROLE_MAX) })}
                className={fieldClass}
                placeholder="z. B. Gründerin, Product Manager"
              />
            </Field>
            <Field label="Hauptziel" hint="bis zu 3">
              <ChoiceChips
                options={GOALS}
                value={draft.goals}
                onChange={(goals) => setDraft({ ...draft, goals })}
                customPlaceholder="Ein anderes Ziel?"
                maxTotal={3}
              />
            </Field>
            <LightCvFields
              value={{
                expertise: draft.cv.expertise ?? "",
                achievements: draft.cv.achievements,
                links: draft.cv.links,
              }}
              onChange={(cv) => setDraft({ ...draft, cv })}
            />
            {error && (
              <p role="alert" className="text-xs text-rose">
                {error}
              </p>
            )}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Abbrechen
              </button>
              <GoldButton onClick={save} disabled={saving}>
                {saving ? "Speichere …" : "Speichern"}
              </GoldButton>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="mt-3 space-y-3 text-sm text-zinc-200"
          >
            <p>
              <span className="text-zinc-500">Branche: </span>
              {labelOf(business.sector, SECTORS)}
              <span className="text-zinc-500"> · Rolle: </span>
              {business.role}
            </p>
            <ChipRow>
              {choiceLabels(business.goals, GOALS).map((g) => (
                <Chip key={g} selected onClick={() => undefined}>
                  {g}
                </Chip>
              ))}
            </ChipRow>
            {business.cv.expertise && (
              <p>
                <span className="text-zinc-500">Expertise: </span>
                {business.cv.expertise}
              </p>
            )}
            {business.cv.achievements.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-zinc-300">
                {business.cv.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
            {business.cv.links.length > 0 && (
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                {business.cv.links.map((l) => (
                  <a
                    key={l}
                    href={safeHref(l)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    {l.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                  </a>
                ))}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
