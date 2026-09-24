import { ReactNode } from "react";
import { ArrowRightIcon } from "./Icons";

type ModeCardProps = {
  icon: ReactNode;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  accent: "rose" | "teal";
};

const accentStyles = {
  rose: {
    ring: "hover:ring-rose/40",
    iconWrap: "bg-rose/10 text-rose",
    badge: "bg-rose/10 text-rose",
    button: "bg-rose text-zinc-950 hover:bg-rose/90",
  },
  teal: {
    ring: "hover:ring-teal/40",
    iconWrap: "bg-teal/10 text-teal",
    badge: "bg-teal/10 text-teal",
    button: "bg-teal text-zinc-950 hover:bg-teal/90",
  },
};

export default function ModeCard({
  icon,
  title,
  tagline,
  description,
  bullets,
  ctaLabel,
  accent,
}: ModeCardProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={`group flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 ring-1 ring-transparent transition ${styles.ring}`}
    >
      <div
        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${styles.iconWrap}`}
      >
        {icon}
      </div>

      <span
        className={`mt-5 inline-block w-fit rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
      >
        {tagline}
      </span>

      <h3 className="mt-3 text-xl font-semibold text-zinc-50 sm:text-2xl">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {description}
      </p>

      <ul className="mt-5 space-y-2 text-sm text-zinc-300">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${styles.button}`}
      >
        {ctaLabel}
        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
