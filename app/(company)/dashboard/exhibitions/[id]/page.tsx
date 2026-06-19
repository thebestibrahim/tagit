import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import LocalTime from "@/components/ui/LocalTime";
import { infoUrl } from "@/lib/exhibitions";
import ExhibitionDetailClient, { type ProductRow } from "./ExhibitionDetailClient";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export default async function ExhibitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient() as Admin;

  const { data: exhibition } = await admin
    .from("exhibitions")
    .select("id, name, location, start_date, end_date")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!exhibition) notFound();

  const [{ data: links }, { data: codes }] = await Promise.all([
    admin
      .from("exhibition_products")
      .select("product_id, created_at, products(id, name, photos)")
      .eq("exhibition_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("info_codes")
      .select("id, product_id, token, status, scan_count, generated_at")
      .eq("exhibition_id", id)
      .order("generated_at", { ascending: false }),
  ]);

  const currentCode = new Map<string, { id: string; token: string; status: string; scan_count: number }>();
  for (const c of (codes ?? []) as { id: string; product_id: string; token: string; status: string; scan_count: number }[]) {
    if (c.status === "revoked") continue;
    if (!currentCode.has(c.product_id)) {
      currentCode.set(c.product_id, { id: c.id, token: c.token, status: c.status, scan_count: c.scan_count });
    }
  }

  const products: ProductRow[] = ((links ?? []) as {
    product_id: string;
    products: { id: string; name: string; photos: string[] | null } | null;
  }[]).map((l) => {
    const code = currentCode.get(l.product_id) ?? null;
    return {
      product_id: l.product_id,
      name: l.products?.name ?? "Untitled",
      photo: l.products?.photos?.[0] ?? null,
      code: code
        ? { id: code.id, status: code.status as "active" | "inactive", token: code.token, scan_count: code.scan_count, url: infoUrl(code.token) }
        : null,
    };
  });

  const ex = exhibition as { id: string; name: string; location: string | null; start_date: string | null; end_date: string | null };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/exhibitions" className="inline-flex items-center gap-1 text-body-sm mb-6" style={{ color: "var(--color-slate)" }}>
        <ChevronLeft size={15} /> Back to exhibitions
      </Link>

      <div className="mb-2">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>{ex.name}</h1>
      </div>
      <div className="flex items-center gap-4 mb-8 text-body-sm" style={{ color: "var(--color-slate)" }}>
        {ex.location && (
          <span className="flex items-center gap-1"><MapPin size={13} /> {ex.location}</span>
        )}
        {ex.start_date && (
          <span>
            <LocalTime iso={ex.start_date} pattern="d MMM yyyy" />
            {ex.end_date ? <> — <LocalTime iso={ex.end_date} pattern="d MMM yyyy" /></> : null}
          </span>
        )}
      </div>

      <ExhibitionDetailClient exhibitionId={ex.id} initialProducts={products} />
    </div>
  );
}
