import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes (no auth required)
// Keep home and generate open; protect selected pages like /stream and /tutorial/*
const isPublicRoute = createRouteMatcher([
  "/",
  "/generate(.*)",
  "/brand-demo(.*)",
  // Static assets and _next are excluded by matcher below
]);

export default clerkMiddleware((auth, req) => {
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
