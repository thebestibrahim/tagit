import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Landmark, MapPin } from "lucide-react";
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>Exhibitions</h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            QR information placards for pieces on show. Reference information only — separate from chip authentication.
          </p>
        </div>
        <Link
          href="/dashboard/exhibitions/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
          style={{ backgroundColor: "var(--color-charcoal)", color: "#fff" }}
        >
          <Plus size={16} /> New exhibition
        </Link>
      </div>

      {exhibitions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center py-20 rounded-xl"
          style={{ border: "1px dashed var(--color-stone)", backgroundColor: "#fff" }}
        >
          <Landmark size={28} style={{ color: "var(--color-mist)" }} />
          <p className="mt-4 text-body font-medium" style={{ color: "var(--color-charcoal)" }}>No exhibitions yet</p>
          <p className="mt-1 max-w-sm" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Create an exhibition, attach the pieces on show, and generate a scannable QR placard for each one.
          </p>
          <Link
            href="/dashboard/exhibitions/new"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
            style={{ backgroundColor: "var(--color-charcoal)", color: "#fff" }}
          >
            <Plus size={16} /> New exhibition
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-stone)", backgroundColor: "#fff" }}>
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-stone)" }}>
                {["Exhibition", "Dates", "Products", "Active codes"].map((h) => (
                  <th key={h} className="px-5 py-3 text-micro uppercase tracking-wider" style={{ color: "var(--color-mist)", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exhibitions.map((e) => (
                <tr key={e.id} className="group" style={{ borderBottom: "1px solid var(--color-linen)" }}>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/exhibitions/${e.id}`} className="block">
                      <span className="text-body-sm font-medium" style={{ color: "var(--color-charcoal)" }}>{e.name}</span>
                      {e.location && (
                        <span className="flex items-center gap-1 mt-0.5 text-micro" style={{ color: "var(--color-slate)" }}>
                          <MapPin size={11} /> {e.location}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-body-sm" style={{ color: "var(--color-slate)" }}>
                    {e.start_date ? (
                      <span>
                        <LocalTime iso={e.start_date} pattern="d MMM yyyy" />
                        {e.end_date ? <> — <LocalTime iso={e.end_date} pattern="d MMM yyyy" /></> : null}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-mist)" }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-body-sm" style={{ color: "var(--color-slate)" }}>{productCounts.get(e.id) ?? 0}</td>
                  <td className="px-5 py-4 text-body-sm" style={{ color: "var(--color-slate)" }}>{activeCounts.get(e.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
