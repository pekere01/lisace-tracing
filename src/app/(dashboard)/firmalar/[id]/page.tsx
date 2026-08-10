import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyDetail } from "@/lib/companies";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LicenseList } from "@/components/firmalar/license-list";
import { ActivityTimeline } from "@/components/firmalar/activity-timeline";
import { CompanyFiles } from "@/components/firmalar/company-files";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  MapPin,
  StickyNote,
  Pencil,
  FileSpreadsheet,
} from "lucide-react";

export default async function CompanyDetailPage(
  props: PageProps<"/firmalar/[id]">
) {
  const { id } = await props.params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) notFound();

  const [company, currentUser] = await Promise.all([
    getCompanyDetail(companyId),
    getCurrentUser(),
  ]);
  if (!company) notFound();

  const nearestDays = company.licenses
    .map((l) => l.days)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)[0];
  const nearestStatus = nearestDays !== undefined ? company.licenses.find((l) => l.days === nearestDays)?.status : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/firmalar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {company.name.toUpperCase()}
            </h1>
            {nearestStatus && nearestDays !== undefined && (
              <Badge variant="outline" className={cn("border font-mono text-[10.5px]", STATUS_BADGE_CLASS[nearestStatus])}>
                {nearestDays < 0
                  ? `${Math.abs(nearestDays)} GÜN GEÇTİ`
                  : `${nearestDays} GÜN İÇİNDE YENİLEME`}
              </Badge>
            )}
          </div>
          {company.lastEditedBy && (
            <p className="text-xs text-muted-foreground">
              Son işlem: {company.lastEditedBy} — {company.lastEditDetails}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/export/company/${company.id}`}>
            <FileSpreadsheet className="size-4" />
            Excel
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/firmalar/${company.id}/duzenle`}>
            <Pencil className="size-4" />
            Düzenle
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>İletişim &amp; CRM</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {company.contact?.fullName && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>
                    {company.contact.fullName}
                    {company.contact.phone && ` — ${company.contact.phone}`}
                  </span>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{company.address}</span>
                </div>
              )}
              {company.note?.note && (
                <div className="flex items-start gap-2">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {company.note.note}
                    {company.note.author && ` (${company.note.author})`}
                  </span>
                </div>
              )}
              {!company.contact?.fullName && !company.address && !company.note?.note && (
                <p className="text-muted-foreground">Henüz iletişim bilgisi eklenmemiş.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Görüşme Geçmişi</CardTitle>
              <CardDescription>Son görüşmeler ve notlar</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                companyId={company.id}
                activities={company.activities}
                currentUser={currentUser}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Lisanslar</CardTitle>
            </CardHeader>
            <CardContent>
              <LicenseList licenses={company.licenses} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyFiles companyId={company.id} files={company.files} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
