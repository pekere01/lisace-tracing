const TR_ASCII_MAP: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

/** Türkçe karakterleri ASCII'ye çevirir ve storage için güvenli, benzersiz bir dosya adı üretir. */
export function sanitizeFileName(originalName: string): string {
  const ascii = originalName.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_ASCII_MAP[ch] ?? ch);
  const dotIndex = ascii.lastIndexOf(".");
  const base = dotIndex === -1 ? ascii : ascii.slice(0, dotIndex);
  const ext = dotIndex === -1 ? "" : ascii.slice(dotIndex);

  const safeBase =
    base
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .slice(0, 80) || "dosya";

  return `${Date.now()}-${safeBase}${ext}`;
}

/** Public bucket URL'inden storage yolunu çıkarır (silme işlemi için). */
export function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const markers = [`/object/public/${encodeURIComponent(bucket)}/`, `/object/public/${bucket}/`];
  for (const marker of markers) {
    const idx = url.indexOf(marker);
    if (idx !== -1) return decodeURIComponent(url.slice(idx + marker.length));
  }
  return null;
}
