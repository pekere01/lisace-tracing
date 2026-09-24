-- Personel artık görüşme (company_activities) ekleyebiliyor ve kendi eklediğini
-- silebiliyor — önceden "*_write_admin"/"*_insert_admin" politikaları TÜM yazmayı
-- admin'e kısıtlıyordu, personel hesabından "Görüşme Ekle" her zaman RLS'e takılıp
-- "Görüşme eklenemedi" hatası veriyordu.
--
-- Silme işlemleri iz bırakmadan kaybolmasın diye (kim ne zaman ne sildi anlaşmazlığı
-- olmasın) her silinen kayıt company_activity_deletions'a otomatik (trigger ile)
-- düşüyor — bu tablo sadece admin'e görünür, hiçbir authenticated kullanıcı silemez.

create table public.company_activity_deletions (
  id bigint generated always as identity primary key,
  company_id bigint references public.companies (id) on delete set null,
  original_activity_id bigint not null,
  activity_type text,
  activity_date timestamptz,
  author text,
  note text,
  deleted_by text not null,
  deleted_at timestamptz not null default now()
);

create index on public.company_activity_deletions (company_id);

alter table public.company_activity_deletions enable row level security;

create policy "company_activity_deletions_select_admin"
  on public.company_activity_deletions for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

create or replace function public.log_company_activity_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deleter_username text;
begin
  select username into deleter_username from public.profiles where id = auth.uid();
  insert into public.company_activity_deletions (
    company_id, original_activity_id, activity_type, activity_date, author, note, deleted_by
  ) values (
    old.company_id, old.id, old.activity_type, old.activity_date, old.author, old.note,
    coalesce(deleter_username, 'bilinmiyor')
  );
  return old;
end;
$$;

create trigger company_activities_log_deletion
  before delete on public.company_activities
  for each row execute function public.log_company_activity_deletion();

-- insert: her authenticated kullanıcı ekleyebilir ama author alanı kendi
-- kullanıcı adıyla eşleşmek zorunda (başkası adına görüşme kaydı uydurulamaz);
-- admin dilediği author ile ekleyebilir.
drop policy if exists "company_activities_insert_admin" on public.company_activities;
create policy "company_activities_insert_own_or_admin"
  on public.company_activities for insert
  to authenticated
  with check (
    author = (select username from public.profiles where id = (select auth.uid()))
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- delete: personel sadece kendi eklediği kaydı silebilir, admin hepsini silebilir
-- (trigger her iki durumda da audit tablosuna kaydediyor).
drop policy if exists "company_activities_delete_admin" on public.company_activities;
create policy "company_activities_delete_own_or_admin"
  on public.company_activities for delete
  to authenticated
  using (
    author = (select username from public.profiles where id = (select auth.uid()))
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

-- update: company_activities için arayüzde düzenleme yok, admin-only olarak kalıyor
-- (06_rls_perf_fix.sql'deki "company_activities_update_admin" değişmedi).
