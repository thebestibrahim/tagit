"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

export type ChipExport = {
  short_id: string;
  medium: string;
  url: string;
};

// Bulk helpers for the manual link-writing process: copy every link at once, or
// download a CSV (ID, Type, Link) to work through chip by chip.
export default function BatchChipsExport({
  chips,
  batchLabel,
}: {
  chips: ChipExport[];
  batchLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const text = chips.map((c) => c.url).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
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

  function downloadCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["ID", "Type", "Link"],
      ...chips.map((c) => [c.short_id, c.medium === "card" ? "Card" : "Tag", c.url]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${batchLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-chips.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copyAll}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-caption)",
          backgroundColor: copied ? "#ECFDF5" : "var(--color-pearl)",
          color: copied ? "#065F46" : "var(--color-graphite)",
          border: "1px solid var(--color-cream)",
          cursor: "pointer",
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy all links"}
      </button>
      <button
        type="button"
        onClick={downloadCsv}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-caption)",
          backgroundColor: "var(--color-pearl)",
          color: "var(--color-graphite)",
          border: "1px solid var(--color-cream)",
          cursor: "pointer",
        }}
      >
        <Download size={13} />
        Export CSV
      </button>
    </div>
  );
}
