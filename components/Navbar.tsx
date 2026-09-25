import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-center gap-8 text-sm font-medium text-zinc-300">
      <a href="#funktionen" className="transition hover:text-white">
        Funktionen
      </a>
      <Link href="/mission" className="transition hover:text-white">
        Mission
      </Link>
      <Link href="/kontakt" className="transition hover:text-white">
        Kontakt
      </Link>
    </nav>
  );
}
