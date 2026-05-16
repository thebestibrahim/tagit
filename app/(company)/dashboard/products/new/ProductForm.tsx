"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { INDUSTRY_FIELDS, groupFields } from "@/lib/industry-fields";
import type { FieldDef } from "@/lib/industry-fields";

const CURRENCIES = [
  "NGN", "USD", "EUR", "GBP", "AED", "CHF", "JPY", "CAD", "AUD", "CNY",
] as const;

type Tag = { id: string; short_id: string; token: string };
type ImageEntry = { file: File; preview: string };

export default function ProductForm({
  tags,
  industry,
  companyId,
}: {
  tags: Tag[];
  industry: string;
  companyId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<typeof CURRENCIES[number]>("NGN");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImageEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const industryFields = INDUSTRY_FIELDS[industry] ?? [];
  const grouped = groupFields(industryFields);

  function setField(key: string, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newEntries: ImageEntry[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (images.length + newEntries.length >= 5) break;
      newEntries.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...newEntries]);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    const supabase = createClient();
    const urls: string[] = [];

    for (const { file } of images) {
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
    if (!selectedTag) { toast.error("Select a tag to link this product."); return; }
    setLoading(true);

    let photoUrls: string[] = [];
    try {
      photoUrls = await uploadImages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/company/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_id: selectedTag,
        company_id: companyId,
        name: name.trim(),
        industry_fields: fields,
        retail_price: price ? parseFloat(price) : null,
        currency,
        photos: photoUrls,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to register product.");
      setLoading(false);
      return;
    }

    toast.success("Product registered successfully.");
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
      return (
        <textarea
          key={field.key}
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          style={{ ...baseStyle, resize: "vertical" }}
        />
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <select
          key={field.key}
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
          required={field.required}
          style={{ ...baseStyle, color: value ? "var(--color-onyx)" : "var(--color-mist)" }}
        >
          <option value="" disabled>Select…</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    return (
      <Input
        key={field.key}
        type={field.type === "number" || field.type === "year" ? "number" : "text"}
        value={value}
        onChange={(e) => setField(field.key, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        min={field.type === "year" ? 1800 : undefined}
        max={field.type === "year" ? new Date().getFullYear() + 2 : undefined}
        style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Link to tag */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>
          Link NFC tag
        </h2>
        <p className="text-body-sm mb-4" style={{ color: "var(--color-slate)" }}>
          Each product must be linked to an unassigned tag.
        </p>
        {tags.length === 0 ? (
          <p style={{ color: "var(--color-alert)", fontSize: "var(--text-body-sm)" }}>
            No unassigned tags available. Ask your Tagit admin to generate a batch.
          </p>
        ) : (
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>Select tag</Label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              required
              style={{
                width: "100%",
                border: "1px solid var(--color-stone)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                fontSize: "var(--text-body-sm)",
                color: selectedTag ? "var(--color-onyx)" : "var(--color-mist)",
                backgroundColor: "var(--color-pearl)",
                fontFamily: selectedTag ? "var(--font-jetbrains-mono)" : "inherit",
                outline: "none",
              }}
            >
              <option value="" disabled>Choose an unassigned tag…</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.short_id}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Product basics */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
          Product basics
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Display name <span style={{ color: "var(--color-alert)" }}>*</span>
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How this product appears to consumers"
              required
              style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)" }}
            />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Retail price
            </Label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as typeof CURRENCIES[number])}
                style={{
                  border: "1px solid var(--color-stone)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
                  fontSize: "var(--text-body-sm)",
                  color: "var(--color-onyx)",
                  backgroundColor: "var(--color-pearl)",
                  fontFamily: "var(--font-jetbrains-mono)",
                  outline: "none",
                  width: "90px",
                  flexShrink: 0,
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 450000"
                min="0"
                step="0.01"
                style={{ backgroundColor: "var(--color-pearl)", borderColor: "var(--color-stone)", color: "var(--color-onyx)", fontSize: "var(--text-body-sm)", flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>
          Product photos
        </h2>
        <p className="text-body-sm mb-4" style={{ color: "var(--color-slate)" }}>
          Up to 5 images. First image shown on the scan page.
        </p>

        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: "96px",
                height: "96px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--color-cream)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL from file input, incompatible with next/image */}
              <img
                src={img.preview}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(10,10,11,0.7)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "var(--radius-md)",
                border: "2px dashed var(--color-stone)",
                backgroundColor: "var(--color-smoke)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <ImagePlus size={20} style={{ color: "var(--color-mist)" }} />
              <span style={{ fontSize: "11px", color: "var(--color-mist)" }}>Add photo</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Industry-specific fields */}
      {Object.entries(grouped).map(([groupName, groupFields]) => (
        <div key={groupName} className="card-raised rounded-xl p-6">
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
            {groupName}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groupFields.map((field) => (
              <div
                key={field.key}
                style={{ gridColumn: field.type === "textarea" ? "1 / -1" : undefined }}
              >
                <div className="space-y-1.5">
                  <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                    {field.label}
                    {field.required && <span style={{ color: "var(--color-alert)" }}> *</span>}
                  </Label>
                  {renderField(field)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={loading || tags.length === 0}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-body-sm"
        style={{
          backgroundColor: loading || tags.length === 0 ? "var(--color-stone)" : "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: loading || tags.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Registering…" : "Register product"}
      </button>
    </form>
  );
}
