# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sonçağ Mühendislik bünyesinde 6-7 kişilik küçük bir iç ekip (satış/destek/yönetim). Herkes
kimliklendirilmiş, güvenilir bir kullanıcı grubu — dış müşteri veya halka açık kullanıcı yok.
Günlük iş: firma/lisans portföyünü takip etmek, süresi yaklaşan/geçen lisansları önceden görüp
müşteriyle iletişime geçmek, görüşme geçmişini kayıt altına almak.

## Product Purpose

SolidWorks/SolidCAM/Cimatron lisans bayiliği yapan Sonçağ Mühendislik için CRM + lisans takip
aracı. Firma listesi, her firmanın lisansları ve bitiş tarihleri, iletişim bilgileri, görüşme
geçmişi ve dosyalar tek panelde toplanıyor. Kritik uyarı tanımı: 30 gün içinde bitecek veya
bitmiş lisans. Başarı = ekibin lisans yenileme fırsatını kaçırmadan önce görmesi.

## Positioning

Dış pazara satılan bir ürün değil; Sonçağ'a özel, gerçek Dynamics CRM verisiyle (113 firma, 674
lisans) doldurulmuş içsel operasyon aracı. Eski Streamlit sürümünün yerini aldı (görsel olarak
yetersiz kalınca Next.js'e geçildi).

## Operating Context

- Ekip firma detayına girip lisans ekliyor/düzenliyor, dosya yüklüyor, görüşme notu düşüyor.
- Dashboard'da KPI + grafik + "kritik uyarılar" sekmesi ana giriş noktası.
- Admin rolü ayrı: kullanıcı oluşturma/silme/şifre sıfırlama yalnızca admin'e açık.
- Lisans verisi (`software_type`) serbest metin olarak tutuluyor (`solidworks: Standard` gibi) —
  674 kayıtlık gerçek veri zaten bu formatta, katı bir seçim listesine zorlanmadı.
- Excel export (tekil firma + toplu) sık kullanılan bir çıktı formu.
- Supabase bölgesi Tokyo (ap-northeast-1) — Türkiye'den sorgu başına ~300-500ms ek gecikme var,
  kullanıcı bunu şimdilik kabul etti; tasarım bu gecikmeyi gizleyecek/algıyı yumuşatacak yükleme
  durumları (iskelet/loading state) gerektirir.

## Capabilities and Constraints

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4 + shadcn/ui + Supabase
  (Auth + Postgres + Storage + Edge Functions), `@supabase/ssr`.
- RLS modeli: küçük güvenilir ekip olduğu için satır bazlı kısıtlama yok
  (`for all to authenticated using (true)`); CRUD tarayıcıdan doğrudan Supabase çağrısı.
- Admin işlemleri (`service_role` gerektiren) yalnızca `admin-operations` Edge Function
  üzerinden yapılıyor — service_role hiçbir zaman tarayıcıya gitmiyor. Bu sınır tasarım
  değişikliğinde de korunmalı.
- Excel export sunucu tarafında (`exceljs` client bundle'a girmiyor).
- "Potansiyel" satış hunisi konsepti kullanıcı isteğiyle UI'dan tamamen kaldırıldı — tüm firmalar
  zaten gerçek müşteri. Yeni tasarım bunu geri getirmemeli.
- Canlı: https://lisace-tracing.vercel.app. Repo: `pekere01/lisace-tracing`.

## Brand Commitments

Yok — Sonçağ Mühendistlik'e ait korunması gereken logo/kurumsal renk/font yok (kullanıcı
tarafından doğrulandı). `public/` içinde yalnızca Next.js varsayılan ikonları var. Görsel yön
tamamen serbest.

## Evidence on Hand

Gerçek üretim verisi: 113 firma, 674 lisans, Dynamics CRM Excel export'undan import edildi.
Kurgusal test verisi eklenmemeli — tasarım demoları gerçek veri şekline (firma adı, lisans
tarihi formatı, "aile: etiket" software_type deseni) sadık kalmalı.

## Product Principles

1. Küçük güvenilir ekip aracı — karmaşık rol/izin UI'ı yerine hız ve netlik önceliklidir.
2. Kritik uyarı (bitmek üzere/bitmiş lisans) ürünün kalbi — her tasarımda görünürlüğü en yüksek
   öğelerden biri olmalı, gözden kaçmamalı.
3. Ağ gecikmesi (Tokyo bölgesi) yapısal bir gerçek — algılanan hızı yükleme durumlarıyla/iskelet
   ekranlarla yönetmek tasarımın parçası, gizlenecek bir kusur değil.
4. Serbest metin lisans verisi gerçek dünya dağınıklığını yansıtıyor — tasarım bunu zorlayıcı
   seçim kutularıyla "düzeltmeye" çalışmamalı.
5. İç araç kimliği — pazarlama/persuade estetiği değil, günlük operasyonu hızlandıran bir "Operate"
   yüzeyi.

## Accessibility & Inclusion

Belirli bir standart talep edilmedi; bilinen özel bir erişilebilirlik ihtiyacı yok.
