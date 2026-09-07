import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RENEWAL_STAGE_BADGE_CLASS, type RenewalStage } from "@/lib/dates";
import { FAMILY_DISPLAY_NAME } from "@/lib/licenses";
import { cn } from "@/lib/utils";
import type { LicenseAlert, RenewalAlerts } from "@/lib/dashboard";

const FAMILY_BADGE_CLASS: Record<string, string> = {
  solidworks: "bg-kraft text-kraft-ink border-kraft-shadow/50",
  solidcam: "bg-kraft text-kraft-ink border-kraft-shadow/50",
};

const STAGE_META: Record<
  RenewalStage,
  { title: string; dotClass: string; borderClass: string; desc: string }
> = {
  renewable: {
    title: "Renewable",
    dotClass: "bg-warn",
    borderClass: "border-l-kraft-shadow",
    desc: "Aboneliği devam eden, 30 gün içinde yenileme tarihi gelen lisanslar.",
  },
  recapture: {
    title: "Recapture",
    dotClass: "bg-crit",
    borderClass: "border-l-kraft-shadow",
    desc: "Aboneliği sona ermiş ancak son 4 yıl içinde — hâlâ yeniden kazanılabilir.",
  },
  sunset: {
    title: "Sunset",
    dotClass: "bg-ink-soft",
    borderClass: "border-l-kraft-shadow",
    desc: "4 yıldan uzun süredir sona ermiş — aktif fırsat/yenileme yok, bilgi amaçlı.",
  },
};

type CompanyGroup = {
  companyId: number;
  companyName: string;
  alerts: LicenseAlert[];
};

/** Aynı firmanın bir aşamadaki tüm lisanslarını tek kartta birleştirmek için gruplar; ilk görülme sırası korunur. */
function groupByCompany(alerts: LicenseAlert[]): CompanyGroup[] {
  const groups = new Map<number, CompanyGroup>();
  for (const alert of alerts) {
    const existing = groups.get(alert.companyId);
    if (existing) {
      existing.alerts.push(alert);
    } else {
      groups.set(alert.companyId, {
        companyId: alert.companyId,
        companyName: alert.companyName,
        alerts: [alert],
      });
    }
  }
  return Array.from(groups.values());
}

function CompanyPipelineCard({ group, stage }: { group: CompanyGroup; stage: RenewalStage }) {
  return (
    <Link
      href={`/firmalar/${group.companyId}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border border-l-[3px] bg-card px-3 py-2.5 text-sm transition-transform hover:-translate-y-0.5",
        STAGE_META[stage].borderClass
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 font-medium leading-snug">{group.companyName}</span>
        {group.alerts.length > 1 && (
          <Badge variant="outline" className="shrink-0 px-1.5 py-0 font-mono text-[10px]">
            {group.alerts.length} lisans
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {group.alerts.map((a, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 border-t border-border/70 pt-1.5 first:border-t-0 first:pt-0"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn("shrink-0 px-1.5 py-0 font-mono text-[10px]", FAMILY_BADGE_CLASS[a.family])}
              >
                {FAMILY_DISPLAY_NAME[a.family] ?? a.family.toUpperCase()}
              </Badge>
              <span className="truncate text-xs text-muted-foreground">{a.label || "—"}</span>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {a.days < 0 ? `${Math.abs(a.days)} gün geçti` : `${a.days} gün kaldı`}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function StageList({ stage, alerts }: { stage: RenewalStage; alerts: LicenseAlert[] }) {
  const meta = STAGE_META[stage];
  const groups = groupByCompany(alerts);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{meta.desc}</p>
      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Bu aşamada lisans yok.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {groups.map((g) => (
            <CompanyPipelineCard key={g.companyId} group={g} stage={stage} />
          ))}
        </div>
      )}
    </div>
  );
}

function StageCountBadge({ count, tone }: { count: number; tone: string }) {
  return (
    <Badge variant="outline" className={cn("ml-1 px-1.5 py-0 font-mono text-[10px]", tone)}>
      {count}
    </Badge>
  );
}

export function LicenseRenewalCard({ alerts }: { alerts: RenewalAlerts }) {
  return (
    <Tabs defaultValue="renewable">
      <TabsList>
        <TabsTrigger value="renewable">
          <span className={cn("size-1.5 rounded-sm", STAGE_META.renewable.dotClass)} />
          Renewable
          <StageCountBadge
            count={groupByCompany(alerts.renewable).length}
            tone={RENEWAL_STAGE_BADGE_CLASS.renewable}
          />
        </TabsTrigger>
        <TabsTrigger value="recapture">
          <span className={cn("size-1.5 rounded-sm", STAGE_META.recapture.dotClass)} />
          Recapture
          <StageCountBadge
            count={groupByCompany(alerts.recapture).length}
            tone={RENEWAL_STAGE_BADGE_CLASS.recapture}
          />
        </TabsTrigger>
        <TabsTrigger value="sunset">
          <span className={cn("size-1.5 rounded-sm", STAGE_META.sunset.dotClass)} />
          Sunset
          <StageCountBadge
            count={groupByCompany(alerts.sunset).length}
            tone={RENEWAL_STAGE_BADGE_CLASS.sunset}
          />
        </TabsTrigger>
      </TabsList>
      <div className="rounded-b-lg rounded-tr-lg border border-border bg-card p-4">
        <TabsContent value="renewable">
          <StageList stage="renewable" alerts={alerts.renewable} />
        </TabsContent>
        <TabsContent value="recapture">
          <StageList stage="recapture" alerts={alerts.recapture} />
        </TabsContent>
        <TabsContent value="sunset">
          <StageList stage="sunset" alerts={alerts.sunset} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
