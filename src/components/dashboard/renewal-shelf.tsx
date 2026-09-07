import Link from "next/link";
import { cn } from "@/lib/utils";
import { FAMILY_DISPLAY_NAME } from "@/lib/licenses";
import type { CompanyListItem } from "@/lib/companies";

type Bucket = "crit" | "warn" | "ok";

const SHELF_META: Record<Bucket, { title: string; band: string }> = {
  crit: { title: "Kritik — 30 gün içinde / geçmiş", band: "bg-crit" },
  warn: { title: "Yakında — 31–60 gün", band: "bg-warn" },
  ok: { title: "Sağlıklı — 60+ gün", band: "bg-ok" },
};

function bucketOf(days: number | null): Bucket | null {
  if (days === null) return null;
  if (days <= 30) return "crit";
  if (days <= 60) return "warn";
  return "ok";
}

function Tag({ company, bucket }: { company: CompanyListItem; bucket: Bucket }) {
  const days = company.nearestRenewalDays;
  const dayLabel =
    days === null ? "—" : days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün kaldı`;
  const families = Object.keys(company.familyCounts)
    .map((f) => FAMILY_DISPLAY_NAME[f] ?? f)
    .join(", ");

  return (
    <Link
      href={`/firmalar/${company.id}`}
      className="flex w-[210px] shrink-0 flex-col rounded-md border border-border bg-card px-3.5 py-3.5 shadow-sm transition-transform hover:-translate-y-1"
    >
      <div className="min-h-9 text-[14px] leading-tight font-bold text-ink">
        {company.name.toUpperCase()}
      </div>
      <div className="mt-1.5 truncate text-xs text-ink-soft">{families || "—"}</div>
      <div className={cn("my-3 h-1.5 rounded", SHELF_META[bucket].band)} />
      <div className="flex items-baseline justify-between border-t border-dashed border-kraft-shadow/50 pt-2 font-mono text-[11px] text-ink-soft">
        <span>{company.contactName ?? "—"}</span>
        <span className="font-bold text-ink">{dayLabel}</span>
      </div>
    </Link>
  );
}

function Shelf({
  bucket,
  companies,
  cap,
}: {
  bucket: Bucket;
  companies: CompanyListItem[];
  cap?: number;
}) {
  const shown = cap ? companies.slice(0, cap) : companies;
  const meta = SHELF_META[bucket];

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2.5 border-b-2 border-ink pb-2.5">
        <h2 className="text-sm font-bold tracking-wide uppercase">{meta.title}</h2>
        <span className="font-mono text-[13px] text-ink-soft">{companies.length} firma</span>
      </div>
      {shown.length === 0 ? (
        <p className="pb-6 text-sm text-muted-foreground">Bu grupta firma yok.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {shown.map((c) => (
            <Tag key={c.id} company={c} bucket={bucket} />
          ))}
          {cap && companies.length > cap && (
            <Link
              href="/firmalar"
              className="flex w-[140px] shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-kraft-shadow text-center text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              +{companies.length - cap} firma daha
              <span className="text-ink">Tümünü gör →</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function RenewalShelf({ companies }: { companies: CompanyListItem[] }) {
  const buckets: Record<Bucket, CompanyListItem[]> = { crit: [], warn: [], ok: [] };
  for (const c of companies) {
    const b = bucketOf(c.nearestRenewalDays);
    if (b) buckets[b].push(c);
  }
  buckets.crit.sort((a, b) => (a.nearestRenewalDays ?? 0) - (b.nearestRenewalDays ?? 0));
  buckets.warn.sort((a, b) => (a.nearestRenewalDays ?? 0) - (b.nearestRenewalDays ?? 0));
  buckets.ok.sort((a, b) => (a.nearestRenewalDays ?? 0) - (b.nearestRenewalDays ?? 0));

  return (
    <div className="flex flex-col gap-8">
      <Shelf bucket="crit" companies={buckets.crit} />
      <Shelf bucket="warn" companies={buckets.warn} />
      <Shelf bucket="ok" companies={buckets.ok} cap={12} />
    </div>
  );
}
