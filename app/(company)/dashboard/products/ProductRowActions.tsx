"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pencil, Copy, Link2, Check } from "lucide-react";

export default function ProductRowActions({
  productId,
  scanUrl,
}: {
  productId: string;
  scanUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function go(href: string) {
    return (e: React.MouseEvent) => {
      stop(e);
      setOpen(false);
      router.push(href);
    };
  }

  async function copyLink(e: React.MouseEvent) {
    stop(e);
    if (!scanUrl) return;
    try {
      await navigator.clipboard.writeText(scanUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = scanUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const item: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    textAlign: "left",
    padding: "8px 12px",
    fontSize: "var(--text-body-sm)",
    color: "var(--color-graphite)",
    background: "none",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label="More options"
        onClick={(e) => { stop(e); setOpen((o) => !o); }}
        className="rounded-md"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          background: open ? "var(--color-linen)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-slate)",
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          {/* Outside-click catcher */}
          <div
            onClick={(e) => { stop(e); setOpen(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            onClick={stop}
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              zIndex: 41,
              minWidth: "168px",
              backgroundColor: "var(--color-pearl)",
              border: "1px solid var(--color-cream)",
              borderRadius: "var(--radius-md, 10px)",
              boxShadow: "0 12px 32px rgba(10,10,11,0.14)",
              padding: "4px",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={go(`/dashboard/products/${productId}`)}
              style={item}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-smoke)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Eye size={14} /> View details
            </button>
            <button
              type="button"
              onClick={go(`/dashboard/products/${productId}/edit`)}
              style={item}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-smoke)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              type="button"
              onClick={go(`/dashboard/products/new?from=${productId}`)}
              style={item}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-smoke)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Copy size={14} /> Duplicate
            </button>
            {scanUrl && (
              <button
                type="button"
                onClick={copyLink}
                style={{ ...item, color: copied ? "#065F46" : item.color }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-smoke)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {copied ? <Check size={14} /> : <Link2 size={14} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
