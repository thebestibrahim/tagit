"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function CopyLinkButton({
  url,
  label = "Copy link",
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied!" : label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-cream)",
        backgroundColor: copied ? "#ECFDF5" : "transparent",
        color: copied ? "#065F46" : "var(--color-slate)",
        cursor: "pointer",
        fontSize: "var(--text-caption)",
        transition: "background-color 0.15s, color 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? <Check size={12} /> : <Link2 size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}
