import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { exhibitionsEnabled } from "@/lib/exhibitions-server";

// Exhibitions are the brand-facing container for QR info codes. Auth follows the
// rest of /api/company: verify the session, then act through the service-role
// client scoped to company_id = user.id. RLS is a second wall, not the gate.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// POST — create an exhibition and attach the chosen products in one go.
export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await exhibitionsEnabled(user.id))) {
    return NextResponse.json({ error: "Exhibitions is not enabled for your account." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, location, start_date, end_date, product_ids } = body as {
    name?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    product_ids?: string[];
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "An exhibition name is required." }, { status: 400 });
  }

  const productIds = Array.isArray(product_ids) ? [...new Set(product_ids)] : [];
  const admin = createAdminClient() as Admin;

  // Every product must belong to this brand before it can be attached.
  if (productIds.length > 0) {
    const { data: owned } = await admin
      .from("products")
      .select("id")
      .eq("company_id", user.id)
      .in("id", productIds);
    const ownedIds = new Set(((owned ?? []) as { id: string }[]).map((p) => p.id));
    if (productIds.some((id) => !ownedIds.has(id))) {
      return NextResponse.json({ error: "One or more products were not found." }, { status: 404 });
    }
  }

  const { data: created, error: exhibitionError } = await admin
    .from("exhibitions")
    .insert({
      company_id: user.id,
      name: name.trim(),
      location: location?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
    })
    .select("id")
    .single();

  if (exhibitionError || !created) {
    return NextResponse.json(
      { error: exhibitionError?.message ?? "Failed to create exhibition." },
      { status: 500 }
    );
  }

  const exhibitionId = (created as { id: string }).id;

  if (productIds.length > 0) {
    const { error: linkError } = await admin
      .from("exhibition_products")
      .insert(productIds.map((product_id) => ({ exhibition_id: exhibitionId, product_id })));

    // Roll back the exhibition so we never leave one with a partial product set.
    if (linkError) {
      await admin.from("exhibitions").delete().eq("id", exhibitionId);
      return NextResponse.json({ error: linkError.message ?? "Failed to attach products." }, { status: 500 });
    }
  }

  return NextResponse.json({ id: exhibitionId }, { status: 201 });
}

// GET — list this brand's exhibitions with product + active-code counts.
export async function GET() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient() as Admin;

  const { data: exhibitions } = await admin
    .from("exhibitions")
    .select("id, name, location, start_date, end_date, created_at")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (exhibitions ?? []) as {
    id: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
  }[];

  const ids = rows.map((e) => e.id);
  const productCounts = new Map<string, number>();
  const activeCodeCounts = new Map<string, number>();

  if (ids.length > 0) {
    const [{ data: links }, { data: codes }] = await Promise.all([
      admin.from("exhibition_products").select("exhibition_id").in("exhibition_id", ids),
      admin.from("info_codes").select("exhibition_id").eq("status", "active").in("exhibition_id", ids),
    ]);
    for (const l of (links ?? []) as { exhibition_id: string }[]) {
      productCounts.set(l.exhibition_id, (productCounts.get(l.exhibition_id) ?? 0) + 1);
    }
    for (const c of (codes ?? []) as { exhibition_id: string }[]) {
      activeCodeCounts.set(c.exhibition_id, (activeCodeCounts.get(c.exhibition_id) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    exhibitions: rows.map((e) => ({
      ...e,
      product_count: productCounts.get(e.id) ?? 0,
      active_code_count: activeCodeCounts.get(e.id) ?? 0,
    })),
  });
}
