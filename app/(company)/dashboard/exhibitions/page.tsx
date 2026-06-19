import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Landmark, MapPin, ChevronRight } from "lucide-react";
import LocalTime from "@/components/ui/LocalTime";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

type ExhibitionRow = {
  id: string;
  name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export default async function ExhibitionsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient() as Admin;

  const { data: exhibitionsData } = await admin
    .from("exhibitions")
    .select("id, name, location, start_date, end_date, created_at")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const exhibitions = (exhibitionsData ?? []) as ExhibitionRow[];
  const ids = exhibitions.map((e) => e.id);

  const productCounts = new Map<string, number>();
  const activeCounts = new Map<string, number>();
  if (ids.length > 0) {
    const [{ data: links }, { data: codes }] = await Promise.all([
      admin.from("exhibition_products").select("exhibition_id").in("exhibition_id", ids),
      admin.from("info_codes").select("exhibition_id").eq("status", "active").in("exhibition_id", ids),
    ]);
    for (const l of (links ?? []) as { exhibition_id: string }[]) {
      productCounts.set(l.exhibition_id, (productCounts.get(l.exhibition_id) ?? 0) + 1);
    }
    for (const c of (codes ?? []) as { exhibition_id: string }[]) {
      activeCounts.set(c.exhibition_id, (activeCounts.get(c.exhibition_id) ?? 0) + 1);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
            On View
          </p>
          <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Exhibitions
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Scannable QR placards for pieces on show. Reference information only, separate from chip authentication.
          </p>
        </div>
        <Link
          href="/dashboard/exhibitions/new"
          className="ex-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-body-sm font-medium shrink-0"
          style={{ backgroundColor: "var(--color-charcoal)", color: "#fff" }}
        >
          <Plus size={16} /> New exhibition
        </Link>
      </div>

      {exhibitions.length === 0 ? (
        <div className="card-raised rounded-xl flex flex-col items-center justify-center text-center py-20 px-6">
          <div
            className="flex items-center justify-center rounded-full mb-5"
            style={{ width: 56, height: 56, backgroundColor: "var(--color-soft-gold)" }}
          >
            <Landmark size={24} style={{ color: "var(--color-deep-gold)" }} />
          </div>
          <p className="font-display" style={{ fontSize: 22, color: "var(--color-charcoal)", letterSpacing: "-0.01em" }}>
            No exhibitions yet
          </p>
          <p className="mt-2 max-w-sm" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", lineHeight: 1.6 }}>
            Create an exhibition, attach the pieces on show, and generate a scannable QR placard for each one.
          </p>
          <Link
            href="/dashboard/exhibitions/new"
            className="ex-primary mt-7 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-body-sm font-medium"
            style={{ backgroundColor: "var(--color-charcoal)", color: "#fff" }}
          >
            <Plus size={16} /> New exhibition
          </Link>
        </div>
      ) : (
        <div className="card-raised rounded-xl overflow-hidden" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                  {["Exhibition", "Dates", "Pieces", "Active codes", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider"
                      style={{ color: "var(--color-slate)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exhibitions.map((e, i) => {
                  const active = activeCounts.get(e.id) ?? 0;
                  return (
                    <tr
                      key={e.id}
                      className="ex-row"
                      style={{
                        backgroundColor: "var(--color-pearl)",
                        borderBottom: i < exhibitions.length - 1 ? "1px solid var(--color-cream)" : "none",
                      }}
                    >
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/exhibitions/${e.id}`} className="block" style={{ textDecoration: "none" }}>
                          <span className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                            {e.name}
                          </span>
                          {e.location && (
                            <span className="flex items-center gap-1 mt-0.5" style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
                              <MapPin size={11} /> {e.location}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-4" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {e.start_date ? (
                          <span>
                            <LocalTime iso={e.start_date} pattern="d MMM yyyy" />
                            {e.end_date ? <> &ndash; <LocalTime iso={e.end_date} pattern="d MMM yyyy" /></> : null}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-mist)" }}>&mdash;</span>
                        )}
                      </td>
                      <td className="px-5 py-4" style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {productCounts.get(e.id) ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-micro font-medium"
                          style={
                            active > 0
                              ? { backgroundColor: "var(--color-verified-tint)", color: "var(--color-verified)" }
                              : { backgroundColor: "var(--color-linen)", color: "var(--color-slate)" }
                          }
                        >
                          <span
                            className="rounded-full"
                            style={{ width: 5, height: 5, backgroundColor: active > 0 ? "var(--color-verified)" : "var(--color-mist)" }}
                          />
                          {active} active
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/exhibitions/${e.id}`}
                          className="ex-open inline-flex items-center gap-1"
                          style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
                        >
                          Open <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .ex-primary { transition: opacity 180ms ease, transform 180ms ease; }
        .ex-primary:hover { opacity: 0.9; }
        .ex-primary:active { transform: translateY(1px); }
        .ex-row { transition: background-color 160ms ease; }
        .ex-row:hover { background-color: var(--color-smoke) !important; }
        .ex-open { transition: gap 160ms ease, color 160ms ease; }
        .ex-row:hover .ex-open { color: var(--color-deep-gold); gap: 7px; }
      `}</style>
    </div>
  );
}
