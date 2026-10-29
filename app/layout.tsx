import type { Metadata, Viewport } from "next";
import { Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import PageTransition from "@/components/PageTransition";
import AdminGate from "@/components/AdminGate";
import LoginGate from "@/components/LoginGate";
import MobileTabBar from "@/components/MobileTabBar";
import ErrorReporter from "@/components/ErrorReporter";

// Tamil-Schrift: wird nur genutzt, wenn die Sprache Tamil gewählt ist (siehe globals.css), damit sie auf allen Geräten gleich aussieht
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-tamil" });

export const metadata: Metadata = {
  title: "DSpora — Finde deine Crew in DACH",
  description:
    "DSpora bringt junge Sri-Lanka-Tamil:innen in der Schweiz, Deutschland und Österreich in kleinen, diskreten 4er-Crews zusammen.",
};

// viewport-fit=cover: Die Seite reicht bis an die Ränder des Handys (keine schwarzen Balken oben und unten)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={tamil.variable}>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <LanguageProvider>
          <PageTransition>{children}</PageTransition>
          <AdminGate />
          <LoginGate />
          <MobileTabBar />
          <ErrorReporter />
        </LanguageProvider>
      </body>
    </html>
  );
}
