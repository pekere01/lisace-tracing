import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sayfası olmayan yollar Vercel'de statik 404'e düşüp proxy.ts'i hiç
  // çalıştırmıyor (proxy sadece filesystem'de gerçekten var olan/dinamik
  // route'lar için tetikleniyor) — bu yüzden /panel altına taşınan eski
  // çıplak yollar burada, proxy'den önce çalışan native redirects ile
  // yönlendiriliyor.
  async redirects() {
    return [
      { source: "/", destination: "/panel", permanent: false },
      { source: "/firmalar", destination: "/panel/firmalar", permanent: false },
      { source: "/firmalar/:path*", destination: "/panel/firmalar/:path*", permanent: false },
      { source: "/yeni", destination: "/panel/yeni", permanent: false },
      { source: "/uyarilar", destination: "/panel/uyarilar", permanent: false },
      { source: "/kullanicilar", destination: "/panel/kullanicilar", permanent: false },
    ];
  },
};

export default nextConfig;
