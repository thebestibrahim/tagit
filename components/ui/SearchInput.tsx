"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({
  placeholder = "Search…",
  paramKey = "q",
}: {
  placeholder?: string;
  paramKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Search
        size={14}
        style={{
          position: "absolute",
          left: "10px",
          color: "var(--color-mist)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: "32px",
          paddingRight: value ? "32px" : "12px",
          paddingTop: "8px",
          paddingBottom: "8px",
          border: "1px solid var(--color-stone)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--text-body-sm)",
          color: "var(--color-onyx)",
          backgroundColor: "var(--color-pearl)",
          outline: "none",
          width: "220px",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          style={{
            position: "absolute",
            right: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
          }}
        >
          <X size={13} style={{ color: "var(--color-mist)" }} />
        </button>
      )}
    </div>
  );
}
