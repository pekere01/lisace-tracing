---
title: Lisans Paneli Web — Next.js Dönüşüm Özeti
tags: [proje/aktif, alan/kurumsal, musteri/soncag, tip/mimari, tip/gunluk, stack/supabase, stack/react]
created: 2026-08-08
type: log
---

# Lisans Paneli Web — Next.js Dönüşüm Özeti

> Sonçağ Mühendislik'in SolidWorks/SolidCAM lisans takip paneli. Eski Streamlit sürümü
> (`01_Projects/lisans_paneli/`) görsel olarak tavana çarpınca Next.js'e komple yeniden
> yazıldı. Bu not F0-F8 fazlarının tamamlanmasını ve bugünkü performans incelemesini özetler.

## Proje Nedir

Küçük ekip (6-7 kişi) için kişisel/kurumsal bir CRM+lisans takip aracı. Firma listesi, her
firmanın SolidWorks/SolidCAM/Cimatron lisansları, bitiş tarihleri, iletişim bilgileri, görüşme
geçmişi ve dosyaları tek panelde. Kritik uyarı = 30 gün içinde bitecek/bitmiş lisans.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + shadcn/ui (zinc/nova preset) +
Supabase (Auth + Postgres + Storage + Edge Functions), `@supabase/ssr`.

Backend, eski projenin silinmesi üzerine boşta duran "site" Supabase projesi repurpose edilerek
kuruldu (`rtkvyxvotjbjwrahmiuc`, ap-northeast-1/Tokyo — bkz. aşağıdaki tradeoff notu). 113 firma +
674 lisans, gerçek Dynamics CRM Excel export'undan import edildi.

## Mimari Kararlar

- **RLS modeli:** Tüm ana tablolarda `for all to authenticated using (true)` — küçük, güvenilir
  ekip olduğu için satır bazlı kısıtlama yok. Firma/lisans/dosya CRUD'u bu yüzden **server action
  değil, tarayıcıdan doğrudan Supabase çağrısı** olarak yazıldı (`src/components/firmalar/company-form.tsx`,
  `activity-timeline.tsx`) — RLS zaten yetkiyi garanti ediyor, ekstra bir server katmanı gereksiz.
- **Admin işlemleri istisna:** Kullanıcı oluştur/sil/şifre sıfırla/listele **yalnızca**
  `admin-operations` Edge Function üzerinden — `service_role` hiçbir zaman tarayıcıya gitmiyor.
  Mimari, stok projesindeki [[Güvenlik-Mimarisi]] kalıbının birebir tekrarı: JWT doğrula →
  `profiles.role='admin'` kontrol et → service role ile işlem yap.
- **Excel export sunucuda:** `exceljs` client bundle'a hiç girmiyor; `/api/export/company/[id]`
  ve `/api/export/all` route handler'ları workbook'u sunucuda üretip indiriyor.
- **"Potansiyel" pipeline kaldırıldı:** Kullanıcı isteğiyle satış-hunisi/durum konsepti UI'dan
  tamamen silindi (tüm 113 firma zaten gerçek müşteri, potansiyel değil). `companies.status`
  DB kolonu bilerek silinmedi — kullanılmıyor ama geri dönüş kolay olsun diye duruyor.
- **Lisans verisi serbest metin:** `software_type` alanı `"aile: etiket"` formatında saklanıyor
  (`solidworks: Standard`, `solidcam: 2.5D Frezeleme, Tornalama` gibi). Formlarda Select yerine
  datalist + serbest metin kullanıldı çünkü 674 kayıtlık gerçek veri zaten serbest metin olarak
  import edildi — zorlayıcı bir seçim listesi mevcut kayıtları düzenlerken uyuşmazlık yaratırdı.

## F0-F8 Tamamlandı

Tüm fazlar bitti: scaffold+tema, Supabase Auth+RLS, tam import (113 firma/674 lisans), dashboard
(KPI+grafik+kritik uyarılar sekmesi), firma liste/detay, yeni/düzenleme formları (dinamik lisans
satırları, dosya yükle/sil), görüşme timeline (ekle/sil, yetki: admin veya kayıt sahibi), admin
kullanıcı yönetimi UI, Excel export (tekil+toplu), ve cilalama: prod build temiz, güvenlik
grep'i temiz, eski/kullanılmayan `public.users` (sha256 auth kalıntısı) tablosu drop edildi.

## Bugün Öğrenilen: "Sayfa geçişleri yavaş" şikayeti

Kullanıcı firma detayına geçişte gözle görülür bekleme fark etti. Canlı dev log'unu okuyarak
teşhis edildi:

```
GET /firmalar/6         200 in 2.6s   (derleme: 947ms, veri: 1659ms)   ← ilk ziyaret
GET /firmalar/6/duzenle 200 in 2.6s   (derleme: 863ms, veri: 1724ms)   ← ilk ziyaret
GET /firmalar/6/duzenle 200 in 1374ms (derleme: 40ms,  veri: 1334ms)   ← ikinci ziyaret
GET /firmalar/6/duzenle 200 in 182ms  (derleme: 40ms,  veri: 142ms)    ← üçüncü ziyaret
```

İki ayrı sebep ayrıştı:

1. **Dev-mode ilk-derleme maliyeti** (~900ms) — `next dev`/Turbopack her rotayı ilk ziyarette
   derliyor. Üretimde (`next build`) bu maliyet hiç yok, yanıltıcıydı.
2. **Gerçek kod verimsizliği** (düzeltildi): `(dashboard)/layout.tsx` her navigasyonda
   `getCurrentUser()` ve `getCriticalAlertsCount()`'u **sırayla** (paralel değil) çekiyordu, sonra
   her sayfa `getCurrentUser()`'ı **ikinci kez** ayrı bir sorguyla tekrar çekiyordu — navigasyon
   başına gereksiz 3 ayrı Supabase gidiş-gelişi. Düzeltme: `getCurrentUser` React `cache()` ile
   sarıldı (`src/lib/auth.ts`) ve layout'taki iki sorgu `Promise.all` ile paralelleştirildi
   (`src/app/(dashboard)/layout.tsx`).

> [!warning] Kalıcı tradeoff: Supabase bölgesi Tokyo
> Proje `ap-northeast-1`'de (ücretsiz plan 2-proje limiti yüzünden Frankfurt'a taşınamadı —
> mevcut projelerden birini silmek ya da paid plan'a geçmek gerekir). Türkiye'den her sorgu
> ~300-500ms ek gecikme taşıyor; ısınmış bağlantıyla bile "veri" süresi bunun altına inmiyor.
> Kullanıcı şimdilik bu haliyle kabul etti ("şimdilik böyle kalsın").

## Bilinen Açık Öğeler

> [!todo] Kalanlar
> - Supabase Dashboard → Authentication'da "Leaked Password Protection" WARN açık — SQL/migration
>   ile kapatılamıyor, manuel Dashboard işlemi gerekiyor.
> - Gerçek tarayıcı oturumuyla uçtan uca test henüz tamamlanmadı (kullanıcı şu an local'de test
>   ediyor) — özellikle dosya yükleme, kullanıcı oluşturma/silme, Excel indirme akışları.
> - Eski Streamlit `lisans_paneli` doğrulama bitince arşive taşınacak.
