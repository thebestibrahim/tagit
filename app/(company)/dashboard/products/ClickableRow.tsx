"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClickableRow({
  href,
  children,
  borderBottom,
}: {
  href: string;
  children: React.ReactNode;
  borderBottom?: string;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onClick={() => router.push(href)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "var(--color-smoke)" : "var(--color-pearl)",
        borderBottom: borderBottom ?? "none",
        cursor: "pointer",
        transition: "background-color 120ms ease",
      }}
    >
      {children}
    </tr>
  );
}
