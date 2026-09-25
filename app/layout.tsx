import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSpora — Finde deine Crew in DACH",
  description:
    "DSpora bringt junge Sri-Lanka-Tamil:innen in der Schweiz, Deutschland und Österreich in kleinen, diskreten 4er-Crews zusammen.",
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
