"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Volume2, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

interface VoiceWidgetProps {
  tagId: string;
  personaName: string;
  accentColor: string;
  primaryColor: string;
}

type WidgetState = "idle" | "recording" | "thinking" | "speaking";

export default function VoiceWidget({ tagId, personaName, accentColor, primaryColor }: VoiceWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [widgetState, setWidgetState] = useState<WidgetState>("idle");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      greet();
    }
  }, [open]);

  async function greet() {
    setWidgetState("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Greet the customer who just scanned this product tag. Be brief and welcoming — one or two sentences.", tag_id: tagId }),
      });
      const json = await res.json();
      if (json.reply) {
        const assistantMsg = { role: "assistant" as const, text: json.reply };
        setMessages([assistantMsg]);
        await speak(json.reply);
      }
    } catch {
      setError("Could not connect to AI persona.");
    } finally {
      setWidgetState("idle");
    }
  }

  async function speak(text: string) {
    setWidgetState("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tag_id: tagId }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } catch {
      // TTS failure is non-fatal — text is still shown
    } finally {
      setWidgetState("idle");
    }
  }

  const startRecording = useCallback(async () => {
    if (widgetState !== "idle") return;
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied.");
      return;
    }

    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); processAudio(); };
    mr.start();
    mediaRecorderRef.current = mr;
    setWidgetState("recording");
  }, [widgetState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  async function processAudio() {
    setWidgetState("thinking");

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fd = new FormData();
    fd.append("audio", blob, "audio.webm");

    let transcript = "";
    try {
      const sttRes = await fetch("/api/stt", { method: "POST", body: fd });
      const sttJson = await sttRes.json();
      transcript = sttJson.text?.trim() ?? "";
    } catch {
      setError("Could not transcribe audio.");
      setWidgetState("idle");
      return;
    }

    if (!transcript) {
      setError("Couldn't hear that. Try again.");
      setWidgetState("idle");
      return;
    }

    setMessages((m) => [...m, { role: "user", text: transcript }]);

    try {
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript, tag_id: tagId }),
      });
      const chatJson = await chatRes.json();
      const reply = chatJson.reply ?? "Sorry, I couldn't respond to that.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      await speak(reply);
    } catch {
      setError("AI failed to respond.");
      setWidgetState("idle");
    }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setWidgetState("idle");
  }

  const isRecording = widgetState === "recording";
  const isThinking = widgetState === "thinking";
  const isSpeaking = widgetState === "speaking";
  const isBusy = isThinking || isSpeaking;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "88px",
            right: "20px",
            width: "320px",
            maxHeight: "420px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 24px 48px rgba(10,10,11,0.15), 0 8px 16px rgba(10,10,11,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: primaryColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: accentColor,
                  animation: isSpeaking ? "pulse 1s ease-in-out infinite" : "none",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>
                {personaName}
              </span>
              {isSpeaking && (
                <Volume2 size={12} color={accentColor} />
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "rgba(255,255,255,0.7)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {messages.length === 0 && isThinking && (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                <Loader2 size={20} color="#9E9EA3" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "8px 12px",
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  backgroundColor: m.role === "user" ? primaryColor : "#F5F4F1",
                  color: m.role === "user" ? "#fff" : "#1F1F22",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {m.text}
              </div>
            ))}
            {isThinking && messages.length > 0 && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 14px",
                  backgroundColor: "#F5F4F1",
                  borderRadius: "12px 12px 12px 2px",
                }}
              >
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#9E9EA3",
                        display: "inline-block",
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {error && (
              <p style={{ fontSize: "12px", color: "#B85C5C", textAlign: "center", margin: "4px 0" }}>
                {error}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mic control */}
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid #F0EDE8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#F9DDDD",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Volume2 size={18} color="#B85C5C" />
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isBusy}
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: isRecording ? "#B85C5C" : isBusy ? "#E8E2D5" : accentColor,
                  border: "none",
                  cursor: isBusy ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isRecording ? "0 0 0 8px rgba(184,92,92,0.2)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {isThinking ? (
                  <Loader2 size={20} color="#9E9EA3" style={{ animation: "spin 1s linear infinite" }} />
                ) : isRecording ? (
                  <MicOff size={20} color="#fff" />
                ) : (
                  <Mic size={20} color="#fff" />
                )}
              </button>
            )}
            <p style={{ fontSize: "11px", color: "#9E9EA3", margin: 0 }}>
              {isRecording ? "Release to send" : isSpeaking ? "Tap to stop" : isThinking ? "Thinking…" : "Hold to speak"}
            </p>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: open ? primaryColor : accentColor,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(10,10,11,0.2)",
          zIndex: 50,
          transition: "background-color 0.2s, transform 0.15s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
      >
        {open ? <X size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}
