import Link from "next/link";

/**
 * Shared table pagination footer. Renders nothing for a single page. `makeHref`
 * builds the URL for a given page number, preserving the caller's other filters.
 */
export default function Pagination({
  page,
  totalPages,
  makeHref,
  totalLabel,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
  totalLabel?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}
    >
      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
        Page {page} of {totalPages}
        {totalLabel ? ` · ${totalLabel}` : ""}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={makeHref(page - 1)}
            className="px-3 py-1.5 rounded-lg text-caption font-medium"
            style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={makeHref(page + 1)}
            className="px-3 py-1.5 rounded-lg text-caption font-medium"
            style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
