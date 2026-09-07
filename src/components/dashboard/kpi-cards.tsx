const ITEMS = [
  { key: "total", label: "Toplam Firma" },
  { key: "sw", label: "SolidWorks Sayısı" },
  { key: "cam", label: "SolidCAM Sayısı" },
  { key: "alerts", label: "Yenileme Gerekli", crit: true },
] as const;

export function KpiCards({
  totalCompanies,
  solidworksCount,
  solidcamCount,
  criticalCount,
}: {
  totalCompanies: number;
  solidworksCount: number;
  solidcamCount: number;
  criticalCount: number;
}) {
  const values: Record<(typeof ITEMS)[number]["key"], number> = {
    total: totalCompanies,
    sw: solidworksCount,
    cam: solidcamCount,
    alerts: criticalCount,
  };

  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-card">
      {ITEMS.map((item, i) => (
        <div
          key={item.key}
          className={`flex-1 px-5 py-4 ${i > 0 ? "border-l border-dashed border-kraft-shadow/60" : ""}`}
        >
          <div
            className={`font-mono text-[28px] leading-none font-bold tabular-nums ${"crit" in item && values[item.key] > 0 ? "text-crit" : "text-ink"}`}
          >
            {values[item.key]}
          </div>
          <div className="mt-1.5 text-[11px] tracking-wide text-ink-soft uppercase">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
