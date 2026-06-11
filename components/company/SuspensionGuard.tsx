"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const BILLING_PATH = "/dashboard/features";

// When a brand is suspended for non-payment, every dashboard page redirects to
// the billing page so they can settle up. Chip scanning (/v/[token]) lives
// outside the dashboard and is never affected by this guard.
export function SuspensionGuard({ suspended }: { suspended: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (suspended && pathname !== BILLING_PATH) {
      router.replace(BILLING_PATH);
    }
  }, [suspended, pathname, router]);

  return null;
}
