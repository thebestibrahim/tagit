import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: "var(--color-pearl)" }}
    >
      <span className="font-display text-4xl mb-4" style={{ color: "var(--color-charcoal)" }}>
        Tagit
      </span>
      <h1 className="text-h3 font-semibold mb-3" style={{ color: "var(--color-charcoal)" }}>
        Access denied
      </h1>
      <p className="mb-8" style={{ color: "var(--color-slate)", maxWidth: "360px" }}>
        You don&apos;t have permission to view this page.
      </p>
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium transition-colors"
        style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)" }}
      >
        Back to login
      </Link>
    </div>
  );
}
