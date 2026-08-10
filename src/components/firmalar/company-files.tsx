"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { sanitizeFileName } from "@/lib/files";
import type { CompanyDetail } from "@/lib/companies";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Plus } from "lucide-react";

const BUCKET = "firma postlari";

export function CompanyFiles({
  companyId,
  files,
}: {
  companyId: number;
  files: CompanyDetail["files"];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFilesSelected(fileList: FileList | null) {
    const selected = Array.from(fileList ?? []);
    if (selected.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    try {
      for (const file of selected) {
        const path = `${companyId}/${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insertError } = await supabase.from("company_files").insert({
          company_id: companyId,
          file_name: file.name,
          file_url: pub.publicUrl,
        });
        if (insertError) throw insertError;
      }
      toast.success(selected.length > 1 ? "Postlar eklendi." : "Post eklendi.");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Yükleme başarısız oldu.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">Post eklenmemiş.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <a
              key={f.id}
              href={f.fileUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileDown className="size-4" />
              {f.fileName}
            </a>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Post Ekle
      </Button>
    </div>
  );
}
