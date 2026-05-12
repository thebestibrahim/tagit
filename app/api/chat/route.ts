import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { message, tag_id } = body as { message?: string; tag_id?: string };

  if (!message || !tag_id) {
    return NextResponse.json({ error: "message and tag_id required" }, { status: 400 });
  }

  if (typeof message !== "string" || message.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
  }

  // Fetch tag → company + product in parallel
  const [{ data: tagData }, { data: productData }] = await Promise.all([
    admin.from("tags").select("id, industry, company_id").eq("id", tag_id).single(),
    admin.from("products").select("name, industry_fields, retail_price, currency").eq("tag_id", tag_id).single(),
  ]);

  if (!tagData) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const tag = tagData as { id: string; industry: string; company_id: string };
  const product = productData as { name: string; industry_fields: Record<string, string>; retail_price: number | null; currency: string } | null;

  const { data: companyData } = await admin
    .from("companies")
    .select("name, brand_story, ai_enabled, ai_persona_name, ai_persona_prompt")
    .eq("id", tag.company_id)
    .single();

  const company = companyData as {
    name: string;
    brand_story: string | null;
    ai_enabled: boolean;
    ai_persona_name: string | null;
    ai_persona_prompt: string | null;
  } | null;

  if (!company?.ai_enabled) {
    return NextResponse.json({ error: "AI persona not enabled for this brand" }, { status: 403 });
  }

  const personaName = company.ai_persona_name || "Tagit Assistant";

  // Build system prompt
  const productContext = product
    ? [
        `Product: ${product.name}`,
        product.retail_price ? `Price: ${product.currency} ${product.retail_price.toLocaleString()}` : "",
        `Industry: ${tag.industry}`,
        Object.entries(product.industry_fields || {})
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
          .join("\n"),
      ].filter(Boolean).join("\n")
    : "No product registered yet.";

  const systemPrompt = [
    company.ai_persona_prompt || `You are ${personaName}, the voice of ${company.name}. Be warm, knowledgeable, and concise. Keep responses to 2-3 sentences.`,
    "",
    "--- PRODUCT CONTEXT ---",
    productContext,
    company.brand_story ? `\n--- BRAND STORY ---\n${company.brand_story}` : "",
    "",
    "Answer questions about this product and brand. If asked something unrelated, gently redirect. Never break character.",
  ].join("\n");

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";

  return NextResponse.json({ reply, persona_name: personaName });
}
