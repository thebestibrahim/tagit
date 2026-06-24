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
    .select("name, email, company, phone, status")
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

  // Approving an inquiry creates the company account directly so it shows up
  // under Companies immediately (billing can be set up before the brand ever logs in).
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "invite",
    email: inquiry.email,
    options: {
      redirectTo: `${APP_URL}/auth/callback?next=/auth/reset-password`,
    },
  });

  if (linkError || !linkData?.user) {
    if (linkError?.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    log.error("admin/inquiries/invite", "generateLink failed", linkError);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }

  const userId = linkData.user.id;

  const { error: dbError } = await admin.from("companies").insert({
    id: userId,
    name: inquiry.company,
    email: inquiry.email.toLowerCase().trim(),
    industry: "fashion",
    status: "pending",
    contact_name: inquiry.name,
    ...(inquiry.phone?.trim() ? { contact_phone: inquiry.phone.trim() } : {}),
  });

  if (dbError) {
    log.error("admin/inquiries/invite", "companies insert failed", dbError);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Failed to create company profile." }, { status: 500 });
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
    loginUrl: linkData.properties.action_link,
  }).catch((err) => log.error("admin/inquiries/invite", "Invitation email failed", err));

  return NextResponse.json({ success: true });
}
