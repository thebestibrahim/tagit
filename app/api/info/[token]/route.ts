export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { readInfoCode, recordInfoScan } from "@/lib/exhibitions-server";

// Public, no auth. The info page (and any client) calls this. Returns ONLY
// registration fields + brand identity for an active code, or a graceful
// expired payload otherwise. It never returns ownership data of any kind.
//
// Status is re-read on every request and nothing here is cached, so toggling a
// code off (or regenerating it) takes effect immediately.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await readInfoCode(token);

  if (result.status !== "active") {
    return NextResponse.json(
      { status: "expired", brand_slug: result.brandSlug, brand_name: result.brandName },
      // 200 by design: the page renders a calm "no longer active" message, not
      // an error. The body distinguishes the state.
      { status: 200 }
    );
  }

  // Count the scan + log it (source: qr_exhibition). Fire-and-forget.
  const headerStore = await headers();
  recordInfoScan(result.codeId, result.scanCount, headerStore);

  return NextResponse.json({
    status: "active",
    product: {
      name: result.product.name,
      photos: result.product.photos,
      specs: result.product.specs,
      stories: result.product.stories,
    },
    brand: {
      name: result.brand.name,
      logo_url: result.brand.logo_url,
    },
  });
}
