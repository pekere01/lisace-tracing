"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { licenseStatus, STATUS_LABEL, STATUS_BADGE_CLASS } from "@/lib/dates";
import type { CompanyListItem } from "@/lib/companies";

const FAMILY_CHIP_CLASS: Record<string, string> = {
  solidworks: "bg-kraft text-kraft-ink border-kraft-shadow/50",
  solidcam: "bg-kraft text-kraft-ink border-kraft-shadow/50",
};

const FAMILY_ABBR: Record<string, string> = {
  solidworks: "CAD",
  solidcam: "CAM",
  solidcam_deneme: "CAM",
  cimatron: "CIM",
};

const TONE_BAR_CLASS: Record<string, string> = {
  expired: "bg-crit",
  critical: "bg-crit",
  warning: "bg-warn",
  active: "bg-ok",
};

const FILTERS = ["Tümü", "SolidWorks", "SolidCAM", "30 gün içinde", "Süresi geçmiş"] as const;
type Filter = (typeof FILTERS)[number];

export function CompanyTable({ companies }: { companies: CompanyListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Tümü");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (filter === "SolidWorks" && !c.familyCounts.solidworks) return false;
      if (filter === "SolidCAM" && !c.familyCounts.solidcam) return false;
      if (
        filter === "30 gün içinde" &&
        !(c.nearestRenewalDays !== null && c.nearestRenewalDays >= 0 && c.nearestRenewalDays <= 30)
      )
        return false;
      if (filter === "Süresi geçmiş" && !(c.nearestRenewalDays !== null && c.nearestRenewalDays < 0))
        return false;
      return true;
    });
  }, [companies, query, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Şirket adı ara..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-[30px] rounded-md border border-transparent px-3 text-xs font-semibold transition-transform hover:-translate-y-px",
                filter === f
                  ? "bg-ink text-paper"
                  : "bg-kraft text-ink-soft"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma</TableHead>
              <TableHead>Yetkili</TableHead>
              <TableHead>Lisanslar</TableHead>
              <TableHead>En Yakın Yenileme</TableHead>
              <TableHead className="text-right">Durum</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const status = licenseStatus(c.nearestRenewalDays);
                const toneClass = status ? TONE_BAR_CLASS[status] : "bg-border";
                const pct =
                  c.nearestRenewalDays === null
                    ? 0
                    : Math.max(
                        4,
                        Math.min(
                          100,
                          Math.round((1 - Math.min(Math.max(c.nearestRenewalDays, 0), 365) / 365) * 100)
                        )
                      );
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className={cn("h-6 w-[3px] shrink-0 rounded-full", toneClass)} />
                        <Link href={`/firmalar/${c.id}`} className="truncate hover:underline">
                          {c.name.toUpperCase()}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.contactName ? (
                        <span className="flex flex-col gap-0.5">
                          <span className="text-foreground/90">{c.contactName}</span>
                          {c.contactPhone && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {c.contactPhone}
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(c.familyCounts).length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          Object.entries(c.familyCounts).map(([family, count]) => (
                            <Badge
                              key={family}
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 font-mono text-[10px]",
                                FAMILY_CHIP_CLASS[family] ?? "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {FAMILY_ABBR[family] ?? family.slice(0, 3).toUpperCase()} ×{count}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.nearestRenewalDays === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs tabular-nums text-foreground/90">
                            {c.nearestRenewalDays < 0
                              ? `${Math.abs(c.nearestRenewalDays)} gün geçti`
                              : `${c.nearestRenewalDays} gün kaldı`}
                          </span>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full", toneClass)} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {status && (
                        <Badge variant="outline" className={cn("border", STATUS_BADGE_CLASS[status])}>
                          {STATUS_LABEL[status]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/firmalar/${c.id}`}>
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} / {companies.length} firma gösteriliyor
      </p>
    </div>
  );
}
