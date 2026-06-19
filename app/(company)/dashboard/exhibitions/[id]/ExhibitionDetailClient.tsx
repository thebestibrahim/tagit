"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { QrCode, RefreshCw, Download, Link2, Loader2 } from "lucide-react";

export type CodeInfo = {
  id: string;
  status: "active" | "inactive";
  token: string;
  scan_count: number;
  url: string;
};

export type ProductRow = {
  product_id: string;
  name: string;
  photo: string | null;
  code: CodeInfo | null;
};

export default function ExhibitionDetailClient({
  exhibitionId,
  initialProducts,
}: {
  exhibitionId: string;
  initialProducts: ProductRow[];
}) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<"generate" | "download" | null>(null);
  const [regenTarget, setRegenTarget] = useState<ProductRow | null>(null);

  const activeCount = products.filter((p) => p.code?.status === "active").length;
  const anyCode = products.some((p) => p.code);

  function setCode(productId: string, code: CodeInfo | null) {
    setProducts((prev) => prev.map((p) => (p.product_id === productId ? { ...p, code } : p)));
  }

  function downloadLabel(codeId: string) {
    // GET endpoint returns the PDF as an attachment.
    window.open(`/api/company/exhibitions/codes/${codeId}/label`, "_blank");
  }

  async function generate(p: ProductRow) {
    setBusy(p.product_id);
    try {
      const res = await fetch(`/api/company/exhibitions/${exhibitionId}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: p.product_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Failed to generate code."); return; }
      setCode(p.product_id, data.code);
      toast.success("Info code generated.");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(p: ProductRow) {
    if (!p.code) return;
    const next = p.code.status === "active" ? "inactive" : "active";
    setBusy(p.product_id);
    try {
      const res = await fetch(`/api/company/exhibitions/codes/${p.code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Failed to update code."); return; }
      setCode(p.product_id, { ...p.code, status: next });
      toast.success(next === "active" ? "Code is live again." : "Code turned off. It stops working immediately.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmRegenerate() {
    const p = regenTarget;
    if (!p?.code) { setRegenTarget(null); return; }
    setBusy(p.product_id);
    try {
      const res = await fetch(`/api/company/exhibitions/codes/${p.code.id}/regenerate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Failed to regenerate code."); return; }
      setCode(p.product_id, data.code);
      setRegenTarget(null);
      if (data.prompt_label_redownload) {
        toast.success("New code issued. Download and reprint the new label.");
        downloadLabel(data.code.id);
      }
    } finally {
      setBusy(null);
    }
  }

  async function bulkGenerate() {
    setBulkBusy("generate");
    try {
      const res = await fetch(`/api/company/exhibitions/${exhibitionId}/codes/bulk`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Failed to generate codes."); return; }
      const byProduct = new Map<string, CodeInfo>(
        (data.generated as (CodeInfo & { product_id: string })[]).map((c) => [c.product_id, c])
      );
      setProducts((prev) => prev.map((p) => (!p.code && byProduct.has(p.product_id) ? { ...p, code: byProduct.get(p.product_id)! } : p)));
      toast.success(data.count > 0 ? `${data.count} code${data.count === 1 ? "" : "s"} generated.` : "All products already have codes.");
    } finally {
      setBulkBusy(null);
    }
  }

  function bulkDownload() {
    window.open(`/api/company/exhibitions/${exhibitionId}/labels/bulk`, "_blank");
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl py-16 text-center" style={{ border: "1px dashed var(--color-stone)", backgroundColor: "#fff" }}>
        <p className="text-body-sm" style={{ color: "var(--color-slate)" }}>No products attached to this exhibition.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk actions */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={bulkGenerate}
          disabled={bulkBusy !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
          style={{ backgroundColor: "var(--color-charcoal)", color: "#fff", opacity: bulkBusy ? 0.6 : 1 }}
        >
          {bulkBusy === "generate" ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
          Generate codes for all
        </button>
        {anyCode && (
          <button
            type="button"
            onClick={bulkDownload}
            disabled={activeCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
            style={{ border: "1px solid var(--color-stone)", backgroundColor: "#fff", color: "var(--color-charcoal)", opacity: activeCount === 0 ? 0.5 : 1 }}
          >
            <Download size={15} /> Download all labels
          </button>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-stone)", backgroundColor: "#fff" }}>
        {products.map((p, i) => (
          <div
            key={p.product_id}
            className="flex items-center gap-4 px-4 py-3"
            style={{ borderBottom: i < products.length - 1 ? "1px solid var(--color-linen)" : "none" }}
          >
            <div className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-linen)" }}>
              {p.photo ? (
                <Image src={p.photo} alt="" width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <QrCode size={16} style={{ color: "var(--color-mist)" }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium truncate" style={{ color: "var(--color-charcoal)" }}>{p.name}</p>
              <StatusLabel code={p.code} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!p.code ? (
                <button
                  type="button"
                  onClick={() => generate(p)}
                  disabled={busy === p.product_id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-micro font-medium"
                  style={{ backgroundColor: "var(--color-charcoal)", color: "#fff", opacity: busy === p.product_id ? 0.6 : 1 }}
                >
                  {busy === p.product_id ? <Loader2 size={13} className="animate-spin" /> : <QrCode size={13} />}
                  Generate
                </button>
              ) : (
                <>
                  <ToggleSwitch
                    on={p.code.status === "active"}
                    disabled={busy === p.product_id}
                    onChange={() => toggle(p)}
                  />
                  <IconBtn title="Copy public link" onClick={() => copyLink(p.code!.url)}><Link2 size={14} /></IconBtn>
                  <IconBtn title="Download label" onClick={() => downloadLabel(p.code!.id)}><Download size={14} /></IconBtn>
                  <IconBtn title="Regenerate code" onClick={() => setRegenTarget(p)}><RefreshCw size={14} /></IconBtn>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {regenTarget && (
        <RegenerateDialog
          productName={regenTarget.name}
          busy={busy === regenTarget.product_id}
          onCancel={() => setRegenTarget(null)}
          onConfirm={confirmRegenerate}
        />
      )}
    </div>
  );
}

function StatusLabel({ code }: { code: CodeInfo | null }) {
  if (!code) {
    return <span className="text-micro" style={{ color: "var(--color-mist)" }}>No code</span>;
  }
  const active = code.status === "active";
  return (
    <span className="flex items-center gap-1.5 text-micro" style={{ color: "var(--color-slate)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? "#22A06B" : "var(--color-mist)" }} />
      {active ? "Active" : "Off"} · {code.scan_count} scan{code.scan_count === 1 ? "" : "s"}
    </span>
  );
}

function ToggleSwitch({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      title={on ? "Turn off" : "Turn on"}
      style={{
        width: 38,
        height: 22,
        borderRadius: 99,
        border: "none",
        padding: 2,
        cursor: disabled ? "default" : "pointer",
        backgroundColor: on ? "#22A06B" : "var(--color-stone)",
        transition: "background-color 0.15s",
        display: "flex",
        justifyContent: on ? "flex-end" : "flex-start",
        alignItems: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff" }} />
    </button>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-md flex items-center justify-center"
      style={{ border: "1px solid var(--color-stone)", backgroundColor: "#fff", color: "var(--color-slate)" }}
    >
      {children}
    </button>
  );
}

function RegenerateDialog({
  productName,
  busy,
  onCancel,
  onConfirm,
}: {
  productName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,10,11,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: "#fff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-body font-semibold mb-2" style={{ color: "var(--color-charcoal)" }}>
          Regenerate code for “{productName}”?
        </h3>
        <p className="text-body-sm mb-5" style={{ color: "var(--color-slate)", lineHeight: 1.6 }}>
          This issues a brand new QR code and <strong>immediately stops the old printed label from working</strong>.
          Anyone who scans the old placard will see a “no longer active” message. You will be prompted to download
          and reprint the new label right away.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-body-sm font-medium"
            style={{ border: "1px solid var(--color-stone)", backgroundColor: "#fff", color: "var(--color-charcoal)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
            style={{ backgroundColor: "var(--color-charcoal)", color: "#fff", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Regenerate &amp; reprint
          </button>
        </div>
      </div>
    </div>
  );
}
