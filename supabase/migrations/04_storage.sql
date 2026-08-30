-- "firma postlari" bucket: firma dosyaları için. Public (kod getPublicUrl kullanıyor),
-- yazma yalnızca admin.

insert into storage.buckets (id, name, public)
values ('firma postlari', 'firma postlari', true)
on conflict (id) do nothing;

create policy "firma_postlari_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'firma postlari');

create policy "firma_postlari_admin_write"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'firma postlari'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id = 'firma postlari'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
