import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { sendBrandInvitationEmail, APP_URL } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authClient = await createServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: inquiry, error } = await admin
    .from("brand_inquiries")
    .select("name, email, company, status")
    .eq("id", id)
    .single();

  if (error || !inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }

  if (inquiry.status === "converted") {
    return NextResponse.json({ error: "Invitation already sent." }, { status: 400 });
  }

  if (inquiry.status === "declined") {
    return NextResponse.json({ error: "Cannot invite a declined inquiry." }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("brand_inquiries")
    .update({ status: "converted" })
    .eq("id", id);

  if (updateError) {
    log.error("admin/inquiries/invite", "Status update failed", updateError);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }

  await sendBrandInvitationEmail(inquiry.email, {
    name: inquiry.name,
    company: inquiry.company,
    loginUrl: `${APP_URL}/auth/login`,
  }).catch((err) => log.error("admin/inquiries/invite", "Invitation email failed", err));

  return NextResponse.json({ success: true });
}
