import { Card, CardContent } from "@/components/ui/card";
import { Building2, RefreshCcw, Wrench, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "total", label: "Toplam Firma", icon: Building2, tone: "text-primary" },
  { key: "sw", label: "SolidWorks Sayısı", icon: Wrench, tone: "text-chart-2" },
  { key: "cam", label: "SolidCAM Sayısı", icon: Cog, tone: "text-chart-3" },
  {
    key: "alerts",
    label: "Yenileme Gerekli",
    icon: RefreshCcw,
    tone: "text-destructive",
  },
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <Card key={item.key}>
          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {values[item.key]}
              </p>
            </div>
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
                item.tone
              )}
            >
              <item.icon className="size-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
