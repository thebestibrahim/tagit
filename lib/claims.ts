import type { createAdminClient } from "@/lib/supabase/admin";

// How long a brand has to review an ownership claim before it lapses and the
// item is released back to a claimable state.
export const CLAIM_WINDOW_DAYS = 14;

type AdminClient = ReturnType<typeof createAdminClient>;

/** ISO timestamp for when a claim created now should expire. */
export function claimExpiresAt(from: Date = new Date()): string {
  return new Date(from.getTime() + CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Lazily expire any pending claim on this tag whose review window has passed,
 * and release the tag back to a claimable state ("embedded" — the same state
 * the reject flow returns a tag to) so a new claim can be made.
 *
 * Claims with a null expires_at are treated as having no expiry and are left
 * untouched. Returns true if at least one claim was expired (tag released).
 */
export async function releaseExpiredClaims(
  admin: AdminClient,
  tagId: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();

  const { data: stale } = await admin
    .from("ownership_claims")
    .select("id")
    .eq("tag_id", tagId)
    .eq("status", "pending")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso);

  const staleClaims = (stale ?? []) as { id: string }[];
  if (staleClaims.length === 0) return false;

  await admin
    .from("ownership_claims")
    .update({ status: "expired" })
    .in("id", staleClaims.map((c) => c.id));

  // Only release the tag if it is still parked on the pending claim, so we
  // never clobber a status set by another concurrent flow (transfer, etc.).
  await admin
    .from("tags")
    .update({ status: "embedded" })
    .eq("id", tagId)
    .eq("status", "claim_pending");

  return true;
}
