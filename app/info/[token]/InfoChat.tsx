"use client";

import { useState, useRef, useEffect } from "react";

// Calm, editorial "Ask about this piece" chat for the info page. Posts to the
// strictly-grounded /api/info/[token]/chat endpoint. No security iconography —
// this is a reference-information helper, not an authentication tool.

type Msg = { role: "user" | "assistant"; text: string };

export default function InfoChat({
  token,
  personaName,
  accent,
  textPrimary,
  textSecondary,
  background,
  onAccent,
  divider,
}: {
  token: string;
  personaName: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
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
      const reply = res.ok
        ? data.reply
        : "I'm sorry, I can't help with that right now.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "14px 18px",
          borderRadius: 12,
          border: `1px solid ${divider}`,
          backgroundColor: "transparent",
          color: textPrimary,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        Ask about this piece
      </button>
    );
  }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${divider}`, overflow: "hidden", backgroundColor: background }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{personaName}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ border: "none", background: "none", color: textSecondary, fontSize: 18, cursor: "pointer", lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
            Ask me about this piece. I can only share the information recorded for it.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "9px 13px",
              borderRadius: 12,
              fontSize: 13.5,
              lineHeight: 1.5,
              backgroundColor: m.role === "user" ? accent : "rgba(0,0,0,0.04)",
              color: m.role === "user" ? onAccent : textPrimary,
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <span style={{ alignSelf: "flex-start", fontSize: 13, color: textSecondary }}>…</span>
        )}
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
            padding: "10px 12px",
            borderRadius: 9,
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
            padding: "10px 16px",
            borderRadius: 9,
            border: "none",
            backgroundColor: accent,
            color: onAccent,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading || !input.trim() ? "default" : "pointer",
            opacity: loading || !input.trim() ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
