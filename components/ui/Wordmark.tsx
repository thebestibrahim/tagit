import Image from "next/image";

// The Tagit text logo. One asset (gold on transparent), adapted to its surface:
//   gold  → dark surfaces (sidebars, dark hero) — the asset as-is
//   ink   → light surfaces (landing, auth form) — darkened to near-black to match
//   light → dark surfaces where a white wordmark is wanted
// Height drives the size; width is derived from the asset's 1279×585 ratio.
const RATIO = 1279 / 585;

export function Wordmark({
  tone = "gold",
  height = 20,
  className,
}: {
  tone?: "gold" | "ink" | "light";
  height?: number;
  className?: string;
}) {
  const filter =
    tone === "ink" ? "brightness(0)" : tone === "light" ? "brightness(0) invert(1)" : undefined;
  return (
    <Image
      src="/tagit-logo.png"
      alt="Tagit"
      width={Math.round(height * RATIO)}
      height={height}
      priority
      style={filter ? { filter } : undefined}
      className={className}
    />
  );
}
