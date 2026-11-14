import Link from "next/link";

/**
 * Shown in place of a feature when its flag is disabled for the brand.
 *
 * Laid out like every other page: the feature is the title, the sentence under
 * it says what it does, and one panel says it isn't on the plan and how to get
 * it. A brand landing here should learn what they would gain first.
 *
 * Server component, no client JS needed.
 */
export default function FeatureWall({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">{name}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>

      <section className="card-raised px-6 py-6">
        <h2 className="ov-h2">Not on your plan yet</h2>
        <p className="mt-2 text-body-sm" style={{ color: "var(--app-body)", maxWidth: "56ch", lineHeight: 1.6 }}>
          {`${name} isn't included in your current plan. Ask us to add it and we'll reply with the price and switch it on for your account.`}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <a
            href={`mailto:business@tagitlux.com?subject=${encodeURIComponent(`Add ${name} to our plan`)}`}
            className="ov-btn"
          >
            Ask to add it
          </a>
          <Link href="/dashboard/features" className="ov-btn ov-btn-quiet">
            See your plan
          </Link>
        </div>
      </section>
    </div>
  );
}
