import { clerkMiddleware } from "@clerk/nextjs/server";

// Enable Clerk middleware for auth/session on all app and API routes
export default clerkMiddleware();

export const config = {
  matcher: [
    // Run on all paths except static assets and _next
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
