-- auth.users'a yeni kullanıcı eklenince otomatik profiles satırı oluşturur.
-- admin-operations Edge Function createUser çağrısında user_metadata.username/role
-- gönderiyor ama profiles'ı kendisi yazmıyor — bu trigger o boşluğu dolduruyor.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'personel')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
