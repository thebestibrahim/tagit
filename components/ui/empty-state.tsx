import Link from "next/link";

/**
 * What an empty list says: what will appear here, how it gets here, and
 * (when there is one) the action that starts it. No icon: the words do the
 * work, and a faded glyph above "No items" is the most generic screen there is.
 */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      {children && <p className="empty-state-body">{children}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center h-9 px-3.5 rounded-md text-body-sm font-medium"
          style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", textDecoration: "none" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
