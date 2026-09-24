-- company_activity_deletions.company_id foreign key'i, firma silinirken (cascade
-- ile company_activities de silinince) kendi kendini engelliyordu: trigger yeni
-- bir audit satırı eklemeye çalışırken referans ettiği companies satırı aynı
-- transaction içinde zaten silinmiş oluyordu -> "Firma silinemedi" hatası.
-- Bir silme günlüğü tablosunun, sildiği firmayı referans etmeye devam etmesi
-- zaten anlamsız (o firma artık yok) — kısıtı tamamen kaldırıyoruz.

alter table public.company_activity_deletions
  drop constraint company_activity_deletions_company_id_fkey;
