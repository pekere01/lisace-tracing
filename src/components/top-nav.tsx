"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Panel" },
  { href: "/firmalar", label: "Firmalar" },
  { href: "/yeni", label: "Yeni Firma" },
  { href: "/uyarilar", label: "Uyarılar", badge: true },
];

export function TopNav({
  user,
  renewalAlertsCount,
}: {
  user: CurrentUser;
  renewalAlertsCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items =
    user.role === "admin"
      ? [...NAV_ITEMS, { href: "/kullanicilar", label: "Kullanıcılar" }]
      : NAV_ITEMS;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-5 py-3.5 backdrop-blur-sm sm:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-[15px] font-bold tracking-tight text-ink"
        >
          <span className="size-[9px] shrink-0 rounded-full bg-ink shadow-[inset_0_1px_1px_rgba(0,0,0,0.4)]" />
          LİSANS PANELİ
        </Link>
        <nav className="flex shrink-0 items-end gap-1.5">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-[3px] px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-all hover:-translate-y-px",
                  active
                    ? "bg-kraft-dark text-ink"
                    : "bg-kraft text-ink-soft"
                )}
              >
                {item.label}
                {item.badge && renewalAlertsCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-crit px-1 font-mono text-[11px] font-bold text-white">
                    {renewalAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-bold text-paper outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={user.username}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-1.5 py-1 text-sm">
            <p className="font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            <LogOut className="size-4" />
            Çıkış Yap
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
