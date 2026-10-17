import type { Viewport } from "next";
import HomeClient from "@/components/HomeClient";

// Die Statusleiste des Handys übernimmt auf der Startseite die Farbe des Hero-Bereichs (statt schwarz)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#86195a",
};

export default function Home() {
  return <HomeClient />;
}
