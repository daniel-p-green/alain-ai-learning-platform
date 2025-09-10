import { NextResponse, type NextRequest } from "next/server";

// Temporarily disabled Clerk middleware to stabilize deploys.
// API route handlers still enforce auth explicitly using Clerk.
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
