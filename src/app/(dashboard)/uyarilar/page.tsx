import { getDashboardData } from "@/lib/dashboard";
import { LicenseRenewalCard } from "@/components/dashboard/license-renewal";

export default async function UyarilarPage() {
  const dashboard = await getDashboardData();
  const total =
    dashboard.renewalAlerts.renewable.length +
    dashboard.renewalAlerts.recapture.length +
    dashboard.renewalAlerts.sunset.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lisans Yenileme Takibi</h1>
        <p className="text-sm text-muted-foreground">
          Tüm lisansların yenileme durumu: Renewable, Recapture ve Sunset ({total})
        </p>
      </div>
      <LicenseRenewalCard alerts={dashboard.renewalAlerts} />
    </div>
  );
}
