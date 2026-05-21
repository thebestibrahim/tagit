import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json();

  const {
    brand_primary_color,
    brand_secondary_color,
    brand_accent_color,
    brand_text_color,
    brand_font,
    brand_template,
    cert_template,
    brand_story,
    custom_header_text,
    social_links,
    logo_url,
    signature_url,
  } = body;

  const admin = createAdminClient();

  // Build update payload — only include keys that were explicitly sent in the request body
  const update: Database["public"]["Tables"]["companies"]["Update"] = {
    brand_primary_color,
    brand_secondary_color,
    brand_accent_color,
    brand_text_color,
    brand_font,
    brand_template,
    cert_template,
    brand_story,
    custom_header_text,
    social_links,
  };
  if ("logo_url" in body) update.logo_url = logo_url;
  if ("signature_url" in body) update.signature_url = signature_url;

  const { error } = await admin
    .from("companies")
    .update(update)
    .eq("id", user.id);

  if (error) { log.error("company/customization", "Update failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }

  return NextResponse.json({ success: true });
}
