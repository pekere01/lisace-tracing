-- Etkin Lisanslar Excel importu "Bölge (Firma)" alanını taşıyor, companies
-- tablosunda bunun için kolon yoktu (2026-09-25).
alter table public.companies add column if not exists region text;
