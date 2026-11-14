/**
 * The Tagit icon mark (public/tagit-icon.svg) as an SVG group, for drawing
 * inside another SVG such as a certificate seal. `cx`/`cy` is its centre and
 * `size` its diameter, in the parent's units.
 */
export function TagitMarkGlyph({
  cx,
  cy,
  size,
  paint = "#B9955D",
}: {
  cx: number;
  cy: number;
  size: number;
  /** Any SVG paint: a colour, or a `url(#gradient)`. */
  paint?: string;
}) {
  const k = Math.round((size / 307) * 10000) / 10000;
  const tx = Math.round((cx - size / 2) * 100) / 100;
  const ty = Math.round((cy - size / 2) * 100) / 100;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${k})`} aria-hidden>
      <g fill={paint}>
        <rect x="37.7744" y="67.5864" width="237.756" height="19.9982" />
        <rect x="179.984" y="69.8091" width="171.096" height="22.2202" transform="rotate(90 179.984 69.8091)" />
        <rect x="275.531" y="240.905" width="117.767" height="22.2202" transform="rotate(-180 275.531 240.905)" />
        <rect x="160.563" y="78.3472" width="201.708" height="21.0267" transform="rotate(119.376 160.563 78.3472)" />
        <rect x="259.977" y="225.349" width="59.9946" height="24.4423" transform="rotate(-90 259.977 225.349)" />
        <rect x="160.747" y="199.17" width="79.4341" height="21.0267" transform="rotate(-180 160.747 199.17)" />
        <rect x="160.798" y="168.279" width="63.5715" height="20.9412" transform="rotate(-180 160.798 168.279)" />
        <rect x="288.863" y="174.243" width="53.3285" height="22.2202" transform="rotate(-180 288.863 174.243)" />
      </g>
      <circle cx="153.32" cy="153.32" r="142.806" stroke={paint} strokeWidth="21.0267" fill="none" />
    </g>
  );
}
