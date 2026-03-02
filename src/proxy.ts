import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // First, handle Supabase auth session
  const response = await updateSession(request);

  // Add security headers to hide server information and prevent attacks
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Remove server identification headers (hides backend stack)
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

  // Content Security Policy - prevents loading external scripts that could steal data
  // Updated to allow Paddle.com payment integration
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.paddle.com https://cdn.paddle-dev.com;
    script-src-elem 'self' 'unsafe-inline' https://cdn.paddle.com https://cdn.paddle-dev.com;
    style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com;
    style-src-elem 'self' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com;
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://cdn.paddle.com https://cdn.paddle-dev.com https://sandbox-api.paddle.com https://api.paddle.com wss://*.supabase.co;
    frame-src 'self' https://cdn.paddle.com https://sandbox-checkout.paddle.com https://checkout.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com;
    frame-ancestors 'none';
    object-src 'none';
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
