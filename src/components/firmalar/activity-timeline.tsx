"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { CompanyDetail } from "@/lib/companies";
import type { CurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";

const ACTIVITY_TYPE_SUGGESTIONS = ["Telefon", "Ziyaret", "E-posta", "Toplantı", "Diğer"];

export function ActivityTimeline({
  companyId,
  activities,
  currentUser,
}: {
  companyId: number;
  activities: CompanyDetail["activities"];
  currentUser: CurrentUser | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [activityType, setActivityType] = useState("Telefon");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Not boş olamaz.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("company_activities").insert({
      company_id: companyId,
      activity_type: activityType.trim() || null,
      activity_date: activityDate || null,
      note: note.trim(),
      author: currentUser?.username ?? null,
    });
    setSubmitting(false);

    if (error) {
      console.error(error);
      toast.error("Görüşme eklenemedi.");
      return;
    }

    toast.success("Görüşme eklendi.");
    setNote("");
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("company_activities").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      console.error(error);
      toast.error("Kayıt silinemedi.");
      return;
    }

    toast.success("Kayıt silindi.");
    router.refresh();
  }

  function canDelete(author: string | null) {
    if (!currentUser) return false;
    return currentUser.role === "admin" || author === currentUser.username;
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz bir görüşme kaydı bulunmuyor.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activities.map((a) => (
            <div
              key={a.id}
              className="group flex items-start justify-between gap-2 rounded-md border-l-2 border-primary bg-muted/40 px-3 py-2"
            >
              <div>
                <p className="text-xs text-muted-foreground">
                  {a.activityDate} · {a.author} · {a.activityType}
                </p>
                <p className="mt-0.5 text-sm">{a.note}</p>
              </div>
              {canDelete(a.author) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  disabled={deletingId === a.id}
                  onClick={() => handleDelete(a.id)}
                >
                  {deletingId === a.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          <div className="flex gap-2">
            <Input
              list="activity-type-suggestions"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              placeholder="Tür (Telefon, Ziyaret...)"
              className="flex-1"
            />
            <Input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-40"
            />
          </div>
          <datalist id="activity-type-suggestions">
            {ACTIVITY_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Görüşme notu..."
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          Görüşme Ekle
        </Button>
      )}
    </div>
  );
}
