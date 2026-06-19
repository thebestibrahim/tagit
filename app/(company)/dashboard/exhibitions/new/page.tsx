import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NewExhibitionForm from "../NewExhibitionForm";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export default async function NewExhibitionPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient() as Admin;
  const { data } = await admin
    .from("products")
    .select("id, name, photos")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const products = ((data ?? []) as { id: string; name: string; photos: string[] | null }[]).map((p) => ({
    id: p.id,
    name: p.name,
    photo: p.photos?.[0] ?? null,
  }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/exhibitions"
        className="inline-flex items-center gap-1 text-body-sm mb-6"
        style={{ color: "var(--color-slate)" }}
      >
        <ChevronLeft size={15} /> Back to exhibitions
      </Link>
      <h1 className="text-h2 font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>New exhibition</h1>
      <p className="mb-8" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
        Dates are for your own labeling only. They do not turn codes off — lifecycle is fully manual.
      </p>
      <NewExhibitionForm products={products} />
    </div>
  );
}
