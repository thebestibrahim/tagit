import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTagitHostname } from "@/lib/domains/validate";
import { NextResponse, type NextRequest } from "next/server";

// Look up a verified custom domain and return the brand slug, or null.
// Only 'verified' rows are matched — pending/failed/removed are invisible.
async function resolveCustomDomain(host: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("custom_domains")
    .select("companies(slug)")
    .eq("domain", host)
    .eq("status", "verified")
    .maybeSingle();

  if (!data) return null;
  const slug = (data.companies as unknown as { slug: string | null } | null)?.slug;
  return slug ?? null;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname } = request.nextUrl;

  // Custom domain resolution: if this request is coming from a brand's own domain
  // (not tagitlux.com), look up the slug and rewrite to /{slug}.
  if (!isTagitHostname(host)) {
    const skipPaths =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/favicon") ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml";

    if (!skipPaths) {
      try {
        const slug = await resolveCustomDomain(host);
        if (slug) {
          const url = request.nextUrl.clone();
          url.pathname = pathname === "/" || pathname === "" ? `/${slug}` : `/${slug}${pathname}`;
          return NextResponse.rewrite(url);
        }
      } catch {
        // DB error: fall through to normal routing
      }
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin routes: must be authenticated with tagit_admin role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Staff have their own portal — /auth/login is the brand-only form and
      // rejects non-company roles outright, so send admins to /control/signin.
      return NextResponse.redirect(new URL("/control/signin", request.url));
    }
    const role = user.app_metadata?.role;
    if (role !== "tagit_admin") {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }
  }

  // Company dashboard routes: must be authenticated as company
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const role = user.app_metadata?.role;
    if (role !== "company" && role !== "tagit_admin") {
      return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/((?!_next/static|_next/image|favicon.ico|v/|auth/|api/).*)",
  ],
};
