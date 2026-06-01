import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitAsync, getIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

// Dedicated, hardened sign-in for Tagit staff (tagit_admin) only.
// Separate from the public brand portal (/auth/login) by design.
const GENERIC_ERROR = "Invalid credentials.";

export async function POST(request: Request) {
  const ip = getIp(request);

  // 5 attempts per 15 minutes per IP, on top of Supabase's own auth limits.
  if (!(await rateLimitAsync(`admin-login:${ip}`, 5, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let email: string, password: string;
  try {
    const body = await request.json();
    email = String(body.email ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Never reveal whether the email exists, is unconfirmed, or the password was wrong.
  if (error || !data.user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const role = data.user.app_metadata?.role;

  if (role !== "tagit_admin") {
    // A valid non-admin account tried the staff portal. Tear down the session
    // immediately and log the attempt — but return the same generic error.
    await supabase.auth.signOut();
    log.warn("auth/admin-login", "Non-admin attempted staff portal", {
      ip,
      userId: data.user.id,
      role: role ?? "none",
    });
    void auditAttempt(data.user.id, role ?? "none", ip, "admin_login_denied");
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  void auditAttempt(data.user.id, "tagit_admin", ip, "admin_login");
  return NextResponse.json({ success: true });
}

// Best-effort audit trail; never blocks or fails the login response.
async function auditAttempt(
  userId: string,
  role: string,
  ip: string,
  action: "admin_login" | "admin_login_denied"
) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      table_name: "auth",
      record_id: userId,
      action,
      changed_by: userId,
      changed_by_role: role,
      ip_address: ip,
    });
  } catch (err) {
    log.error("auth/admin-login", "Audit insert failed", err);
  }
}
