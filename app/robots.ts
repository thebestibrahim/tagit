import type { MetadataRoute } from "next";

// .trim() guards against stray whitespace/newlines in the deployment env var
// (bit us once in production — see lib/exhibitions.ts for the same guard).
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

// Keep internal/authenticated areas out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/control/", "/admin", "/admin/", "/dashboard", "/dashboard/", "/auth/", "/api/"],
    },
    host: APP_URL,
  };
}
