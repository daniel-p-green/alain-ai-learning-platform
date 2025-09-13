import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth required)
// Keep home and generate open; protect selected pages like /stream and /tutorial/*
const isPublicRoute = createRouteMatcher([
  "/",
  "/generate(.*)",
  // Public read-only APIs (discovery, health)
  "/api/health(.*)",
  "/api/providers(.*)",
  "/api/notebooks(.*)",
  // Static assets and _next are excluded by matcher below
]);

export default clerkMiddleware((auth, req) => {
  // Legacy path redirects: /notebooks -> /tutorials
  // TODO: Remove these redirects once external links are migrated (tracked in docs).
  const url = new URL(req.url);
  if (url.pathname === '/notebooks') {
    url.pathname = '/tutorials';
    return NextResponse.redirect(url, 308);
  }
  if (url.pathname.startsWith('/notebooks/')) {
    url.pathname = url.pathname.replace(/^\/notebooks\b/, '/tutorials');
    return NextResponse.redirect(url, 308);
  }
  // Admin-only routes
  const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
  if (isAdminRoute(req)) {
    const claims: any = auth().sessionClaims;
    if (claims?.publicMetadata?.role !== "admin") {
      // Not admin: block
      return new Response("Forbidden", { status: 403 });
    }
  }
  if (isPublicRoute(req)) return;
  auth().protect();
});

export const config = {
  matcher: [
    // Run on all paths except static assets and _next
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
