"use client";

import { CUSTOM_PATTERN, type Option } from "@/lib/onboarding";
import { Chip, ChipRow } from "@/components/onboarding/ui";
import { CustomEntry, INVALID_ENTRY } from "@/components/onboarding/ChoiceSelect";

// Einfachauswahl mit eigener Eingabe: Chip antippen oder eigenen Text tippen und mit Enter übernehmen.
// onSelect liefert die Id des Chips oder den eigenen Text.
// Optional lässt sich der getippte Text von außen steuern (draft), damit ein umgebendes Formular ihn beim Speichern übernehmen kann.
export default function SingleChoice({
  options,
  value,
  onSelect,
  customPlaceholder,
  extra,
  draft,
  onDraftChange,
}: {
  options: Option[];
  value?: string;
  onSelect: (value: string, label: string) => void;
  customPlaceholder: string;
  extra?: React.ReactNode;
  draft?: string;
  onDraftChange?: (value: string) => void;
}) {
  const isCustom = Boolean(value) && !options.some((o) => o.id === value);

  function addCustom(text: string): string | null {
    if (!CUSTOM_PATTERN.test(text)) return INVALID_ENTRY;
    const known = options.find((o) => o.label.toLowerCase() === text.toLowerCase());
    if (known) onSelect(known.id, known.label);
    else onSelect(text, text);
    return null;
  }

  return (
    <div className="space-y-3">
      <ChipRow>
        {options.map((o) => (
          <Chip key={o.id} selected={value === o.id} onClick={() => onSelect(o.id, o.label)}>
            {o.label}
          </Chip>
        ))}
        {isCustom && (
          <Chip selected onClick={() => onSelect("", "")}>
            {value}
          </Chip>
        )}
        {extra}
      </ChipRow>
      <CustomEntry
        placeholder={customPlaceholder}
        onAdd={addCustom}
        draft={draft}
        onDraftChange={onDraftChange}
      />
    </div>
  );
}
