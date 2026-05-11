"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Bot, Mic, Volume2, Play, Square } from "lucide-react";
import { Label } from "@/components/ui/label";

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — Calm, professional (female)" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam — Deep, authoritative (male)" },
  { id: "AZnzlk1XvdvUeBnXmlld", label: "Domi — Natural, energetic (female)" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh — Warm, conversational (male)" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella — Soft, elegant (female)" },
];

type InitialValues = {
  ai_enabled: boolean;
  ai_persona_name: string;
  ai_persona_prompt: string;
  ai_persona_voice_id: string;
  elevenlabs_api_key: string;
};

export default function PersonaForm({ initialValues }: { initialValues: InitialValues }) {
  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useState<HTMLAudioElement | null>(null);

  async function previewVoice(voiceId: string) {
    // Stop current if playing
    if (audioRef[0]) { audioRef[0].pause(); audioRef[0] = null; }
    if (playingVoice === voiceId) { setPlayingVoice(null); return; }

    setPlayingVoice(voiceId);
    try {
      const res = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_id: voiceId }),
      });
      if (!res.ok) { toast.error("Could not play voice sample."); setPlayingVoice(null); return; }
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef[0] = audio;
      audio.onended = () => { setPlayingVoice(null); audioRef[0] = null; };
      audio.play();
    } catch {
      toast.error("Could not play voice sample.");
      setPlayingVoice(null);
    }
  }

  function set(field: keyof InitialValues, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/company/ai-persona", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      toast.success("AI persona saved.");
    } else {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Failed to save.");
    }
  }

  const inputStyle = {
    width: "100%",
    border: "1px solid var(--color-stone)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 12px",
    fontSize: "var(--text-body-sm)",
    color: "var(--color-onyx)",
    backgroundColor: "var(--color-pearl)",
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Enable toggle */}
      <div
        className="flex items-center justify-between rounded-xl px-5 py-4"
        style={{ border: "1px solid var(--color-cream)", backgroundColor: form.ai_enabled ? "var(--color-verified-tint)" : "var(--color-smoke)" }}
      >
        <div className="flex items-center gap-3">
          <Bot size={20} style={{ color: form.ai_enabled ? "var(--color-verified)" : "var(--color-slate)" }} />
          <div>
            <p className="font-semibold" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
              {form.ai_enabled ? "AI Persona is active" : "AI Persona is disabled"}
            </p>
            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
              {form.ai_enabled ? "Customers can talk to your brand on scan pages" : "Enable to show a voice assistant on scan pages"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => set("ai_enabled", !form.ai_enabled)}
          style={{
            width: "44px",
            height: "24px",
            borderRadius: "999px",
            backgroundColor: form.ai_enabled ? "var(--color-verified)" : "var(--color-stone)",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background-color 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "3px",
              left: form.ai_enabled ? "23px" : "3px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      {/* Persona name */}
      <div className="space-y-1.5">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Persona name
        </Label>
        <input
          type="text"
          value={form.ai_persona_name}
          onChange={(e) => set("ai_persona_name", e.target.value)}
          placeholder="e.g. Aria, Atlas, Maison"
          style={inputStyle}
        />
        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
          The name customers will see and hear on the scan page.
        </p>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Voice <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>— powered by ElevenLabs</span>
        </Label>
        <div className="space-y-2">
          {VOICES.map((v) => (
            <div
              key={v.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${form.ai_persona_voice_id === v.id ? "var(--color-gold)" : "var(--color-cream)"}`,
                backgroundColor: form.ai_persona_voice_id === v.id ? "var(--color-soft-gold)" : "var(--color-pearl)",
                cursor: "pointer",
              }}
              onClick={() => set("ai_persona_voice_id", v.id)}
            >
              <Volume2 size={14} style={{ color: form.ai_persona_voice_id === v.id ? "var(--color-gold)" : "var(--color-slate)", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>{v.label}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); previewVoice(v.id); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-stone)",
                  backgroundColor: "var(--color-pearl)",
                  cursor: "pointer",
                  fontSize: "11px",
                  color: "var(--color-graphite)",
                  flexShrink: 0,
                }}
              >
                {playingVoice === v.id
                  ? <><Square size={10} fill="currentColor" /> Stop</>
                  : <><Play size={10} fill="currentColor" /> Play</>
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System prompt */}
      <div className="space-y-1.5">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          Persona instructions
        </Label>
        <textarea
          value={form.ai_persona_prompt}
          onChange={(e) => set("ai_persona_prompt", e.target.value)}
          placeholder={`e.g. You are Aria, the voice of Maison Lagos. You speak with warmth and deep expertise about our handcrafted leather goods. Keep responses concise — no more than 2-3 sentences. You are proud, elegant, and helpful.`}
          rows={5}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
          Product details, brand story, and ownership info are automatically included. Just describe the tone and persona.
        </p>
      </div>

      {/* ElevenLabs API key */}
      <div className="space-y-1.5">
        <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
          ElevenLabs API key <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>(optional)</span>
        </Label>
        <input
          type="password"
          value={form.elevenlabs_api_key}
          onChange={(e) => set("elevenlabs_api_key", e.target.value)}
          placeholder="sk_..."
          style={inputStyle}
        />
        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
          Leave blank to use the Tagit shared key (free tier, limited). Add your own for unlimited voice generation.
        </p>
      </div>

      {/* Info box */}
      <div
        className="flex gap-3 rounded-lg px-4 py-3"
        style={{ backgroundColor: "var(--color-soft-gold)", border: "1px solid var(--color-champagne)" }}
      >
        <Mic size={16} style={{ color: "var(--color-deep-gold)", marginTop: "2px", flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-deep-gold)", lineHeight: 1.6 }}>
          Voice input uses Groq Whisper (free, instant). Voice output uses ElevenLabs. The persona knows your product details, brand story, and provenance automatically.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-body-sm)",
          backgroundColor: saving ? "var(--color-stone)" : "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? "Saving…" : "Save persona"}
      </button>
    </form>
  );
}
