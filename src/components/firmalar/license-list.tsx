import { Badge } from "@/components/ui/badge";
import { FAMILY_DISPLAY_NAME } from "@/lib/licenses";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CompanyDetail } from "@/lib/companies";

function StatusBadge({
  status,
  days,
}: {
  status: CompanyDetail["licenses"][number]["status"];
  days: number | null;
}) {
  if (!status || days === null) return null;
  const daysText = days < 0 ? `${Math.abs(days)} gün geçti` : `${days} gün`;
  return (
    <Badge variant="outline" className={cn("border", STATUS_BADGE_CLASS[status])}>
      {STATUS_LABEL[status]} · {daysText}
    </Badge>
  );
}

export function LicenseList({ licenses }: { licenses: CompanyDetail["licenses"] }) {
  if (licenses.length === 0) {
    return <p className="text-sm text-muted-foreground">Lisans kaydı yok.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {licenses.map((l) => (
        <div
          key={l.id}
          className="flex flex-col gap-1.5 rounded-md border border-border/60 px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {FAMILY_DISPLAY_NAME[l.family] ?? l.family.toUpperCase()}
              {l.label && (
                <span className="font-normal text-muted-foreground"> · {l.label}</span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {l.serialNumber && <span>No: {l.serialNumber}</span>}
            {l.subDate && <span>Bitiş: {l.subDate}</span>}
            {l.trialDate && !l.subDate && <span>Deneme Bitiş: {l.trialDate}</span>}
            <StatusBadge status={l.status} days={l.days} />
          </div>
        </div>
      ))}
    </div>
  );
}
