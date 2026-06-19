import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { rateLimitAsync, getIp } from "@/lib/rate-limit";
import { readInfoCode } from "@/lib/exhibitions-server";
import { buildInfoSystemPrompt } from "@/lib/exhibitions";
import { isBrandFlagEnabled } from "@/lib/feature-flags/server";

// Info-page assistant. Reuses the same Groq model, rate-limiting and ai_persona
// feature-flag pattern as the scan-page chat (/api/chat), but the system prompt
// is built STRICTLY from this product's registration record. It must refuse or
// redirect on anything outside it — price, availability, ownership, authenticity.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const ip = getIp(request);
  if (!await rateLimitAsync(`info-chat:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { message } = body as { message?: string };
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  if (message.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
  }

  const result = await readInfoCode(token);
  if (result.status !== "active") {
    return NextResponse.json({ error: "This code is no longer active." }, { status: 404 });
  }

  // Per-token cap, same rationale as the scan-page chat: bounds LLM spend on a
  // single popular piece even if an abuser rotates IPs.
  if (!await rateLimitAsync(`info-chat:token:${token}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // AI chat respects the same gate as the scan page: the brand's ai_enabled
  // toggle AND the ai_persona feature flag.
  const flagOn = await isBrandFlagEnabled(result.companyId, "ai_persona");
  if (!result.brand.ai_enabled || !flagOn) {
    return NextResponse.json({ error: "AI assistant not enabled." }, { status: 403 });
  }

  const personaName = result.brand.ai_persona_name || "Gallery Guide";
  const systemPrompt = buildInfoSystemPrompt({
    brandName: result.brand.name || "the brand",
    personaName,
    product: result.product,
  });

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 200,
    temperature: 0.5,
  });

  const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
  return NextResponse.json({ reply, persona_name: personaName });
}
