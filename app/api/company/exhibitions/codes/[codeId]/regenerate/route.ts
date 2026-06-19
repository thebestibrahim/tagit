import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { infoUrl } from "@/lib/exhibitions";
import { insertInfoCode } from "@/lib/exhibitions-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// POST — revoke the existing code and issue a brand new one for the same product
// and exhibition. The old token dies instantly (status -> revoked); the public
// route rejects it on the next request. The response flags that the brand must
// download and reprint the new label.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ codeId: string }> }
) {
  const { codeId } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient() as Admin;

  const { data: code } = await admin
    .from("info_codes")
    .select("id, exhibition_id, product_id, status")
    .eq("id", codeId)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!code) return NextResponse.json({ error: "Info code not found." }, { status: 404 });

  const existing = code as { id: string; exhibition_id: string; product_id: string; status: string };
  if (existing.status === "revoked") {
    return NextResponse.json({ error: "This code has already been revoked." }, { status: 409 });
  }

  // Kill the old token first so there is never a window with two live codes for
  // the same product.
  const { error: revokeError } = await admin
    .from("info_codes")
    .update({ status: "revoked", deactivated_at: new Date().toISOString() })
    .eq("id", codeId)
    .eq("company_id", user.id);
  if (revokeError) {
    return NextResponse.json({ error: revokeError.message ?? "Failed to revoke old code." }, { status: 500 });
  }

  const fresh = await insertInfoCode(admin, {
    exhibition_id: existing.exhibition_id,
    product_id: existing.product_id,
    company_id: user.id,
  });
  if (!fresh) return NextResponse.json({ error: "Failed to issue new code." }, { status: 500 });

  return NextResponse.json(
    {
      code: { ...fresh, url: infoUrl(fresh.token) },
      url: infoUrl(fresh.token),
      // The old printed label no longer works — prompt an immediate reprint.
      prompt_label_redownload: true,
    },
    { status: 201 }
  );
}
