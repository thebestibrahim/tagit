"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAFAF8",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#B8986A",
          marginBottom: 16,
        }}
      >
        Something went wrong
      </p>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "#1A1A1A",
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}
      >
        An unexpected error occurred
      </h1>
      <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 32, maxWidth: 400 }}>
        Our team has been notified. You can try again or return to the dashboard.
      </p>

      {/* Staging only: surface the real error so we can diagnose it. */}
      {process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" && (
        <pre
          style={{
            maxWidth: 560,
            margin: "0 0 28px",
            padding: "12px 14px",
            backgroundColor: "#FDECEC",
            border: "1px solid #F0C0C0",
            borderRadius: 8,
            fontSize: 12,
            color: "#9B1C1C",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {error?.message || "Unknown error"}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1A1A1A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          Try again
        </button>
        {/* Deliberate hard navigation: the React tree has errored, so a full
            page load recovers cleanly where a soft <Link> may not. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/dashboard"
          style={{
            padding: "10px 20px",
            backgroundColor: "transparent",
            color: "#1A1A1A",
            border: "1px solid #E5E5E0",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
