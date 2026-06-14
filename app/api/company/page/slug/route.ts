import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { validateSlug } from "@/lib/brand-page";
import { NextResponse } from "next/server";

// PATCH /api/company/page/slug
// Updates the current brand's slug. Body: { slug: string }
// Validates format + reserved list + uniqueness.
export async function PATCH(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const v = validateSlug(typeof body?.slug === "string" ? body.slug : "");
  if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });

  const admin = createAdminClient();

  // Reject if another brand already owns this slug.
  const { data: taken } = await admin
    .from("companies")
    .select("id")
    .eq("slug", v.slug)
    .neq("id", user.id)
    .maybeSingle();

  if (taken) {
    return NextResponse.json({ error: "That slug is already taken. Choose another." }, { status: 409 });
  }

  const { error } = await admin
    .from("companies")
    .update({ slug: v.slug })
    .eq("id", user.id);

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "That slug is already taken. Choose another." }, { status: 409 });
    }
    log.error("company/page/slug", "Slug update failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ slug: v.slug });
}
