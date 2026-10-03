// Verkleinert ein Profilfoto im Browser und kodiert es neu als JPEG.
// Das spart Platz und entfernt dabei auch versteckte Metadaten (z. B. GPS-Standort aus dem Foto).

const MAX_FILE_BYTES = 12 * 1024 * 1024;

export async function resizeImage(
  file: File,
  maxSize = 900,
): Promise<{ blob: Blob; url: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Bitte wähle ein Bild aus.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Das Bild ist zu groß (max. 12 MB).");

  const source = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Das Bild konnte nicht gelesen werden."));
      el.src = source;
    });

    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Das Bild konnte nicht verarbeitet werden.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Das Bild konnte nicht verarbeitet werden."))),
        "image/jpeg",
        0.82,
      ),
    );
    return { blob, url: URL.createObjectURL(blob) };
  } finally {
    URL.revokeObjectURL(source);
  }
}
