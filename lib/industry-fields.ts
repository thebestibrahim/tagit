export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "year";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  group: string;
};

export const FASHION_FIELDS: FieldDef[] = [
  // Identity
  { group: "Identity",     key: "product_name",      label: "Product name",        type: "text",     placeholder: "e.g. The Onyx Blazer",    required: true },
  { group: "Identity",     key: "sku",                label: "SKU / Style code",    type: "text",     placeholder: "e.g. BLZ-2026-ONX" },
  { group: "Identity",     key: "collection",         label: "Collection",          type: "text",     placeholder: "e.g. Autumn/Winter 2026" },
  { group: "Identity",     key: "season",             label: "Season / Year",       type: "text",     placeholder: "e.g. AW26" },
  // Materials
  { group: "Materials",    key: "primary_material",   label: "Primary material",    type: "text",     placeholder: "e.g. 100% Cashmere",       required: true },
  { group: "Materials",    key: "secondary_material", label: "Secondary material",  type: "text",     placeholder: "e.g. Silk lining" },
  { group: "Materials",    key: "hardware",           label: "Hardware / Trim",     type: "text",     placeholder: "e.g. 18k gold-plated buttons" },
  // Production
  { group: "Production",   key: "made_in",            label: "Made in",             type: "text",     placeholder: "e.g. Italy",               required: true },
  { group: "Production",   key: "artisan",            label: "Artisan / Workshop",  type: "text",     placeholder: "e.g. Atelier Moretti, Milan" },
  { group: "Production",   key: "production_year",    label: "Production year",     type: "year",     placeholder: "2026" },
  { group: "Production",   key: "edition_size",       label: "Edition size",        type: "number",   placeholder: "e.g. 50 (leave blank for open edition)" },
  { group: "Production",   key: "edition_number",     label: "Piece number",        type: "text",     placeholder: "e.g. 12/50" },
  // Dimensions
  { group: "Dimensions",   key: "size",               label: "Size",                type: "text",     placeholder: "e.g. EU 42 / UK 16" },
  { group: "Dimensions",   key: "colorway",           label: "Colorway",            type: "text",     placeholder: "e.g. Midnight Onyx" },
  // Certifications
  { group: "Certifications", key: "certifications",   label: "Certifications",      type: "text",     placeholder: "e.g. GOTS certified, B Corp" },
  { group: "Certifications", key: "care_instructions", label: "Care instructions",  type: "textarea", placeholder: "e.g. Dry clean only, store in dust bag" },
  // Notes
  { group: "Story",        key: "design_notes",       label: "Design notes",        type: "textarea", placeholder: "What makes this piece special?" },
  { group: "Story",        key: "inspiration",        label: "Inspiration",         type: "textarea", placeholder: "The story behind the design" },
];

export const ARTS_FIELDS: FieldDef[] = [
  { group: "Identity",     key: "title",              label: "Title",               type: "text",     placeholder: "e.g. Untitled No. 7",          required: true },
  { group: "Identity",     key: "artist_name",        label: "Artist name",         type: "text",     placeholder: "Full name as signed",           required: true },
  { group: "Identity",     key: "year_created",       label: "Year created",        type: "year",     placeholder: "2026",                          required: true },
  { group: "Identity",     key: "medium",             label: "Medium",              type: "text",     placeholder: "e.g. Oil on canvas",            required: true },
  { group: "Dimensions",   key: "dimensions",         label: "Dimensions (cm)",     type: "text",     placeholder: "e.g. 80 × 120 × 2" },
  { group: "Dimensions",   key: "weight_kg",          label: "Weight (kg)",         type: "number",   placeholder: "e.g. 3.5" },
  { group: "Edition",      key: "edition_type",       label: "Edition type",        type: "select",   options: ["Unique", "Limited edition", "Open edition", "Artist proof"] },
  { group: "Edition",      key: "edition_number",     label: "Edition number",      type: "text",     placeholder: "e.g. 3/25 or AP 2/5" },
  { group: "Provenance",   key: "signature_location", label: "Signature location",  type: "text",     placeholder: "e.g. Bottom right, verso" },
  { group: "Provenance",   key: "exhibition_history", label: "Exhibition history",  type: "textarea", placeholder: "List notable exhibitions" },
  { group: "Provenance",   key: "collection_history", label: "Collection history",  type: "textarea", placeholder: "Previous collections / acquisitions" },
  { group: "Provenance",   key: "certificate_number", label: "Certificate of authenticity no.", type: "text", placeholder: "e.g. COA-2026-0072" },
  { group: "Story",        key: "artist_statement",   label: "Artist statement",    type: "textarea", placeholder: "In the artist's own words…" },
  { group: "Story",        key: "series",             label: "Series / Body of work", type: "text",  placeholder: "e.g. The Lagos Portraits" },
  { group: "Story",        key: "framing_notes",      label: "Framing / Mounting",  type: "text",     placeholder: "e.g. Archival framed, UV glass" },
];

export const COLLECTIBLES_FIELDS: FieldDef[] = [
  { group: "Identity",     key: "item_name",          label: "Item name",           type: "text",     placeholder: "e.g. 1986 Rolex Daytona Ref. 6263", required: true },
  { group: "Identity",     key: "category",           label: "Category",            type: "select",   options: ["Watch", "Sneaker", "Trading card", "Wine / Spirits", "Memorabilia", "Jewellery", "Coin / Currency", "Other"], required: true },
  { group: "Identity",     key: "brand",              label: "Brand / Maker",       type: "text",     placeholder: "e.g. Rolex",                   required: true },
  { group: "Identity",     key: "model_reference",    label: "Model / Reference",   type: "text",     placeholder: "e.g. Ref. 6263" },
  { group: "Identity",     key: "serial_number",      label: "Serial number",       type: "text",     placeholder: "e.g. 4,298,XXX" },
  { group: "Identity",     key: "year",               label: "Year / Vintage",      type: "year",     placeholder: "e.g. 1986" },
  { group: "Condition",    key: "condition_grade",    label: "Condition grade",     type: "select",   options: ["Mint (M)", "Near Mint (NM)", "Excellent (EX)", "Very Good (VG)", "Good (G)", "Poor (P)"], required: true },
  { group: "Condition",    key: "condition_notes",    label: "Condition notes",     type: "textarea", placeholder: "Describe any wear, patina, or imperfections" },
  { group: "Condition",    key: "graded_by",          label: "Graded / Certified by", type: "text",  placeholder: "e.g. PSA, NGC, WATA, independent expert" },
  { group: "Provenance",   key: "acquisition_source", label: "Acquisition source",  type: "text",     placeholder: "e.g. Christie's auction, April 2024" },
  { group: "Provenance",   key: "previous_owners",    label: "Previous ownership",  type: "textarea", placeholder: "Notable previous owners or collections" },
  { group: "Provenance",   key: "documentation",      label: "Documentation",       type: "textarea", placeholder: "e.g. Box & papers, original receipt, auction record" },
  { group: "Specifications", key: "specifications",   label: "Specifications",      type: "textarea", placeholder: "Key technical or physical specifications" },
  { group: "Specifications", key: "materials",        label: "Materials",           type: "text",     placeholder: "e.g. 18k yellow gold, sapphire crystal" },
  { group: "Specifications", key: "dimensions",       label: "Dimensions / Size",   type: "text",     placeholder: "e.g. 38mm case diameter" },
  { group: "Story",        key: "story",              label: "Story / Significance", type: "textarea", placeholder: "Why is this piece significant?" },
];

export const INDUSTRY_FIELDS: Record<string, FieldDef[]> = {
  fashion:      FASHION_FIELDS,
  arts:         ARTS_FIELDS,
  collectibles: COLLECTIBLES_FIELDS,
};

export function groupFields(fields: FieldDef[]): Record<string, FieldDef[]> {
  return fields.reduce<Record<string, FieldDef[]>>((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {});
}
