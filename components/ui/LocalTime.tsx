"use client";

import { useSyncExternalStore } from "react";
import { format as dfFormat } from "date-fns";

function fmt(iso: string | null | undefined, pattern: string, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? fallback : dfFormat(d, pattern);
}

// No external store to subscribe to — the value only depends on the runtime's
// timezone, which differs between server (UTC on Vercel) and the viewer's
// browser. useSyncExternalStore swaps the server snapshot for the client one at
// hydration, so each viewer sees their own local time — with no setState-in-
// effect and no hydration warning.
const noop = () => () => {};

/**
 * Renders a stored UTC timestamp in the *viewer's* local timezone. Date math and
 * storage stay UTC; only the display is localised. Guards null/invalid →
 * fallback (never "1 Jan 1970").
 */
export default function LocalTime({
  iso,
  pattern = "MMM d, yyyy",
  fallback = "—",
}: {
  iso: string | null | undefined;
  pattern?: string;
  fallback?: string;
}) {
  const text = useSyncExternalStore(
    noop,
    () => fmt(iso, pattern, fallback), // client: browser-local timezone
    () => fmt(iso, pattern, fallback), // server: runtime (UTC) timezone
  );

  return (
    <time dateTime={iso ?? undefined} suppressHydrationWarning>
      {text}
    </time>
  );
}
