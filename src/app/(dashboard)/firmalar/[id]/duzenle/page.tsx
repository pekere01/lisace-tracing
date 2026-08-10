import { notFound } from "next/navigation";
import { getCompanyDetail } from "@/lib/companies";
import { getCurrentUser } from "@/lib/auth";
import { CompanyForm } from "@/components/firmalar/company-form";

export default async function EditCompanyPage(
  props: PageProps<"/firmalar/[id]/duzenle">
) {
  const { id } = await props.params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) notFound();

  const [company, user] = await Promise.all([
    getCompanyDetail(companyId),
    getCurrentUser(),
  ]);
  if (!company) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Firmayı Düzenle</h1>
        <p className="text-sm text-muted-foreground">{company.name.toUpperCase()}</p>
      </div>
      <CompanyForm
        mode="edit"
        company={company}
        currentUsername={user?.username ?? "kullanıcı"}
      />
    </div>
  );
}
