import { NextResponse, type NextRequest } from "next/server";

// Temporarily disable Clerk middleware to unblock deploys.
// API routes still perform auth checks in their handlers using safeAuth().
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static assets and _next
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
