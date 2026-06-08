"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, X, Search } from "lucide-react";
import { toast } from "sonner";
import type { ReplacementReason } from "@/types/database";

const REASONS: { value: ReplacementReason; label: string }[] = [
  { value: "not_scanning", label: "Not scanning" },
  { value: "physically_damaged", label: "Physically damaged" },
  { value: "missing_or_lost", label: "Missing or lost" },
];

export default function ReplaceChipButton({
  productId,
  chip,
  available,
}: {
  productId: string;
  chip: { short_id: string; medium: string };
  available: string[];
}) {
  const router = useRouter();
  const noun = chip.medium === "card" ? "Card" : "Tag";
  const lower = noun.toLowerCase();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReplacementReason>("not_scanning");
  const [shortId, setShortId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      search
        ? available.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
        : available,
    [available, search]
  );

  function close() {
    if (loading) return;
    setOpen(false);
    setError(null);
    setShortId("");
    setSearch("");
    setReason("not_scanning");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shortId.trim()) {
      setError(`Select a replacement ${lower} from your inventory.`);
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/company/products/${productId}/replace-chip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason,
        replacement_short_id: shortId.trim(),
        old_short_id: chip.short_id,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || `Failed to replace ${lower}.`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    setShortId("");
    toast.success("Replaced successfully");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: "var(--text-caption)",
          color: "var(--color-slate)",
        }}
      >
        <RefreshCw size={12} />
        Replace {noun}
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(10,10,11,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Replace ${lower}`}
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "var(--color-pearl)",
              borderRadius: "var(--radius-lg, 14px)",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(10,10,11,0.25)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                color: "var(--color-slate)",
                padding: 0,
              }}
            >
              <X size={18} />
            </button>

            <h2
              className="font-display"
              style={{ fontSize: "20px", color: "var(--color-charcoal)", letterSpacing: "-0.01em", marginBottom: "18px" }}
            >
              Replace {noun}
            </h2>

            <form onSubmit={handleSubmit}>
              <p className="text-micro font-medium uppercase tracking-wider mb-2" style={{ color: "var(--color-slate)" }}>
                Why are you replacing this {lower}?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      fontSize: "var(--text-body-sm)",
                      color: "var(--color-graphite)",
                    }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      disabled={loading}
                    />
                    {r.label}
                  </label>
                ))}
              </div>

              <label
                htmlFor="replacement_short_id"
                className="text-micro font-medium uppercase tracking-wider mb-2 block"
                style={{ color: "var(--color-slate)" }}
              >
                Replacement {lower}
              </label>
              {available.length === 0 ? (
                <p
                  className="w-full rounded-lg p-3"
                  style={{
                    border: "1px dashed var(--color-stone)",
                    fontSize: "var(--text-body-sm)",
                    color: "var(--color-slate)",
                    backgroundColor: "var(--color-smoke)",
                    margin: 0,
                  }}
                >
                  No unassigned {lower}s in your inventory. Add one before replacing.
                </p>
              ) : shortId ? (
                // A choice is made — show it as a chip with a clear button.
                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px 6px 12px",
                      backgroundColor: "var(--color-onyx)",
                      color: "var(--color-pearl)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontFamily: "var(--font-jetbrains-mono)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {shortId}
                    <button
                      type="button"
                      onClick={() => { setShortId(""); setSearch(""); }}
                      disabled={loading}
                      aria-label="Clear selection"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        color: "rgba(250,250,248,0.55)",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={14}
                      style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-mist)", pointerEvents: "none" }}
                    />
                    <input
                      id="replacement_short_id"
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      disabled={loading}
                      autoFocus
                      placeholder={`Search your ${lower}s…`}
                      className="w-full rounded-lg"
                      style={{
                        border: "1px solid var(--color-stone)",
                        padding: "11px 12px 11px 34px",
                        fontSize: "var(--text-body-sm)",
                        color: "var(--color-onyx)",
                        backgroundColor: "#fff",
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
                        borderRadius: "var(--radius-sm, 8px)",
                        backgroundColor: "#fff",
                      }}
                    >
                      {filtered.map((sid) => (
                        <button
                          key={sid}
                          type="button"
                          onClick={() => { setShortId(sid); setSearch(""); setError(null); }}
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
                          {sid}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: "8px", fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                      No match for &ldquo;{search}&rdquo;
                    </p>
                  )}
                </>
              )}

              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)", marginTop: "8px" }}>
                Note: only unassigned {lower}s from your inventory are shown.
              </p>

              {error && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-alert-tint)",
                    border: "1px solid #F0C0C0",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--color-alert)" }}>{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "var(--text-body-sm)",
                    color: "var(--color-slate)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || available.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
                  style={{
                    backgroundColor: "var(--color-onyx)",
                    color: "var(--color-pearl)",
                    border: "none",
                    cursor: loading || available.length === 0 ? "not-allowed" : "pointer",
                    fontSize: "var(--text-body-sm)",
                    opacity: loading || available.length === 0 ? 0.5 : 1,
                  }}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Replace {noun}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
