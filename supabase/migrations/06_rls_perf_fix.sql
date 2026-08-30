-- Supabase performance advisor bulguları:
-- 1) "for all" admin politikaları SELECT'i de kapsıyor, zaten var olan
--    "*_select_authenticated" politikasıyla çakışıp her sorguda çifte
--    değerlendirmeye yol açıyor (multiple_permissive_policies).
-- 2) auth.uid() her satır için yeniden çağrılıyordu; (select auth.uid())
--    olarak sarmalamak planlayıcının bunu bir kez değerlendirmesini sağlar
--    (auth_rls_initplan).
--
-- Çözüm: "for all" yerine yalnızca insert/update/delete için ayrı politikalar.

do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'licenses', 'company_notes', 'company_activities', 'company_files']
  loop
    execute format('drop policy if exists "%1$s_write_admin" on public.%1$s;', t);

    execute format(
      $f$create policy "%1$s_insert_admin" on public.%1$s for insert to authenticated
        with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));$f$,
      t
    );
    execute format(
      $f$create policy "%1$s_update_admin" on public.%1$s for update to authenticated
        using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
        with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));$f$,
      t
    );
    execute format(
      $f$create policy "%1$s_delete_admin" on public.%1$s for delete to authenticated
        using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));$f$,
      t
    );
  end loop;
end $$;
