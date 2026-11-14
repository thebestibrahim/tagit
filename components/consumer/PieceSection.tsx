import ProductGallery from "@/components/consumer/ProductGallery";
import { INDUSTRY_FIELDS, resolveField, inferIndustry } from "@/lib/industry-fields";
import { scanStyles as s, Disclosure, Facts } from "@/components/consumer/scan-chrome";

/**
 * The piece on a scan page: its picture, name and the facts that matter, in
 * the layout the brand chose (classic, minimal or editorial). Shared by the
 * live scan page and the Customize preview, so the preview is the real thing.
 */

export type PieceProduct = {
  name: string;
  industry_fields: Record<string, string>;
  retail_price: number | null;
  currency: string;
  photos: string[];
};

const PRIORITY_KEYS: Record<string, string[]> = {
  fashion: ["primary_material", "made_in", "collection", "colorway", "size", "production_year"],
  arts: ["artist_name", "year_created", "medium", "edition_type", "edition_number", "dimensions"],
  collectibles: ["brand", "model_reference", "serial_number", "year", "condition_grade", "graded_by"],
};

/** The piece: its picture, name and the facts that matter, in the brand's chosen layout. */
export default function PieceSection({
  product,
  industry,
  accent,
  template,
  media,
}: {
  product: PieceProduct;
  industry: string;
  accent: string;
  template: string;
  /** Stands in for the photo gallery (the Customize preview's sample image). */
  media?: React.ReactNode;
}) {
  // Derive fields from what's actually stored, never from the tag's industry
  // alone, so content is never silently dropped when the tag's industry has no
  // schema or differs from the one the product was entered under (see resolveField).
  const stored = product.industry_fields ?? {};
  const storedKeys = Object.keys(stored).filter((k) => String(stored[k] ?? "").trim() !== "");
  const effectiveIndustry = inferIndustry(storedKeys, industry);
  const schemaKeys = (INDUSTRY_FIELDS[effectiveIndustry] ?? []).map((f) => f.key);
  const orderedKeys = [
    ...schemaKeys.filter((k) => storedKeys.includes(k)),
    ...storedKeys.filter((k) => !schemaKeys.includes(k)),
  ];
  const filled = orderedKeys.map(resolveField);
  const value = (key: string) => String(stored[key]);

  const highlight = PRIORITY_KEYS[effectiveIndustry] ?? [];
  const highlights = filled.filter((f) => highlight.includes(f.key)).slice(0, 6).map((f) => ({ key: f.key, label: f.label, value: value(f.key) }));
  const details = filled.filter((f) => !highlight.includes(f.key) && f.type !== "textarea").map((f) => ({ key: f.key, label: f.label, value: value(f.key) }));
  const stories = filled.filter((f) => f.type === "textarea" && stored[f.key]);
  const hasPhotos = !!media || (product.photos?.length ?? 0) > 0;
  const category = effectiveIndustry ? effectiveIndustry.charAt(0).toUpperCase() + effectiveIndustry.slice(1) : null;
  const price = product.retail_price ? `${product.currency} ${product.retail_price.toLocaleString()}` : null;

  const more = (skipFirstStory: boolean) => {
    const rest = skipFirstStory ? stories.slice(1) : stories;
    if (details.length === 0 && rest.length === 0) return null;
    return (
      <div className={s.section}>
        <div className={s.panel}>
          {details.length > 0 && (
            <Disclosure title="Details" count={details.length}>
              <Facts items={details} />
            </Disclosure>
          )}
          {rest.map((f) => (
            <Disclosure key={f.key} title={f.label}>
              <p className={s.story}>{value(f.key)}</p>
            </Disclosure>
          ))}
        </div>
      </div>
    );
  };

  if (template === "minimal") {
    return (
      <section className={s.section} aria-label="The piece">
        {hasPhotos && (
          <div style={{ marginBottom: 24 }}>
            {media ?? <ProductGallery photos={product.photos} alt={product.name} accent={accent} frame={{ aspectRatio: "1/1", objectFit: "contain", padding: 20 }} />}
          </div>
        )}
        <h2 className={s.pieceName}>{product.name}</h2>
        {price && <p className={s.price}>{price}</p>}
        {highlights.length > 0 && (
          <div className={s.chips}>
            {highlights.slice(0, 3).map((f) => (
              <span key={f.key} className={s.chip}>
                <span>{f.label} </span>
                {f.value}
              </span>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (template === "editorial") {
    const first = stories[0];
    return (
      <>
        <section className={s.section} aria-label="The piece">
          {category && <p className={s.kicker}>{category}</p>}
          <h2 className={s.pieceName} style={{ fontSize: 40 }}>{product.name}</h2>
          {first && <p className={s.lede}>{value(first.key)}</p>}
          {hasPhotos && (
            <div style={{ marginTop: 24 }}>
              {media ?? <ProductGallery photos={product.photos} alt={product.name} accent={accent} frame={{ height: 300, objectFit: "cover" }} />}
            </div>
          )}
          <Facts items={highlights} />
          {price && <p className={s.price} style={{ marginTop: 16 }}>{price}</p>}
        </section>
        {more(true)}
      </>
    );
  }

  return (
    <>
      <section className={s.section} aria-label="The piece">
        {hasPhotos && (
          <div style={{ marginBottom: 24 }}>
            {media ?? <ProductGallery photos={product.photos} alt={product.name} accent={accent} frame={{ height: 360, objectFit: "contain", padding: "16px" }} />}
          </div>
        )}
        {category && <p className={s.kicker}>{category}</p>}
        <h2 className={s.pieceName}>{product.name}</h2>
        {price && <p className={s.price}>{price}</p>}
        <Facts items={highlights} />
      </section>
      {more(false)}
    </>
  );
}

