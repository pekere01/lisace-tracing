import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UsersTable } from "@/components/kullanicilar/users-table";

export default async function KullanicilarPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground">
          Panel kullanıcılarını yönet — oluştur, şifre sıfırla, sil.
        </p>
      </div>
      <UsersTable currentUser={user} />
    </div>
  );
}
