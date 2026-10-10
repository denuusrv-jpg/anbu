// Bilder im Browser verkleinern und als JPEG ausgeben (Profilbild: quadratisch zugeschnitten, Beiträge: lange Kante höchstens max).
export async function toJpeg(file: File, opts: { square?: boolean; max: number; quality?: number }): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (opts.square) {
    const side = Math.min(sw, sh);
    sx = Math.floor((sw - side) / 2);
    sy = Math.floor((sh - side) / 2);
    sw = side;
    sh = side;
  }
  const scale = Math.min(1, opts.max / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Bild konnte nicht umgewandelt werden"))), "image/jpeg", opts.quality ?? 0.85);
  });
}
