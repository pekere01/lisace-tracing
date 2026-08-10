export type LicenseStatus = "expired" | "critical" | "warning" | "active";

/** "YYYY-MM-DD" formatındaki bir tarihe kaç gün kaldığını hesaplar (main.py'deki kalan_gun_bul). */
export function daysRemaining(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function licenseStatus(days: number | null): LicenseStatus | null {
  if (days === null) return null;
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 60) return "warning";
  return "active";
}

export const STATUS_LABEL: Record<LicenseStatus, string> = {
  expired: "Süresi Doldu",
  critical: "Kritik",
  warning: "Yaklaşıyor",
  active: "Aktif",
};

export const STATUS_BADGE_CLASS: Record<LicenseStatus, string> = {
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

export type RenewalStage = "renewable" | "recapture" | "sunset";

/** ~4 yıl (365*4 + 1 artık gün). Uygulamadaki diğer tarih hesapları da basit gün farkı kullanıyor. */
const RECAPTURE_WINDOW_DAYS = 1461;

/**
 * Bir lisansın yenileme döngüsündeki konumu:
 * - renewable: abonelik hâlâ devam ediyor.
 * - recapture: abonelik bitmiş ama son 4 yıl içinde — yeniden kazanılabilir.
 * - sunset: 4 yıldan uzun süredir bitmiş — aktif fırsat yok.
 */
export function renewalStage(days: number | null): RenewalStage | null {
  if (days === null) return null;
  if (days >= 0) return "renewable";
  if (days > -RECAPTURE_WINDOW_DAYS) return "recapture";
  return "sunset";
}

export const RENEWAL_STAGE_LABEL: Record<RenewalStage, string> = {
  renewable: "Renewable",
  recapture: "Recapture",
  sunset: "Sunset",
};

export const RENEWAL_STAGE_BADGE_CLASS: Record<RenewalStage, string> = {
  renewable: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  recapture: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  sunset: "bg-muted text-muted-foreground border-border",
};
