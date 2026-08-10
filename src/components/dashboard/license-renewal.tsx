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
import { RENEWAL_STAGE_BADGE_CLASS } from "@/lib/dates";
import { FAMILY_DISPLAY_NAME } from "@/lib/licenses";
import { cn } from "@/lib/utils";
import type { LicenseAlert, RenewalAlerts } from "@/lib/dashboard";

const FAMILY_BADGE_CLASS: Record<string, string> = {
  solidworks: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  solidcam: "bg-violet-500/15 text-violet-500 border-violet-500/30",
};

function AlertRow({ alert }: { alert: LicenseAlert }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
      <div className="min-w-0">
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
              "shrink-0 px-1.5 py-0 text-[10px]",
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
        {alert.days < 0 ? `${Math.abs(alert.days)} gün geçti` : `${alert.days} gün kaldı`}
      </Badge>
    </li>
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

function CountBadge({ count }: { count: number }) {
  return (
    <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
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
        <CardContent>
          <AlertList
            alerts={merged}
            emptyText="Şu anda yenileme veya recapture gerektiren lisans yok."
          />
          {alerts.sunset.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Ayrıca {alerts.sunset.length} lisans sunset durumunda (pasif, aktif takip gerekmiyor).
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="size-4 text-primary" />
          Lisans Yenileme Takibi
        </CardTitle>
        <CardDescription>
          Yenileme döngüsündeki durum: Renewable → Recapture → Sunset
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="renewable">
          <TabsList>
            <TabsTrigger value="renewable">
              Renewable
              <CountBadge count={alerts.renewable.length} />
            </TabsTrigger>
            <TabsTrigger value="recapture">
              Recapture
              <CountBadge count={alerts.recapture.length} />
            </TabsTrigger>
            <TabsTrigger value="sunset">
              Sunset
              <CountBadge count={alerts.sunset.length} />
            </TabsTrigger>
          </TabsList>
          <TabsContent value="renewable" className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Aboneliği devam eden, 30 gün içinde yenileme tarihi gelen lisanslar.
            </p>
            <AlertList alerts={alerts.renewable} emptyText="Yaklaşan yenileme yok." />
          </TabsContent>
          <TabsContent value="recapture" className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Aboneliği sona ermiş ancak son 4 yıl içinde — hâlâ yeniden kazanılabilir.
            </p>
            <AlertList alerts={alerts.recapture} emptyText="Recapture kapsamında lisans yok." />
          </TabsContent>
          <TabsContent value="sunset" className="mt-3">
            <p className="mb-2 text-xs text-muted-foreground">
              4 yıldan uzun süredir sona ermiş — aktif yenileme/recapture fırsatı yok, bilgi amaçlı.
            </p>
            <AlertList alerts={alerts.sunset} emptyText="Sunset lisans yok." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
