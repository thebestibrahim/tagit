"use client";

import { useRef, useState, useEffect } from "react";
import { getStroke } from "perfect-freehand";
import { Loader2, Upload, RotateCcw, PenLine, X } from "lucide-react";

// ─── Canvas constants ────────────────────────────────────────────────────────

const CANVAS_W = 560;
const CANVAS_H = 170;

const STROKE_OPTS = {
  size: 5,
  thinning: 0.7,
  smoothing: 0.5,
  streamline: 0.5,
  start: { taper: 40, cap: true },
  end:   { taper: 40, cap: true },
};

// ─── perfect-freehand helper ─────────────────────────────────────────────────

function pathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";
  const d = stroke.reduce<(string | number)[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SignaturePanelProps {
  companyName: string;
  preview: string | null;
  onSave: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SignaturePanel({ companyName, preview, onSave, onRemove }: SignaturePanelProps) {
  const [tab, setTab] = useState<"draw" | "upload">("draw");
  const [strokes, setStrokes] = useState<number[][][]>([]);
  const [currentStroke, setCurrentStroke] = useState<number[][]>([]);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const hasStrokes = strokes.length > 0 || currentStroke.length > 0;

  // ── Canvas setup ───────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
  }, []);

  // Re-render canvas on every stroke change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = dprRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#0A0A0B";

    const all = [...strokes, ...(currentStroke.length > 1 ? [currentStroke] : [])];
    for (const s of all) {
      const outline = getStroke(s, STROKE_OPTS);
      if (outline.length < 2) continue;
      try {
        ctx.fill(new Path2D(pathFromStroke(outline)));
      } catch { /* skip degenerate path */ }
    }
  }, [strokes, currentStroke]);

  // ── Pointer handlers ───────────────────────────────────────────────────────

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>): [number, number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (CANVAS_W / rect.width),
      (e.clientY - rect.top)  * (CANVAS_H / rect.height),
      e.pressure || 0.5,
    ];
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPointerDown(true);
    setCurrentStroke([getPoint(e)]);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isPointerDown) return;
    setCurrentStroke((prev) => [...prev, getPoint(e)]);
  }

  function handlePointerUp() {
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
    setIsPointerDown(false);
  }

  function handleClear() {
    setStrokes([]);
    setCurrentStroke([]);
  }

  // ── Save drawn signature ───────────────────────────────────────────────────

  async function handleSaveDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;
    setIsSaving(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setIsSaving(false); return; }
      try {
        await onSave(new File([blob], "signature.png", { type: "image/png" }));
      } finally {
        setIsSaving(false);
      }
    }, "image/png");
  }

  // ── Upload signature ───────────────────────────────────────────────────────

  async function handleFileChange(file: File) {
    setIsUploading(true);
    try {
      await onSave(file);
    } finally {
      setIsUploading(false);
    }
  }

  // ── Remove ─────────────────────────────────────────────────────────────────

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  }

  // ── Render: preview state ──────────────────────────────────────────────────

  if (preview) {
    return (
      <div>
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid var(--color-stone)",
            borderRadius: 10,
            padding: "20px 32px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 88,
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Signature"
              style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }}
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving}
              style={{
                position: "absolute", top: -8, right: -8,
                width: 20, height: 20, borderRadius: "50%",
                backgroundColor: "var(--color-alert)", border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: isRemoving ? "not-allowed" : "pointer",
              }}
            >
              {isRemoving ? <Loader2 size={9} color="#fff" className="animate-spin" /> : <X size={10} color="#fff" />}
            </button>
          </div>
        </div>
        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
          Remove to replace with a new signature.
        </p>
      </div>
    );
  }

  // ── Render: capture state ──────────────────────────────────────────────────

  return (
    <div>
      {/* Tab switcher */}
      <div
        className="flex gap-1 mb-4 p-1 rounded-lg"
        style={{
          display: "inline-flex",
          backgroundColor: "var(--color-smoke)",
          border: "1px solid var(--color-cream)",
        }}
      >
        {(["draw", "upload"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex items-center gap-1.5 rounded-md font-medium transition-all"
            style={{
              padding: "6px 14px",
              fontSize: "var(--text-body-sm)",
              backgroundColor: tab === t ? "#fff" : "transparent",
              color: tab === t ? "var(--color-charcoal)" : "var(--color-mist)",
              border: "none",
              cursor: "pointer",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t === "draw" ? <PenLine size={13} /> : <Upload size={13} />}
            {t === "draw" ? "Draw" : "Upload"}
          </button>
        ))}
      </div>

      {/* ── Draw tab ────────────────────────────────────────────────────────── */}
      {tab === "draw" && (
        <div>
          <div
            style={{
              position: "relative",
              border: "1.5px dashed var(--color-stone)",
              borderRadius: 10,
              backgroundColor: "#fff",
              overflow: "hidden",
              cursor: "crosshair",
              marginBottom: 10,
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: "block", width: "100%", height: CANVAS_H, touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />

            {/* "Sign here" placeholder — disappears as soon as drawing starts */}
            {!hasStrokes && (
              <div
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: "Georgia,serif",
                    fontStyle: "italic",
                    fontSize: 24,
                    color: "var(--color-mist)",
                    letterSpacing: "-0.01em",
                    marginBottom: 5,
                    lineHeight: 1,
                  }}
                >
                  Sign here…
                </p>
                <p style={{ fontSize: 11, color: "var(--color-mist)", opacity: 0.7 }}>
                  Mouse · trackpad · or stylus
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSaveDrawing}
              disabled={!hasStrokes || isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              style={{
                fontSize: "var(--text-body-sm)",
                backgroundColor: !hasStrokes || isSaving ? "var(--color-stone)" : "var(--color-onyx)",
                color: "var(--color-pearl)",
                border: "none",
                cursor: !hasStrokes || isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              {isSaving ? "Saving…" : "Use this signature"}
            </button>

            {hasStrokes && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                style={{
                  fontSize: "var(--text-body-sm)",
                  backgroundColor: "var(--color-smoke)",
                  color: "var(--color-slate)",
                  border: "1px solid var(--color-cream)",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={12} />
                Clear
              </button>
            )}

            <p style={{ fontSize: 11, color: "var(--color-mist)", marginLeft: "auto" }}>
              Best with a stylus or Apple Pencil
            </p>
          </div>
        </div>
      )}

      {/* ── Upload tab ───────────────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid var(--color-stone)",
              borderRadius: 10,
              padding: "20px 24px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 88,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: "Georgia,serif", fontStyle: "italic",
                fontSize: 20, color: "var(--color-mist)", marginBottom: 4,
              }}>
                Authorized by {companyName}
              </p>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                Default shown if no image is uploaded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
            />
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              style={{
                fontSize: "var(--text-body-sm)",
                backgroundColor: "var(--color-linen)",
                color: "var(--color-graphite)",
                border: "1px solid var(--color-cream)",
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {isUploading ? "Uploading…" : "Upload signature image"}
            </button>
            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
              PNG · transparent background recommended · max 2 MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
