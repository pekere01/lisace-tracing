"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  LogOut,
  RefreshCcw,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Takip",
    items: [
      { href: "/", label: "Genel Durum", icon: LayoutDashboard },
      { href: "/uyarilar", label: "Lisans Yenileme", icon: RefreshCcw, badge: true },
    ],
  },
  {
    label: "Firmalar",
    items: [
      { href: "/firmalar", label: "Firma Listesi", icon: Building2 },
      { href: "/yeni", label: "Yeni Firma", icon: PlusCircle },
    ],
  },
];

export function AppSidebar({
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

  const navGroups =
    user.role === "admin"
      ? [
          ...NAV_GROUPS,
          {
            label: "Yönetim",
            items: [{ href: "/kullanicilar", label: "Kullanıcılar", icon: Users }],
          },
        ]
      : NAV_GROUPS;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-[13px] font-bold text-primary-foreground">
            SÇ
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">Lisans Paneli</span>
            <span className="text-[11px] text-muted-foreground">Sonçağ Mühendislik</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-mono text-[10px] tracking-widest">
              {group.label.toUpperCase()}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && renewalAlertsCount > 0 && (
                      <SidebarMenuBadge className="bg-destructive/15 font-mono text-destructive">
                        {renewalAlertsCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <Avatar className="size-8">
            <AvatarFallback className="font-mono text-xs">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none min-w-0">
            <span className="truncate text-sm font-medium">{user.username}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user.role}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Çıkış Yap</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
