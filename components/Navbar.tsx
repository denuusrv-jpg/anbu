import { Target, ListChecks, Mail } from "lucide-react";
import { FloatingDock } from "@/components/ui/floating-dock";

const dockItems = [
  {
    title: "Mission",
    icon: <Target className="h-full w-full text-zinc-300" />,
    href: "#mission",
  },
  {
    title: "Warteliste",
    icon: <ListChecks className="h-full w-full text-zinc-300" />,
    href: "#warteliste",
  },
  {
    title: "Kontakt",
    icon: <Mail className="h-full w-full text-zinc-300" />,
    href: "#kontakt",
  },
];

export default function Navbar() {
  return (
    <header className="sticky top-4 z-50 flex items-center justify-between gap-4">
      <a href="#" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-zinc-950">
          D
        </span>
        <span className="text-base font-semibold tracking-tight text-zinc-50">
          DSpora
        </span>
      </a>

      <FloatingDock
        items={dockItems}
        desktopClassName="!bg-zinc-900/70 border border-zinc-800 backdrop-blur-md shadow-lg shadow-black/30"
        mobileClassName=""
      />
    </header>
  );
}
