// Orte, Hubs und Fahrzeiten. Reine Berechnung ohne Netz: Eine eingebaute Liste großer Städte in Deutschland, Österreich und
// der Schweiz liefert Koordinaten und den Hub. Unbekannte Orte ordnet die KI zu (lib/geoAi.ts), die Prüfung bleibt hier.
// Die Fahrzeit mit dem Auto wird aus der Luftlinie geschätzt (Umwegfaktor und Durchschnittstempo), das genügt für Freundschaften.

export type Place = { name: string; lat: number; lng: number; hub: string };

type Row = [string, number, number];

// [Name, Breitengrad, Längengrad], gruppiert nach Hub
const TABLE: Record<string, Row[]> = {
  nrw: [
    ["Köln", 50.94, 6.96], ["Düsseldorf", 51.23, 6.78], ["Dortmund", 51.51, 7.47], ["Essen", 51.46, 7.01], ["Duisburg", 51.43, 6.76],
    ["Bochum", 51.48, 7.22], ["Wuppertal", 51.26, 7.15], ["Bielefeld", 52.02, 8.53], ["Bonn", 50.73, 7.1], ["Münster", 51.96, 7.63],
    ["Gelsenkirchen", 51.52, 7.1], ["Mönchengladbach", 51.19, 6.44], ["Aachen", 50.78, 6.08], ["Krefeld", 51.34, 6.59],
    ["Oberhausen", 51.47, 6.86], ["Hagen", 51.36, 7.47], ["Hamm", 51.68, 7.82], ["Herne", 51.54, 7.22], ["Leverkusen", 51.03, 6.98],
    ["Solingen", 51.17, 7.08], ["Neuss", 51.2, 6.69], ["Paderborn", 51.72, 8.75], ["Recklinghausen", 51.61, 7.2], ["Bottrop", 51.52, 6.92],
    ["Siegen", 50.87, 8.02], ["Gütersloh", 51.91, 8.38], ["Unna", 51.53, 7.69], ["Soest", 51.57, 8.11], ["Lünen", 51.62, 7.52],
    ["Iserlohn", 51.38, 7.7], ["Witten", 51.44, 7.34], ["Bergisch Gladbach", 50.99, 7.13], ["Remscheid", 51.18, 7.19], ["Moers", 51.45, 6.63],
    ["Ahlen", 51.76, 7.89], ["Lippstadt", 51.67, 8.34], ["Detmold", 51.94, 8.88], ["Minden", 52.29, 8.92], ["Dorsten", 51.66, 6.97],
  ],
  "rhein-main": [
    ["Frankfurt", 50.11, 8.68], ["Wiesbaden", 50.08, 8.24], ["Mainz", 49.99, 8.27], ["Darmstadt", 49.87, 8.65], ["Offenbach", 50.1, 8.76],
    ["Hanau", 50.13, 8.92], ["Rüsselsheim", 49.99, 8.41], ["Bad Homburg", 50.23, 8.62], ["Gießen", 50.58, 8.68], ["Aschaffenburg", 49.98, 9.15],
    ["Kassel", 51.31, 9.48], ["Koblenz", 50.36, 7.59], ["Trier", 49.76, 6.64], ["Kaiserslautern", 49.44, 7.77], ["Ludwigshafen", 49.48, 8.44],
    ["Saarbrücken", 49.24, 6.99], ["Fulda", 50.55, 9.68], ["Marburg", 50.81, 8.77], ["Worms", 49.63, 8.36], ["Bingen", 49.97, 7.9],
  ],
  "baden-wuerttemberg": [
    ["Stuttgart", 48.78, 9.18], ["Karlsruhe", 49.01, 8.4], ["Mannheim", 49.49, 8.47], ["Freiburg", 47.99, 7.85], ["Heidelberg", 49.4, 8.67],
    ["Ulm", 48.4, 9.99], ["Heilbronn", 49.14, 9.22], ["Pforzheim", 48.89, 8.7], ["Reutlingen", 48.49, 9.2], ["Tübingen", 48.52, 9.06],
    ["Konstanz", 47.66, 9.18], ["Esslingen", 48.74, 9.31], ["Ludwigsburg", 48.9, 9.19], ["Baden-Baden", 48.76, 8.24], ["Villingen-Schwenningen", 48.06, 8.46],
    ["Göppingen", 48.7, 9.65], ["Offenburg", 48.47, 7.94], ["Friedrichshafen", 47.65, 9.48], ["Ravensburg", 47.78, 9.61], ["Aalen", 48.84, 10.09],
  ],
  bayern: [
    ["München", 48.14, 11.58], ["Nürnberg", 49.45, 11.08], ["Augsburg", 48.37, 10.9], ["Regensburg", 49.01, 12.1], ["Ingolstadt", 48.76, 11.42],
    ["Würzburg", 49.79, 9.95], ["Fürth", 49.48, 10.99], ["Erlangen", 49.6, 11.0], ["Bamberg", 49.89, 10.89], ["Bayreuth", 49.94, 11.58],
    ["Rosenheim", 47.86, 12.12], ["Passau", 48.57, 13.43], ["Landshut", 48.54, 12.15], ["Kempten", 47.73, 10.31], ["Freising", 48.4, 11.74],
    ["Memmingen", 47.98, 10.18], ["Schweinfurt", 50.05, 10.23], ["Hof", 50.31, 11.92], ["Garmisch-Partenkirchen", 47.49, 11.1], ["Neu-Ulm", 48.39, 10.0],
  ],
  "berlin-ost": [
    ["Berlin", 52.52, 13.4], ["Leipzig", 51.34, 12.37], ["Dresden", 51.05, 13.74], ["Potsdam", 52.4, 13.07], ["Chemnitz", 50.83, 12.92],
    ["Halle", 51.48, 11.97], ["Magdeburg", 52.12, 11.63], ["Erfurt", 50.98, 11.03], ["Cottbus", 51.76, 14.33], ["Jena", 50.93, 11.59],
    ["Frankfurt (Oder)", 52.35, 14.55], ["Gera", 50.88, 12.08], ["Zwickau", 50.72, 12.49], ["Weimar", 50.98, 11.33], ["Brandenburg an der Havel", 52.41, 12.56],
    ["Dessau", 51.84, 12.25], ["Görlitz", 51.15, 14.99], ["Plauen", 50.5, 12.14], ["Eisenach", 50.98, 10.32], ["Neuruppin", 52.93, 12.8],
  ],
  "hamburg-nord": [
    ["Hamburg", 53.55, 9.99], ["Bremen", 53.08, 8.8], ["Hannover", 52.37, 9.74], ["Kiel", 54.32, 10.14], ["Lübeck", 53.87, 10.69],
    ["Braunschweig", 52.27, 10.52], ["Oldenburg", 53.14, 8.21], ["Osnabrück", 52.28, 8.05], ["Göttingen", 51.53, 9.94], ["Wolfsburg", 52.42, 10.79],
    ["Hildesheim", 52.15, 9.95], ["Flensburg", 54.78, 9.44], ["Rostock", 54.09, 12.14], ["Schwerin", 53.63, 11.41], ["Bremerhaven", 53.54, 8.58],
    ["Lüneburg", 53.25, 10.41], ["Salzgitter", 52.15, 10.33], ["Celle", 52.63, 10.08], ["Neumünster", 54.07, 9.98], ["Stralsund", 54.31, 13.09],
    ["Greifswald", 54.09, 13.38], ["Emden", 53.37, 7.21], ["Wilhelmshaven", 53.53, 8.11],
  ],
  schweiz: [
    ["Zürich", 47.38, 8.54], ["Bern", 46.95, 7.45], ["Basel", 47.56, 7.59], ["Genf", 46.2, 6.14], ["Lausanne", 46.52, 6.63],
    ["Luzern", 47.05, 8.31], ["St. Gallen", 47.42, 9.38], ["Winterthur", 47.5, 8.72], ["Lugano", 46.0, 8.95], ["Biel", 47.14, 7.25],
    ["Thun", 46.76, 7.63], ["Aarau", 47.39, 8.05], ["Chur", 46.85, 9.53], ["Schaffhausen", 47.7, 8.63], ["Zug", 47.17, 8.52],
  ],
  oesterreich: [
    ["Wien", 48.21, 16.37], ["Graz", 47.07, 15.44], ["Linz", 48.31, 14.29], ["Salzburg", 47.81, 13.05], ["Innsbruck", 47.27, 11.39],
    ["Klagenfurt", 46.62, 14.31], ["Villach", 46.61, 13.85], ["Wels", 48.16, 14.03], ["St. Pölten", 48.2, 15.63], ["Dornbirn", 47.41, 9.74],
    ["Bregenz", 47.5, 9.75], ["Steyr", 48.04, 14.42], ["Wiener Neustadt", 47.82, 16.24], ["Feldkirch", 47.24, 9.6], ["Krems", 48.41, 15.61],
  ],
};

// Alternative Schreibweisen
const ALIASES: Record<string, string> = {
  koeln: "köln", cologne: "köln", duesseldorf: "düsseldorf", muenchen: "münchen", munich: "münchen", nuernberg: "nürnberg", nurnberg: "nürnberg",
  "frankfurt am main": "frankfurt", "frankfurt a m": "frankfurt", "frankfurt main": "frankfurt", muenster: "münster", zuerich: "zürich", zurich: "zürich",
  geneva: "genf", vienna: "wien", wurzburg: "würzburg", wuerzburg: "würzburg", luebeck: "lübeck", goettingen: "göttingen", saarbruecken: "saarbrücken",
  tuebingen: "tübingen", guetersloh: "gütersloh", osnabrueck: "osnabrück", giessen: "gießen", giesen: "gießen", ruesselsheim: "rüsselsheim",
  "bad homburg vor der hoehe": "bad homburg", "halle saale": "halle", "halle (saale)": "halle", "frankfurt oder": "frankfurt (oder)",
  fuerth: "fürth", "st gallen": "st. gallen", "st poelten": "st. pölten", "sankt gallen": "st. gallen", "st. gallen": "st. gallen",
};

const strip = (text: string) =>
  text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const INDEX = new Map<string, Place>();
for (const hub of Object.keys(TABLE)) {
  for (const [name, lat, lng] of TABLE[hub]) INDEX.set(strip(name), { name, lat, lng, hub });
}

/** Ort aus der eingebauten Liste, anhand des Namens (auch "Köln, Deutschland" oder "koeln"). */
export function findPlace(input: string): Place | null {
  const first = input.split(/[,/(]/)[0] ?? input;
  const key = strip(first);
  if (!key) return null;
  const alias = ALIASES[key] ?? ALIASES[input.trim().toLowerCase()];
  const direct = INDEX.get(key) ?? (alias ? INDEX.get(strip(alias)) : undefined);
  return direct ?? null;
}

// Mittelpunkte der Hubs, für Orte außerhalb der Liste
const HUB_CENTERS: Record<string, { lat: number; lng: number; country: "DE" | "CH" | "AT" }> = {
  nrw: { lat: 51.3, lng: 7.2, country: "DE" },
  "rhein-main": { lat: 50.1, lng: 8.7, country: "DE" },
  "baden-wuerttemberg": { lat: 48.78, lng: 9.18, country: "DE" },
  bayern: { lat: 48.5, lng: 11.6, country: "DE" },
  "berlin-ost": { lat: 52.0, lng: 13.2, country: "DE" },
  "hamburg-nord": { lat: 53.2, lng: 9.7, country: "DE" },
  schweiz: { lat: 47.0, lng: 8.2, country: "CH" },
  oesterreich: { lat: 47.8, lng: 14.5, country: "AT" },
};

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Nächster Hub zu einem Punkt, innerhalb des Landes (CH, AT, DE). Weiter als 150 km vom nächsten Hub: Warteliste. */
export function hubFor(lat: number, lng: number, country: "DE" | "CH" | "AT" | string): string {
  const candidates = Object.entries(HUB_CENTERS).filter(([, h]) => h.country === country);
  if (candidates.length === 0) return "warteliste";
  let best = "warteliste";
  let bestDistance = Infinity;
  for (const [id, h] of candidates) {
    const d = distanceKm(lat, lng, h.lat, h.lng);
    if (d < bestDistance) {
      bestDistance = d;
      best = id;
    }
  }
  return bestDistance <= 250 ? best : "warteliste";
}

/** Liegt der Punkt grob in Deutschland, Österreich oder der Schweiz? */
export function plausibleCoords(lat: number, lng: number): boolean {
  return lat >= 45.7 && lat <= 55.2 && lng >= 5.8 && lng <= 17.2;
}

/**
 * Geschätzte Fahrzeit mit dem Auto in Minuten zwischen zwei Orten: Luftlinie mal Umwegfaktor, Durchschnittstempo je nach Strecke.
 * Mindestens 5 Minuten (auch innerhalb derselben Stadt).
 */
export function travelMinutes(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const straight = distanceKm(aLat, aLng, bLat, bLng);
  const road = straight * 1.3;
  const speed = road <= 20 ? 35 : road <= 100 ? 65 : 85;
  return Math.max(5, Math.round((road / speed) * 60));
}
