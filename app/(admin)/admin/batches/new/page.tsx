import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NewBatchForm from "./NewBatchForm";

type Company = { id: string; name: string; industry: string };

export default async function NewBatchPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("companies")
    .select("id, name, industry")
    .eq("status", "approved")
    .order("name");

  const companies = (data ?? []) as Company[];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/admin/batches"
        className="inline-flex items-center gap-1.5 mb-8"
        style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
      >
        <ChevronLeft size={14} />
        All batches
      </Link>

      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Generate tag batch
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Creates tag tokens with HMAC-signed URLs and unique short IDs.
        </p>
      </div>

      <div
        className="rounded-xl p-8"
        style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {companies.length === 0 ? (
          <div className="text-center py-8" style={{ color: "var(--color-mist)" }}>
            <p style={{ fontSize: "var(--text-body-sm)" }}>No approved companies yet.</p>
            <Link
              href="/admin/companies"
              className="mt-3 inline-block"
              style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}
            >
              Review applications →
            </Link>
          </div>
        ) : (
          <NewBatchForm companies={companies} />
        )}
      </div>
    </div>
  );
}
