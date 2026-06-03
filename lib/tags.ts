import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * All tag ids that belong to the same physical item as `tag`. Several tags may
 * be linked to one product (multiple chips on one item); ownership is unified
 * across that group. A tag with no product is its own group of one.
 */
export async function getSiblingTagIds(
  admin: AdminClient,
  tag: { id: string; product_id: string | null }
): Promise<string[]> {
  if (!tag.product_id) return [tag.id];
  const { data } = await admin
    .from("tags")
    .select("id")
    .eq("product_id", tag.product_id);
  const ids = ((data ?? []) as { id: string }[]).map((t) => t.id);
  return ids.length > 0 ? ids : [tag.id];
}
