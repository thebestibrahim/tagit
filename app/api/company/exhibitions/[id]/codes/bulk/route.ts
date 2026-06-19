import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { infoUrl } from "@/lib/exhibitions";
import { insertInfoCode, exhibitionsEnabled } from "@/lib/exhibitions-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// POST — generate info codes for every product in this exhibition that does not
// already have a current (non-revoked) code. Products that already have one are
// skipped, never duplicated.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await exhibitionsEnabled(user.id))) {
    return NextResponse.json({ error: "Exhibitions is not enabled for your account." }, { status: 403 });
  }

  const admin = createAdminClient() as Admin;

  const { data: exhibition } = await admin
    .from("exhibitions")
    .select("id")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!exhibition) return NextResponse.json({ error: "Exhibition not found." }, { status: 404 });

  const [{ data: links }, { data: existingCodes }] = await Promise.all([
    admin.from("exhibition_products").select("product_id").eq("exhibition_id", id),
    admin.from("info_codes").select("product_id").eq("exhibition_id", id).neq("status", "revoked"),
  ]);

  const haveCode = new Set(((existingCodes ?? []) as { product_id: string }[]).map((c) => c.product_id));
  const toGenerate = [...new Set(((links ?? []) as { product_id: string }[]).map((l) => l.product_id))]
    .filter((pid) => !haveCode.has(pid));

  const generated: { id: string; token: string; status: string; scan_count: number; product_id: string; url: string }[] = [];
  for (const product_id of toGenerate) {
    const code = await insertInfoCode(admin, { exhibition_id: id, product_id, company_id: user.id });
    if (code) generated.push({ ...code, url: infoUrl(code.token) });
  }

  return NextResponse.json({ generated, count: generated.length, skipped: haveCode.size }, { status: 201 });
}
