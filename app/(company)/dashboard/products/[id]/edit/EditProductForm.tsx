"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { INDUSTRY_FIELDS, groupFields } from "@/lib/industry-fields";
import type { FieldDef } from "@/lib/industry-fields";

type ExistingPhoto = { url: string; toDelete?: boolean };
type NewPhoto = { file: File; preview: string };

export default function EditProductForm({
  product,
  industry,
  companyId,
}: {
  product: {
    id: string;
    name: string;
    retail_price: number | null;
    currency: string;
    industry_fields: Record<string, string>;
    photos: string[];
  };
  industry: string;
  companyId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.retail_price?.toString() ?? "");
  const [fields, setFields] = useState<Record<string, string>>(product.industry_fields ?? {});
  const [existing, setExisting] = useState<ExistingPhoto[]>(
    (product.photos ?? []).map((url) => ({ url }))
  );
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const industryFields = INDUSTRY_FIELDS[industry] ?? [];
  const grouped = groupFields(industryFields);
  const totalPhotos = existing.filter((p) => !p.toDelete).length + newPhotos.length;

  function setField(key: string, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newEntries: NewPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (totalPhotos + newEntries.length >= 5) break;
      newEntries.push({ file, preview: URL.createObjectURL(file) });
    }
    setNewPhotos((prev) => [...prev, ...newEntries]);
  }

  function removeExisting(index: number) {
    setExisting((prev) => prev.map((p, i) => i === index ? { ...p, toDelete: true } : p));
  }

  function removeNew(index: number) {
    setNewPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadNewPhotos(): Promise<string[]> {
    if (newPhotos.length === 0) return [];
    const supabase = createClient();
    const urls: string[] = [];
    for (const { file } of newPhotos) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let newUrls: string[] = [];
    try {
      newUrls = await uploadNewPhotos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
      setLoading(false);
      return;
    }

    const keptUrls = existing.filter((p) => !p.toDelete).map((p) => p.url);
    const photos = [...keptUrls, ...newUrls];

    const res = await fetch(`/api/company/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        retail_price: price ? parseFloat(price) : null,
        industry_fields: fields,
        photos,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to update product.");
      setLoading(false);
      return;
    }

    toast.success("Product updated.");
    router.push("/dashboard/products");
    router.refresh();
  }

  function renderField(field: FieldDef) {
    const value = fields[field.key] ?? "";
    const baseStyle = {
      width: "100%",
      border: "1px solid var(--color-stone)",
      borderRadius: "var(--radius-sm)",
      padding: "8px 12px",
      fontSize: "var(--text-body-sm)",
      color: "var(--color-onyx)",
      backgroundColor: "var(--color-pearl)",
      outline: "none",
    };
    if (field.type === "textarea") {
      return <textarea value={value} onChange={(e) => setField(field.key, e.target.value)} placeholder={field.placeholder} required={field.required} rows={3} style={{ ...baseStyle, resize: "vertical" }} />;
    }
    if (field.type === "select" && field.options) {
      return (
        <select value={value} onChange={(e) => setField(field.key, e.target.value)} required={field.required} style={{ ...baseStyle, color: value ? "var(--color-onyx)" : "var(--color-mist)" }}>
          <option value="" disabled>Select…</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    return <Input type={field.type === "number" || field.type === "year" ? "number" : "text"} value={value} onChange={(e) => setField(field.key, e.target.value)} placeholder={field.placeholder} required={field.required} style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basics */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>Product basics</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>Display name <span style={{ color: "var(--color-alert)" }}>*</span></Label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }} />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>Retail price (NGN)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }} />
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>Product photos</h2>
        <p className="text-body-sm mb-4" style={{ color: "var(--color-slate)" }}>Up to 5 images. First image shown on the scan page.</p>
        <div className="flex flex-wrap gap-3">
          {existing.filter((p) => !p.toDelete).map((img, i) => (
            <div key={i} style={{ position: "relative", width: "96px", height: "96px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-cream)" }}>
              <Image src={img.url} alt="" fill style={{ objectFit: "cover" }} />
              <button type="button" onClick={() => removeExisting(i)} style={{ position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(10,10,11,0.7)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}
          {newPhotos.map((img, i) => (
            <div key={`new-${i}`} style={{ position: "relative", width: "96px", height: "96px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "2px solid var(--color-gold)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL from file input, incompatible with next/image */}
              <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button type="button" onClick={() => removeNew(i)} style={{ position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(10,10,11,0.7)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}
          {totalPhotos < 5 && (
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: "96px", height: "96px", borderRadius: "var(--radius-md)", border: "2px dashed var(--color-stone)", backgroundColor: "var(--color-smoke)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <ImagePlus size={20} style={{ color: "var(--color-mist)" }} />
              <span style={{ fontSize: "11px", color: "var(--color-mist)" }}>Add photo</span>
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Industry fields */}
      {Object.entries(grouped).map(([groupName, groupFields]) => (
        <div key={groupName} className="card-raised rounded-xl p-6">
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>{groupName}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groupFields.map((field) => (
              <div key={field.key} style={{ gridColumn: field.type === "textarea" ? "1 / -1" : undefined }}>
                <div className="space-y-1.5">
                  <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                    {field.label}{field.required && <span style={{ color: "var(--color-alert)" }}> *</span>}
                  </Label>
                  {renderField(field)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-body-sm" style={{ backgroundColor: loading ? "var(--color-stone)" : "var(--color-onyx)", color: "var(--color-pearl)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
