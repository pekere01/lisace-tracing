import { getCurrentUser } from "@/lib/auth";
import { CompanyForm } from "@/components/firmalar/company-form";

export default async function YeniFirmaPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Firma</h1>
        <p className="text-sm text-muted-foreground">
          Firma, iletişim ve lisans bilgilerini gir.
        </p>
      </div>
      <CompanyForm mode="create" currentUsername={user?.username ?? "kullanıcı"} />
    </div>
  );
}
