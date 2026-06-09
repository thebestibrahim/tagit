"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  // Fixed-position coords for the portalled menu (set from the button's rect).
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function toggle(e: React.MouseEvent) {
    stop(e);
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const itemCount = scanUrl ? 4 : 3;
    const menuH = itemCount * 36 + 8;
    const below = r.bottom + 4;
    // Flip above the trigger if it would overflow the viewport bottom.
    const flipUp = below + menuH > window.innerHeight && r.top - menuH > 8;
    setCoords({
      top: flipUp ? r.top - menuH - 4 : below,
      right: window.innerWidth - r.right,
    });
    setOpen(true);
  }

  // The menu is portalled to <body> with position: fixed, so a scroll or resize
  // would detach it — close on either.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

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
        ref={btnRef}
        type="button"
        aria-label="More options"
        onClick={toggle}
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

      {open && coords && createPortal(
        <>
          {/* Outside-click catcher */}
          <div
            onClick={(e) => { stop(e); setOpen(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
          />
          <div
            onClick={stop}
            role="menu"
            style={{
              position: "fixed",
              top: coords.top,
              right: coords.right,
              zIndex: 9999,
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
        </>,
        document.body
      )}
    </div>
  );
}
