"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Hatalı e-posta veya şifre.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-gradient-to-br from-accent to-background px-14 py-14 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            SÇ
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Lisans Paneli</span>
            <span className="text-xs text-muted-foreground">Sonçağ Mühendislik</span>
          </div>
        </div>
        <div className="relative flex max-w-md flex-col gap-4">
          <span className="font-mono text-[11px] tracking-[0.16em] text-primary">
            LİSANS TAKİP SİSTEMİ
          </span>
          <h1 className="text-[40px] font-semibold leading-[1.08] tracking-tight text-balance">
            Tüm firmalar, tek lisans takvimi.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-balance">
            SolidWorks ve SolidCAM aboneliklerinin yenileme takvimi, görüşme geçmişi ve
            firma dosyaları — hepsi aynı panelde.
          </p>
        </div>
        <span className="relative font-mono text-[11px] text-muted-foreground/60">
          Next.js · Supabase
        </span>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight">Panele giriş</h2>
            <p className="text-sm text-muted-foreground">
              Hesabınız yoksa yöneticinizden talep edin.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Giriş Yap
            </Button>
          </form>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground/70">
            Oturumlar Supabase Auth ile yönetilir. Şifre sıfırlama talebi için panel
            yöneticisine yazın.
          </p>
        </div>
      </div>
    </div>
  );
}
