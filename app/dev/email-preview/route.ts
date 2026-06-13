import { NextResponse } from "next/server";
import { previewEmailHtml } from "@/lib/email";

// Visual preview of the email layout (header banner + card). Available on
// staging/preview/local only — 404 on the production domain so it is never
// exposed to real users. Host-gated so it doesn't depend on env-var wiring.
const PROD_HOSTS = new Set(["tagitlux.com", "www.tagitlux.com"]);

export async function GET(request: Request) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  if (PROD_HOSTS.has(host)) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(previewEmailHtml(), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
