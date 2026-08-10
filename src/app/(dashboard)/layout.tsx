import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRenewalAlertsCount } from "@/lib/dashboard";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const [user, renewalAlertsCount] = await Promise.all([
    getCurrentUser(),
    getRenewalAlertsCount(),
  ]);

  // proxy.ts zaten oturumsuz istekleri yönlendiriyor; bu ikinci bir güvenlik katmanı.
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar user={user} renewalAlertsCount={renewalAlertsCount} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
