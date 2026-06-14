import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

// GET /api/company/page
// Returns the current brand's public-page settings. companies.id === user.id.
export async function GET() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .select("slug, page_bio, page_enabled, contact_phone")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    log.error("company/page", "Failed to load page settings", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    slug: data.slug,
    page_bio: data.page_bio,
    page_enabled: data.page_enabled ?? false,
    whatsapp_number: data.contact_phone,
  });
}

const BIO_MAX = 280;

// PATCH /api/company/page
// Updates the bio and/or publish toggle. Body: { page_bio?: string; page_enabled?: boolean }
export async function PATCH(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const update: { page_bio?: string | null; page_enabled?: boolean } = {};

  if ("page_bio" in body) {
    if (body.page_bio != null && typeof body.page_bio !== "string") {
      return NextResponse.json({ error: "Invalid bio." }, { status: 400 });
    }
    const bio = typeof body.page_bio === "string" ? body.page_bio.trim() : "";
    if (bio.length > BIO_MAX) {
      return NextResponse.json({ error: `Bio must be ${BIO_MAX} characters or fewer.` }, { status: 400 });
    }
    update.page_bio = bio || null;
  }

  if ("page_enabled" in body) {
    if (typeof body.page_enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid publish state." }, { status: 400 });
    }
    update.page_enabled = body.page_enabled;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("companies").update(update).eq("id", user.id);

  if (error) {
    log.error("company/page", "Update failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...update });
}
