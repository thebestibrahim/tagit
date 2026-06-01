import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

/**
 * Shown in place of a feature when its flag is disabled for the brand.
 * Server component — no client JS needed.
 */
export default function FeatureWall({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div
        className="flex flex-col items-center text-center"
        style={{ minHeight: "62vh", justifyContent: "center" }}
      >
        <div
          className="flex items-center justify-center mb-6"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "var(--color-smoke)",
            border: "1px solid var(--color-cream)",
          }}
        >
          <Lock size={26} style={{ color: "var(--color-mist)" }} />
        </div>

        <p
          className="text-micro font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--color-gold)" }}
        >
          {name}
        </p>
        <h1
          className="font-display"
          style={{
            fontSize: "28px",
            color: "var(--color-charcoal)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          This feature isn&apos;t available yet
        </h1>
        <p
          className="mt-3"
          style={{
            color: "var(--color-slate)",
            fontSize: "var(--text-body-sm)",
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          {description ? `${description} ` : ""}
          {name} isn&apos;t currently enabled for your account. Feature access is
          managed by the Tagit team.
        </p>

        <Link
          href="/dashboard/features"
          className="inline-flex items-center gap-1.5 mt-7 px-5 py-2.5 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--color-onyx)",
            color: "var(--color-pearl)",
            fontSize: "var(--text-body-sm)",
          }}
        >
          View your plan
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
