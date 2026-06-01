import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
