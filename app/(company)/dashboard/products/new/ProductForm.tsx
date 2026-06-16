"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ImagePlus, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDUSTRY_FIELDS, groupFields } from "@/lib/industry-fields";
import type { FieldDef } from "@/lib/industry-fields";

const CURRENCIES = [
  "NGN", "USD", "EUR", "GBP", "AED", "CHF", "JPY", "CAD", "AUD", "CNY",
] as const;

type Item = { id: string; short_id: string; token: string };
type ImageEntry = { file: File; preview: string };

export type ProductDefaults = {
  name: string;
  price: string;
  currency: string;
  fields: Record<string, string>;
  photos: string[];
};

const MAX_PHOTOS = 5;

export default function ProductForm({
  tags,
  cards,
  industry,
  companyId,
  defaults,
}: {
  tags: Item[];
  cards: Item[];
  industry: string;
  companyId: string;
  defaults?: ProductDefaults;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [name, setName] = useState(defaults?.name ?? "");
  const [price, setPrice] = useState(defaults?.price ?? "");
  const [currency, setCurrency] = useState<typeof CURRENCIES[number]>(
    (CURRENCIES as readonly string[]).includes(defaults?.currency ?? "")
      ? (defaults!.currency as typeof CURRENCIES[number])
      : "NGN"
  );
  const [fields, setFields] = useState<Record<string, string>>(defaults?.fields ?? {});
  // Photos already uploaded on the source product (duplicate flow). They reuse
  // the same storage URLs; new uploads are appended on submit.
  const [existingPhotos, setExistingPhotos] = useState<string[]>(defaults?.photos ?? []);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoCount = existingPhotos.length + images.length;

  const industryFields = INDUSTRY_FIELDS[industry] ?? [];
  const grouped = groupFields(industryFields);

  // Tag IDs + the (optional) single card ID — both go to the API as tag_ids;
  // the API/DB enforce at most one card per product.
  const selectedIds = useMemo(
    () => [...selectedTagIds, ...(selectedCardId ? [selectedCardId] : [])],
    [selectedTagIds, selectedCardId]
  );

  function setField(key: string, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newEntries: ImageEntry[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (existingPhotos.length + images.length + newEntries.length >= MAX_PHOTOS) break;
      newEntries.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...newEntries]);
  }

  function removeExistingPhoto(index: number) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    const urls: string[] = [];

    // Upload through the server route so each image is validated by its real
    // bytes (rejects non-images / SVG) before it reaches the public bucket.
    for (const { file } of images) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/company/products/upload-image", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      urls.push(json.url);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) { toast.error("Select at least one tag or card to link this product."); return; }
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
        tag_ids: selectedIds,
        company_id: companyId,
        name: name.trim(),
        industry_fields: fields,
        retail_price: price ? parseFloat(price) : null,
        currency,
        photos: [...existingPhotos, ...photoUrls],
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
      {/* Link tags & cards */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>
          Link tags &amp; cards
        </h2>
        <p className="text-body-sm mb-5" style={{ color: "var(--color-slate)" }}>
          Attach one or more tags, and optionally a card, to this product.
        </p>

        {tags.length === 0 && cards.length === 0 ? (
          <p style={{ color: "var(--color-alert)", fontSize: "var(--text-body-sm)" }}>
            No unassigned tags or cards available. Request a batch from the ID Keys section.
          </p>
        ) : (
          <div className="space-y-5">
            <KeyPicker
              label="Tags"
              hint="Select one or more to link to this product."
              items={tags}
              selected={selectedTagIds}
              onAdd={(id) => setSelectedTagIds((p) => [...p, id])}
              onRemove={(id) => setSelectedTagIds((p) => p.filter((i) => i !== id))}
              searchPlaceholder="Search tags…"
              emptyText="No unassigned tags available."
              noneText="No tags selected yet."
            />
            <KeyPicker
              label="Card"
              hint="A product can have at most one card (optional)."
              items={cards}
              selected={selectedCardId ? [selectedCardId] : []}
              single
              onAdd={(id) => setSelectedCardId(id)}
              onRemove={() => setSelectedCardId(null)}
              searchPlaceholder="Search cards…"
              emptyText="No unassigned cards available."
              noneText="No card selected."
            />
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
          {existingPhotos.map((url, i) => (
            <div
              key={`existing-${i}`}
              style={{
                position: "relative",
                width: "96px",
                height: "96px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--color-cream)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- existing public URL carried over from the source product */}
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => removeExistingPhoto(i)}
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

          {photoCount < MAX_PHOTOS && (
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
        disabled={loading || selectedIds.length === 0}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-body-sm"
        style={{
          backgroundColor: loading || selectedIds.length === 0 ? "var(--color-stone)" : "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: loading || selectedIds.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Registering…" : "Register product"}
      </button>
    </form>
  );
}

/**
 * Search + select picker for tags or cards. `single` makes it a one-pick control
 * (selecting replaces the current choice) for the one-card-per-product rule.
 */
function KeyPicker({
  label,
  hint,
  items,
  selected,
  single = false,
  onAdd,
  onRemove,
  searchPlaceholder,
  emptyText,
  noneText,
}: {
  label: string;
  hint: string;
  items: Item[];
  selected: string[];
  single?: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  searchPlaceholder: string;
  emptyText: string;
  noneText: string;
}) {
  const [search, setSearch] = useState("");

  const available = useMemo(
    () => items.filter((t) => !selected.includes(t.id)),
    [items, selected]
  );
  const filtered = useMemo(
    () => (search ? available.filter((t) => t.short_id.toLowerCase().includes(search.toLowerCase())) : available),
    [available, search]
  );

  // In single mode, hide the search/list once a choice is made (remove to change).
  const showList = single ? selected.length === 0 : true;

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-body-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>{label}</span>
        <span style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>{hint}</span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>{emptyText}</p>
      ) : (
        <div>
          {selected.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {selected.map((id) => {
                const t = items.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 10px 4px 12px",
                      backgroundColor: "var(--color-onyx)",
                      color: "var(--color-pearl)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontFamily: "var(--font-jetbrains-mono)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {t?.short_id}
                    <button
                      type="button"
                      onClick={() => onRemove(id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(250,250,248,0.55)",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {showList && (
            <>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-mist)", pointerEvents: "none" }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    width: "100%",
                    border: "1px solid var(--color-stone)",
                    borderRadius: "var(--radius-sm)",
                    padding: "9px 12px 9px 34px",
                    fontSize: "var(--text-body-sm)",
                    color: "var(--color-onyx)",
                    backgroundColor: "var(--color-pearl)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {filtered.length > 0 ? (
                <div
                  style={{
                    marginTop: "6px",
                    maxHeight: "180px",
                    overflowY: "auto",
                    border: "1px solid var(--color-stone)",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--color-pearl)",
                  }}
                >
                  {filtered.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { onAdd(t.id); setSearch(""); }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 14px",
                        fontSize: "13px",
                        fontFamily: "var(--font-jetbrains-mono)",
                        letterSpacing: "0.04em",
                        color: "var(--color-graphite)",
                        backgroundColor: "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--color-cream)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-smoke)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                    >
                      {t.short_id}
                    </button>
                  ))}
                </div>
              ) : search ? (
                <p style={{ marginTop: "8px", fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                  No match for &ldquo;{search}&rdquo;
                </p>
              ) : null}
            </>
          )}

          {selected.length === 0 && (
            <p style={{ marginTop: "8px", fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
              {noneText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
