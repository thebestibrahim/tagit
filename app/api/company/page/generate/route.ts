import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { slugify, validateSlug, SLUG_MAX } from "@/lib/brand-page";
import { NextResponse } from "next/server";

// POST /api/company/page/generate
// Generates and saves a slug for the current brand, then publishes the page.
// Auto-generates from the company name when no custom slug is supplied.
// Body (optional): { slug?: string }
export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("name, slug")
    .eq("id", user.id)
    .single();

  if (companyError || !company) {
    log.error("company/page/generate", "Company lookup failed", companyError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Already has a slug — just (re)publish, don't churn the URL.
  if (company.slug) {
    const { error } = await admin
      .from("companies")
      .update({ page_enabled: true })
      .eq("id", user.id);
    if (error) {
      log.error("company/page/generate", "Publish failed", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ slug: company.slug, page_enabled: true });
  }

  let base: string;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.slug === "string" && body.slug.trim()) {
    const v = validateSlug(body.slug);
    if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });
    base = v.slug;
  } else {
    base = slugify(company.name);
    // Guarantee the auto-generated base satisfies the length floor.
    if (base.length < 3) base = `${base}${base ? "-" : ""}brand`.slice(0, SLUG_MAX);
  }

  const slug = await findAvailableSlug(admin, base, user.id);

  const { error: updateError } = await admin
    .from("companies")
    .update({ slug, page_enabled: true })
    .eq("id", user.id);

  if (updateError) {
    // 23505 = unique_violation: lost a race for the slug. Surface as a conflict.
    if ((updateError as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "That slug was just taken. Try again." }, { status: 409 });
    }
    log.error("company/page/generate", "Slug save failed", updateError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ slug, page_enabled: true });
}

// Append -2, -3, … until the slug is free (excluding this company's own row).
async function findAvailableSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string,
  selfId: string,
): Promise<string> {
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`.slice(0, SLUG_MAX).replace(/-+$/g, "");
    const { data } = await admin
      .from("companies")
      .select("id")
      .eq("slug", candidate)
      .neq("id", selfId)
      .maybeSingle();
    if (!data) return candidate;
  }
  // Extremely unlikely fallback: suffix with a short random tail.
  return `${base}-${Math.random().toString(36).slice(2, 6)}`.slice(0, SLUG_MAX);
}
