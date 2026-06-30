import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBrandFlagEnabled } from "@/lib/feature-flags/server";
import { normaliseDomain } from "@/lib/domains/validate";
import { addDomainToVercel, removeDomainFromVercel, configureWwwRedirect, DomainTakenError } from "@/lib/domains/vercel";
import { log } from "@/lib/logger";

// GET /api/company/domain
// Returns the brand's current custom domain row, or null if none connected.
export async function GET() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("custom_domains")
    .select("*")
    .eq("company_id", user.id)
    .maybeSingle();

  if (error) {
    log.error("company/domain GET", "Lookup failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ domain: data ?? null });
}

// POST /api/company/domain
// Body: { domain: string }
// Validates, normalises, calls Vercel, creates the custom_domains row.
export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isBrandFlagEnabled(user.id, "custom_domain"))) {
    return NextResponse.json(
      { error: "Custom domains are not available on your current plan. Contact the Tagit team to request access." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { domain: rawInput } = body as { domain?: string };

  if (!rawInput) return NextResponse.json({ error: "Domain is required." }, { status: 400 });

  const normalised = normaliseDomain(rawInput);
  if (!normalised.ok) return NextResponse.json({ error: normalised.error }, { status: 422 });

  const { apex, hasWww } = normalised;

  // Check for existing row (brand already has a domain or is re-connecting)
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("custom_domains")
    .select("id, domain, status")
    .eq("company_id", user.id)
    .maybeSingle();

  if (existing && existing.status !== "removed") {
    return NextResponse.json(
      { error: "You already have a custom domain connected. Disconnect it first before adding a new one." },
      { status: 409 }
    );
  }

  // Register with Vercel
  let vercelResult;
  try {
    vercelResult = await addDomainToVercel(apex);
  } catch (err) {
    if (err instanceof DomainTakenError) {
      return NextResponse.json(
        { error: "This domain is already connected to another account. If it's yours, remove it from the other Vercel project first." },
        { status: 409 }
      );
    }
    log.error("company/domain POST", "Vercel addDomain failed", err);
    return NextResponse.json(
      { error: "We could not register your domain with our infrastructure. Please try again in a few minutes." },
      { status: 502 }
    );
  }

  // Configure www redirect (non-fatal if it fails)
  if (!hasWww) {
    configureWwwRedirect(apex).catch((err) =>
      log.warn("company/domain POST", `www redirect setup failed for ${apex}`, err)
    );
  }

  // Upsert the custom_domains row
  const now = new Date().toISOString();
  const { data: row, error: upsertError } = await admin
    .from("custom_domains")
    .upsert(
      {
        company_id: user.id,
        domain: apex,
        status: "pending",
        vercel_domain_id: vercelResult.vercelDomainId,
        verification_records: vercelResult.verificationRecords as unknown as import("@/types/database").Json,
        failure_reason: null,
        verified_at: null,
        updated_at: now,
      },
      { onConflict: "company_id" }
    )
    .select()
    .single();

  if (upsertError) {
    // Could be a unique constraint violation on domain — someone else already has it
    if (upsertError.code === "23505") {
      return NextResponse.json(
        { error: "This domain is already connected to another Tagit account." },
        { status: 409 }
      );
    }
    log.error("company/domain POST", "Upsert failed", upsertError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ domain: row });
}

// DELETE /api/company/domain
// Removes the domain from Vercel and marks the row as removed.
export async function DELETE() {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("custom_domains")
    .select("id, domain, status")
    .eq("company_id", user.id)
    .maybeSingle();

  if (!existing || existing.status === "removed") {
    return NextResponse.json({ error: "No active custom domain found." }, { status: 404 });
  }

  try {
    await removeDomainFromVercel(existing.domain);
  } catch (err) {
    log.error("company/domain DELETE", "Vercel removeDomain failed", err);
    return NextResponse.json(
      { error: "We could not remove your domain from our infrastructure. Please try again." },
      { status: 502 }
    );
  }

  const { error } = await admin
    .from("custom_domains")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("company_id", user.id);

  if (error) {
    log.error("company/domain DELETE", "Status update failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
