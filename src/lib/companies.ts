import { createClient } from "@/lib/supabase/server";
import { parseSoftwareType } from "@/lib/licenses";
import { daysRemaining, licenseStatus } from "@/lib/dates";

export type CompanyListItem = {
  id: number;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  licenseCount: number;
  hasCriticalLicense: boolean;
  /** En yakın yenileme tarihine kalan gün (negatifse süresi geçmiş). Hiç lisans/tarih yoksa null. */
  nearestRenewalDays: number | null;
  /** Firmadaki lisans ailelerine göre adet dağılımı, ör. { solidworks: 4, solidcam: 2 }. */
  familyCounts: Record<string, number>;
};

export async function getCompanyList(): Promise<CompanyListItem[]> {
  const supabase = await createClient();

  const [{ data: companies }, { data: contacts }, { data: licenses }] =
    await Promise.all([
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("contacts").select("company_id, full_name, phone"),
      supabase
        .from("licenses")
        .select("company_id, software_type, sub_date, trial_date"),
    ]);

  const contactByCompany = new Map(
    (contacts ?? []).map((c) => [c.company_id, c])
  );

  const licenseStatsByCompany = new Map<
    number,
    { count: number; critical: boolean; nearestDays: number | null; familyCounts: Record<string, number> }
  >();
  for (const lic of licenses ?? []) {
    if (lic.company_id === null) continue;
    const stat = licenseStatsByCompany.get(lic.company_id) ?? {
      count: 0,
      critical: false,
      nearestDays: null,
      familyCounts: {},
    };
    stat.count++;
    const { family } = parseSoftwareType(lic.software_type);
    stat.familyCounts[family] = (stat.familyCounts[family] ?? 0) + 1;
    const days = daysRemaining(lic.sub_date ?? lic.trial_date);
    if (days !== null && days <= 30) stat.critical = true;
    if (days !== null && (stat.nearestDays === null || days < stat.nearestDays)) {
      stat.nearestDays = days;
    }
    licenseStatsByCompany.set(lic.company_id, stat);
  }

  return (companies ?? []).map((c) => {
    const contact = contactByCompany.get(c.id);
    const stats = licenseStatsByCompany.get(c.id);
    return {
      id: c.id,
      name: c.name,
      contactName: contact?.full_name ?? null,
      contactPhone: contact?.phone ?? null,
      licenseCount: stats?.count ?? 0,
      hasCriticalLicense: stats?.critical ?? false,
      nearestRenewalDays: stats?.nearestDays ?? null,
      familyCounts: stats?.familyCounts ?? {},
    };
  });
}

export type CompanyDetail = {
  id: number;
  name: string;
  address: string | null;
  lastEditedBy: string | null;
  lastEditDetails: string | null;
  contact: { fullName: string | null; phone: string | null } | null;
  note: { author: string | null; note: string | null } | null;
  licenses: {
    id: number;
    family: string;
    label: string;
    serialNumber: string | null;
    subDate: string | null;
    trialDate: string | null;
    days: number | null;
    status: ReturnType<typeof licenseStatus>;
  }[];
  files: { id: number; fileName: string | null; fileUrl: string | null }[];
  activities: {
    id: number;
    activityType: string | null;
    activityDate: string | null;
    note: string | null;
    author: string | null;
  }[];
};

export async function getCompanyDetail(id: number): Promise<CompanyDetail | null> {
  const supabase = await createClient();

  const [
    { data: company },
    { data: contacts },
    { data: notes },
    { data: licensesRaw },
    { data: files },
    { data: activities },
  ] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).maybeSingle(),
    supabase.from("contacts").select("full_name, phone").eq("company_id", id),
    supabase.from("company_notes").select("author, note").eq("company_id", id),
    supabase.from("licenses").select("*").eq("company_id", id),
    supabase.from("company_files").select("id, file_name, file_url").eq("company_id", id),
    supabase
      .from("company_activities")
      .select("id, activity_type, activity_date, note, author")
      .eq("company_id", id)
      .order("activity_date", { ascending: false }),
  ]);

  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    address: company.address,
    lastEditedBy: company.last_edited_by,
    lastEditDetails: company.last_edit_details,
    contact: contacts?.[0]
      ? { fullName: contacts[0].full_name, phone: contacts[0].phone }
      : null,
    note: notes?.[0] ? { author: notes[0].author, note: notes[0].note } : null,
    licenses: (licensesRaw ?? []).map((l) => {
      const { family, label } = parseSoftwareType(l.software_type);
      const relevantDate = l.sub_date ?? l.trial_date;
      const days = daysRemaining(relevantDate);
      return {
        id: l.id,
        family,
        label,
        serialNumber: l.serial_number,
        subDate: l.sub_date,
        trialDate: l.trial_date,
        days,
        status: licenseStatus(days),
      };
    }),
    files: (files ?? []).map((f) => ({
      id: f.id,
      fileName: f.file_name,
      fileUrl: f.file_url,
    })),
    activities: (activities ?? []).map((a) => ({
      id: a.id,
      activityType: a.activity_type,
      activityDate: a.activity_date,
      note: a.note,
      author: a.author,
    })),
  };
}

export type LicenseExportRow = {
  companyName: string;
  contactName: string | null;
  contactPhone: string | null;
  family: string;
  label: string;
  serialNumber: string | null;
  subDate: string | null;
  trialDate: string | null;
  days: number | null;
  status: ReturnType<typeof licenseStatus>;
};

/** Tüm rapor (Excel export) için firma + lisans verisini düz liste olarak döner. */
export async function getFullExportData(): Promise<LicenseExportRow[]> {
  const supabase = await createClient();

  const [{ data: companies }, { data: contacts }, { data: licensesRaw }] =
    await Promise.all([
      supabase.from("companies").select("id, name"),
      supabase.from("contacts").select("company_id, full_name, phone"),
      supabase
        .from("licenses")
        .select("company_id, software_type, serial_number, sub_date, trial_date"),
    ]);

  const companyById = new Map((companies ?? []).map((c) => [c.id, c]));
  const contactByCompany = new Map((contacts ?? []).map((c) => [c.company_id, c]));

  return (licensesRaw ?? [])
    .filter((l) => l.company_id !== null)
    .map((l) => {
      const company = companyById.get(l.company_id!);
      const contact = contactByCompany.get(l.company_id!);
      const { family, label } = parseSoftwareType(l.software_type);
      const days = daysRemaining(l.sub_date ?? l.trial_date);
      return {
        companyName: company?.name ?? "Bilinmeyen",
        contactName: contact?.full_name ?? null,
        contactPhone: contact?.phone ?? null,
        family,
        label,
        serialNumber: l.serial_number,
        subDate: l.sub_date,
        trialDate: l.trial_date,
        days,
        status: licenseStatus(days),
      };
    })
    .sort((a, b) => a.companyName.localeCompare(b.companyName, "tr"));
}
