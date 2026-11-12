/* Engine-turned guilloché, the pattern on a share certificate or a watch dial.
   A hypotrochoid closes after `r / gcd(R, r)` turns, so with a prime r it draws
   one continuous rosette. Cheap to generate once at module load, and it is what
   makes the card read as a document of value rather than a UI panel. */
export function rosette(R: number, r: number, d: number, steps = 620) {
  const turns = r;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI;
    const k = (R - r) / r;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return "M" + pts.join("L");
}
