"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Check } from "lucide-react";

type ProductOption = { id: string; name: string; photo: string | null };

export default function NewExhibitionForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give the exhibition a name.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/company/exhibitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          product_ids: [...selected],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create exhibition.");
        return;
      }
      toast.success("Exhibition created.");
      router.push(`/dashboard/exhibitions/${data.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-stone)",
    backgroundColor: "#fff",
    fontSize: "var(--text-body-sm)",
    color: "var(--color-charcoal)",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-body-sm)",
    fontWeight: 500,
    color: "var(--color-charcoal)",
    marginBottom: 6,
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label style={labelStyle}>Exhibition name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lagos Contemporary 2026" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Location <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span></label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lekki Art Pavilion" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Start date <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span></label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>End date <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span></label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Pieces on show</label>
        {products.length === 0 ? (
          <p className="text-body-sm" style={{ color: "var(--color-slate)" }}>
            You have no products yet. You can create the exhibition now and attach products later.
          </p>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1"
          >
            {products.map((p) => {
              const on = selected.has(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="relative text-left rounded-lg overflow-hidden"
                  style={{
                    border: on ? "2px solid var(--color-deep-gold)" : "1px solid var(--color-stone)",
                    backgroundColor: "#fff",
                    padding: 8,
                  }}
                >
                  <div
                    className="w-full rounded mb-2 flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: "1/1", backgroundColor: "var(--color-linen)" }}
                  >
                    {p.photo ? (
                      <Image src={p.photo} alt="" width={120} height={120} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-micro" style={{ color: "var(--color-mist)" }}>No photo</span>
                    )}
                  </div>
                  <span className="block text-micro font-medium truncate" style={{ color: "var(--color-charcoal)" }}>{p.name}</span>
                  {on && (
                    <span
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--color-deep-gold)" }}
                    >
                      <Check size={12} color="#fff" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {selected.size > 0 && (
          <p className="mt-2 text-micro" style={{ color: "var(--color-slate)" }}>{selected.size} selected</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-lg text-body-sm font-medium"
        style={{ backgroundColor: "var(--color-charcoal)", color: "#fff", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Creating…" : "Create exhibition"}
      </button>
    </form>
  );
}
