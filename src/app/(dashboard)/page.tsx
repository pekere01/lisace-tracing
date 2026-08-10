import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { LicenseRenewalCard } from "@/components/dashboard/license-renewal";
import {
  SolidworksTierChart,
  SolidcamModuleChart,
} from "@/components/dashboard/charts";

export default async function DashboardPage() {
  const [user, dashboard] = await Promise.all([getCurrentUser(), getDashboardData()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Şirket Lisans &amp; Yönetim Paneli
        </h1>
        <p className="text-sm text-muted-foreground">
          Hoş geldin, {user?.username} — genel durum aşağıda.
        </p>
      </div>

      <KpiCards
        totalCompanies={dashboard.totalCompanies}
        solidworksCount={dashboard.solidworksCount}
        solidcamCount={dashboard.solidcamCount}
        criticalCount={
          dashboard.renewalAlerts.renewable.length + dashboard.renewalAlerts.recapture.length
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SolidworksTierChart data={dashboard.solidworksTierDist} />
        <SolidcamModuleChart data={dashboard.solidcamModuleDist} />
        <LicenseRenewalCard alerts={dashboard.renewalAlerts} limit={6} showViewAllLink />
      </div>
    </div>
  );
}
