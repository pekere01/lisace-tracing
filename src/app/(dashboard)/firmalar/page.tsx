import { getCompanyList } from "@/lib/companies";
import { CompanyTable } from "@/components/firmalar/company-table";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default async function FirmalarPage() {
  const companies = await getCompanyList();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Firmalar</h1>
          <p className="text-sm text-muted-foreground">
            Toplam {companies.length} firma
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/export/all">
            <FileSpreadsheet className="size-4" />
            Tüm Raporu İndir
          </a>
        </Button>
      </div>
      <CompanyTable companies={companies} />
    </div>
  );
}
