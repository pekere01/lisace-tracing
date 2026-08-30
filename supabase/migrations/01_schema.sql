-- Lisans Paneli — çekirdek şema (2026-08-30, silinen proje sonrası yeniden kuruldu)
-- Kaynak: src/lib/supabase/database.types.ts + app kodu okunarak kurtarıldı.

create table public.companies (
  id bigint generated always as identity primary key,
  name text not null,
  address text,
  status text,
  created_at timestamptz default now(),
  last_edited_by text,
  last_edit_details text
);

create table public.contacts (
  id bigint generated always as identity primary key,
  company_id bigint references public.companies (id) on delete cascade,
  full_name text,
  phone text
);

create table public.licenses (
  id bigint generated always as identity primary key,
  company_id bigint references public.companies (id) on delete cascade,
  software_type text not null,
  serial_number text,
  sub_date date,
  trial_date date
);

create table public.company_notes (
  id bigint generated always as identity primary key,
  company_id bigint references public.companies (id) on delete cascade,
  author text,
  note text
);

create table public.company_activities (
  id bigint generated always as identity primary key,
  company_id bigint references public.companies (id) on delete cascade,
  activity_type text,
  activity_date timestamptz,
  author text,
  note text
);

create table public.company_files (
  id bigint generated always as identity primary key,
  company_id bigint references public.companies (id) on delete cascade,
  file_name text,
  file_url text
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  role text not null default 'personel',
  created_at timestamptz not null default now()
);

create index on public.contacts (company_id);
create index on public.licenses (company_id);
create index on public.company_notes (company_id);
create index on public.company_activities (company_id);
create index on public.company_files (company_id);
