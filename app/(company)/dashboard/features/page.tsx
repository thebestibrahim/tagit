import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFlagsForBrand } from "@/lib/feature-flags/server";
import { Sparkles, CheckCircle2, Clock } from "lucide-react";
import type { FlagKey } from "@/lib/feature-flags/types";

const FEATURE_DISPLAY: {
  key: FlagKey;
  name: string;
  description: string;
}[] = [
  {
    key: "certificate_generation",
    name: "Certificate of Authenticity",
    description: "Verified certificates for every ownership confirmation",
  },
  {
    key: "brand_customisation",
    name: "Brand Page Customisation",
    description: "Personalise your consumer-facing scan experience",
  },
  {
    key: "ai_persona",
    name: "AI Product Persona",
    description: "Let your items speak for themselves with AI",
  },
  {
    key: "resale_analytics",
    name: "Resale Analytics",
    description: "Track how your items perform in secondary markets",
  },
  {
    key: "bulk_tag_creation",
    name: "Bulk Tag Creation",
    description: "Create multiple tags in a single operation",
  },
  {
    key: "intelligence_reports",
    name: "Intelligence Reports",
    description: "Premium market intelligence for your brand",
  },
];

export default async function FeaturesPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", user.id)
    .single();

  if (!company) redirect("/auth/unauthorized");

  const flags = await getFlagsForBrand(user.id);

  const activeCount = FEATURE_DISPLAY.filter(f => flags[f.key]).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} style={{ color: "var(--color-gold)" }} />
          <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
            Your Plan
          </p>
        </div>
        <h1
          className="font-display"
          style={{ fontSize: "32px", color: "var(--color-charcoal)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
        >
          Features
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {activeCount} of {FEATURE_DISPLAY.length} features active on your account
        </p>
      </div>

      {/* Features grid */}
      <div className="space-y-3">
        {FEATURE_DISPLAY.map((feature) => {
          const active = flags[feature.key] ?? false;
          return (
            <div
              key={feature.key}
              className="flex items-start gap-4 px-5 py-4 rounded-xl"
              style={{
                backgroundColor: active ? "var(--color-pearl)" : "var(--color-smoke)",
                border: active
                  ? "1px solid var(--color-cream)"
                  : "1px solid transparent",
                opacity: active ? 1 : 0.75,
              }}
            >
              <div
                className="mt-0.5 shrink-0"
                style={{ color: active ? "#16A34A" : "var(--color-mist)" }}
              >
                {active ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium"
                  style={{
                    color: active ? "var(--color-charcoal)" : "var(--color-graphite)",
                    fontSize: "var(--text-body-sm)",
                  }}
                >
                  {feature.name}
                </p>
                <p className="mt-0.5" style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>
                  {feature.description}
                </p>
              </div>
              <span
                className="shrink-0 text-micro font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: active ? "#DCFCE7" : "var(--color-cream)",
                  color: active ? "#166534" : "var(--color-mist)",
                }}
              >
                {active ? "Active" : "Coming soon"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-caption text-center" style={{ color: "var(--color-mist)" }}>
        Feature access is managed by the Tagit team. Contact us to learn more.
      </p>
    </div>
  );
}
