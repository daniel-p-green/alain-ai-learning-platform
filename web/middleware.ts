import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes (no auth required)
// Keep home and generate open; protect selected pages like /stream and /tutorial/*
const isPublicRoute = createRouteMatcher([
  "/",
  "/generate(.*)",
  "/brand-demo(.*)",
  // Public read-only APIs (discovery, health)
  "/api/health(.*)",
  "/api/providers(.*)",
  // Static assets and _next are excluded by matcher below
]);

export default clerkMiddleware((auth, req) => {
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
