"use client";

import { CUSTOM_PATTERN, type Option } from "@/lib/onboarding";
import { Chip, ChipRow } from "@/components/onboarding/ui";
import { CustomEntry } from "@/components/onboarding/ChoiceSelect";

// Einfachauswahl mit eigener Eingabe: Chip antippen oder eigenen Text eintragen.
// onSelect liefert die Id des Chips oder den eigenen Text.
export default function SingleChoice({
  options,
  value,
  onSelect,
  customPlaceholder,
  extra,
}: {
  options: Option[];
  value?: string;
  onSelect: (value: string, label: string) => void;
  customPlaceholder: string;
  extra?: React.ReactNode;
}) {
  const isCustom = value !== undefined && !options.some((o) => o.id === value);

  function addCustom(text: string): string | null {
    if (!CUSTOM_PATTERN.test(text)) return "2 bis 30 Zeichen, nur Buchstaben, Zahlen und einfache Zeichen.";
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
      <CustomEntry placeholder={customPlaceholder} onAdd={addCustom} />
    </div>
  );
}
