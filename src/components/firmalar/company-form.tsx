"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatSoftwareType, SOLIDWORKS_TIERS, SOLIDCAM_MODULES } from "@/lib/licenses";
import { sanitizeFileName, storagePathFromPublicUrl } from "@/lib/files";
import type { CompanyDetail } from "@/lib/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Plus, Trash2, FileDown, X } from "lucide-react";

const BUCKET = "firma postlari";

type LicenseRow = {
  key: string;
  family: string;
  label: string;
  serialNumber: string;
  date: string;
  isTrial: boolean;
};

function newLicenseRow(): LicenseRow {
  return {
    key: crypto.randomUUID(),
    family: "solidworks",
    label: "",
    serialNumber: "",
    date: "",
    isTrial: false,
  };
}

function licenseRowsFromDetail(company: CompanyDetail): LicenseRow[] {
  return company.licenses.map((l) => ({
    key: crypto.randomUUID(),
    family: l.family,
    label: l.label,
    serialNumber: l.serialNumber ?? "",
    date: l.subDate ?? l.trialDate ?? "",
    isTrial: !l.subDate && !!l.trialDate,
  }));
}

const LABEL_SUGGESTIONS = [...SOLIDWORKS_TIERS, ...SOLIDCAM_MODULES];

export function CompanyForm({
  mode,
  company,
  currentUsername,
}: {
  mode: "create" | "edit";
  company?: CompanyDetail;
  currentUsername: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(company?.name ?? "");
  const [address, setAddress] = useState(company?.address ?? "");
  const [contactFullName, setContactFullName] = useState(company?.contact?.fullName ?? "");
  const [contactPhone, setContactPhone] = useState(company?.contact?.phone ?? "");
  const [noteAuthor, setNoteAuthor] = useState(company?.note?.author ?? "");
  const [noteText, setNoteText] = useState(company?.note?.note ?? "");
  const [licenses, setLicenses] = useState<LicenseRow[]>(() =>
    company ? licenseRowsFromDetail(company) : [newLicenseRow()]
  );

  const [existingFiles, setExistingFiles] = useState(company?.files ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);

  function updateLicense(key: string, patch: Partial<LicenseRow>) {
    setLicenses((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeLicense(key: string) {
    setLicenses((rows) => rows.filter((r) => r.key !== key));
  }

  async function handleDeleteExistingFile(file: { id: number; fileName: string | null; fileUrl: string | null }) {
    setDeletingFileId(file.id);
    const supabase = createClient();
    try {
      if (file.fileUrl) {
        const path = storagePathFromPublicUrl(file.fileUrl, BUCKET);
        if (path) {
          await supabase.storage.from(BUCKET).remove([path]);
        }
      }
      const { error } = await supabase.from("company_files").delete().eq("id", file.id);
      if (error) throw error;
      setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success("Dosya silindi.");
    } catch (err) {
      console.error(err);
      toast.error("Dosya silinemedi.");
    } finally {
      setDeletingFileId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Firma adı zorunlu.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      let companyId = company?.id;
      const companyPayload = {
        name: name.trim(),
        address: address.trim() || null,
        last_edited_by: currentUsername,
        last_edit_details:
          mode === "create" ? "Panelden oluşturuldu" : "Panelden güncellendi",
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("companies")
          .insert(companyPayload)
          .select("id")
          .single();
        if (error) throw error;
        companyId = data.id;
      } else {
        const { error } = await supabase
          .from("companies")
          .update(companyPayload)
          .eq("id", companyId!);
        if (error) throw error;
      }

      await supabase.from("contacts").delete().eq("company_id", companyId!);
      if (contactFullName.trim() || contactPhone.trim()) {
        const { error } = await supabase.from("contacts").insert({
          company_id: companyId!,
          full_name: contactFullName.trim() || null,
          phone: contactPhone.trim() || null,
        });
        if (error) throw error;
      }

      await supabase.from("company_notes").delete().eq("company_id", companyId!);
      if (noteAuthor.trim() || noteText.trim()) {
        const { error } = await supabase.from("company_notes").insert({
          company_id: companyId!,
          author: noteAuthor.trim() || null,
          note: noteText.trim() || null,
        });
        if (error) throw error;
      }

      await supabase.from("licenses").delete().eq("company_id", companyId!);
      const licenseRows = licenses
        .filter((l) => l.family.trim())
        .map((l) => ({
          company_id: companyId!,
          software_type: formatSoftwareType(l.family.trim(), l.label.trim()),
          serial_number: l.serialNumber.trim() || null,
          sub_date: l.isTrial ? null : l.date || null,
          trial_date: l.isTrial ? l.date || null : null,
        }));
      if (licenseRows.length > 0) {
        const { error } = await supabase.from("licenses").insert(licenseRows);
        if (error) throw error;
      }

      for (const file of newFiles) {
        const path = `${companyId}/${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insertError } = await supabase.from("company_files").insert({
          company_id: companyId!,
          file_name: file.name,
          file_url: pub.publicUrl,
        });
        if (insertError) throw insertError;
      }

      await supabase.from("company_activities").insert({
        company_id: companyId!,
        activity_type: mode === "create" ? "Oluşturuldu" : "Güncellendi",
        activity_date: new Date().toISOString().slice(0, 10),
        author: currentUsername,
        note:
          mode === "create"
            ? "Firma panelden oluşturuldu."
            : "Firma bilgileri güncellendi.",
      });

      toast.success(mode === "create" ? "Firma oluşturuldu." : "Firma güncellendi.");
      router.push(`/firmalar/${companyId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Firma Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Firma Adı *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Adres</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactFullName">Yetkili</Label>
            <Input
              id="contactFullName"
              value={contactFullName}
              onChange={(e) => setContactFullName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactPhone">Telefon</Label>
            <Input
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Not</CardTitle>
          <CardDescription>Serbest metin CRM notu</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="noteAuthor">Yazan</Label>
            <Input
              id="noteAuthor"
              value={noteAuthor}
              onChange={(e) => setNoteAuthor(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="noteText">Not</Label>
            <Textarea
              id="noteText"
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Lisanslar</CardTitle>
            <CardDescription>SolidWorks, SolidCAM ve diğer ürün lisansları</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLicenses((rows) => [...rows, newLicenseRow()])}
          >
            <Plus className="size-4" />
            Lisans Ekle
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {licenses.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz lisans satırı yok.</p>
          )}
          {licenses.map((l) => {
            const serialLabel = l.family.trim().toLowerCase().startsWith("solidcam")
              ? "Dongle No"
              : "Seri No";
            return (
            <div
              key={l.key}
              className="grid gap-3 rounded-md border border-border/60 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]"
            >
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Ürün</Label>
                <Input
                  list="family-suggestions"
                  value={l.family}
                  onChange={(e) => updateLicense(l.key, { family: e.target.value })}
                  placeholder="solidworks"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Tip / Modül</Label>
                <Input
                  list="label-suggestions"
                  value={l.label}
                  onChange={(e) => updateLicense(l.key, { label: e.target.value })}
                  placeholder="Standard"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">{serialLabel}</Label>
                <Input
                  value={l.serialNumber}
                  onChange={(e) => updateLicense(l.key, { serialNumber: e.target.value })}
                  placeholder={serialLabel}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={l.date}
                  onChange={(e) => updateLicense(l.key, { date: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2 pb-1.5">
                <Checkbox
                  id={`trial-${l.key}`}
                  checked={l.isTrial}
                  onCheckedChange={(v) => updateLicense(l.key, { isTrial: v === true })}
                />
                <Label htmlFor={`trial-${l.key}`} className="text-xs text-muted-foreground">
                  Deneme
                </Label>
              </div>
              <div className="flex items-end justify-end pb-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLicense(l.key)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            );
          })}
          <datalist id="family-suggestions">
            <option value="solidworks" />
            <option value="solidcam" />
            <option value="solidcam_deneme" />
            <option value="cimatron" />
          </datalist>
          <datalist id="label-suggestions">
            {LABEL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dosyalar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {existingFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              {existingFiles.map((f) => {
                const ext = (f.fileName?.split(".").pop() ?? "?").slice(0, 4).toUpperCase();
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-2.5 rounded-md border border-border bg-secondary/60 px-2.5 py-2 text-sm"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[9px] font-semibold text-muted-foreground">
                      {ext}
                    </span>
                    <a
                      href={f.fileUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-primary hover:underline"
                    >
                      {f.fileName}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={deletingFileId === f.id}
                      onClick={() => handleDeleteExistingFile(f)}
                    >
                      {deletingFileId === f.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <X className="size-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <Input
            type="file"
            multiple
            onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          />
          {newFiles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {newFiles.length} dosya yüklenmeye hazır.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Firmayı Oluştur" : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
