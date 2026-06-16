import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { toFile } from "groq-sdk";
import { rateLimitAsync, getIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getIp(request);
  if (!await rateLimitAsync(`stt:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Speech-to-text has no tag/brand to scope it to (it's generic transcription),
  // so the per-IP limit is its only natural bound — and an abuser can rotate
  // IPs. This platform-wide backstop caps total Whisper spend per minute so a
  // distributed flood can't run up an unbounded bill. Generous enough that real
  // scan-page voice usage never reaches it.
  if (!await rateLimitAsync("stt:global", 300, 60_000)) {
    return NextResponse.json({ error: "Service is busy. Please try again shortly." }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const audio = formData.get("audio") as Blob | null;
  if (!audio) return NextResponse.json({ error: "audio field required" }, { status: 400 });

  if (audio.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio file too large (max 10MB)" }, { status: 413 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const arrayBuffer = await audio.arrayBuffer();
  const file = await toFile(Buffer.from(arrayBuffer), "audio.webm", { type: "audio/webm" });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "json",
    language: "en",
  });

  return NextResponse.json({ text: transcription.text });
}
