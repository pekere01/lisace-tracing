import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRenewalAlertsCount } from "@/lib/dashboard";
import { TopNav } from "@/components/top-nav";

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
    <div className="flex min-h-screen flex-col">
      <TopNav user={user} renewalAlertsCount={renewalAlertsCount} />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 p-4 md:p-7">
        {children}
      </main>
    </div>
  );
}
