import FlowingWaveBackground from "@/components/FlowingWaveBackground";

// Wird sofort gezeigt, während das Profil geladen wird (statt einer leeren Seite)
export default function Loading() {
  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center bg-zinc-950 px-5">
      <FlowingWaveBackground pulses={false} fixed />
      <span role="status" aria-label="Lädt" className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-gold" />
    </main>
  );
}
