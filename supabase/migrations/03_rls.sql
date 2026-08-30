-- RLS modeli: okuma tüm authenticated kullanıcılara, yazma yalnızca admin.
-- profiles: SELECT herkese (getCurrentUser + kullanıcı listesi için gerekli),
-- INSERT/UPDATE/DELETE hiç policy yok — yalnızca trigger (security definer) ve
-- admin-operations Edge Function'ın service_role'ü yazabilir.

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.licenses enable row level security;
alter table public.company_notes enable row level security;
alter table public.company_activities enable row level security;
alter table public.company_files enable row level security;
alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'licenses', 'company_notes', 'company_activities', 'company_files']
  loop
    execute format(
      'create policy "%1$s_select_authenticated" on public.%1$s for select to authenticated using (true);',
      t
    );
    execute format(
      $f$create policy "%1$s_write_admin" on public.%1$s for all to authenticated
        using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
        with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));$f$,
      t
    );
  end loop;
end $$;
