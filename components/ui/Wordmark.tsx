// The Tagit wordmark — the gold SVG, crisp at any size. Used across the app
// (sidebars, landing, auth). SVG (not PNG) for sharpness; gold on every surface
// per brand direction. `height` drives the wordmark size; width keeps the ratio.
// `withIcon` prepends the AG monogram as a balanced lockup (icon ≈ 1.2× the
// wordmark height, with a proportional gap) — used in the website nav/footer.
export function Wordmark({
  height = 24,
  withIcon = false,
  className,
}: {
  height?: number;
  withIcon?: boolean;
  className?: string;
}) {
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/tagit-logo.svg"
      alt="Tagit"
      style={{ height, width: "auto", display: "block" }}
      className={withIcon ? undefined : className}
    />
  );

  if (!withIcon) return mark;

  const iconH = Math.round(height * 1.2);
  const gap = Math.round(height * 0.34);
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/tagit-icon.svg" alt="" style={{ height: iconH, width: "auto", display: "block" }} />
      {mark}
    </span>
  );
}
