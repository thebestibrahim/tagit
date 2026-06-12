// Helpers for the admin batch-fulfilment view: build the consumer scan link the
// SAME way brands see it on the product page, and order chips for writing.

export type RawChip = {
  id: string;
  short_id: string;
  medium: string;
  token: string;
  status: string;
};

export type DisplayChip = {
  id: string;
  short_id: string;
  medium: string;
  url: string;
  status: string;
};

/**
 * The link to write onto a physical chip: `${baseUrl}/v/${token}`.
 *
 * Built from the token + the app's configured base URL (matching the brand
 * product page) rather than the tag's stored `url`, which hard-codes the prod
 * origin and a vestigial `?sig=` the scan page ignores — so the stored value
 * 404s when viewed on staging. Using the live base URL means the link always
 * resolves in the environment it's viewed in.
 */
export function chipScanLink(token: string, appUrl: string = process.env.NEXT_PUBLIC_APP_URL ?? ""): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}/v/${token}`;
}

/** Tags first, then cards; stable within each group by short_id. */
export function sortChips<T extends { medium: string; short_id: string }>(chips: T[]): T[] {
  return [...chips].sort((a, b) => {
    const am = a.medium === "card" ? 1 : 0;
    const bm = b.medium === "card" ? 1 : 0;
    if (am !== bm) return am - bm;
    return a.short_id.localeCompare(b.short_id);
  });
}

/** Map raw tag rows to display chips with a resolved, working scan link. */
export function toDisplayChips(rows: RawChip[], appUrl?: string): DisplayChip[] {
  return sortChips(
    rows.map((c) => ({
      id: c.id,
      short_id: c.short_id,
      medium: c.medium,
      url: chipScanLink(c.token, appUrl),
      status: c.status,
    }))
  );
}
