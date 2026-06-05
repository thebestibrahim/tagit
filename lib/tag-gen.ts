import { nanoid, customAlphabet } from "nanoid";
import { createHmac } from "crypto";
import type { TagMedium, TagStatus, Database } from "@/types/database";

type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];

// Physical tags/cards are printed with a URL that must resolve in production,
// regardless of which environment generated the batch. Kept in sync with the
// backfill in 20260605000000_tags_v3.sql.
const SCAN_ORIGIN = "https://tagitlux.com";

const shortId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function generateHmac(token: string): string {
  return createHmac("sha256", process.env.TAGIT_HMAC_SECRET!)
    .update(token)
    .digest("hex");
}

export function scanUrl(token: string, hmac: string): string {
  return `${SCAN_ORIGIN}/v/${token}?sig=${hmac}`;
}

/**
 * Build `count` fresh tag/card records for a batch. Each record gets its token,
 * HMAC signature and public scan URL at creation time; product_id stays NULL
 * until a brand attaches the tag to a product.
 */
export function buildTagRecords(opts: {
  count: number;
  company_id: string;
  industry: string;
  batch_id: string;
  medium: TagMedium;
}): TagInsert[] {
  return Array.from({ length: opts.count }, () => {
    const token = nanoid(21);
    const hmac = generateHmac(token);
    return {
      token,
      short_id: shortId(),
      company_id: opts.company_id,
      industry: opts.industry,
      batch_id: opts.batch_id,
      medium: opts.medium,
      status: "created" as TagStatus,
      hmac_signature: hmac,
      url: scanUrl(token, hmac),
    };
  });
}
