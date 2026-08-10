import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw } from "lucide-react";
import { RENEWAL_STAGE_BADGE_CLASS, type RenewalStage } from "@/lib/dates";
import { FAMILY_DISPLAY_NAME } from "@/lib/licenses";
import { cn } from "@/lib/utils";
import type { LicenseAlert, RenewalAlerts } from "@/lib/dashboard";

const FAMILY_BADGE_CLASS: Record<string, string> = {
  solidworks: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  solidcam: "bg-violet-500/15 text-violet-500 border-violet-500/30",
};

function AlertRow({ alert }: { alert: LicenseAlert }) {
  const isOverdue = alert.days < 0;
  return (
    <li className="flex items-center gap-3.5 rounded-md border-l-2 border-border bg-card px-3 py-2 text-sm data-[overdue=true]:border-l-amber-500" data-overdue={isOverdue}>
      <div className="w-14 shrink-0 text-right font-mono text-base font-semibold tabular-nums">
        {Math.abs(alert.days)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/firmalar/${alert.companyId}`}
            className="truncate font-medium hover:underline"
          >
            {alert.companyName}
          </Link>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 px-1.5 py-0 font-mono text-[10px]",
              FAMILY_BADGE_CLASS[alert.family]
            )}
          >
            {FAMILY_DISPLAY_NAME[alert.family] ?? alert.family.toUpperCase()}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{alert.label || "—"}</p>
      </div>
      <Badge
        variant="outline"
        className={cn("shrink-0 border", RENEWAL_STAGE_BADGE_CLASS[alert.stage])}
      >
        {isOverdue ? "gün geçti" : "gün kaldı"}
      </Badge>
    </li>
  );
}

function StageBar({ alerts }: { alerts: RenewalAlerts }) {
  const renewable = alerts.renewable.length;
  const recapture = alerts.recapture.length;
  const sunset = alerts.sunset.length;
  const total = renewable + recapture + sunset;
  if (total === 0) return null;

  const pct = (n: number) => (n / total) * 100;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-chart-4" style={{ width: `${pct(renewable)}%` }} />
        <div className="bg-chart-3" style={{ width: `${pct(recapture)}%` }} />
        <div className="bg-border" style={{ width: `${pct(sunset)}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5 border-l-2 border-chart-4 pl-2.5">
          <span className="font-mono text-lg font-semibold tabular-nums">{renewable}</span>
          <span className="text-[11px] text-muted-foreground">Renewable</span>
        </div>
        <div className="flex flex-col gap-0.5 border-l-2 border-chart-3 pl-2.5">
          <span className="font-mono text-lg font-semibold tabular-nums">{recapture}</span>
          <span className="text-[11px] text-muted-foreground">Recapture</span>
        </div>
        <div className="flex flex-col gap-0.5 border-l-2 border-border pl-2.5">
          <span className="font-mono text-lg font-semibold tabular-nums">{sunset}</span>
          <span className="text-[11px] text-muted-foreground">Sunset</span>
        </div>
      </div>
    </div>
  );
}

function AlertList({ alerts, emptyText }: { alerts: LicenseAlert[]; emptyText: string }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((a, i) => (
        <AlertRow key={`${a.companyId}-${i}`} alert={a} />
      ))}
    </ul>
  );
}

const STAGE_META: Record<
  RenewalStage,
  { title: string; dotClass: string; borderClass: string; desc: string }
> = {
  renewable: {
    title: "Renewable",
    dotClass: "bg-chart-4",
    borderClass: "border-l-chart-4",
    desc: "Aboneliği devam eden, 30 gün içinde yenileme tarihi gelen lisanslar.",
  },
  recapture: {
    title: "Recapture",
    dotClass: "bg-chart-3",
    borderClass: "border-l-chart-3",
    desc: "Aboneliği sona ermiş ancak son 4 yıl içinde — hâlâ yeniden kazanılabilir.",
  },
  sunset: {
    title: "Sunset",
    dotClass: "bg-muted-foreground/50",
    borderClass: "border-l-border",
    desc: "4 yıldan uzun süredir sona ermiş — aktif fırsat/yenileme yok, bilgi amaçlı.",
  },
};

function PipelineCard({ alert, stage }: { alert: LicenseAlert; stage: RenewalStage }) {
  return (
    <Link
      href={`/firmalar/${alert.companyId}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border border-l-2 bg-secondary/40 px-3 py-2.5 text-sm transition-colors hover:bg-secondary",
        STAGE_META[stage].borderClass
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 font-medium leading-snug">{alert.companyName}</span>
        <Badge
          variant="outline"
          className={cn("shrink-0 px-1.5 py-0 font-mono text-[10px]", FAMILY_BADGE_CLASS[alert.family])}
        >
          {FAMILY_DISPLAY_NAME[alert.family] ?? alert.family.toUpperCase()}
        </Badge>
      </div>
      <span className="text-xs text-muted-foreground">{alert.label || "—"}</span>
      <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">
          {alert.days < 0 ? `${Math.abs(alert.days)} gün geçti` : `${alert.days} gün kaldı`}
        </span>
        <Badge variant="outline" className={cn("border font-mono text-[10px]", RENEWAL_STAGE_BADGE_CLASS[stage])}>
          {Math.abs(alert.days)}
        </Badge>
      </div>
    </Link>
  );
}

function StageList({ stage, alerts }: { stage: RenewalStage; alerts: LicenseAlert[] }) {
  const meta = STAGE_META[stage];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{meta.desc}</p>
      {alerts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Bu aşamada lisans yok.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {alerts.map((a, i) => (
            <PipelineCard key={`${a.companyId}-${i}`} alert={a} stage={stage} />
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

export function LicenseRenewalCard({
  alerts,
  limit,
  showViewAllLink,
}: {
  alerts: RenewalAlerts;
  /** Verilirse kompakt (dashboard) görünüm: sekmesiz, tek birleşik liste. Verilmezse tam (uyarilar sayfası) görünüm. */
  limit?: number;
  showViewAllLink?: boolean;
}) {
  if (limit) {
    const merged = [...alerts.renewable, ...alerts.recapture]
      .sort((a, b) => a.days - b.days)
      .slice(0, limit);
    const totalActionable = alerts.renewable.length + alerts.recapture.length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCcw className="size-4 text-primary" />
            Lisans Yenileme Takibi
          </CardTitle>
          <CardDescription>Yenilenecek ve recapture kapsamındaki lisanslar</CardDescription>
          {showViewAllLink && totalActionable > limit && (
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/uyarilar">Tümünü Gör</Link>
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StageBar alerts={alerts} />
          <AlertList
            alerts={merged}
            emptyText="Şu anda yenileme veya recapture gerektiren lisans yok."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="renewable">
      <TabsList>
        <TabsTrigger value="renewable">
          <span className={cn("size-1.5 rounded-sm", STAGE_META.renewable.dotClass)} />
          Renewable
          <StageCountBadge count={alerts.renewable.length} tone={RENEWAL_STAGE_BADGE_CLASS.renewable} />
        </TabsTrigger>
        <TabsTrigger value="recapture">
          <span className={cn("size-1.5 rounded-sm", STAGE_META.recapture.dotClass)} />
          Recapture
          <StageCountBadge count={alerts.recapture.length} tone={RENEWAL_STAGE_BADGE_CLASS.recapture} />
        </TabsTrigger>
        <TabsTrigger value="sunset">
          <span className={cn("size-1.5 rounded-sm", STAGE_META.sunset.dotClass)} />
          Sunset
          <StageCountBadge count={alerts.sunset.length} tone={RENEWAL_STAGE_BADGE_CLASS.sunset} />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="renewable" className="mt-3">
        <StageList stage="renewable" alerts={alerts.renewable} />
      </TabsContent>
      <TabsContent value="recapture" className="mt-3">
        <StageList stage="recapture" alerts={alerts.recapture} />
      </TabsContent>
      <TabsContent value="sunset" className="mt-3">
        <StageList stage="sunset" alerts={alerts.sunset} />
      </TabsContent>
    </Tabs>
  );
}
