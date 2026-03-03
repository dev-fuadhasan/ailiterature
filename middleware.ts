import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Admin route protection - check before Supabase
  if (url.pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token");
    
    if (!adminToken) {
      url.pathname = "/secretlogin";
      return NextResponse.redirect(url);
    }
    // Admin is authenticated, allow through
    return NextResponse.next();
  }
  
  // Supabase session management for regular routes
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

  const isAuthPage = url.pathname.startsWith("/login");
  const isProtected =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/project");

  // Handle OAuth callback with code parameter on homepage
  if (url.searchParams.has("code") && url.pathname === "/") {
    url.pathname = "/auth/callback";
    url.searchParams.set("code", url.searchParams.get("code")!);
    return NextResponse.redirect(url);
  }

  if (!user && isProtected) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
