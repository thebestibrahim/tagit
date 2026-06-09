"use client";

import { useEffect, useState } from "react";
import { format as dfFormat } from "date-fns";

function fmt(iso: string | null | undefined, pattern: string, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? fallback : dfFormat(d, pattern);
}

/**
 * Renders a timestamp in the *viewer's* local timezone. Date math/storage stays
 * in UTC; only the display is localised. The server renders it in its own TZ
 * (UTC on Vercel); after hydration a re-render formats it in the browser's TZ,
 * so each viewer sees their own local time. Guards null/invalid → fallback
 * (never "1 Jan 1970"). Use anywhere a stored ISO timestamp is shown to a user.
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
  const [text, setText] = useState(() => fmt(iso, pattern, fallback));

  useEffect(() => {
    setText(fmt(iso, pattern, fallback));
  }, [iso, pattern, fallback]);

  return (
    <time dateTime={iso ?? undefined} suppressHydrationWarning>
      {text}
    </time>
  );
}
