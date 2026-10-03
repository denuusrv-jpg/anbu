"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, BoltIcon } from "@/components/Icons";

// Entwicklungs-Abkürzung zum Onboarding/Chatbot. Zum Ausblenden in Vercel die
// Umgebungsvariable NEXT_PUBLIC_SHOW_TEST_BUTTON auf "false" setzen.
const enabled = process.env.NEXT_PUBLIC_SHOW_TEST_BUTTON !== "false";

export default function TestButton() {
  const pathname = usePathname();
  if (!enabled || pathname.startsWith("/onboarding")) return null;

  return (
    <Link
      href="/onboarding"
      className="cta-premium group fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-xs font-medium tracking-wide text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-[border-color,color,box-shadow] duration-500 [--sheen-alpha:0.16] hover:border-gold/50 hover:text-gold hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.8),0_0_28px_-10px_rgba(242,166,90,0.45)] sm:right-6 sm:bottom-6"
    >
      <BoltIcon className="h-3.5 w-3.5 text-gold" />
      Zum Chatbot-Test
      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}
