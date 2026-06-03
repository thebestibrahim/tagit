import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { sendClaimNotificationEmail, APP_URL } from "@/lib/email";
import { claimExpiresAt, releaseExpiredClaims } from "@/lib/claims";
import { getSiblingTagIds } from "@/lib/tags";
import { headers } from "next/headers";

const admin = createAdminClient();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { tag_id, claimant_name, claimant_email, claim_location, otp_code } = body as {
    tag_id?: string;
    claimant_name?: string;
    claimant_email?: string;
    claim_location?: string;
    otp_code?: string;
  };

  if (!tag_id || !claimant_name || !claimant_email || !otp_code) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify OTP server-side before creating any claim
  const now = new Date().toISOString();
  const { data: otps } = await admin
    .from("otp_codes")
    .select("id, code_hash, attempts, is_used, expires_at")
    .eq("email", claimant_email)
    .eq("purpose", "claim")
    .eq("is_used", false)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1);

  const otp = (otps ?? [])[0] as {
    id: string;
    code_hash: string;
    attempts: number;
  } | undefined;

  if (!otp) {
    return NextResponse.json({ error: "No valid code found. Request a new one." }, { status: 400 });
  }

  if (otp.attempts >= 5) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 400 });
  }

  const otpValid = await compare(otp_code, otp.code_hash);
  if (!otpValid) {
    await admin.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  // Mark OTP used immediately
  await admin.from("otp_codes").update({ is_used: true }).eq("id", otp.id);

  // Verify tag is in a claimable state
  const { data: tagData } = await admin
    .from("tags")
    .select("id, status, company_id, short_id, product_id")
    .eq("id", tag_id)
    .single();

  const tag = tagData as {
    id: string;
    status: string;
    company_id: string;
    short_id: string;
    product_id: string | null;
  } | null;

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // A tag is claimable only while `live` (product attached, no owner).
  if (tag.status !== "live") {
    return NextResponse.json(
      { error: "This item is not available for claiming" },
      { status: 409 }
    );
  }

  // Ownership is unified across the product's tag group — resolve siblings and
  // expire any lapsed pending claims before deciding eligibility.
  const siblingIds = await getSiblingTagIds(admin, tag);
  await releaseExpiredClaims(admin, siblingIds);

  // If the item already has an owner (claim confirmed via any sibling tag), it
  // is not claimable.
  const { data: ownerRows } = await admin
    .from("ownership_records")
    .select("id")
    .in("tag_id", siblingIds)
    .eq("is_current", true)
    .limit(1);
  if ((ownerRows ?? []).length > 0) {
    return NextResponse.json(
      { error: "This item has already been claimed" },
      { status: 409 }
    );
  }

  // Lock the whole group: any still-pending claim on a sibling tag blocks a new
  // claim on this item.
  const { data: existingClaims } = await admin
    .from("ownership_claims")
    .select("id")
    .in("tag_id", siblingIds)
    .eq("status", "pending")
    .limit(1);

  if ((existingClaims ?? []).length > 0) {
    return NextResponse.json(
      { error: "A claim is already pending for this item" },
      { status: 409 }
    );
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? null;

  // Create claim
  const { data: claimData, error: claimError } = await admin
    .from("ownership_claims")
    .insert({
      tag_id,
      claimant_name,
      claimant_email,
      claim_ip: ip,
      claim_location: claim_location ?? null,
      status: "pending",
      // Tag stays `live`; the brand must manually approve before this expiry
      // (now + 24h), after which the claim lapses and the item is claimable again.
      expires_at: claimExpiresAt(),
    })
    .select("id")
    .single();

  if (claimError || !claimData) {
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }

  // Fetch product name (via tags.product_id FK) and company email for notification
  const [{ data: tagProductData }, { data: companyData }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("tags").select("products(name)").eq("id", tag_id).single(),
    admin.from("companies").select("email, name").eq("id", tag.company_id).single(),
  ]);

  const rawProd = (tagProductData as { products: unknown } | null)?.products;
  const product = (Array.isArray(rawProd) ? rawProd[0] : rawProd) as { name: string } | null;
  const company = companyData as { email: string; name: string } | null;

  if (product && company) {
    const claim = claimData as { id: string };
    const claimUrl = `${APP_URL}/dashboard/ownership/${claim.id}`;
    await sendClaimNotificationEmail(company.email, {
      companyName: company.name,
      productName: product.name,
      claimantName: claimant_name,
      claimantEmail: claimant_email,
      claimUrl,
    }).catch((err) => log.error("claim", "Notification email failed", err));
  }

  return NextResponse.json({ success: true });
}
