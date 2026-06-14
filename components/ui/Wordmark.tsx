// The Tagit wordmark — the gold SVG, crisp at any size. Used across the app
// (sidebars, landing, auth). SVG (not PNG) for sharpness; gold on every surface
// per brand direction. `height` drives the size; width keeps the aspect ratio.
export function Wordmark({ height = 24, className }: { height?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/tagit-logo.svg"
      alt="Tagit"
      style={{ height, width: "auto", display: "block" }}
      className={className}
    />
  );
}
