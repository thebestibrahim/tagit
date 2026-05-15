"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body
        style={{
          margin: 0,
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
          Tagit
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
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 32, maxWidth: 400 }}>
          A critical error occurred. Please refresh the page or contact support if the problem persists.
        </p>
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
      </body>
    </html>
  );
}
