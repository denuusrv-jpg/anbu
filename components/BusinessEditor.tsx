"use client";

import { useTx } from "@/lib/LanguageContext";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChoiceChips, INVALID_ENTRY, flushDraft } from "@/components/onboarding/ChoiceSelect";
import SingleChoice from "@/components/onboarding/SingleChoice";
import { LightCvFields, cleanCv } from "@/components/onboarding/BusinessFields";
import { Chip, ChipRow, Field, GoldButton, fieldClass } from "@/components/onboarding/ui";
import { CUSTOM_PATTERN, GOALS, ROLE_MAX, SECTORS, choiceLabels, labelOf, type BusinessData } from "@/lib/onboarding";

const safeHref = (link: string) => (/^https?:\/\//i.test(link) ? link : `https://${link}`);

// Business-Profil und Light-CV im Hub ansehen und bearbeiten
export default function BusinessEditor({
  business,
  onSave,
  startEditing = false,
  onCancel,
  title = "Business & Light-CV",
}: {
  business: BusinessData;
  onSave: (next: BusinessData) => Promise<string | null>;
  startEditing?: boolean;
  onCancel?: () => void;
  title?: string;
}) {
  const tx = useTx();
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(business);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [sectorDraft, setSectorDraft] = useState("");

  async function save() {
    const result = cleanCv(draft.cv);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (draft.role.trim().length < 2) {
      setError(tx("Bitte gib deine Rolle an."));
      return;
    }
    // Noch nicht mit Enter bestätigte Eingaben automatisch übernehmen
    const goals = flushDraft(draft.goals, goalDraft, GOALS, 3);
    if (goals.error) {
      setError(goals.error);
      return;
    }
    let sector = draft.sector;
    const sectorText = sectorDraft.trim();
    if (sectorText) {
      if (!CUSTOM_PATTERN.test(sectorText)) {
        setError(INVALID_ENTRY);
        return;
      }
      sector = SECTORS.find((o) => o.label.toLowerCase() === sectorText.toLowerCase())?.id ?? sectorText;
    }
    if (!sector) {
      setError(tx("Bitte wähle eine Branche."));
      return;
    }
    if (goals.value.ids.length + goals.value.custom.length === 0) {
      setError(tx("Bitte wähle mindestens ein Ziel."));
      return;
    }
    setSaving(true);
    setError("");
    const message = await onSave({ ...draft, sector, goals: goals.value, role: draft.role.trim(), cv: result.cv });
    setSaving(false);
    if (message) setError(message);
    else setEditing(false);
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-100">{title}</p>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(business);
              setGoalDraft("");
              setSectorDraft("");
              setEditing(true);
              setError("");
            }}
            className="text-xs text-zinc-400 transition-colors hover:text-gold"
          >
            {tx("Bearbeiten")}
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
                value={draft.sector || undefined}
                onSelect={(v) => v && setDraft({ ...draft, sector: v })}
                draft={sectorDraft}
                onDraftChange={setSectorDraft}
                customPlaceholder={tx("Andere Branche? Eigene Angabe")}
              />
            </Field>
            <Field label="Aktuelle Rolle">
              <input
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value.slice(0, ROLE_MAX) })}
                className={fieldClass}
                placeholder={tx("z. B. Gründerin, Product Manager")}
              />
            </Field>
            <Field label="Hauptziel" hint={tx("bis zu 3")}>
              <ChoiceChips
                options={GOALS}
                value={draft.goals}
                onChange={(goals) => setDraft({ ...draft, goals })}
                customPlaceholder={tx("Ein anderes Ziel?")}
                maxTotal={3}
                draft={goalDraft}
                onDraftChange={setGoalDraft}
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
                onClick={() => {
                  setEditing(false);
                  onCancel?.();
                }}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {tx("Abbrechen")}
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
              <span className="text-zinc-500">{tx("Branche:")} </span>
              {labelOf(business.sector, SECTORS)}
              <span className="text-zinc-500"> {tx("· Rolle:")} </span>
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
                <span className="text-zinc-500">{tx("Expertise:")} </span>
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
