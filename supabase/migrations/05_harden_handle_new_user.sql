-- Supabase security advisor bulgusu: handle_new_user() SECURITY DEFINER olduğu için
-- anon/authenticated rolleri /rest/v1/rpc/handle_new_user ile doğrudan çağırabiliyordu.
-- Trigger olarak tetiklenmesi bu grant'lere ihtiyaç duymaz (Postgres trigger'ları
-- invoking role'ün EXECUTE izninden bağımsız çalışır) — güvenle kaldırılabilir.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
