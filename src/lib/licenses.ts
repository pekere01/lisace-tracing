export type LicenseFamily =
  | "solidworks"
  | "solidcam"
  | "solidcam_deneme"
  | "cimatron"
  | string;

export type ParsedLicense = {
  family: LicenseFamily;
  label: string;
};

/**
 * Eski Streamlit panelinden devralınan encoding: "solidworks: Standard",
 * "solidcam: 2.5D Frezeleme, Tornalama", "cimatron: NC Solution". Bu encoding
 * korunuyor ki Excel'den aktarılan ~674 lisans kaydı ve gelecekteki kayıtlar
 * tek bir formatta kalsın.
 */
export function parseSoftwareType(raw: string): ParsedLicense {
  const idx = raw.indexOf(":");
  if (idx === -1) return { family: raw.trim(), label: "" };
  return {
    family: raw.slice(0, idx).trim(),
    label: raw.slice(idx + 1).trim(),
  };
}

export function formatSoftwareType(family: string, label: string): string {
  return `${family}: ${label}`;
}

export const FAMILY_DISPLAY_NAME: Record<string, string> = {
  solidworks: "SolidWorks",
  solidcam: "SolidCAM",
  solidcam_deneme: "SolidCAM Deneme",
  cimatron: "Cimatron",
};

export const SOLIDWORKS_TIERS = ["Standard", "Professional", "Premium"] as const;

export const SOLIDCAM_MODULES = [
  "2.5D Frezeleme",
  "3D HSS (Yüzey İşleme)",
  "3D HSM/HSR",
  "iMachining 2D",
  "iMachining 3D",
  "Simültane 4/5 Eksen",
  "Tornalama",
  "Gelişmiş Mill-Turn",
  "Kayar Otomat (Swiss-Type)",
  "Solid Probe",
] as const;

