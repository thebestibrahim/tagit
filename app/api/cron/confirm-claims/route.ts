export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { confirmClaim } from "@/lib/claims";
import { headers } from "next/headers";

const admin = createAdminClient();

/**
 * PRD v3.0 auto-confirm. Confirms every pending ownership claim whose 24h
 * review window has lapsed with no rejection.
 *
 * Scheduled by Vercel Cron (vercel.json). NOTE: the Vercel Hobby plan caps
 * crons at once-per-day, so the schedule is daily; on Pro, tighten it to
 * every ~15 min for prompt confirmation. The endpoint is also POST/GET
 * triggerable on demand (same auth guard) for testing or an external scheduler.
 *
 * Guarded by CRON_SECRET (Vercel sends it as `Authorization: Bearer <secret>`).
 * Fails closed: if CRON_SECRET is unset, or the header does not match, no work
 * is done. Set CRON_SECRET in the Vercel project env BEFORE the cron goes live.
 */
async function handle() {
  const secret = process.env.CRON_SECRET;
  const provided = (await headers()).get("authorization");

  if (!secret || provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const { data: dueData, error } = await admin
    .from("ownership_claims")
    .select("id")
    .eq("status", "pending")
    .not("expires_at", "is", null)
    .lte("expires_at", nowIso);

  if (error) {
    log.error("cron/confirm-claims", "Failed to query due claims", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const due = (dueData ?? []) as { id: string }[];

  let confirmed = 0;
  for (const { id } of due) {
    try {
      const res = await confirmClaim(admin, id, null);
      if (res.confirmed) confirmed += 1;
    } catch (err) {
      // One bad claim must not abort the whole run.
      log.error("cron/confirm-claims", "confirmClaim failed", { claimId: id, err });
    }
  }

  return NextResponse.json({ due: due.length, confirmed });
}

export async function GET() {
  return handle();
}

// Allow manual/QStash-style POST triggering too (same auth guard).
export async function POST() {
  return handle();
}
