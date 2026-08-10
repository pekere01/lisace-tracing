import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Yetkisiz" }, 401);

  try {
    // Caller kimliğini JWT ile doğrula (anon key + caller token)
    const sbCaller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
      error: userErr,
    } = await sbCaller.auth.getUser();
    if (userErr || !user) return json({ error: "Kimlik doğrulanamadı" }, 401);

    // Service role client — yalnızca bu fonksiyon içinde, Deno env secret olarak
    const sbAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Her admin işlemi, çağıranın profiles.role='admin' olmasını gerektirir.
    // (İlk admin kullanıcısı Supabase Dashboard'dan elle oluşturulur — bu fonksiyon
    // kendi kendini bootstrap etmez, bu bilerek alınmış bir güvenlik kararıdır.)
    const { data: profile, error: profErr } = await sbAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profErr || profile?.role !== "admin") {
      return json({ error: "Admin yetkisi gerekli" }, 403);
    }

    const body = await req.json();
    const { action, userId, email, password, username, role } = body;

    if (action === "list_users") {
      const [{ data: authList, error: listErr }, { data: profiles, error: profListErr }] =
        await Promise.all([
          sbAdmin.auth.admin.listUsers({ perPage: 1000 }),
          sbAdmin.from("profiles").select("id, username, role, created_at"),
        ]);
      if (listErr) throw listErr;
      if (profListErr) throw profListErr;

      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
      const users = authList.users.map((u) => {
        const p = profileById.get(u.id);
        return {
          id: u.id,
          email: u.email ?? "",
          username: p?.username ?? u.email ?? "kullanıcı",
          role: p?.role ?? "personel",
          createdAt: p?.created_at ?? u.created_at,
        };
      });
      return json({ ok: true, users });
    }

    if (action === "create_user") {
      const { data, error } = await sbAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, role: role ?? "personel" },
      });
      if (error) throw error;
      return json({ ok: true, userId: data.user.id });
    }

    if (action === "delete_user") {
      if (userId === user.id) return json({ error: "Kendi hesabını silemezsin" }, 400);
      const { error } = await sbAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const { error } = await sbAdmin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Geçersiz işlem" }, 400);
  } catch (err) {
    console.error("admin-operations error:", err);
    return json({ error: String((err as Error).message ?? err) }, 500);
  }
});
