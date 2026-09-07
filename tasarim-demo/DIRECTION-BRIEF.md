# Yön Kartları — Lisans Paneli Yeniden Tasarımı

Bu klasör canlı koda dokunmaz. Üç bağımsız, tam çalışır HTML demo — karşılaştırma için.
Ürün gerçeği: `../PRODUCT.md`. Mod: **Operate** (6-7 kişilik iç ekip, günlük iş aracı).

Kategori tuzağı (kaçınılan): jenerik SaaS dashboard (sidebar + ikon+başlık kartları + yumuşak
gölgeli KPI kutuları + mavi-mor aksan) — projenin bugünkü hâli tam olarak bu, ve değişmesi
istenen de bu. Karşı-tuzak da kaçınıldı: kategori klişesi kırmak için "koyu tema + neon" da
kendi başına yeni bir klişe.

Ürünün kendi dünyasından türetilen 7 aday (rezonansa göre sıralı):
1. Kalibrasyon/muayene etiketi (renkli geçerlilik bandı — yeşil/amber/kırmızı)
2. Mühendislik çizim antet bloğu (rev/ölçek/çizen/onaylayan + bölge harfleri)
3. Split-flap kalkış panosu (istasyon panosu, süreye göre sıralı satırlar)
4. Parça listesi / malzeme listesi (BOM) defteri
5. CNC/SolidCAM takım yolu — enstrüman okuması (feed/speed, alarm rengi)
6. Lisans/sertifika levhası (resmi mühür, seri no, geçerlilik tarihi)
7. Elektrik pano şeması / server rack directory (numaralı yuva + durum LED'i)

Genel katalog rulosu (seed `d87ba4c6`, mod `operate`) atanan indeks: **5** → bu, kendi
listemdeki CNC/enstrüman okuması adayıyla örtüşüyor (Concept C). Aynı rulonun 6. challenger'ı
(split-flap kalkış panosu) kendi listemde bağımsız olarak zaten 3. sıradaydı — çifte doğrulanmış,
bu yüzden Concept B olarak seçildi. Concept A kendi listemin en yüksek rezonanslı adayı
(impeccable's-pick eşdeğeri). Üç yön birbirinden malzeme ailesi olarak da ayrışıyor: etiket/kağıt
nesnesi (A), mekanik kinetik tabela (B), dijital enstrüman paneli (C).

---

## Concept A — "Kalibrasyon Etiketi"

**THESIS:** Lisans durumu bir SaaS "badge pill" değil, ekipmana asılan gerçek bir muayene
etiketidir — zımba delikli, ipli, renk bantlı. Aynı-boy kart+ikon+başlık şablonu reddedilir.

**OWN-WORLD:** Sayfa zemini nötr atölye grisi (kraft/krem sadece etiketin kendi malzemesinde,
global zemin değil — "sıcak/kitapsı krem" klişesinden kaçınmak için bilinçli sınır). Etiket
gövdesi kraft kartonu, üstte zımba deliği ve ip; durum rengi geçerlilik bandı olarak üstte ince
bir şerit (yeşil/amber/kırmızı), seri no ve tarih monospace (ölçüm enstrümanı geleneği — burada
gerçek ölçüm verisi olduğu için hak edilmiş), firma adı ve etiket başlığı workhorse humanist sans.

**STORY:** Ekip girişte "etiketi sararmış" firmaları bir bakışta görür; her etiket gerçekten
asılı gibi hafif farklı açılarda durur.

**FIRST VIEWPORT:** Üç raf — Kritik / Yakında / Sağlıklı — her rafın altında o durumdaki
firmaların etiketleri asılı. KPI sayıları ayrı kutularda değil, raf başlıklarının parçası.

**SIGNATURE INTERACTION:** Hover'da etiket ipini gerer gibi öne kalkar ve hafif döner (spring,
damping 1.0, response ~0.35s). Tıklamada etiket 3D flip ile çevrilir, arkasında iletişim/görüşme
özeti görünür.

## Concept B — "Sevkiyat Panosu"

**THESIS:** Dashboard'un tamamı bir tren/havaalanı split-flap panosu. Lisanslar kalan süreye göre
sıralı satırlar; en kritik en üstte, tıpkı en yakın kalkış gibi.

**OWN-WORLD:** Koyu çelik gri pano gövdesi, mat siyah flap yüzeyi + beyaz kondanse harfler, amber
gecikme/yakında lambası, kırmızı iptal/expired rengi. Sabit karakter hücreleri, cetvelli
satır/kolon ızgarası kompozisyonun tamamı — kart yok, gölge yok.

**STORY:** "Hangi firma ne zaman kalkıyor (lisansı bitiyor)" bir istasyon panosu gibi okunur.

**FIRST VIEWPORT:** Tam ekran pano; satırlar FİRMA / LİSANS / KALAN SÜRE / DURUM hücrelerinden
oluşur, sayfa yüklenince harfler yukarıdan aşağı sırayla karakter karakter "çözülerek" gerçek
veriye iner (staggered cascade, 30-60ms satır arası).

**SIGNATURE INTERACTION:** Yükleme cascade'i + bir satırın durumu değiştiğinde yalnızca DURUM
hücresinin flap'lenerek güncellenmesi.

## Concept C — "Atölye Enstrüman Paneli"

**THESIS:** Arayüz bir SolidCAM takım yolu simülasyon/kontrol ekranı gibi davranır — sayısal
okumalar CNC feed/speed göstergesi, kritik lisanslar gerçek bir CNC alarmı gibi davranır.

**OWN-WORLD:** Neredeyse siyah panel zemini, ince yeşil/amber fosfor okuma rengi (aksan olarak,
tüm sayfa neon değil), beyaz crosshair/koordinat çizgileri, dar/dikey teknik etiket fontu, 1px
ayraç çizgileri gerçek panel bölmeleri gibi.

**STORY:** Ekip panele "makineyi izler gibi" bakar; kritik lisanslar alarm bölgesinde yanıp söner.

**FIRST VIEWPORT:** Üstte koordinat şeridi (TOPLAM / KRİTİK / YAKINDA — CNC göstergesi rakamlarıyla),
altta firma listesi; kritik satırlar amber/kırmızı alarm çerçevesiyle ayrılır.

**SIGNATURE INTERACTION:** Kritik satırlarda düşük frekanslı alarm pulse (~1.2s, çok hafif);
sayı okumaları değiştiğinde 7-segment sayaç gibi hızlı digit-roll animasyonu.

---

## Ortak teknik disiplin (apple-design + emil-design-eng)

- Sadece `transform`/`opacity` (+ gerekliyse `filter: blur()`) animasyonu; layout tetikleyen
  özellik yok.
- Custom cubic-bezier ease-out (`cubic-bezier(0.23,1,0.32,1)`), asla `ease-in`.
- Buton/etkileşim: `:active` üzerinde `scale(0.97)`, 100-160ms.
- Giriş animasyonları `scale(0)` değil `scale(0.95)+opacity` ile başlar.
- Stagger 30-80ms aralık, asla daha uzun.
- `prefers-reduced-motion` için hareket yerine opacity-only crossfade.
- Hover efektleri `(hover:hover) and (pointer:fine)` ile kapılı.
- Kritik uyarı verisi PRODUCT.md ile birebir: 30 gün kuralı, "aile: etiket" lisans formatı.

FINISH: unreviewed and undocumented is unfinished; bu klasördeki üç demo kullanıcı bir yön
seçtikten sonra gerçek `src/` koduna taşınacak. **2026-09-07: Konsept A ("Kalibrasyon
Etiketi") seçildi ve gerçek `src/` koduna taşınıp canlıya alındı** (bkz. commit
"redesign: canli paneli konsept A ... temasina tasi"). B ve C demoları arşiv/referans
olarak kalıyor.
