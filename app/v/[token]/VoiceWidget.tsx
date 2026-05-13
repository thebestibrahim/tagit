"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Send, Square } from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };
type WidgetState = "idle" | "recording" | "thinking" | "speaking";

interface VoiceWidgetProps {
  tagId: string;
  personaName: string;
  accentColor: string;
  primaryColor: string;
}

const MAX_RECORDING_SECONDS = 30;

export default function VoiceWidget({ tagId, personaName, accentColor, primaryColor }: VoiceWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [widgetState, setWidgetState] = useState<WidgetState>("idle");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRecording = widgetState === "recording";
  const isThinking = widgetState === "thinking";
  const isSpeaking = widgetState === "speaking";
  const isBusy = isThinking || isSpeaking || isRecording;

  function stopRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, widgetState]);

  useEffect(() => {
    if (open && messages.length === 0) greet();
    if (open) setTimeout(() => inputRef.current?.focus(), 400);
  }, [open]);

  async function greet() {
    setWidgetState("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Greet the customer who just scanned this product tag. Be brief and welcoming — one or two sentences.",
          tag_id: tagId,
        }),
      });
      const json = await res.json();
      if (json.reply) {
        setMessages([{ role: "assistant", text: json.reply }]);
        await speak(json.reply);
      }
    } catch {
      setError("Could not connect.");
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
      // non-fatal
    } finally {
      setWidgetState("idle");
    }
  }

  function stopSpeaking() {
    audioRef.current?.pause();
    audioRef.current = null;
    setWidgetState("idle");
  }

  const toggleRecording = useCallback(async () => {
    if (isSpeaking) { stopSpeaking(); return; }
    if (isThinking) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied.");
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const mr = new MediaRecorder(stream, { mimeType });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      stopRecordingTimer();
      processAudio();
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setWidgetState("recording");
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => {
        if (s + 1 >= MAX_RECORDING_SECONDS) {
          mediaRecorderRef.current?.stop();
          return 0;
        }
        return s + 1;
      });
    }, 1000);
  }, [widgetState]);

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
      setError("Could not transcribe. Try typing instead.");
      setWidgetState("idle");
      return;
    }

    if (!transcript) {
      setError("Couldn't hear that — try again or type your question.");
      setWidgetState("idle");
      return;
    }

    await sendMessage(transcript);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTextInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setWidgetState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, tag_id: tagId }),
      });
      const json = await res.json();
      const reply = json.reply ?? "Sorry, I couldn't respond to that.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      await speak(reply);
    } catch {
      setError("Failed to get a response.");
      setWidgetState("idle");
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textInput.trim() || isBusy) return;
    sendMessage(textInput);
  }

  const micLabel = isRecording ? `Listening… tap to send (${MAX_RECORDING_SECONDS - recordingSeconds}s)` : isSpeaking ? "Tap to stop" : isThinking ? "Thinking…" : "Type or tap mic to speak";

  return (
    <>
      {/* Overlay backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(10,10,11,0.35)",
            zIndex: 49,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            backgroundColor: "#FAFAF8",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -8px 40px rgba(10,10,11,0.18)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "75vh",
            overflow: "hidden",
          }}
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: "#E8E2D5" }} />
          </div>

          {/* Header */}
          <div
            style={{
              padding: "12px 20px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              borderBottom: "1px solid #F0EDE8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Persona avatar */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  backgroundColor: primaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Instrument Serif',Georgia,serif",
                    fontSize: 15,
                    fontStyle: "italic",
                    color: "#FAFAF8",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {personaName.charAt(0)}
                </span>
                {/* Live indicator */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 1,
                    right: 1,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: isSpeaking || isRecording ? accentColor : "#4ADE80",
                    border: "1.5px solid #FAFAF8",
                    animation: isSpeaking || isRecording ? "pulse-dot 1s ease-in-out infinite" : "none",
                  }}
                />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0A0A0B", letterSpacing: "-0.01em" }}>
                  {personaName}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: isRecording ? accentColor : isSpeaking ? accentColor : isThinking ? "#9E9EA3" : "#4ADE80", letterSpacing: "-0.003em", transition: "color 0.3s" }}>
                  {isRecording ? "Listening…" : isSpeaking ? "Speaking…" : isThinking ? "Thinking…" : "Online"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#F0EDE8",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6E6E73",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {messages.length === 0 && isThinking && (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <ThinkingDots color={accentColor} />
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  gap: 4,
                  animation: "fadeUp 0.3s ease",
                }}
              >
                {m.role === "assistant" && (
                  <span style={{ fontSize: 10, color: "#9E9EA3", letterSpacing: "0.04em", paddingLeft: 2 }}>
                    {personaName}
                  </span>
                )}
                <div
                  style={{
                    maxWidth: "82%",
                    padding: m.role === "user" ? "10px 14px" : "12px 16px",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    backgroundColor: m.role === "user" ? primaryColor : "#fff",
                    color: m.role === "user" ? "#FAFAF8" : "#1F1F22",
                    fontSize: 14,
                    lineHeight: 1.6,
                    letterSpacing: "-0.003em",
                    boxShadow: m.role === "assistant" ? "0 1px 4px rgba(10,10,11,0.06)" : "none",
                    border: m.role === "assistant" ? "1px solid #F0EDE8" : "none",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Thinking bubble */}
            {isThinking && messages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, animation: "fadeUp 0.3s ease" }}>
                <span style={{ fontSize: 10, color: "#9E9EA3", letterSpacing: "0.04em", paddingLeft: 2 }}>{personaName}</span>
                <div style={{ padding: "12px 16px", backgroundColor: "#fff", borderRadius: "18px 18px 18px 4px", border: "1px solid #F0EDE8", boxShadow: "0 1px 4px rgba(10,10,11,0.06)" }}>
                  <ThinkingDots color={accentColor} />
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: 12, color: "#B85C5C", textAlign: "center", margin: 0, padding: "4px 0" }}>
                {error}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: "12px 16px 20px",
              borderTop: "1px solid #F0EDE8",
              flexShrink: 0,
              backgroundColor: "#FAFAF8",
            }}
          >
            <form onSubmit={handleTextSubmit} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Text input */}
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={micLabel}
                  disabled={isRecording || isThinking}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #E8E2D5",
                    borderRadius: 99,
                    fontSize: 14,
                    color: "#0A0A0B",
                    backgroundColor: "#fff",
                    outline: "none",
                    fontFamily: "inherit",
                    letterSpacing: "-0.003em",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = accentColor; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E8E2D5"; }}
                />
              </div>

              {/* Send (when typing) or Mic */}
              {textInput.trim() ? (
                <button
                  type="submit"
                  disabled={isThinking}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    backgroundColor: accentColor,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "transform 0.15s",
                  }}
                >
                  <Send size={18} color="#fff" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isThinking}
                  aria-label={isRecording ? "Stop recording" : isSpeaking ? "Stop speaking" : "Start recording"}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    backgroundColor: isRecording ? "#B85C5C" : isSpeaking ? "#6E6E73" : accentColor,
                    border: "none",
                    cursor: isThinking ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    position: "relative",
                    transition: "background-color 0.2s, transform 0.15s",
                    boxShadow: isRecording ? `0 0 0 6px rgba(184,92,92,0.2), 0 0 0 12px rgba(184,92,92,0.1)` : "none",
                    animation: isRecording ? "mic-pulse 1.5s ease-in-out infinite" : "none",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}
                >
                  {isSpeaking ? (
                    <Square size={16} color="#fff" fill="#fff" />
                  ) : isRecording ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>
                      {MAX_RECORDING_SECONDS - recordingSeconds}
                    </span>
                  ) : (
                    <Mic size={18} color="#fff" />
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open voice assistant"
          style={{
            position: "fixed",
            bottom: 24,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: accentColor,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 20px ${accentColor}60, 0 2px 8px rgba(10,10,11,0.15)`,
            zIndex: 50,
            animation: "float 3s ease-in-out infinite",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <Mic size={22} color="#fff" />
        </button>
      )}

      <style>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(184,92,92,0.25), 0 0 0 8px rgba(184,92,92,0.12); }
          50% { box-shadow: 0 0 0 8px rgba(184,92,92,0.18), 0 0 0 16px rgba(184,92,92,0.07); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}

function ThinkingDots({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", height: 16 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: color,
            display: "inline-block",
            opacity: 0.4,
            animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
