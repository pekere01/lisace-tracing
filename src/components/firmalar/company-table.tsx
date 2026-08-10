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
import { Search, AlertTriangle, ChevronRight } from "lucide-react";
import type { CompanyListItem } from "@/lib/companies";

export function CompanyTable({ companies }: { companies: CompanyListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Şirket adı ara..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma Adı</TableHead>
              <TableHead>Yetkili</TableHead>
              <TableHead className="text-right">Lisanslar</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-medium">
                    <Link href={`/firmalar/${c.id}`} className="hover:underline">
                      {c.name.toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.contactName ? (
                      <span>
                        {c.contactName}
                        {c.contactPhone && (
                          <span className="text-xs"> · {c.contactPhone}</span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {c.hasCriticalLicense && (
                        <AlertTriangle className="size-3.5 text-destructive" />
                      )}
                      {c.licenseCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/firmalar/${c.id}`}>
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
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
