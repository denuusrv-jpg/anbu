// Profilfotos eines Gastes bleiben bis zur Anmeldung im Browser (localStorage, bereits verkleinert).
// Nach dem Klick auf den Link werden sie hochgeladen. Öffnet jemand den Link auf einem anderen
// Gerät, sind die Fotos dort nicht vorhanden - das Profil selbst kommt trotzdem an.

const KEY = "dspora-draft-photos";

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function stashPhotos(blobs: Blob[]): Promise<void> {
  try {
    if (blobs.length === 0) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(await Promise.all(blobs.map(toDataUrl))));
  } catch {
    // Speicher voll oder nicht verfügbar: Fotos entfallen, der Rest funktioniert weiter
  }
}

export async function takePhotos(): Promise<Blob[]> {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as string[];
    return await Promise.all(list.map((url) => fetch(url).then((r) => r.blob())));
  } catch {
    return [];
  }
}
