import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Fluid compute ile global değişkende tutulmaz — her istek için yeni oluşturulur.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // createServerClient ile getClaims() arasına kod eklenmemeli.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isPublicRoute = request.nextUrl.pathname.startsWith("/login");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  // "/" ve eski çıplak yollar (/firmalar, /yeni, ...) next.config.ts'teki
  // redirects() ile /panel altına yönlendiriliyor — proxy sayfası olmayan
  // yollar için hiç çalışmıyor (bkz. Vercel statik 404 kısayolu), o yüzden
  // bu yönlendirme burada değil orada.

  return supabaseResponse;
}
