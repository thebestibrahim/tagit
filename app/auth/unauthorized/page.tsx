import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function UnauthorizedPage() {
  const user = await getUser();

  // Admins have no brand dashboard — send them to where they belong
  // instead of stranding them on a dead-end "Back to login" screen.
  if (user?.app_metadata?.role === "tagit_admin") {
    redirect("/admin");
  }

  // A logged-in company that landed here is almost always pending approval.
  // Tell them that, rather than the generic "permission" message.
  let pending = false;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("companies")
      .select("status")
      .eq("id", user.id)
      .single() as { data: { status: string } | null };
    pending = data?.status === "pending";
  }

  const heading = pending ? "Account under review" : "Access denied";
  const message = pending
    ? "Your brand application is being reviewed. We'll email you as soon as it's approved."
    : "You don't have permission to view this page.";
  const ctaHref = user ? "/" : "/auth/login";
  const ctaLabel = user ? "Back to home" : "Back to login";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: "var(--color-pearl)" }}
    >
      <span className="font-display text-4xl mb-4" style={{ color: "var(--color-charcoal)" }}>
        Tagit
      </span>
      <h1 className="text-h3 font-semibold mb-3" style={{ color: "var(--color-charcoal)" }}>
        {heading}
      </h1>
      <p className="mb-8" style={{ color: "var(--color-slate)", maxWidth: "360px" }}>
        {message}
      </p>
      <Link
        href={ctaHref}
        className="inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium transition-colors"
        style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)" }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
