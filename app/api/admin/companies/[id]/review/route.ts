import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendCompanyApprovedEmail, sendCompanyRejectedEmail, APP_URL } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { action, reason } = await request.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch company for email
  const { data: companyData } = await admin
    .from("companies")
    .select("name, email")
    .eq("id", id)
    .single();
  const company = companyData as { name: string; email: string } | null;

  if (action === "approve") {
    const { error } = await admin
      .from("companies")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      } as never)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (company) {
      await sendCompanyApprovedEmail(company.email, {
        companyName: company.name,
        dashboardUrl: `${APP_URL}/dashboard`,
      }).catch(() => {});
    }
  } else {
    const { error } = await admin
      .from("companies")
      .update({ status: "rejected" } as never)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (company) {
      await sendCompanyRejectedEmail(company.email, {
        companyName: company.name,
        reason: reason ?? undefined,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}
