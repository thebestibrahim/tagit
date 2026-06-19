"use client";

import { useState, useRef, useEffect } from "react";

// Calm "Ask about this piece" panel for the info page. Posts to the strictly
// grounded /api/info/[token]/chat endpoint. Fully palette-driven and free of any
// security iconography — a reference helper, not an authentication tool.

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISPLAY = "'Instrument Serif', Georgia, serif";

type Msg = { role: "user" | "assistant"; text: string };

export default function InfoChat({
  token,
  personaName,
  accent,
  textPrimary,
  textSecondary,
  background,
  surface,
  onAccent,
  divider,
}: {
  token: string;
  personaName: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
  surface: string;
  onAccent: string;
  divider: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/info/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok ? data.reply : "I'm sorry, I can't help with that right now.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="info-ask"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            width: "100%",
            padding: "16px 18px",
            border: `1px solid ${divider}`,
            backgroundColor: surface,
            color: textPrimary,
            cursor: "pointer",
            textAlign: "left",
            borderRadius: 3,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, backgroundColor: accent, transform: "rotate(45deg)" }} />
            <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 17 }}>Ask about this piece</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: textSecondary }}>→</span>
        </button>
        <style>{`
          .info-ask { transition: border-color 200ms ease, transform 200ms ease; }
          .info-ask:hover { border-color: ${accent}; }
          .info-ask:active { transform: translateY(1px); }
          .info-ask:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
        `}</style>
      </>
    );
  }

  return (
    <div style={{ border: `1px solid ${divider}`, borderRadius: 3, overflow: "hidden", backgroundColor: surface }}>
      <div
        style={{
          padding: "13px 16px",
          borderBottom: `1px solid ${divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ display: "inline-block", width: 5, height: 5, backgroundColor: accent, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: textSecondary }}>
            {personaName}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ border: "none", background: "none", color: textSecondary, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ maxHeight: 300, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 11 }}>
        {messages.length === 0 && (
          <p style={{ margin: 0, fontSize: 13.5, color: textSecondary, lineHeight: 1.6 }}>
            Ask about this piece. I can share only the information recorded for it.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "86%",
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 13.5,
              lineHeight: 1.5,
              backgroundColor: m.role === "user" ? accent : background,
              border: m.role === "user" ? "none" : `1px solid ${divider}`,
              color: m.role === "user" ? onAccent : textPrimary,
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <span style={{ alignSelf: "flex-start", fontSize: 16, color: textSecondary, letterSpacing: 2 }}>···</span>}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${divider}` }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask a question…"
          style={{
            flex: 1,
            padding: "11px 13px",
            borderRadius: 3,
            border: `1px solid ${divider}`,
            backgroundColor: background,
            color: textPrimary,
            fontSize: 13.5,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "11px 16px",
            borderRadius: 3,
            border: "none",
            backgroundColor: accent,
            color: onAccent,
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: loading || !input.trim() ? "default" : "pointer",
            opacity: loading || !input.trim() ? 0.55 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
