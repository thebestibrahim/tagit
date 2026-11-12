"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Mobile top bar with a hamburger that opens the dashboard side nav as a
// left slide-in drawer. Hidden on desktop (lg+), where the static sidebar is
// shown instead. The sidebar passed as children is reused verbatim, so nav
// links behave identically — and the drawer auto-closes on navigation.
export function MobileNav({
  children,
  label = "Tagit",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (i.e. a nav item was tapped).
  // Done at render time (not in an effect) per the React Compiler guidance —
  // avoids a cascading re-render and the react-hooks/set-state-in-effect lint.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <div
      className="lg:hidden print:hidden flex items-center gap-3 h-14 px-4 shrink-0"
      style={{ backgroundColor: "var(--app-sidebar)", borderBottom: "1px solid rgba(240, 237, 230, 0.08)" }}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open menu"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ color: "#f0ede6", border: "1px solid rgba(240, 237, 230, 0.12)" }}
        >
          <Menu size={18} />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 sm:max-w-none p-0 border-0 gap-0"
        >
          {children}
        </SheetContent>
      </Sheet>
      <span className="text-body-sm font-semibold truncate" style={{ color: "#f0ede6" }}>
        {label}
      </span>
    </div>
  );
}
