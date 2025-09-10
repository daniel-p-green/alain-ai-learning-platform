import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Fall back to a no-op middleware if Clerk keys are not configured
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

export default hasClerk
  ? clerkMiddleware({
      // Mark common public routes to avoid unnecessary auth work
      publicRoutes: [
        "/",
        "/stream",
        "/tutorials",
        "/tutorial/:id",
        "/api/setup", // GET probe is public; POST is guarded in handler
      ],
    })
  : (() => NextResponse.next());

export const config = {
  matcher: [
    // Recommended Clerk pattern: run on all paths except static/_next; also include root
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
