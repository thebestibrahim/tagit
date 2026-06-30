import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDomainStatus } from "@/lib/domains/vercel";
import { log } from "@/lib/logger";

// POST /api/company/domain/check
// Polls Vercel for verification and SSL status. Updates the custom_domains row accordingly.
// Returning "pending" is normal — never treat it as an error while still waiting.
export async function POST() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: domainRow } = await admin
    .from("custom_domains")
    .select("*")
    .eq("company_id", user.id)
    .maybeSingle();

  if (!domainRow || domainRow.status === "removed") {
    return NextResponse.json({ error: "No pending domain found." }, { status: 404 });
  }

  // Already verified — nothing to do
  if (domainRow.status === "verified") {
    return NextResponse.json({ domain: domainRow });
  }

  let vercelStatus;
  try {
    vercelStatus = await checkDomainStatus(domainRow.domain);
  } catch (err) {
    log.error("company/domain/check", "Vercel check failed", err);
    // Transient error: return the current pending state without marking it failed
    return NextResponse.json({ domain: domainRow });
  }

  if (vercelStatus.verified) {
    const { data: updated } = await admin
      .from("custom_domains")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        failure_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", user.id)
      .select()
      .single();

    return NextResponse.json({ domain: updated });
  }

  // Still pending — just return current state. Do not mark as failed here;
  // DNS propagation can take up to 48 hours. Failure is only set by an
  // explicit Vercel permanent-failure response, not by a timeout.
  return NextResponse.json({ domain: domainRow });
}
