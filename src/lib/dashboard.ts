import { createClient } from "@/lib/supabase/server";
import { parseSoftwareType } from "@/lib/licenses";
import { daysRemaining, renewalStage, type RenewalStage } from "@/lib/dates";

export type LicenseAlert = {
  companyId: number;
  companyName: string;
  family: string;
  label: string;
  days: number;
  stage: RenewalStage;
};

export type RenewalAlerts = {
  renewable: LicenseAlert[];
  recapture: LicenseAlert[];
  sunset: LicenseAlert[];
};

export type DashboardData = {
  totalCompanies: number;
  solidworksCount: number;
  solidcamCount: number;
  renewalAlerts: RenewalAlerts;
  solidworksTierDist: { tier: string; count: number }[];
  solidcamModuleDist: { module: string; count: number }[];
};

/** Renewable, sadece yenileme tarihi yaklaşan (30 gün içindeki) lisanslar için alert üretir; aksi halde tüm aktif abonelikler listeyi boğar. */
const RENEWABLE_ALERT_WINDOW_DAYS = 30;

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [{ data: companies }, { data: licensesRaw }] = await Promise.all([
    supabase.from("companies").select("id, name"),
    supabase
      .from("licenses")
      .select("company_id, software_type, sub_date, trial_date, companies(name)"),
  ]);

  const companyList = companies ?? [];
  const licenses = licensesRaw ?? [];

  let solidworksCount = 0;
  let solidcamCount = 0;
  const renewalAlerts: RenewalAlerts = { renewable: [], recapture: [], sunset: [] };
  const tierCounts = new Map<string, number>();
  const moduleCounts = new Map<string, number>();

  for (const lic of licenses) {
    const { family, label } = parseSoftwareType(lic.software_type);

    if (family === "solidworks") {
      solidworksCount++;
      tierCounts.set(label, (tierCounts.get(label) ?? 0) + 1);
    } else if (family === "solidcam") {
      solidcamCount++;
      for (const mod of label.split(",").map((m) => m.trim()).filter(Boolean)) {
        if (mod === "Belirtilmedi") continue;
        moduleCounts.set(mod, (moduleCounts.get(mod) ?? 0) + 1);
      }
    }

    const relevantDate = lic.sub_date ?? lic.trial_date;
    const days = daysRemaining(relevantDate);
    if (days === null || lic.company_id === null) continue;

    const stage = renewalStage(days);
    if (stage === null) continue;
    if (stage === "renewable" && days > RENEWABLE_ALERT_WINDOW_DAYS) continue;

    renewalAlerts[stage].push({
      companyId: lic.company_id,
      companyName: lic.companies?.name?.toUpperCase() ?? "Bilinmeyen",
      family,
      label,
      days,
      stage,
    });
  }

  renewalAlerts.renewable.sort((a, b) => a.days - b.days);
  renewalAlerts.recapture.sort((a, b) => b.days - a.days);
  renewalAlerts.sunset.sort((a, b) => b.days - a.days);

  return {
    totalCompanies: companyList.length,
    solidworksCount,
    solidcamCount,
    renewalAlerts,
    solidworksTierDist: Array.from(tierCounts, ([tier, count]) => ({ tier, count })),
    solidcamModuleDist: Array.from(moduleCounts, ([module, count]) => ({
      module,
      count,
    })).sort((a, b) => b.count - a.count),
  };
}

/**
 * Sidebar rozeti için hafif sayım — tüm dashboard verisini yeniden çekmeden.
 * Sunset lisanslar aksiyon gerektirmediği için sayıma dahil edilmez.
 */
export async function getRenewalAlertsCount(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("licenses").select("sub_date, trial_date");
  return (data ?? []).filter((l) => {
    const days = daysRemaining(l.sub_date ?? l.trial_date);
    if (days === null) return false;
    const stage = renewalStage(days);
    if (stage === "renewable") return days <= RENEWABLE_ALERT_WINDOW_DAYS;
    return stage === "recapture";
  }).length;
}
