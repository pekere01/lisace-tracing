import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  role: "admin" | "personel";
};

/**
 * Server tarafında oturum açmış kullanıcıyı + profil bilgisini getirir.
 * proxy.ts zaten oturumsuz istekleri /login'e yönlendiriyor; burada null dönerse
 * çağıran taraf yine de kendi guard'ını uygulamalı (savunma katmanı).
 *
 * react cache() ile sarılı: aynı istek/render ağacında (layout + page) birden
 * fazla çağrılsa da Tokyo'daki Supabase'e yalnızca bir kez gidilir.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub as string,
    email: (claims.email as string) ?? "",
    username: profile?.username ?? (claims.email as string) ?? "kullanıcı",
    role: (profile?.role as "admin" | "personel") ?? "personel",
  };
});
