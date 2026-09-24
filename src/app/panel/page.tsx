import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { getCompanyList } from "@/lib/companies";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RenewalShelf } from "@/components/dashboard/renewal-shelf";
import {
  SolidworksTierChart,
  SolidcamModuleChart,
} from "@/components/dashboard/charts";

export default async function DashboardPage() {
  const [user, dashboard, companies] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
    getCompanyList(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
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

      <RenewalShelf companies={companies} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SolidworksTierChart data={dashboard.solidworksTierDist} />
        <SolidcamModuleChart data={dashboard.solidcamModuleDist} />
      </div>
    </div>
  );
}
