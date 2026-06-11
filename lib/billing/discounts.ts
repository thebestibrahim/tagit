import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Discount, DiscountType } from "@/types/database";

type DB = SupabaseClient<Database>;

// Fetch the single active discount of a given type for a brand, or null.
async function getActiveDiscount(
  supabase: DB,
  companyId: string,
  type: DiscountType
): Promise<Discount | null> {
  const { data } = await supabase
    .from("discounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("type", type)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

// Active SUBSCRIPTION discount for a brand (consumed by subscription invoices only).
export async function getActiveSubscriptionDiscount(
  supabase: DB,
  companyId: string
): Promise<Discount | null> {
  return getActiveDiscount(supabase, companyId, "subscription");
}

// Active BATCH discount for a brand (consumed by batch invoices only).
export async function getActiveBatchDiscount(
  supabase: DB,
  companyId: string
): Promise<Discount | null> {
  return getActiveDiscount(supabase, companyId, "batch");
}

// Consume one unit (one billing cycle or one batch order) from a discount.
// Increments `used`; deactivates the discount once `used` reaches `duration`.
// Operates on exactly one discount row, so consuming a batch discount never
// touches the subscription discount and vice versa.
export async function consumeDiscount(
  supabase: DB,
  discountId: string
): Promise<void> {
  const { data: discount } = await supabase
    .from("discounts")
    .select("used, duration")
    .eq("id", discountId)
    .single();

  if (!discount) return;

  const used = discount.used + 1;
  const isActive = used < discount.duration;

  await supabase
    .from("discounts")
    .update({ used, is_active: isActive })
    .eq("id", discountId);
}
