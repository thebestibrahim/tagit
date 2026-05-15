import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { toFile } from "groq-sdk";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getIp(request);
  if (!rateLimit(`stt:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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
