import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSpora — Dating & Freunde für Sri-Lanka-Tamil:innen in DACH",
  description:
    "Die diskrete Plattform für junge Sri-Lanka-Tamil:innen in DACH: Blind-Dating mit KI-Vibe-Check oder neue Freundschaften in lokalen 4er-Crews.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
